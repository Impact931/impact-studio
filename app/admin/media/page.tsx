'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Upload, Trash2, Copy, Check, Search, Grid, List, X, FileImage, Film, FileText } from 'lucide-react';

interface MediaFile {
  key: string;
  url: string;
  size: number;
  lastModified: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(key: string) {
  return /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp|ico)$/i.test(key);
}

function isVideo(key: string) {
  return /\.(mp4|mov|avi|webm|mkv)$/i.test(key);
}

function FileIcon({ filename }: { filename: string }) {
  if (isImage(filename)) return <FileImage className="w-8 h-8 text-blue-400" />;
  if (isVideo(filename)) return <Film className="w-8 h-8 text-purple-400" />;
  return <FileText className="w-8 h-8 text-gray-400" />;
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selected, setSelected] = useState<MediaFile | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/media');
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'Failed to load media');
      }
    } catch (err) {
      setError('Failed to connect to media library');
      console.error('Media load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  async function uploadFiles(fileList: FileList | File[]) {
    const filesArray = Array.from(fileList);
    if (!filesArray.length) return;

    setUploading(true);
    setError('');
    const progress: string[] = [];

    try {
      for (const file of filesArray) {
        progress.push(`Uploading ${file.name}...`);
        setUploadProgress([...progress]);

        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/admin/media', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          progress[progress.length - 1] = `Failed: ${file.name} — ${errData.error || 'Upload error'}`;
          setUploadProgress([...progress]);
        } else {
          progress[progress.length - 1] = `Done: ${file.name}`;
          setUploadProgress([...progress]);
        }
      }
      await loadFiles();
    } catch (err) {
      setError('Upload failed');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress([]), 3000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) uploadFiles(e.target.files);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
  }

  async function handleDelete(key: string) {
    if (!confirm('Delete this file? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/media?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.key !== key));
        if (selected?.key === key) setSelected(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const filtered = files.filter((f) =>
    f.key.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
          <p className="text-gray-500 mt-1">{files.length} files</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx"
            onChange={handleFileInput}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-accent text-white text-sm font-medium hover:bg-brand-accent-hover transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload Files'}
          </button>
        </div>
      </div>

      {/* Upload progress */}
      {uploadProgress.length > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
          {uploadProgress.map((msg, i) => (
            <p key={i} className={`text-sm ${msg.startsWith('Failed') ? 'text-red-600' : msg.startsWith('Done') ? 'text-green-600' : 'text-blue-700'}`}>
              {msg}
            </p>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`mb-6 border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver
            ? 'border-brand-accent bg-brand-accent/5'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <Upload className={`w-8 h-8 mx-auto mb-2 ${dragOver ? 'text-brand-accent' : 'text-gray-400'}`} />
        <p className="text-sm text-gray-600">
          Drag and drop files here, or{' '}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-brand-accent font-medium hover:underline"
          >
            browse
          </button>
        </p>
        <p className="text-xs text-gray-400 mt-1">Images, videos, PDFs, documents</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent"
          />
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setView('grid')}
            className={`p-2.5 ${view === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2.5 ${view === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* File Grid/List */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading media...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <FileImage className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                {search ? 'No files match your search' : 'No files uploaded yet'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {!search && 'Upload files using the button above or drag and drop'}
              </p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((file) => {
                const filename = file.key.split('/').pop() || file.key;
                return (
                  <button
                    key={file.key}
                    onClick={() => setSelected(file)}
                    className={`group relative aspect-square rounded-lg border overflow-hidden transition-all ${
                      selected?.key === file.key
                        ? 'border-brand-accent ring-2 ring-brand-accent/30'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    {isImage(file.key) ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={file.url}
                        alt={filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 gap-2">
                        <FileIcon filename={file.key} />
                        <span className="text-xs font-medium text-gray-500 uppercase px-2 truncate max-w-full">
                          {filename}
                        </span>
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
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-3 font-medium text-gray-500">File</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Size</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Modified</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((file) => {
                    const filename = file.key.split('/').pop() || file.key;
                    return (
                      <tr
                        key={file.key}
                        onClick={() => setSelected(file)}
                        className={`cursor-pointer transition-colors ${
                          selected?.key === file.key ? 'bg-brand-accent/5' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            {isImage(file.key) ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={file.url} alt="" className="w-10 h-10 rounded object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                                <FileIcon filename={file.key} />
                              </div>
                            )}
                            <span className="font-medium text-gray-900 truncate max-w-xs">{filename}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-gray-500">{formatBytes(file.size)}</td>
                        <td className="px-6 py-3 text-gray-500">
                          {new Date(file.lastModified).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(file.key);
                            }}
                            className="p-1.5 rounded text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
                <button
                  onClick={() => setSelected(null)}
                  className="p-1 rounded text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isImage(selected.key) && (
                <div className="aspect-video relative bg-gray-50 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selected.url}
                    alt=""
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}

              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Filename</p>
                  <p className="text-sm text-gray-900 break-all">{selected.key.split('/').pop()}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Size</p>
                  <p className="text-sm text-gray-900">{formatBytes(selected.size)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Last Modified</p>
                  <p className="text-sm text-gray-900">
                    {new Date(selected.lastModified).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">URL</p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={selected.url}
                      className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-gray-600 truncate"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      onClick={() => copyUrl(selected.url)}
                      className="p-1.5 rounded border border-gray-200 text-gray-400 hover:text-brand-accent transition-colors flex-shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
                  >
                    Open
                  </a>
                  <button
                    onClick={() => handleDelete(selected.key)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
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
