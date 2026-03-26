'use client';

import { Monitor, Smartphone } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

interface ArticlePreviewProps {
  title: string;
  titleBold: boolean;
  content: string;
  mainImage: string;
  layout: number;
  category?: string;
}

export default function ArticlePreview({
  title,
  titleBold,
  content,
  mainImage,
  layout,
  category,
}: ArticlePreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Split content for layout 3 (image in middle)
  const getContentParts = () => {
    if (layout !== 3) return { part1: content, part2: '' };

    // Simple split at middle paragraph
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const paragraphs = tempDiv.querySelectorAll('p, h2, h3, ul, ol, blockquote');

    if (paragraphs.length < 2) {
      return { part1: content, part2: '' };
    }

    const midPoint = Math.ceil(paragraphs.length / 2);
    const part1Elements: string[] = [];
    const part2Elements: string[] = [];

    paragraphs.forEach((el, index) => {
      if (index < midPoint) {
        part1Elements.push(el.outerHTML);
      } else {
        part2Elements.push(el.outerHTML);
      }
    });

    return {
      part1: part1Elements.join(''),
      part2: part2Elements.join(''),
    };
  };

  const { part1, part2 } = getContentParts();

  const renderLayout = () => {
    const imageElement = mainImage ? (
      <div className="relative overflow-hidden rounded-lg bg-white/10 w-full h-full min-h-[200px]">
        <Image
          src={mainImage}
          alt={title || 'Article image'}
          fill
          sizes="(max-width: 768px) 100vw, 600px"
          className="object-cover"
        />
      </div>
    ) : (
      <div className="w-full h-48 bg-white/10 rounded-lg flex items-center justify-center text-gray-400">
        Aucune image
      </div>
    );

    const titleElement = (
      <h1 className={`text-xl md:text-2xl ${titleBold ? 'font-black' : 'font-bold'} text-white mb-3`}>
        {title || 'Titre de l\'article'}
      </h1>
    );

    const contentElement = (
      <div
        className="prose prose-sm max-w-none text-gray-300"
        dangerouslySetInnerHTML={{ __html: content || '<p class="text-gray-400">Contenu de l\'article...</p>' }}
      />
    );

    const categoryBadge = category && (
      <span className="inline-block px-3 py-1 bg-[#ff6b35] text-white text-xs font-medium rounded-full mb-3">
        {category}
      </span>
    );

    switch (layout) {
      case 1: // Image en haut
        return (
          <article className="space-y-4">
            <div className="aspect-video">
              {imageElement}
            </div>
            <div className="px-1">
              {categoryBadge}
              {titleElement}
              {contentElement}
            </div>
          </article>
        );

      case 2: // Image en bas
        return (
          <article className="space-y-4">
            <div className="px-1">
              {categoryBadge}
              {titleElement}
              {contentElement}
            </div>
            <div className="aspect-video">
              {imageElement}
            </div>
          </article>
        );

      case 3: // Image au milieu
        return (
          <article className="space-y-4 px-1">
            {categoryBadge}
            {titleElement}
            <div
              className="prose prose-sm max-w-none text-gray-300"
              dangerouslySetInnerHTML={{ __html: part1 || '<p class="text-gray-400">Début du contenu...</p>' }}
            />
            <div className="aspect-video my-6">
              {imageElement}
            </div>
            {part2 && (
              <div
                className="prose prose-sm max-w-none text-gray-300"
                dangerouslySetInnerHTML={{ __html: part2 }}
              />
            )}
          </article>
        );

      case 4: // Image à gauche
        return (
          <article className={`flex gap-6 ${viewMode === 'mobile' ? 'flex-col' : ''}`}>
            <div className={viewMode === 'mobile' ? 'w-full aspect-video' : 'w-2/5 flex-shrink-0'}>
              <div className="h-full min-h-[200px]">
                {imageElement}
              </div>
            </div>
            <div className="flex-1">
              {categoryBadge}
              {titleElement}
              {contentElement}
            </div>
          </article>
        );

      case 5: // Image à droite
        return (
          <article className={`flex gap-6 ${viewMode === 'mobile' ? 'flex-col-reverse' : ''}`}>
            <div className="flex-1">
              {categoryBadge}
              {titleElement}
              {contentElement}
            </div>
            <div className={viewMode === 'mobile' ? 'w-full aspect-video' : 'w-2/5 flex-shrink-0'}>
              <div className="h-full min-h-[200px]">
                {imageElement}
              </div>
            </div>
          </article>
        );

      default:
        return (
          <article className="space-y-4">
            <div className="aspect-video">
              {imageElement}
            </div>
            <div className="px-1">
              {categoryBadge}
              {titleElement}
              {contentElement}
            </div>
          </article>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* View mode toggle */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-300">Aperçu de l'article</h4>
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode('desktop')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'desktop' ? 'bg-[#1a1a24] shadow text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
            title="Vue desktop"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('mobile')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'mobile' ? 'bg-[#1a1a24] shadow text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
            title="Vue mobile"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview container */}
      <div className={`border border-[#2a2a36] rounded-xl bg-[#1a1a24] overflow-hidden transition-all ${
        viewMode === 'mobile' ? 'max-w-sm mx-auto' : ''
      }`}>
        <div className="p-4 md:p-6 max-h-[500px] overflow-y-auto">
          {renderLayout()}
        </div>
      </div>
    </div>
  );
}
