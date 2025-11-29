'use client';

import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface FileUploaderProps {
  accept?: string;
  maxSize?: number; // in MB
  onFileSelect: (file: File | null) => void;
  currentFile?: File | string | null;
  label?: string;
  type?: 'image' | 'video' | 'csv';
}

export default function FileUploader({
  accept,
  maxSize = 10,
  onFileSelect,
  currentFile,
  label,
  type = 'image',
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setError(null);

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Check file type
    if (type === 'image' && !file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (type === 'video' && !file.type.startsWith('video/')) {
      setError('Please select a video file');
      return;
    }

    if (type === 'csv' && file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    onFileSelect(file);
  };

  const handleRemove = () => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError(null);
  };

  const getDefaultAccept = () => {
    if (type === 'image') return 'image/*';
    if (type === 'video') return 'video/*';
    if (type === 'csv') return '.csv';
    return accept;
  };

  const getPreviewUrl = () => {
    if (!currentFile) return null;
    if (typeof currentFile === 'string') return currentFile;
    return URL.createObjectURL(currentFile);
  };

  const previewUrl = getPreviewUrl();

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-text-primary">{label}</label>}
      
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-yellow-500 bg-yellow-500/10'
            : 'border-border-default hover:border-border-hover'
        }`}
      >
        {previewUrl ? (
          <div className="relative">
            {type === 'image' && (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-64 mx-auto rounded-lg"
              />
            )}
            {type === 'video' && (
              <video
                src={previewUrl}
                controls
                className="max-h-64 mx-auto rounded-lg"
              />
            )}
            {type === 'csv' && (
              <div className="text-center py-8">
                <p className="text-text-primary font-medium">{typeof currentFile === 'string' ? currentFile : (currentFile as File).name}</p>
              </div>
            )}
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-surface-raised rounded-full hover:bg-surface-hover transition-colors"
              type="button"
            >
              <X className="h-4 w-4 text-text-primary" />
            </button>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="h-12 w-12 mx-auto text-text-secondary mb-4" />
            <p className="text-text-primary mb-2">
              Drag and drop or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-yellow-500 hover:text-yellow-400 font-medium"
              >
                browse
              </button>
            </p>
            <p className="text-sm text-text-secondary">
              {type === 'image' && 'PNG, JPG, GIF up to 10MB'}
              {type === 'video' && 'MP4, MOV up to 50MB'}
              {type === 'csv' && 'CSV file up to 5MB'}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept || getDefaultAccept()}
              onChange={handleChange}
              className="hidden"
            />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

