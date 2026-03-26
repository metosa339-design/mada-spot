'use client';

import { useState, useEffect } from 'react';
import {
  Save,
  X,
  Calendar,
  Clock,
  Image as ImageIcon,
  Link,
  Star,
  Zap,
  Eye,
  Loader2,
  FileText,
  Layout,
  Type,
} from 'lucide-react';
import { RichTextEditor, ImageUploader, LayoutPicker, ArticlePreview } from './editor';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Article {
  id?: string;
  title: string;
  content: string;
  summary?: string;
  categoryId?: string;
  imageUrl?: string;
  additionalImages?: string[];
  sourceUrl?: string;
  sourceName?: string;
  status: string;
  scheduledAt?: string;
  isFeatured: boolean;
  isBreaking: boolean;
  hasCustomImage?: boolean;
  layoutFormat?: number;
  titleBold?: boolean;
}

interface ArticleEditorProps {
  article?: Article | null;
  onSave: (article: Article) => Promise<void>;
  onClose: () => void;
}

type TabType = 'images' | 'content' | 'layout';

export default function ArticleEditor({ article, onSave, onClose }: ArticleEditorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('images');
  const [formData, setFormData] = useState<Article>({
    title: '',
    content: '',
    summary: '',
    categoryId: '',
    imageUrl: '',
    additionalImages: [],
    sourceUrl: '',
    sourceName: '',
    status: 'draft',
    scheduledAt: '',
    isFeatured: false,
    isBreaking: false,
    hasCustomImage: true,
    layoutFormat: 1,
    titleBold: false,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (article) {
      // Ensure additionalImages is always an array
      let additionalImages: string[] = [];
      if (Array.isArray(article.additionalImages)) {
        additionalImages = article.additionalImages;
      } else if (typeof article.additionalImages === 'string' && article.additionalImages) {
        try {
          const parsed = JSON.parse(article.additionalImages);
          additionalImages = Array.isArray(parsed) ? parsed : [];
        } catch {
          additionalImages = [];
        }
      }

      setFormData({
        ...article,
        additionalImages,
        layoutFormat: article.layoutFormat || 1,
        titleBold: article.titleBold || false,
        scheduledAt: article.scheduledAt ? new Date(article.scheduledAt).toISOString().slice(0, 16) : '',
      });
    }
    fetchCategories();
  }, [article]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return '';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || '';
  };

  // Handle images change from ImageUploader
  const handleImagesChange = (images: string[]) => {
    setFormData(prev => ({
      ...prev,
      additionalImages: images,
    }));
  };

  // Handle main image change
  const handleMainImageChange = (url: string) => {
    setFormData(prev => ({
      ...prev,
      imageUrl: url,
      hasCustomImage: true,
    }));
  };

  // All images (main + additional) for the gallery
  const additionalImagesArray = Array.isArray(formData.additionalImages) ? formData.additionalImages : [];
  const allImages = [
    ...(formData.imageUrl ? [formData.imageUrl] : []),
    ...additionalImagesArray.filter(img => img !== formData.imageUrl),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      // Clean data before sending - convert empty strings to undefined
      const cleanedData: Article = {
        ...formData,
        hasCustomImage: true,
        imageUrl: formData.imageUrl || undefined,
        sourceUrl: formData.sourceUrl || undefined,
        sourceName: formData.sourceName || undefined,
        summary: formData.summary || undefined,
        categoryId: formData.categoryId || undefined,
        scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : undefined,
        additionalImages: (Array.isArray(formData.additionalImages) ? formData.additionalImages : []).filter(img => img && img.trim() !== ''),
      };

      await onSave(cleanedData);
    } catch (err: any) {
      const errorMessage = err?.message || 'Erreur lors de la sauvegarde';
      setError(errorMessage);
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setFormData({ ...formData, status: 'published' });
    setTimeout(() => {
      const form = document.getElementById('article-form') as HTMLFormElement;
      form?.requestSubmit();
    }, 100);
  };

  const handleSchedule = async () => {
    if (!formData.scheduledAt) {
      setError('Veuillez sélectionner une date de publication');
      return;
    }
    setFormData({ ...formData, status: 'scheduled' });
    setTimeout(() => {
      const form = document.getElementById('article-form') as HTMLFormElement;
      form?.requestSubmit();
    }, 100);
  };

  const tabs = [
    { id: 'images' as TabType, label: 'Images', icon: ImageIcon },
    { id: 'content' as TabType, label: 'Contenu', icon: FileText },
    { id: 'layout' as TabType, label: 'Mise en page', icon: Layout },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a24] rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#2a2a36] flex items-center justify-between bg-[#12121a]">
          <h2 className="text-xl font-bold text-white">
            {article?.id ? 'Modifier l\'article' : 'Nouvel article'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#2a2a36] bg-[#12121a]/50">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-[#ff6b35] text-[#ff6b35] bg-[#1a1a24]'
                      : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form
          id="article-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto"
        >
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Tab: Images */}
            {activeTab === 'images' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Galerie d'images
                  </h3>
                  <p className="text-sm text-blue-700 mb-4">
                    Uploadez vos images et sélectionnez l'image principale qui sera affichée selon le format choisi.
                  </p>
                  <ImageUploader
                    images={allImages}
                    mainImage={formData.imageUrl || ''}
                    onImagesChange={handleImagesChange}
                    onMainImageChange={handleMainImageChange}
                  />
                </div>
              </div>
            )}

            {/* Tab: Content */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                {/* Title with bold option */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-300">
                      Titre *
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.titleBold}
                        onChange={(e) => setFormData({ ...formData, titleBold: e.target.checked })}
                        className="w-4 h-4 text-[#ff6b35] border-gray-300 rounded focus:ring-[#ff6b35]"
                      />
                      <Type className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-400">Titre en gras</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`w-full px-4 py-3 border border-[#2a2a36] bg-[#12121a] text-white rounded-lg focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35] outline-none ${
                      formData.titleBold ? 'font-black text-xl' : 'font-semibold text-lg'
                    }`}
                    placeholder="Titre de l'article"
                    required
                  />
                </div>

                {/* Summary */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Résumé
                  </label>
                  <textarea
                    value={formData.summary || ''}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    className="w-full px-4 py-2 border border-[#2a2a36] bg-[#12121a] text-white rounded-lg focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35] outline-none resize-none"
                    rows={2}
                    placeholder="Bref résumé de l'article"
                  />
                </div>

                {/* Rich text content */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contenu *
                  </label>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(html) => setFormData({ ...formData, content: html })}
                    availableImages={allImages}
                    placeholder="Écrivez votre article ici..."
                  />
                </div>

                {/* Category and Source */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Catégorie
                    </label>
                    <select
                      value={formData.categoryId || ''}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-4 py-2 border border-[#2a2a36] bg-[#12121a] text-white rounded-lg focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35] outline-none"
                    >
                      <option value="">Aucune catégorie</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Source
                    </label>
                    <input
                      type="text"
                      value={formData.sourceName || ''}
                      onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })}
                      className="w-full px-4 py-2 border border-[#2a2a36] bg-[#12121a] text-white rounded-lg focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35] outline-none"
                      placeholder="Nom de la source"
                    />
                  </div>
                </div>

                {/* Source URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    <Link className="w-4 h-4 inline-block mr-1" />
                    Lien source original
                  </label>
                  <input
                    type="url"
                    value={formData.sourceUrl || ''}
                    onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-[#2a2a36] bg-[#12121a] text-white rounded-lg focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35] outline-none"
                    placeholder="https://..."
                  />
                </div>

                {/* Scheduling */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    <Calendar className="w-4 h-4 inline-block mr-1" />
                    Publication programmée
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt || ''}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="w-full px-4 py-2 border border-[#2a2a36] bg-[#12121a] text-white rounded-lg focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35] outline-none"
                  />
                </div>

                {/* Options */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="w-4 h-4 text-[#ff6b35] border-gray-300 rounded focus:ring-[#ff6b35]"
                    />
                    <Star className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-gray-300">Article à la une</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isBreaking}
                      onChange={(e) => setFormData({ ...formData, isBreaking: e.target.checked })}
                      className="w-4 h-4 text-[#ff6b35] border-gray-300 rounded focus:ring-[#ff6b35]"
                    />
                    <Zap className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-gray-300">Breaking news</span>
                  </label>
                </div>
              </div>
            )}

            {/* Tab: Layout */}
            {activeTab === 'layout' && (
              <div className="space-y-6">
                {/* Layout picker */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
                  <LayoutPicker
                    selectedLayout={formData.layoutFormat || 1}
                    onChange={(layout) => setFormData({ ...formData, layoutFormat: layout })}
                  />
                </div>

                {/* Preview */}
                <div className="border border-[#2a2a36] rounded-xl p-4">
                  <ArticlePreview
                    title={formData.title}
                    titleBold={formData.titleBold || false}
                    content={formData.content}
                    mainImage={formData.imageUrl || ''}
                    layout={formData.layoutFormat || 1}
                    category={getCategoryName(formData.categoryId)}
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-[#2a2a36] bg-[#12121a]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Statut:</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  formData.status === 'published'
                    ? 'bg-green-100 text-green-700'
                    : formData.status === 'scheduled'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-white/5 text-gray-300'
                }`}
              >
                {formData.status === 'published'
                  ? 'Publié'
                  : formData.status === 'scheduled'
                  ? 'Programmé'
                  : 'Brouillon'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-300 hover:bg-white/10 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                form="article-form"
                disabled={isSaving}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Brouillon
              </button>
              {formData.scheduledAt && (
                <button
                  type="button"
                  onClick={handleSchedule}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Programmer
                </button>
              )}
              <button
                type="button"
                onClick={handlePublish}
                disabled={isSaving}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all flex items-center gap-2 font-semibold shadow-lg shadow-green-200"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                Publier maintenant
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
