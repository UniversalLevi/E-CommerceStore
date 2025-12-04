'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { ensureHttps } from '@/lib/imageUtils';

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
  required?: boolean;
}

export default function ImageUploader({
  value = [],
  onChange,
  multiple = true,
  maxFiles = 10,
  label = 'Upload Images',
  required = false,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    const filesToUpload = multiple ? filesArray : [filesArray[0]];
    
    if (value.length + filesToUpload.length > maxFiles) {
      notify.error(`Maximum ${maxFiles} images allowed`);
      return;
    }

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        notify.error(`${file.name} is not an image file`);
        continue;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        notify.error(`${file.name} is too large. Maximum size is 5MB`);
        continue;
      }

      const newIndex = value.length + i;
      setUploadingIndex(newIndex);
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append('image', file);

        // Don't set Content-Type header - let browser set it automatically with boundary
        const response = await api.post<{ success: boolean; url: string }>(
          '/api/upload/image',
          formData
        );

        if (response.success && response.url) {
          // Ensure URL uses HTTPS to prevent mixed content warnings
          const safeUrl = ensureHttps(response.url);
          onChange([...value, safeUrl]);
          notify.success('Image uploaded successfully');
        }
      } catch (error: any) {
        notify.error(error.response?.data?.error || 'Failed to upload image');
      } finally {
        setUploadingIndex(null);
        if (i === filesToUpload.length - 1) {
          setUploading(false);
        }
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-text-secondary mb-2">
        {label} {required && '*'}
      </label>

      {/* Upload Button */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-border-default rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 transition-colors bg-surface-elevated"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || value.length >= maxFiles}
        />
        <Upload className="h-8 w-8 mx-auto mb-2 text-text-muted" />
        <p className="text-sm text-text-secondary">
          {uploading ? 'Uploading...' : `Click to upload ${multiple ? 'images' : 'an image'}`}
        </p>
        <p className="text-xs text-text-muted mt-1">
          PNG, JPG, GIF up to 5MB {multiple && `(max ${maxFiles} files)`}
        </p>
      </div>

      {/* Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {value.map((url, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-surface-elevated border border-border-default">
                {uploadingIndex === index ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  </div>
                ) : (
                  <img
                    src={ensureHttps(url)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && required && (
        <p className="text-sm text-red-400">At least one image is required</p>
      )}
    </div>
  );
}

