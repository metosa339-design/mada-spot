'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Loader2,
  Search,
  ExternalLink,
  Save,
  X,
  Image as ImageIcon,
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  imageUrl: string | null;
  status: string;
  isFeatured: boolean;
  isBreaking: boolean;
  publishedAt: string | null;
  createdAt: string;
  category: { id: string; name: string; color: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export default function BlogManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Article | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '',
    slug: '',
    summary: '',
    content: '',
    imageUrl: '',
    status: 'draft',
    isFeatured: false,
    isBreaking: false,
    categoryId: '',
  });

  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/articles');
      const data = await res.json();
      if (data.success) setArticles(data.articles || []);
    } catch { /* */ }
    setLoading(false);
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/articles?categories=true');
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
    } catch { /* */ }
  }, []);

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, [fetchArticles, fetchCategories]);

  const openNew = () => {
    setForm({ title: '', slug: '', summary: '', content: '', imageUrl: '', status: 'draft', isFeatured: false, isBreaking: false, categoryId: '' });
    setIsNew(true);
    setEditing({} as Article);
  };

  const openEdit = (article: Article) => {
    setForm({
      title: article.title,
      slug: article.slug,
      summary: article.summary || '',
      content: article.content,
      imageUrl: article.imageUrl || '',
      status: article.status,
      isFeatured: article.isFeatured,
      isBreaking: article.isBreaking,
      categoryId: article.category?.id || '',
    });
    setIsNew(false);
    setEditing(article);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSave = async () => {
    if (!form.title || !form.content) return alert('Titre et contenu requis');
    setSaving(true);
    try {
      const slug = form.slug || generateSlug(form.title);
      const body = { ...form, slug };

      const url = isNew ? '/api/admin/articles' : `/api/admin/articles/${editing?.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setEditing(null);
        fetchArticles();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur');
      }
    } catch {
      alert('Erreur reseau');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return;
    try {
      await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
      fetchArticles();
    } catch { /* */ }
  };

  const toggleStatus = async (article: Article) => {
    const newStatus = article.status === 'published' ? 'draft' : 'published';
    try {
      await fetch(`/api/admin/articles/${article.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...article, status: newStatus, categoryId: article.category?.id }),
      });
      fetchArticles();
    } catch { /* */ }
  };

  const filtered = articles.filter(
    (a) => !search || a.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  // Editor view
  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{isNew ? 'Nouvel article' : 'Modifier l\'article'}</h3>
          <button onClick={() => setEditing(null)} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input
                value={form.title}
                onChange={(e) => {
                  setForm({ ...form, title: e.target.value, slug: form.slug || generateSlug(e.target.value) });
                }}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Top 10 des hotels a Nosy Be..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug URL</label>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg font-mono text-sm"
                placeholder="top-10-hotels-nosy-be"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resume (pour le SEO et les aperçus)</label>
              <textarea
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Un court resume de l'article..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contenu (HTML)</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={20}
                className="w-full px-4 py-2.5 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-orange-500"
                placeholder="<h2>Introduction</h2><p>Madagascar est...</p>"
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="draft">Brouillon</option>
                  <option value="published">Publie</option>
                  <option value="archived">Archive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Sans categorie</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image de couverture (URL)</label>
                <input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="https://..."
                />
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg" />
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Article a la une</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isBreaking}
                  onChange={(e) => setForm({ ...form, isBreaking: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Breaking news</span>
              </label>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isNew ? 'Creer l\'article' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un article..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvel article
        </button>
      </div>

      <div className="text-sm text-gray-500">
        {articles.length} articles ({articles.filter((a) => a.status === 'published').length} publies)
      </div>

      <div className="space-y-3">
        {filtered.map((article) => (
          <div
            key={article.id}
            className="flex items-center gap-4 p-4 bg-white border rounded-xl hover:shadow-sm transition-shadow"
          >
            {/* Image */}
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {article.imageUrl ? (
                <img src={article.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-gray-300" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900 truncate">{article.title}</h4>
                {article.isFeatured && <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className={`px-2 py-0.5 rounded-full font-medium ${
                  article.status === 'published'
                    ? 'bg-green-100 text-green-700'
                    : article.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {article.status === 'published' ? 'Publie' : article.status === 'draft' ? 'Brouillon' : 'Archive'}
                </span>
                {article.category && (
                  <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: `${article.category.color}20`, color: article.category.color }}>
                    {article.category.name}
                  </span>
                )}
                <span>{new Date(article.publishedAt || article.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {article.status === 'published' && (
                <a
                  href={`/blog/${article.slug}`}
                  target="_blank"
                  rel="noopener"
                  className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Voir"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={() => toggleStatus(article)}
                className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                title={article.status === 'published' ? 'Depublier' : 'Publier'}
              >
                {article.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => openEdit(article)}
                className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                title="Modifier"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(article.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">Aucun article</p>
            <p className="text-sm">Cliquez sur "Nouvel article" pour commencer</p>
          </div>
        )}
      </div>
    </div>
  );
}
