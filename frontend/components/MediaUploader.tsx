'use client';

import { useState, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { Upload, X, GripVertical, Loader2, Image as ImageIcon, Film } from 'lucide-react';

interface MediaUploaderProps {
  type: 'image' | 'video';
  urls: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

export default function MediaUploader({ type, urls, onChange, maxFiles }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accept = type === 'image' ? 'image/*' : 'video/*';
  const maxSize = type === 'image' ? '5MB' : '100MB';
  const Icon = type === 'image' ? ImageIcon : Film;

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    if (maxFiles && urls.length + fileArr.length > maxFiles) {
      notify.error(`Maximum ${maxFiles} ${type}s allowed`);
      return;
    }
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of fileArr) {
      try {
        const res = type === 'image' ? await api.uploadImage(file) : await api.uploadVideo(file);
        if (res.url) newUrls.push(res.url);
      } catch (err: any) {
        notify.error(err?.response?.data?.message || `Failed to upload ${file.name}`);
      }
    }
    if (newUrls.length > 0) onChange([...urls, ...newUrls]);
    setUploading(false);
  }, [type, urls, onChange, maxFiles]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleRemove = (idx: number) => onChange(urls.filter((_, i) => i !== idx));

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (maxFiles && urls.length >= maxFiles) {
      notify.error(`Maximum ${maxFiles} ${type}s allowed`);
      return;
    }
    onChange([...urls, trimmed]);
    setUrlInput('');
  };

  const handleDragStart = (idx: number) => setDragIndex(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) return;
    const reordered = [...urls];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(idx, 0, moved);
    onChange(reordered);
    setDragIndex(idx);
  };
  const handleDragEnd = () => setDragIndex(null);

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-purple-500 bg-purple-500/10' : 'border-border-default hover:border-purple-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            <span className="text-sm text-text-secondary">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-text-secondary" />
            <p className="text-sm text-text-secondary">
              Drag & drop {type}s here, or click to select
            </p>
            <p className="text-xs text-text-secondary">Max {maxSize} per file</p>
          </div>
        )}
      </div>

      {/* URL input fallback */}
      <div className="flex gap-2">
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddUrl(); } }}
          placeholder={`Or paste ${type} URL`}
          className="flex-1 px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button type="button" onClick={handleAddUrl} className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
          Add
        </button>
      </div>

      {/* Previews */}
      {urls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {urls.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`relative group rounded-lg overflow-hidden border border-border-default bg-surface-base ${
                dragIndex === idx ? 'opacity-50' : ''
              }`}
            >
              <div className="absolute top-1 left-1 z-10 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-4 w-4 text-white drop-shadow-lg" />
              </div>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-1 right-1 z-10 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
              {type === 'image' ? (
                <img src={url} alt={`${type} ${idx + 1}`} className="w-full h-24 object-cover" />
              ) : (
                <video src={url} className="w-full h-24 object-cover" muted preload="metadata" />
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-0.5 truncate">
                {idx + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-text-secondary">
        <Icon className="inline h-3 w-3 mr-1" />
        {urls.length}{maxFiles ? ` / ${maxFiles}` : ''} {type}(s)
      </p>
    </div>
  );
}
