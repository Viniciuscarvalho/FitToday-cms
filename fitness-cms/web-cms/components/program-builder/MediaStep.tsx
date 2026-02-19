'use client';

import { useState } from 'react';
import { Upload, X, Image as ImageIcon, Video, Link as LinkIcon } from 'lucide-react';
import { ProgramFormData } from '@/app/(dashboard)/programs/new/page';

interface MediaStepProps {
  data: ProgramFormData;
  onChange: (data: Partial<ProgramFormData>) => void;
  errors: Record<string, string>;
}

const MAX_COVER_SIZE = 10 * 1024 * 1024; // 10MB

export function MediaStep({ data, onChange, errors }: MediaStepProps) {
  const [coverUrlInput, setCoverUrlInput] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');

  const handleCoverUrlSubmit = () => {
    if (coverUrlInput.trim()) {
      onChange({ coverImage: coverUrlInput.trim(), coverImageFile: null });
      setCoverUrlInput('');
    }
  };

  const handleVideoUrlSubmit = () => {
    if (videoUrlInput.trim()) {
      onChange({ previewVideo: videoUrlInput.trim() });
      setVideoUrlInput('');
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Apenas imagens são permitidas (JPEG, PNG, WebP)');
      return;
    }
    if (file.size > MAX_COVER_SIZE) {
      alert('Imagem muito grande. Máximo 10MB');
      return;
    }

    // Create a local preview URL and store the file for upload
    const previewUrl = URL.createObjectURL(file);
    onChange({ coverImage: previewUrl, coverImageFile: file });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Mídia do Programa
        </h2>
        <p className="text-gray-500 mb-6">
          Adicione imagens e vídeos para tornar seu programa mais atraente
        </p>
      </div>

      {/* Cover Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Imagem de Capa
        </label>
        <div className="space-y-3">
          {data.coverImage ? (
            <div className="relative rounded-lg overflow-hidden border border-gray-200">
              <img
                src={data.coverImage}
                alt="Cover"
                className="w-full h-48 object-cover"
              />
              <button
                onClick={() => onChange({ coverImage: '', coverImageFile: null })}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
              {data.coverImageFile && (
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                  {data.coverImageFile.name} ({(data.coverImageFile.size / (1024 * 1024)).toFixed(1)}MB)
                </div>
              )}
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 transition-colors"
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files[0];
                if (file) handleFileSelect(file);
              }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/jpeg,image/png,image/webp';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleFileSelect(file);
                };
                input.click();
              }}
            >
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-500 mb-2">
                Clique ou arraste uma imagem
              </p>
              <p className="text-xs text-gray-400">
                PNG, JPG ou WEBP - Máximo 10MB (Recomendado: 1200x630px)
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={coverUrlInput}
              onChange={(e) => setCoverUrlInput(e.target.value)}
              placeholder="Ou cole a URL da imagem"
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleCoverUrlSubmit()}
            />
            <button
              onClick={handleCoverUrlSubmit}
              disabled={!coverUrlInput.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <LinkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Preview Video */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vídeo de Apresentação (Opcional)
        </label>
        <div className="space-y-3">
          {data.previewVideo ? (
            <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-black">
              <video
                src={data.previewVideo}
                className="w-full h-48 object-contain"
                controls
              />
              <button
                onClick={() => onChange({ previewVideo: '' })}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-500 mb-2">
                Adicione um vídeo de apresentação do programa
              </p>
              <p className="text-xs text-gray-400">
                MP4 ou URL do YouTube/Vimeo
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={videoUrlInput}
              onChange={(e) => setVideoUrlInput(e.target.value)}
              placeholder="Cole a URL do vídeo (YouTube, Vimeo, etc)"
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleVideoUrlSubmit()}
            />
            <button
              onClick={handleVideoUrlSubmit}
              disabled={!videoUrlInput.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <LinkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Dicas para boas imagens:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>- Use imagens de alta qualidade que representem o programa</li>
          <li>- Evite textos pequenos na imagem de capa</li>
          <li>- Vídeos de apresentação aumentam conversões em até 80%</li>
        </ul>
      </div>
    </div>
  );
}
