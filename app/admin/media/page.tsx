'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, Trash2, Copy, Check, Search, Grid, List, X } from 'lucide-react';

interface MediaFile {
  key: string;
  url: string;
  size: number;
  lastModified: string;
  contentType?: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selected, setSelected] = useState<MediaFile | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadFiles() {
    try {
      const res = await fetch('/api/admin/media');
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList?.length) return;

    setUploading(true);
    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const formData = new FormData();
        formData.append('file', file);

        await fetch('/api/admin/media', {
          method: 'POST',
          body: formData,
        });
      }
      await loadFiles();
    } catch {
      // empty
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(key: string) {
    if (!confirm('Delete this file? This cannot be undone.')) return;
    try {
      await fetch(`/api/admin/media?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });
      setFiles((prev) => prev.filter((f) => f.key !== key));
      if (selected?.key === key) setSelected(null);
    } catch {
      // empty
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

  const isImage = (key: string) =>
    /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(key);

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
            accept="image/*,video/*,.pdf"
            onChange={handleUpload}
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
        <div className="flex-1">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading media...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {search ? 'No files match your search' : 'No files uploaded yet'}
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((file) => (
                <button
                  key={file.key}
                  onClick={() => setSelected(file)}
                  className={`group relative aspect-square rounded-lg border overflow-hidden transition-all ${
                    selected?.key === file.key
                      ? 'border-brand-accent ring-2 ring-brand-accent/30'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {isImage(file.key) ? (
                    <Image
                      src={file.url}
                      alt={file.key.split('/').pop() || ''}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <span className="text-xs font-medium text-gray-400 uppercase">
                        {file.key.split('.').pop()}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white truncate">
                      {file.key.split('/').pop()}
                    </p>
                  </div>
                </button>
              ))}
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
                  {filtered.map((file) => (
                    <tr
                      key={file.key}
                      onClick={() => setSelected(file)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-3">
                        <p className="font-medium text-gray-900 truncate max-w-xs">
                          {file.key.split('/').pop()}
                        </p>
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
                  ))}
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
                <div className="aspect-video relative bg-gray-50">
                  <Image
                    src={selected.url}
                    alt=""
                    fill
                    className="object-contain"
                    sizes="320px"
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
                  <p className="text-xs font-medium text-gray-500 mb-1">URL</p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={selected.url}
                      className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-gray-600 truncate"
                    />
                    <button
                      onClick={() => copyUrl(selected.url)}
                      className="p-1.5 rounded border border-gray-200 text-gray-400 hover:text-brand-accent transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(selected.key)}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete File
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
