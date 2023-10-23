import { ImageResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const headers = req.headers;
    let image = searchParams.get('url') as string;
    let articleUrl = searchParams.get('articleUrl') as string;
    const title = searchParams.get('title') as string;
    const description = searchParams.get('description') as string;
    let imagePositionX = searchParams.get('imagePositionX') as string;
    let imagePositionY = searchParams.get('imagePositionY') as string;
    const height = Number(searchParams.get('height'));
    const width = Number(searchParams.get('width'));

    if (!imagePositionX) {
        imagePositionX = 'center';
    } else {
        imagePositionX = `calc(-50% + ${imagePositionX}px)`;
    }
    if (!imagePositionY) {
        imagePositionY = 'center';
    } else {
        imagePositionY = `calc(-50% + ${imagePositionY}px)`;
    }

    if (!image.startsWith('https://')) {
        const pathname = (headers.get('host') === 'localhost:3000' ? 'http' : 'https') + '://' + headers.get('host');
        console.log(pathname);
        image = pathname + image;
    }

    return new ImageResponse(
        (
            <div
                style={{
                    height: `${height ? `${height}px` : '100%'}`,
                    width: `${width ? `${width}px` : '100%'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    backgroundColor: '#f6f8fa',
                    padding: '2rem',
                    boxSizing: 'border-box',
                    backgroundImage: `url(${image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: `${imagePositionX} ${imagePositionY}`,
                    fontFamily: 'Arial, sans-serif',
                }}
            >
                {title || description || articleUrl ? (
                    <div
                        style={{
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: '10px',
                            boxSizing: 'border-box',
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            padding: '2rem',
                        }}
                    >
                        {title && (
                            <h2
                                style={{
                                    fontSize: '3rem',
                                    fontWeight: 'bold',
                                    color: '#fff',
                                    margin: '0 0 1rem 0',
                                }}
                            >
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p
                                style={{
                                    fontSize: '2rem',
                                    margin: '0 0 1rem 0',
                                    color: '#ddd',
                                }}
                            >
                                {description}
                            </p>
                        )}

                        {articleUrl && (
                            <div style={{ display: 'flex', flexDirection: 'row', fontSize: '1.8rem' }}>
                                <p
                                    style={{
                                        color: '#ddd',
                                    }}
                                >
                                    Read more at:
                                    <span style={{ color: 'rgb(59 130 246)', cursor: 'pointer', textDecoration: 'underline', marginLeft: '0.5rem', width: '100%', overflow: 'hidden' }}>{articleUrl}</span>
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    null
                )}
            </div>
        ),
        {
            width: width || 1200,
            height: height || 628,
        }
    );
}