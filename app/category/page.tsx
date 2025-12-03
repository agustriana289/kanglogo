// app/article/[category]/page.tsx
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import DynamicArticlesList from '@/components/DynamicArticlesList';

interface PageProps {
  params: {
    category: string;
  };
}

async function getCategory(categorySlug: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', categorySlug)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = await getCategory(params.category);
  
  if (!category) {
    return {
      title: 'Kategori Tidak Ditemukan',
    };
  }
  
  return {
    title: `Kategori: ${category.name} - Kanglogo`,
    description: category.description || `Artikel dalam kategori ${category.name}`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const category = await getCategory(params.category);
  
  if (!category) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Kategori: {category.name}</h1>
        {category.description && (
          <p className="text-gray-600 mb-8">{category.description}</p>
        )}
        <DynamicArticlesList initialCategory={params.category} />
      </div>
    </div>
  );
}