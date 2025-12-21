// components/ArticleEditor.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { sendChannelNotification } from '@/lib/telegram';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import Image from 'next/image';

// Dynamic import untuk Quill editor
const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-100 h-96 rounded-lg"></div>
});

import 'react-quill-new/dist/quill.snow.css';

interface Article {
  id?: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  status: string;
  published_at?: string;
  author_name?: string;
  article_categories?: {
    categories: {
      id: number;
      name: string;
      slug: string;
    };
  }[];
}

interface ArticleEditorProps {
  article?: Article;
}

export default function ArticleEditor({ article }: ArticleEditorProps) {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: number, name: string, slug: string }[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image: '',
    status: 'draft',
    published_at: '',
    author_name: '',
  });

  useEffect(() => {
    fetchCategories();
    if (article) {
      setFormData({
        title: article.title,
        slug: article.slug,
        content: article.content,
        excerpt: article.excerpt || '',
        featured_image: article.featured_image || '',
        status: article.status,
        published_at: article.published_at || '',
        author_name: article.author_name || '',
      });

      // Set selected categories
      if (article.article_categories) {
        const categoryIds = article.article_categories.map(ac => ac.categories.id);
        setSelectedCategories(categoryIds);
      }
    }
  }, [article]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
      } else {
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData({
      ...formData,
      title,
      slug: article ? formData.slug : generateSlug(title),
    });
  };

  const handleContentChange = (content: string) => {
    setFormData({
      ...formData,
      content,
      excerpt: content.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `article-${Date.now()}.${fileExt}`;
    const filePath = `articles/${fileName}`;

    setLoading(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);

      setFormData({
        ...formData,
        featured_image: data.publicUrl,
      });
      showToast('Gambar berhasil diupload', 'success');
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('Gagal mengupload gambar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      showToast('Judul dan konten harus diisi', 'warning');
      return;
    }

    setLoading(true);
    try {
      const articleData = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        excerpt: formData.excerpt,
        featured_image: formData.featured_image,
        status: formData.status,
        author_name: formData.author_name,
        published_at: formData.status === 'published' && !article ? new Date().toISOString() : formData.published_at,
      };

      let savedArticle;
      if (article?.id) {
        // Update existing article
        const { data, error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', article.id)
          .select()
          .single();

        if (error) throw error;
        savedArticle = data;
      } else {
        // Create new article
        const { data, error } = await supabase
          .from('articles')
          .insert([articleData])
          .select()
          .single();

        if (error) throw error;
        savedArticle = data;

        // Send Notification to Channel if status is published
        if (articleData.status === 'published') {
          const msg = `📝 <b>Artikel Baru!</b>\n\n<b>${articleData.title}</b>\n\n${articleData.excerpt}\n\n📖 Baca selengkapnya: https://kanglogo.com/blog/${articleData.slug}`;
          await sendChannelNotification(msg, articleData.featured_image);
        }
      }

      // Handle categories
      if (savedArticle?.id) {
        // Delete existing categories
        if (article?.id) {
          await supabase
            .from('article_categories')
            .delete()
            .eq('article_id', article.id);
        }

        // Insert new categories
        if (selectedCategories.length > 0) {
          const categoryRelations = selectedCategories.map(categoryId => ({
            article_id: savedArticle.id,
            category_id: categoryId,
          }));

          await supabase
            .from('article_categories')
            .insert(categoryRelations);
        }
      }

      showToast(article ? 'Artikel berhasil diperbarui!' : 'Artikel berhasil dibuat!', 'success');
      setTimeout(() => {
        router.push('/admin/blog');
      }, 1000);
    } catch (error) {
      console.error('Error saving article:', error);
      showToast('Gagal menyimpan artikel', 'error');
    } finally {
      setLoading(false);
    }
  };

  // FIX: Remove 'bullet' from formats list
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'align': [] }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false
    }
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', // FIXED: Remove 'bullet' - it's part of 'list'
    'align',
    'color', 'background',
    'link', 'image'
  ];

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 2 Column Layout: Editor (Left 70%) + Settings (Right 30%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN - Editor Area (70%) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Title Input */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Judul Artikel
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                value={formData.title}
                onChange={handleTitleChange}
                placeholder="Masukkan judul artikel..."
                required
              />
            </div>

            {/* Content Editor */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditorMode('visual')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${editorMode === 'visual'
                      ? 'bg-white text-primary shadow-sm border border-gray-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                  >
                    Visual
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode('html')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${editorMode === 'html'
                      ? 'bg-white text-primary shadow-sm border border-gray-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                  >
                    HTML
                  </button>
                </div>
              </div>

              <div className="p-6">
                {editorMode === 'visual' ? (
                  <ReactQuill
                    theme="snow"
                    value={formData.content}
                    onChange={handleContentChange}
                    modules={modules}
                    formats={formats}
                    placeholder="Tulis konten artikel di sini..."
                    className="quill-editor"
                    style={{ minHeight: '400px' }}
                  />
                ) : (
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
                    rows={20}
                    value={formData.content}
                    onChange={(e) => {
                      const newContent = e.target.value;
                      setFormData({
                        ...formData,
                        content: newContent,
                        excerpt: newContent.replace(/<[^>]*>/g, '').substring(0, 200) + '...'
                      });
                    }}
                    placeholder="<p>Tulis konten artikel dalam format HTML...</p>"
                  />
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Settings (30%) */}
          <div className="lg:col-span-4 space-y-6 flex flex-col">

            {/* Action Buttons - Full Width */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 order-4 sm:order-1">
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => router.push('/admin/blog')}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium transition-colors"
                >
                  {loading ? 'Menyimpan...' : (article ? 'Perbarui Artikel' : 'Publikasikan')}
                </button>
              </div>
            </div>

            {/* Publish Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 order-1 sm:order-2">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Publikasi</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Publikasi
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    value={formData.published_at ? new Date(formData.published_at).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, published_at: new Date(e.target.value).toISOString() })}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Kosongkan untuk waktu sekarang
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Penulis
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    value={formData.author_name}
                    onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                    placeholder="Nama penulis"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 order-2 sm:order-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Kategori</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      checked={selectedCategories.includes(category.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, category.id]);
                        } else {
                          setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                        }
                      }}
                    />
                    <span className="ml-2 text-sm text-gray-700">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Featured Image */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 order-3 sm:order-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Gambar Unggulan</h3>

              {formData.featured_image && (
                <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                  <Image
                    src={formData.featured_image}
                    alt="Featured"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
              />
              <p className="mt-2 text-xs text-gray-500">
                Ukuran maksimal 2MB. Format: JPG, PNG, WebP
              </p>
            </div>
          </div>
        </div>
      </form>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />

      <style jsx global>{`
        .quill-editor .ql-container {
          min-height: 400px;
          font-size: 16px;
        }
        .quill-editor .ql-editor {
          min-height: 400px;
        }
      `}</style>
    </>
  );
}