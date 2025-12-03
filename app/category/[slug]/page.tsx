// app/category/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import ArticleCard from '@/components/ArticleCard';

interface PageProps {
    params: {
        slug: string;
    };
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
    const category = await getCategoryBySlug(params.slug);

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
    const category = await getCategoryBySlug(params.slug);

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
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Kategori: {category.name}</h1>
                    <p className="text-gray-600 mt-2">Menampilkan {transformedArticles.length} artikel</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Kolom Konten Utama - Daftar Artikel */}
                    <div className="lg:col-span-2">
                        {transformedArticles.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {transformedArticles.map((article) => (
                                    <ArticleCard key={article.id} article={article} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white p-8 rounded-lg shadow-md text-center">
                                <p className="text-gray-500">Belum ada artikel dalam kategori ini.</p>
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