import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://kanglogo.com';

    // Static pages (excluding faq, generator, category as requested)
    const staticPages: MetadataRoute.Sitemap = [
        { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
        { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
        { url: `${baseUrl}/projects`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
        { url: `${baseUrl}/store`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${baseUrl}/articles`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    ];

    // Dynamic: Articles
    const { data: articles } = await supabase
        .from('articles')
        .select('slug, published_at, updated_at')
        .eq('status', 'published');

    const articleUrls: MetadataRoute.Sitemap = (articles || []).map((article) => {
        const date = new Date(article.published_at);
        // Handle invalid dates if published_at is null
        if (isNaN(date.getTime())) return null;

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return {
            url: `${baseUrl}/article/${year}/${month}/${article.slug}`,
            lastModified: new Date(article.updated_at || article.published_at),
            changeFrequency: 'monthly',
            priority: 0.7,
        };
    }).filter(Boolean) as MetadataRoute.Sitemap;

    // Dynamic: Services
    const { data: services } = await supabase.from('services').select('slug, updated_at');
    const serviceUrls: MetadataRoute.Sitemap = (services || []).map((service) => ({
        url: `${baseUrl}/services/${service.slug}`,
        lastModified: new Date(service.updated_at),
        changeFrequency: 'monthly',
        priority: 0.8,
    }));

    // Dynamic: Projects
    const { data: projects } = await supabase.from('projects').select('slug, created_at');
    const projectUrls: MetadataRoute.Sitemap = (projects || []).map((project) => ({
        url: `${baseUrl}/projects/${project.slug}`,
        lastModified: new Date(project.created_at),
        changeFrequency: 'monthly',
        priority: 0.6,
    }));

    // Dynamic: Store Products
    const { data: products } = await supabase.from('products').select('slug, updated_at');
    const productUrls: MetadataRoute.Sitemap = (products || []).map((product) => ({
        url: `${baseUrl}/store/${product.slug}`,
        lastModified: new Date(product.updated_at),
        changeFrequency: 'weekly',
        priority: 0.7,
    }));

    // Dynamic: Static Pages (Kebijakan Privasi, Syarat & Ketentuan, dll)
    const { data: pages } = await supabase
        .from('pages')
        .select('slug, updated_at')
        .eq('is_published', true);
    const pageUrls: MetadataRoute.Sitemap = (pages || []).map((page) => ({
        url: `${baseUrl}/pages/${page.slug}`,
        lastModified: new Date(page.updated_at),
        changeFrequency: 'monthly',
        priority: 0.5,
    }));

    return [...staticPages, ...articleUrls, ...serviceUrls, ...projectUrls, ...productUrls, ...pageUrls];
}
