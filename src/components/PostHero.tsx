import Image from "next/image";
import Link from 'next-intl/link';
import { useLocale } from "next-intl";
import aboutImage from "../../public/blog/thumbnail/about/thumbnail.webp";
import { allPosts } from "contentlayer/generated";
import { getMDXComponent } from 'next-contentlayer/hooks'
import { formatDistanceToNow, format, isToday, isYesterday, parseISO } from 'date-fns'
import ja from 'date-fns/locale/ja';

export default function PostHero() {
    const lang = useLocale();

    const heroPost = allPosts.find((post: any) => post._raw.sourceFileDir === lang && post._raw.sourceFileName === 'about.mdx') as any;
    const Content = getMDXComponent(heroPost.body.code)

    let formattedDate;
    const postDate = parseISO(heroPost.date);
    const locale = heroPost.locale === 'ja' ? ja : undefined;
    const timeFormat = format(postDate, 'HH:mm');

    if (isToday(postDate)) {
        formattedDate = `${formatDistanceToNow(postDate, { addSuffix: true, locale })} ${heroPost.locale === 'ja' ? '' : 'at'} ${timeFormat}`;
    } else if (isYesterday(postDate)) {
        formattedDate = heroPost.locale === 'ja' ? `昨日 ${timeFormat}` : `${heroPost.locale === 'ja' ? '昨日の' : 'Yesterday at'} ${timeFormat}`;
    } else {
        formattedDate = `${formatDistanceToNow(postDate, { addSuffix: true, locale })} ${heroPost.locale === 'ja' ? '' : 'at'} ${timeFormat}`;
    }


    return (
        <Link href={`/posts/${heroPost.slug}`}>
            <div className="w-full mx-auto group p-4 bg-gray-100 dark:bg-gray-800 shadow-md rounded-md">
                <div className="w-full h-64 md:h-96 relative">
                    <div className="aspect-w-16 aspect-h-9">
                        <Image
                            alt={`cover image for ${heroPost.title}`}
                            src={aboutImage}
                            className="object-cover max-h-96 rounded-t-md"
                        />
                    </div>
                </div>

                <div className="grid mt-4 md:grid-cols-2 grid-cols-1 gap-4">
                    <div className="mb-2">
                        <p className="font-semibold text-xl group-hover:underline text-gray-800 dark:text-white">
                            {heroPost.title}
                        </p>
                        {/* <DateFormatter dateString={heroPost.date} /> */}
                        <time dateTime={heroPost.date} className="mb-1 text-base text-gray-400">
                            {formattedDate}
                        </time>
                    </div>
                    <div className="text-gray-600 dark:text-gray-300 line-clamp-5">
                        <Content />
                    </div>
                </div>
            </div>
        </Link>
    );
}