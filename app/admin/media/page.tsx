'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Upload, Trash2, Copy, Check, Search, Grid, List, X,
  FileImage, Film, FileText, Loader2, CheckCircle, AlertCircle,
} from 'lucide-react';

interface MediaFile {
  key: string;
  url: string;
  size: number;
  lastModified: string;
  mediaId?: string;
  filename?: string;
  mediaType?: string;
  status?: string;
}

interface UploadFile {
  id: string;
  file: File;
  status: 'queued' | 'hashing' | 'checking' | 'optimizing' | 'uploading' | 'completing' | 'done' | 'error' | 'duplicate';
  progress: number;
  error?: string;
  previewUrl?: string;
  mediaId?: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(key: string) {
  return /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp|ico|tiff)$/i.test(key);
}

function FileIcon({ filename }: { filename: string }) {
  if (isImage(filename)) return <FileImage className="w-8 h-8 text-blue-400" />;
  if (/\.(mp4|mov|avi|webm)$/i.test(filename)) return <Film className="w-8 h-8 text-purple-400" />;
  return <FileText className="w-8 h-8 text-gray-400" />;
}

// ─── Client-side image optimization ─────────────────────────────────
const MAX_WEB_DIMENSION = 2400;
const WEBP_QUALITY = 0.82;
const MAX_CONCURRENT = 2;

async function computeSHA256(file: File): Promise<string> {
  if (file.size < 5 * 1024 * 1024) {
    const buffer = await file.arrayBuffer();
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  const chunkSize = 1024 * 1024;
  const firstChunk = file.slice(0, chunkSize);
  const lastChunk = file.slice(Math.max(0, file.size - chunkSize));
  const sizeStr = new TextEncoder().encode(String(file.size));
  const parts = await Promise.all([firstChunk.arrayBuffer(), lastChunk.arrayBuffer()]);
  const combined = new Uint8Array(parts[0].byteLength + parts[1].byteLength + sizeStr.byteLength);
  combined.set(new Uint8Array(parts[0]), 0);
  combined.set(new Uint8Array(parts[1]), parts[0].byteLength);
  combined.set(sizeStr, parts[0].byteLength + parts[1].byteLength);
  const hash = await crypto.subtle.digest('SHA-256', combined);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function optimizeImage(file: File): Promise<File> {
  if (!file.type.match(/^image\/(jpeg|png|tiff|webp)$/)) return file;
  if (file.size > 50 * 1024 * 1024) return file;
  const blobUrl = URL.createObjectURL(file);
  try {
    return await new Promise<File>((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_WEB_DIMENSION || height > MAX_WEB_DIMENSION) {
          const scale = MAX_WEB_DIMENSION / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(file); return; }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) { resolve(file); return; }
            const optimizedName = file.name.replace(/\.[^.]+$/, '.webp');
            resolve(new File([blob], optimizedName, { type: 'image/webp' }));
          },
          'image/webp',
          WEBP_QUALITY,
        );
      };
      img.onerror = () => resolve(file);
      img.src = blobUrl;
    });
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

// ─── Component ──────────────────────────────────────────────────────
export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selected, setSelected] = useState<MediaFile | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [uploads, setUploads] = useState<UploadFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeCountRef = useRef(0);
  const queueRef = useRef<UploadFile[]>([]);

  const loadFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/media');
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      } else {
        setError('Failed to load media');
      }
    } catch {
      setError('Failed to connect to media library');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const updateUpload = useCallback((id: string, updates: Partial<UploadFile>) => {
    setUploads((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }, []);

  const processNext = useCallback(() => {
    if (activeCountRef.current >= MAX_CONCURRENT || queueRef.current.length === 0) return;
    const next = queueRef.current.shift();
    if (next) {
      activeCountRef.current++;
      uploadSingleFile(next);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadSingleFile = useCallback(async (uploadFile: UploadFile) => {
    const { id, file } = uploadFile;
    try {
      // Step 1: Hash
      updateUpload(id, { status: 'hashing', progress: 5 });
      await new Promise((r) => setTimeout(r, 0));
      const contentHash = await computeSHA256(file);

      // Step 2: Check duplicate
      updateUpload(id, { status: 'checking', progress: 10 });
      const dupRes = await fetch('/api/admin/media/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentHash }),
      });
      if (dupRes.ok) {
        const dupData = await dupRes.json();
        if (dupData.isDuplicate) {
          updateUpload(id, { status: 'duplicate', error: `Duplicate of "${dupData.existingMedia?.filename}"`, mediaId: dupData.existingMedia?.mediaId });
          return;
        }
      }

      // Step 3: Optimize image (resize + WebP)
      updateUpload(id, { status: 'optimizing', progress: 12 });
      await new Promise((r) => setTimeout(r, 0));
      const optimizedFile = await optimizeImage(file);
      if (optimizedFile !== file) {
        console.log(`Image optimized: ${(file.size / 1024 / 1024).toFixed(1)}MB → ${(optimizedFile.size / 1024 / 1024).toFixed(1)}MB`);
      }

      // Step 4: Get presigned URL
      updateUpload(id, { status: 'uploading', progress: 15 });
      const uploadRes = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: optimizedFile.name,
          contentType: optimizedFile.type,
          fileSize: optimizedFile.size,
          contentHash,
        }),
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || 'Failed to get upload URL');
      }
      const { uploadUrl, mediaId } = await uploadRes.json();
      updateUpload(id, { mediaId, progress: 20 });

      // Step 5: Upload directly to S3 via presigned URL
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            updateUpload(id, { progress: 20 + (e.loaded / e.total) * 65 });
          }
        });
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`S3 upload failed (${xhr.status})`));
        });
        xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
        xhr.timeout = 300000;
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', optimizedFile.type);
        xhr.send(optimizedFile);
      });

      // Step 6: Mark complete
      updateUpload(id, { status: 'completing', progress: 90 });
      await fetch('/api/admin/media/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId, fileSize: optimizedFile.size }),
      });

      updateUpload(id, { status: 'done', progress: 100 });
      await loadFiles();
    } catch (err) {
      updateUpload(id, { status: 'error', error: err instanceof Error ? err.message : 'Upload failed' });
    } finally {
      activeCountRef.current--;
      processNext();
    }
  }, [updateUpload, processNext, loadFiles]);

  function handleFiles(fileList: FileList) {
    const newUploads: UploadFile[] = Array.from(fileList).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      status: 'queued' as const,
      progress: 0,
      previewUrl: file.type.startsWith('image/') && file.size < 10 * 1024 * 1024
        ? URL.createObjectURL(file)
        : undefined,
    }));
    setUploads((prev) => [...newUploads, ...prev]);
    queueRef.current.push(...newUploads);
    for (let i = 0; i < MAX_CONCURRENT; i++) processNext();
  }

  async function handleDelete(mediaId?: string, key?: string) {
    if (!confirm('Delete this file? This cannot be undone.')) return;
    try {
      const params = mediaId ? `mediaId=${mediaId}` : `key=${encodeURIComponent(key || '')}`;
      const res = await fetch(`/api/admin/media?${params}`, { method: 'DELETE' });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => (mediaId ? f.mediaId !== mediaId : f.key !== key)));
        if (selected && (selected.mediaId === mediaId || selected.key === key)) setSelected(null);
      }
    } catch { /* empty */ }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function removeUpload(id: string) {
    setUploads((prev) => {
      const f = prev.find((u) => u.id === id);
      if (f?.previewUrl) URL.revokeObjectURL(f.previewUrl);
      return prev.filter((u) => u.id !== id);
    });
    queueRef.current = queueRef.current.filter((f) => f.id !== id);
  }

  const filtered = files.filter((f) =>
    (f.filename || f.key).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
          <p className="text-gray-500 mt-1">{files.length} files</p>
        </div>
        <div>
          <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf" onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ''; }} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-accent text-white text-sm font-medium hover:bg-brand-accent-hover transition-colors">
            <Upload className="w-4 h-4" />
            Upload Files
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files); }}
        className={`mb-6 border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          dragOver ? 'border-brand-accent bg-brand-accent/5' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className={`w-8 h-8 mx-auto mb-2 ${dragOver ? 'text-brand-accent' : 'text-gray-400'}`} />
        <p className="text-sm text-gray-600">Drag and drop files here, or <span className="text-brand-accent font-medium">browse</span></p>
        <p className="text-xs text-gray-400 mt-1">Images, videos, PDFs, documents</p>
      </div>

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div className="mb-6 space-y-2 max-h-48 overflow-y-auto">
          {uploads.map((f) => (
            <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-200">
              {f.previewUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={f.previewUrl} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <FileIcon filename={f.file.name} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">{f.file.name}</p>
                <p className="text-[10px] text-gray-500">{(f.file.size / 1024 / 1024).toFixed(1)} MB</p>
                {f.status === 'done' ? (
                  <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Complete</p>
                ) : f.status === 'error' ? (
                  <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {f.error}</p>
                ) : f.status === 'duplicate' ? (
                  <p className="text-xs text-amber-600">{f.error}</p>
                ) : f.status === 'queued' ? (
                  <p className="text-xs text-gray-400">Queued...</p>
                ) : (
                  <div className="mt-1">
                    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-accent transition-all duration-300" style={{ width: `${f.progress}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5 capitalize">{f.status}...</p>
                  </div>
                )}
              </div>
              {['done', 'error', 'duplicate', 'queued'].includes(f.status) && (
                <button onClick={() => removeUpload(f.id)} className="p-1 rounded text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search files..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent" />
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button onClick={() => setView('grid')} className={`p-2.5 ${view === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}><Grid className="w-4 h-4" /></button>
          <button onClick={() => setView('list')} className={`p-2.5 ${view === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="text-center py-12 text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading media...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <FileImage className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">{search ? 'No files match your search' : 'No files uploaded yet'}</p>
              <p className="text-sm text-gray-400 mt-1">{!search && 'Upload files using the button above or drag and drop'}</p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((file) => {
                const filename = file.filename || file.key.split('/').pop() || file.key;
                return (
                  <button key={file.key} onClick={() => setSelected(file)} className={`group relative aspect-square rounded-lg border overflow-hidden transition-all ${selected?.key === file.key ? 'border-brand-accent ring-2 ring-brand-accent/30' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}>
                    {isImage(file.key) ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={file.url} alt={filename} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 gap-2">
                        <FileIcon filename={file.key} />
                        <span className="text-xs font-medium text-gray-500 uppercase px-2 truncate max-w-full">{filename}</span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white truncate">{filename}</p>
                      <p className="text-[10px] text-white/70">{formatBytes(file.size)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">File</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Size</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Modified</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((file) => {
                    const filename = file.filename || file.key.split('/').pop() || file.key;
                    return (
                      <tr key={file.key} onClick={() => setSelected(file)} className={`cursor-pointer transition-colors ${selected?.key === file.key ? 'bg-brand-accent/5' : 'hover:bg-gray-50'}`}>
                        <td className="px-6 py-3"><div className="flex items-center gap-3">
                          {isImage(file.key) ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={file.url} alt="" className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center"><FileIcon filename={file.key} /></div>
                          )}
                          <span className="font-medium text-gray-900 truncate max-w-xs">{filename}</span>
                        </div></td>
                        <td className="px-6 py-3 text-gray-500">{formatBytes(file.size)}</td>
                        <td className="px-6 py-3 text-gray-500">{new Date(file.lastModified).toLocaleDateString()}</td>
                        <td className="px-6 py-3 text-right">
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(file.mediaId, file.key); }} className="p-1.5 rounded text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden sticky top-6">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="font-medium text-gray-900 text-sm">File Details</h3>
                <button onClick={() => setSelected(null)} className="p-1 rounded text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              {isImage(selected.key) && (
                <div className="aspect-video relative bg-gray-50 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selected.url} alt="" className="max-w-full max-h-full object-contain" />
                </div>
              )}
              <div className="p-4 space-y-3">
                <div><p className="text-xs font-medium text-gray-500 mb-1">Filename</p><p className="text-sm text-gray-900 break-all">{selected.filename || selected.key.split('/').pop()}</p></div>
                <div><p className="text-xs font-medium text-gray-500 mb-1">Size</p><p className="text-sm text-gray-900">{formatBytes(selected.size)}</p></div>
                <div><p className="text-xs font-medium text-gray-500 mb-1">Last Modified</p><p className="text-sm text-gray-900">{new Date(selected.lastModified).toLocaleString()}</p></div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">URL</p>
                  <div className="flex items-center gap-2">
                    <input readOnly value={selected.url} className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-gray-600 truncate" onClick={(e) => (e.target as HTMLInputElement).select()} />
                    <button onClick={() => copyUrl(selected.url)} className="p-1.5 rounded border border-gray-200 text-gray-400 hover:text-brand-accent transition-colors flex-shrink-0">
                      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="pt-2 flex gap-2">
                  <a href={selected.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors">Open</a>
                  <button onClick={() => handleDelete(selected.mediaId, selected.key)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
