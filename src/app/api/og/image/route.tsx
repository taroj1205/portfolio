import { ImageResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url') as string;
    const image = searchParams.get('image') as string;
    const title = searchParams.get('title') as string;
    const description = searchParams.get('description') as string;
    let imagePositionX = searchParams.get('imagePositionX') as string;
    let imagePositionY = searchParams.get('imagePositionY') as string;

    if (!imagePositionX) {
        imagePositionX = '-50%';
    } else {
        imagePositionX = `calc(-50% + ${imagePositionX}px)`;
    }
    if (!imagePositionY) {
        imagePositionY = '-50%';
    } else {
        imagePositionY = `calc(-50% + ${imagePositionY}px)`;
    }

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    backgroundColor: '#f6f8fa',
                    padding: '2rem',
                    boxSizing: 'border-box',
                    backgroundImage: `url(${image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: '-50% -50%',
                    fontFamily: 'Arial, sans-serif',
                }}
            >
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
                                fontSize: '2.5rem',
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
                                fontSize: '1.8rem',
                                margin: '0 0 1rem 0',
                                color: '#ddd',
                            }}
                        >
                            {description}
                        </p>
                    )}

                    {url && (
                        <div style={{ display: 'flex', flexDirection: 'row', fontSize: '1.5rem' }}>
                            <p
                                style={{
                                    color: '#ddd',
                                }}
                            >
                                Read more at:
                                <span style={{ color: 'rgb(59 130 246)', cursor: 'pointer', textDecoration: 'underline', marginLeft: '0.5rem' }}>{url}</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 628,
        }
    );
}