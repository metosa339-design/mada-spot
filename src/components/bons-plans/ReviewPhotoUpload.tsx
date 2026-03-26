'use client';

import { useState, useCallback, useRef } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';

interface ReviewPhotoUploadProps {
  onImagesChange: (urls: string[]) => void;
  maxPhotos?: number;
  csrfToken: string;
}

export default function ReviewPhotoUpload({
  onImagesChange,
  maxPhotos = 3,
  csrfToken,
}: ReviewPhotoUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      setError(null);
      const files = Array.from(fileList);

      // Validate total count
      if (uploadedUrls.length + files.length > maxPhotos) {
        setError(`Maximum ${maxPhotos} photos autorisées`);
        return;
      }

      // Validate each file
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          setError('Seules les images sont acceptées');
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError('Chaque image doit faire moins de 10 MB');
          return;
        }
      }

      setIsUploading(true);

      try {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        formData.append('csrfToken', csrfToken);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || "Erreur lors de l'upload");
        }

        const data = await res.json();
        const newUrls = data.files.map((f: { url: string }) => f.url);

        // Create local previews
        const newPreviews: string[] = [];
        for (const file of files) {
          const preview = URL.createObjectURL(file);
          newPreviews.push(preview);
        }

        const allPreviews = [...previews, ...newPreviews];
        const allUrls = [...uploadedUrls, ...newUrls];

        setPreviews(allPreviews);
        setUploadedUrls(allUrls);
        onImagesChange(allUrls);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de l'upload");
      } finally {
        setIsUploading(false);
      }
    },
    [uploadedUrls, previews, maxPhotos, csrfToken, onImagesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  const removeImage = useCallback(
    (index: number) => {
      // Revoke the object URL to free memory
      if (previews[index]) {
        URL.revokeObjectURL(previews[index]);
      }

      const newPreviews = previews.filter((_, i) => i !== index);
      const newUrls = uploadedUrls.filter((_, i) => i !== index);

      setPreviews(newPreviews);
      setUploadedUrls(newUrls);
      onImagesChange(newUrls);
    },
    [previews, uploadedUrls, onImagesChange]
  );

  return (
    <div className="space-y-3">
      {/* Thumbnails */}
      {previews.length > 0 && (
        <div className="flex flex-row gap-3">
          {previews.map((preview, index) => (
            <div key={index} className="relative w-20 h-20 flex-shrink-0">
              <img
                src={preview}
                alt={`Photo ${index + 1}`}
                className="w-full h-full aspect-square object-cover rounded-xl border border-[#2a2a36]"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {previews.length < maxPhotos && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-3 p-4 bg-[#0c0c16] border border-dashed border-[#1e1e2e] rounded-xl cursor-pointer hover:border-orange-500/50 transition-colors"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
          ) : (
            <Camera className="w-5 h-5 text-slate-400" />
          )}
          <span className="text-sm text-slate-400">
            {isUploading
              ? 'Upload en cours...'
              : `Ajouter des photos (${previews.length}/${maxPhotos})`}
          </span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Error */}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
