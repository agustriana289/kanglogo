// components/ArticleCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import { ClockIcon, UserIcon } from '@heroicons/react/24/outline';

interface ArticleCardProps {
    article: {
        title: string;
        slug: string;
        excerpt: string;
        published_at: string;
        author_name: string;
        featured_image?: string;
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
            month: 'short',
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
        <Link
            href={getArticleUrl(article)}
            className="overflow-hidden"
        >
            {/* Image */}
            {article.featured_image && (
                <div className="relative w-full h-48">
                    <Image
                        src={article.featured_image}
                        alt={article.title}
                        fill
                        style={{ objectFit: "cover" }}
                        className="transition-transform duration-300 hover:scale-105"
                        unoptimized
                    />
                    {/* Badge Category */}
                    {article.categories.length > 0 && (
                        <div className="absolute top-2 right-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {article.categories[0].name}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {article.title}
                </h3>

                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {article.excerpt}
                </p>

                <div className="flex gap-x-2 items-center text-xs">
                    <span className="text-gray-500 flex gap-1">
                        <ClockIcon className="w-4 h-4" /> {formatDate(article.published_at)}
                    </span>
                    <span className="text-gray-500 flex gap-1">
                        <UserIcon className="w-4 h-4" /> {article.author_name}
                    </span>
                </div>
            </div>
        </Link>
    );
}

