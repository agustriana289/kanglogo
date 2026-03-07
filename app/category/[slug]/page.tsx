// app/category/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import ArticleCard from '@/components/ArticleCard';
import Link from "next/link";

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

// Fungsi untuk mengambil data kategori berdasarkan slug
async function getCategoryBySlug(slug: string) {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error || !data) {
        return null;
    }

    return data;
}

// Fungsi untuk mengambil artikel berdasarkan ID kategori
async function getArticlesByCategoryId(categoryId: number) {
    // Pertama, dapatkan ID artikel yang terhubung dengan kategori ini
    const { data: articleCategories, error: categoryError } = await supabase
        .from('article_categories')
        .select('article_id')
        .eq('category_id', categoryId);

    if (categoryError) {
        console.error('Error fetching article categories:', categoryError);
        return [];
    }

    if (!articleCategories || articleCategories.length === 0) {
        return [];
    }

    const articleIds = articleCategories.map(ac => ac.article_id);

    // Kedua, ambil data artikel lengkap berdasarkan ID yang didapat
    const { data, error } = await supabase
        .from('articles')
        .select(`
      id,
      title,
      slug,
      excerpt,
      featured_image,
      published_at,
      author_name,
      article_categories(
        categories(id, name, slug)
      )
    `)
        .eq('status', 'published')
        .in('id', articleIds)
        .order('published_at', { ascending: false });

    if (error) {
        console.error('Error fetching articles:', error);
        return [];
    }

    return data || [];
}

// Fungsi untuk membuat metadata halaman (judul, deskripsi)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const category = await getCategoryBySlug(slug);

    if (!category) {
        return {
            title: 'Kategori Tidak Ditemukan',
        };
    }

    return {
        title: `Kategori: ${category.name} - Kanglogo`,
        description: `Jelajahi semua artikel dalam kategori ${category.name}.`,
    };
}

// Komponen Halaman Utama
export default async function CategoryPage({ params }: PageProps) {
    const { slug } = await params;
    const category = await getCategoryBySlug(slug);

    // Jika kategori tidak ditemukan, tampilkan halaman 404
    if (!category) {
        notFound();
    }

    const articles = await getArticlesByCategoryId(category.id);

    // Transformasi data agar sesuai dengan format yang diharapkan
    const transformedArticles = articles.map(article => ({
        ...article,
        author: { name: article.author_name },
        categories: article.article_categories?.map((ac: any) => ac.categories).filter(Boolean) || []
    }));

    return (
        <div className="min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-4">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Kembali ke Beranda
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
                        Kategori: <span className="text-primary">{category.name}</span>
                    </h1>
                    <p className="text-slate-600 max-w-xl mx-auto">
                        Menampilkan {transformedArticles.length} artikel
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Kolom Konten Utama - Daftar Artikel */}
                    <div className="lg:col-span-2">
                        {transformedArticles.length > 0 ? (
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {transformedArticles.map((article) => (
                                        <ArticleCard key={article.id} article={article} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">Belum ada artikel dalam kategori ini</h3>
                                <p className="text-gray-500">Artikel akan muncul di sini setelah dipublikasikan</p>
                            </div>
                        )}
                    </div>

                    {/* Kolom Sidebar */}
                    <div className="lg:col-span-1">
                        <Sidebar />
                    </div>
                </div>
            </div>
        </div>
    );
}
