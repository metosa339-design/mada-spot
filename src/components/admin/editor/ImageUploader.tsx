'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Trash2, Star, Loader2, Plus, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  images: string[];
  mainImage: string;
  onImagesChange: (images: string[]) => void;
  onMainImageChange: (url: string) => void;
}

export default function ImageUploader({
  images,
  mainImage,
  onImagesChange,
  onMainImageChange,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [_uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [urlInput, setUrlInput] = useState('');

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'articles');

    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.media?.url) {
        return data.media.url;
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
    return null;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

      const url = await uploadFile(file);
      if (url) {
        uploadedUrls.push(url);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      }
    }

    if (uploadedUrls.length > 0) {
      const newImages = [...images, ...uploadedUrls];
      onImagesChange(newImages);

      // If no main image, set the first uploaded as main
      if (!mainImage && uploadedUrls.length > 0) {
        onMainImageChange(uploadedUrls[0]);
      }
    }

    setIsUploading(false);
    setUploadProgress({});
  }, [images, mainImage, onImagesChange, onMainImageChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleRemoveImage = (urlToRemove: string) => {
    const newImages = images.filter(url => url !== urlToRemove);
    onImagesChange(newImages);

    // If removing main image, set first remaining as main
    if (mainImage === urlToRemove && newImages.length > 0) {
      onMainImageChange(newImages[0]);
    } else if (newImages.length === 0) {
      onMainImageChange('');
    }
  };

  const handleSetMainImage = (url: string) => {
    onMainImageChange(url);
  };

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (url && url.startsWith('http')) {
      const newImages = [...images, url];
      onImagesChange(newImages);

      if (!mainImage) {
        onMainImageChange(url);
      }

      setUrlInput('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Current images gallery */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Images uploadées ({images.length})
            </h4>
            <p className="text-xs text-gray-500">
              Cliquez sur l'étoile pour définir l'image principale
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((imgUrl, index) => {
              const isMain = imgUrl === mainImage;
              return (
                <div
                  key={index}
                  className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                    isMain
                      ? 'border-amber-500 ring-2 ring-amber-200'
                      : 'border-[#2a2a36] hover:border-[#3a3a46]'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Image ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />

                  {/* Main image badge */}
                  {isMain && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Principale
                    </div>
                  )}

                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!isMain && (
                      <button
                        type="button"
                        onClick={() => handleSetMainImage(imgUrl)}
                        className="p-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                        title="Définir comme image principale"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(imgUrl)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Index badge */}
                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-black/70 text-white text-xs font-medium rounded-full flex items-center justify-center">
                    {index + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-[#2a2a36] hover:border-[#3a3a46] hover:bg-[#12121a]'
        }`}
      >
        <input {...getInputProps()} />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-400">Upload en cours...</p>
          </div>
        ) : (
          <>
            <Upload className={`w-12 h-12 mx-auto mb-3 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
            <p className={`text-sm font-medium ${isDragActive ? 'text-blue-600' : 'text-gray-400'}`}>
              {isDragActive
                ? 'Déposez les images ici...'
                : 'Glissez-déposez vos images ici'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ou cliquez pour sélectionner • PNG, JPG, GIF jusqu'à 10MB
            </p>
          </>
        )}
      </div>

      {/* URL input */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10"></div>
        <span className="text-xs text-gray-400 font-medium">OU</span>
        <div className="flex-1 h-px bg-white/10"></div>
      </div>

      <div className="flex gap-2">
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Coller une URL d'image..."
          className="flex-1 px-4 py-2 border border-[#2a2a36] bg-[#12121a] text-white rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddUrl();
            }
          }}
        />
        <button
          type="button"
          onClick={handleAddUrl}
          disabled={!urlInput.trim().startsWith('http')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>
    </div>
  );
}
