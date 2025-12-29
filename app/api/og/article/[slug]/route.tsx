import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        // Fetch article data
        const articleResponse = await fetch(
            `${request.nextUrl.origin}/api/articles/${slug}`,
            { cache: 'no-store' }
        );

        if (!articleResponse.ok) {
            throw new Error('Article not found');
        }

        const article = await articleResponse.json();

        // Fetch logo
        const logoUrl = `${request.nextUrl.origin}/icons/icon-512x512.png.png`;

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#4f46e5',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* SVG Background Pattern */}
                    <svg
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0.15,
                        }}
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* Grid Dots */}
                        <defs>
                            <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                                <circle cx="2" cy="2" r="2" fill="white" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#dots)" />

                        {/* Geometric Shapes */}
                        <circle cx="150" cy="150" r="80" fill="none" stroke="white" strokeWidth="2" opacity="0.3" />
                        <circle cx="1050" cy="100" r="60" fill="none" stroke="white" strokeWidth="2" opacity="0.3" />
                        <rect x="900" y="450" width="100" height="100" fill="none" stroke="white" strokeWidth="2" opacity="0.3" transform="rotate(45 950 500)" />
                        <path d="M 100 500 L 200 550 L 150 600 Z" fill="none" stroke="white" strokeWidth="2" opacity="0.3" />

                        {/* Wave Pattern */}
                        <path
                            d="M 0 400 Q 150 350 300 400 T 600 400 T 900 400 T 1200 400"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            opacity="0.2"
                        />
                        <path
                            d="M 0 450 Q 150 500 300 450 T 600 450 T 900 450 T 1200 450"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            opacity="0.2"
                        />
                    </svg>

                    {/* Content Container */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '80px 100px',
                            position: 'relative',
                            zIndex: 10,
                        }}
                    >
                        {/* Logo */}
                        <img
                            src={logoUrl}
                            alt="Logo"
                            width="120"
                            height="120"
                            style={{
                                marginBottom: '40px',
                                borderRadius: '20px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                            }}
                        />

                        {/* Title */}
                        <div
                            style={{
                                fontSize: '60px',
                                fontWeight: 'bold',
                                color: 'white',
                                textAlign: 'center',
                                lineHeight: 1.2,
                                marginBottom: '30px',
                                maxWidth: '1000px',
                                textShadow: '0 4px 10px rgba(0,0,0,0.3)',
                                display: 'flex',
                            }}
                        >
                            {article.title || 'Artikel KangLogo'}
                        </div>

                        {/* Author */}
                        <div
                            style={{
                                fontSize: '28px',
                                color: '#fbbf24',
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                            }}
                        >
                            <span>✍️</span>
                            <span>{article.author || 'KangLogo Team'}</span>
                        </div>
                    </div>

                    {/* Bottom Gradient Overlay */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '200px',
                            background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)',
                        }}
                    />
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (error) {
        console.error('Error generating OG image:', error);

        // Fallback image
        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#4f46e5',
                    }}
                >
                    <div style={{ fontSize: '60px', color: 'white', fontWeight: 'bold' }}>
                        KangLogo Blog
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    }
}
