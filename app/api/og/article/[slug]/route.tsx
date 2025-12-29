import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        const articleResponse = await fetch(
            `${request.nextUrl.origin}/api/articles/${slug}`,
            { cache: 'no-store' }
        );

        let title = 'KangLogo Blog';

        if (articleResponse.ok) {
            const article = await articleResponse.json();
            title = article.title || 'KangLogo Blog';
        }

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
                        background: '#4559F2',
                        padding: '80px 100px',
                    }}
                >
                    <div
                        style={{
                            fontSize: '64px',
                            fontWeight: 'bold',
                            color: 'white',
                            textAlign: 'center',
                            lineHeight: 1.3,
                            maxWidth: '1000px',
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                        }}
                    >
                        {title}
                    </div>

                    <div
                        style={{
                            position: 'absolute',
                            bottom: '50px',
                            fontSize: '24px',
                            color: 'rgba(255,255,255,0.7)',
                            letterSpacing: '8px',
                            display: 'flex',
                        }}
                    >
                        KANGLOGO.COM
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (error) {
        console.error('Error generating OG image:', error);

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
                        background: '#4559F2',
                        padding: '80px 100px',
                    }}
                >
                    <div
                        style={{
                            fontSize: '72px',
                            fontWeight: 'bold',
                            color: 'white',
                            textAlign: 'center',
                            lineHeight: 1.3,
                            maxWidth: '1000px',
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                        }}
                    >
                        KangLogo Blog
                    </div>

                    <div
                        style={{
                            position: 'absolute',
                            bottom: '50px',
                            fontSize: '24px',
                            color: 'rgba(255,255,255,0.7)',
                            letterSpacing: '8px',
                            display: 'flex',
                        }}
                    >
                        kanglogo.com
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
