// components/ArticleCard.tsx
import Link from 'next/link';

interface ArticleCardProps {
    article: {
        title: string;
        slug: string;
        excerpt: string;
        published_at: string;
        author_name: string;
        categories: {
            id: number;
            name: string;
            slug: string;
        }[];
    };
}

export default function ArticleCard({ article }: ArticleCardProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getArticleUrl = (article: ArticleCardProps['article']) => {
        const date = new Date(article.published_at);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `/article/${year}/${month}/${article.slug}`;
    };

    return (
        <article className="flex flex-col items-start">
            {article.categories.length > 0 && (
                <Link
                    className="inline-block rounded-full bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700"
                    href={`/category/${article.categories[0].slug}`}
                >
                    {article.categories[0].name}
                </Link>
            )}
            <div className="mt-5 flex items-center gap-x-2 text-sm text-slate-700">
                <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
                <span aria-hidden="true">•</span>
                <p>ditulis oleh {article.author_name}</p>
            </div>
            <div className="group relative mt-3">
                <h3 className="text-lg font-semibold leading-6 text-slate-900 group-hover:text-slate-700">
                    <Link href={getArticleUrl(article)}>
                        <span className="absolute inset-0"></span>
                        {article.title}
                    </Link>
                </h3>
                <p className="mt-5 line-clamp-2 text-sm font-normal leading-7 text-slate-700">{article.excerpt}</p>
            </div>
        </article>
    );
}
