// components/ArticleEditor.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';

// Dynamic import untuk Quill editor
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div>Loading editor...</div>
});

import 'react-quill/dist/quill.snow.css';

interface Article {
  id?: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  status: string;
  published_at?: string;
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
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Gagal mengupload gambar');
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
    'list', 'bullet',
    'align',
    'color', 'background',
    'link', 'image'
  ];

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Judul Artikel
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
            value={formData.title}
            onChange={handleTitleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            URL Slug
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Kategori
          </label>
          <div className="space-y-2">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={selectedCategories.includes(category.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCategories([...selectedCategories, category.id]);
                    } else {
                      setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                    }
                  }}
                />
                {category.name}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Featured Image
          </label>
          {formData.featured_image && (
            <img
              src={formData.featured_image}
              alt="Featured"
              className="w-full h-48 object-cover rounded-md mb-2"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Konten Artikel
          </label>
          {/* Tombol Toggle untuk Mode Editor */}
          <div className="flex mb-2 border-b">
            <button
              type="button"
              onClick={() => setEditorMode('visual')}
              className={`px-4 py-2 font-medium text-sm rounded-t-md ${editorMode === 'visual'
                ? 'bg-white text-blue-600 border border-b-0 border-l border-t border-r border-gray-300'
                : 'bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
            >
              Compose
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('html')}
              className={`px-4 py-2 font-medium text-sm rounded-t-md ${editorMode === 'html'
                ? 'bg-white text-blue-600 border border-b-0 border-l border-t border-r border-gray-300'
                : 'bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
            >
              HTML
            </button>
          </div>
          <div className="bg-white dark:bg-gray-700 rounded-md rounded-tl-none border border-t-0 border-gray-300">
            {editorMode === 'visual' ? (
              // Mode Visual (ReactQuill)
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={handleContentChange}
                modules={modules}
                formats={formats}
                placeholder="Tulis konten utama artikel di sini..."
                style={{ minHeight: '300px' }}
              />
            ) : (
              // Mode HTML (Textarea)
              <textarea
                className="w-full px-3 py-2 border-0 rounded-md rounded-tl-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                rows={15}
                value={formData.content}
                onChange={(e) => {
                  const newContent = e.target.value;
                  setFormData({ ...formData, content: newContent });
                  // Opsional: Update excerpt juga saat di mode HTML
                  setFormData(prev => ({
                    ...prev,
                    content: newContent,
                    excerpt: newContent.replace(/<[^>]*>/g, '').substring(0, 200) + '...'
                  }));
                }}
                placeholder="Tulis konten artikel dalam format HTML di sini..."
              />
            )}
          </div>
        </div>

        <div className="pt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tanggal Publikasi
            </label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              value={formData.published_at ? new Date(formData.published_at).toISOString().slice(0, 16) : ''}
              onChange={(e) => setFormData({ ...formData, published_at: new Date(e.target.value).toISOString() })}
            />
            <p className="mt-1 text-xs text-gray-500">
              Biarkan kosong untuk menggunakan waktu saat ini saat dipublikasikan.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="published">Dipublikasikan</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-6">
          <button
            type="button"
            onClick={() => router.push('/admin/blog')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : (article ? 'Perbarui Artikel' : 'Simpan Artikel')}
          </button>
        </div>
      </form>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </>
  );
}