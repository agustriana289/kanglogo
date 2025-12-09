import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/admin/',
                    '/api/',
                    '/login/',
                    '/order/',
                    '/faq/',
                    '/generator/',
                    '/category/',
                ],
            },
        ],
        sitemap: 'https://kanglogo.com/sitemap.xml',
    };
}
