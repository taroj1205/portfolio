import Link from 'next/link'
import { headers } from 'next/headers'
import metadata from '@/app/metadata.json';


export const generateMetadata = ({ params }: { params: { slug: string; locale: string } }) => {
    const locale = params.locale;

    let pageMetadata = (metadata as Record<string, any>)['404'];

    return {
        metadataBase: new URL(pageMetadata.metadataBase),
        title: pageMetadata.title[locale],
        description: pageMetadata.description[locale],
        icons: pageMetadata.icons,
        openGraph: {
            images: pageMetadata.openGraph.images.map((image: { url: string, alt: { [key: string]: string } }) => ({
                url: image.url,
                alt: image.alt[locale],
            })),
        },
        twitter: {
            card: pageMetadata.twitter.card,
            title: pageMetadata.twitter.title[locale],
            description: pageMetadata.twitter.description[locale],
            site: pageMetadata.twitter.site,
            creator: pageMetadata.twitter.creator,
            images: pageMetadata.twitter.images.map((image: { url: string, alt: { [key: string]: string } }) => ({
                url: image.url,
                alt: image.alt[locale],
            })),
        },
        viewport: pageMetadata.viewport
    }
}

export default function NotFound() {
    const headerList = headers();
    const locale = headerList.get('x-current-locale') || 'en';

    return (
        <div className="md:px-4 pt-4 md:pt-12 flex flex-col items-center justify-center text-center">
            <h1 className="text-6xl font-bold text-gray-700 dark:text-gray-300 mb-4">
                404
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                {locale === 'ja' ? 'ページが見つかりません' : 'Page not found'}
            </p>
            <Link href={`/${locale}/posts`} className="text-blue-500 hover:underline">
                {locale === 'ja' ? 'ホームに戻る' : 'Go back to Home'}
            </Link>
        </div>
    )
}