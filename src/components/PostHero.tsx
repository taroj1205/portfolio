import Image from "next/image";
import { useLocale } from "next-intl";
import { allPosts } from "contentlayer/generated";
import { formatDistanceToNow, format, isToday, isYesterday, parseISO } from 'date-fns'
import ja from 'date-fns/locale/ja';
import DateFormatter from "./DateFormatter";
import { IoChatbubbleOutline } from "react-icons/io5";
import Link from "next/link";

export default function PostHero() {
    const lang = useLocale();

    const heroPost = allPosts.find((post: any) => post._raw.sourceFileDir === lang && post._raw.sourceFileName === 'about.mdx') as any;

    let formattedDate;
    const postDate = parseISO(heroPost.publishedAt);
    const locale = heroPost.locale === 'ja' ? ja : undefined;
    const timeFormat = format(postDate, 'HH:mm');

    if (isToday(postDate)) {
        formattedDate = `${formatDistanceToNow(postDate, { addSuffix: true, locale })} ${heroPost.locale === 'ja' ? '' : 'at'} ${timeFormat}`;
    } else if (isYesterday(postDate)) {
        formattedDate = heroPost.locale === 'ja' ? `昨日 ${timeFormat}` : `${heroPost.locale === 'ja' ? '昨日の' : 'Yesterday at'} ${timeFormat}`;
    } else {
        formattedDate = `${formatDistanceToNow(postDate, { addSuffix: true, locale })} ${heroPost.locale === 'ja' ? '' : 'at'} ${timeFormat}`;
    }

    const readTime = `${Math.round(heroPost.readingTime.minutes)}${lang === 'ja' ? '分で読めます' : ' min to read'}`

    const categories = heroPost.category?.split(',') || [];

    return (
        <section className='text-gray-600 body-font'>
            <div className='container px-5 py-6 mx-auto'>
                <div className='flex flex-wrap -m-4'>
                    <div className='p-4'>
                        <div className='h-full border-2 border-gray-200 dark:border-gray-700 border-opacity-60 rounded-lg overflow-hidden'>
                            <Image
                                className='lg:h-48 md:h-36 w-full object-cover object-center'
                                src={heroPost.image}
                                width={1920}
                                height={1080}
                                alt='blog'
                            />
                            <div className='p-6'>
                                <h3 className='tracking-widest text-xs font-medium mb-1'>
                                    {categories.map((item: any, index: any) => (
                                        <Link className='text-gray-400 hover:underline hover:text-gray-500' href={`/${locale}/posts/categories/${item}`} key={index}>#{item}</Link>
                                    ))}
                                </h3>
                                <h2 className='title-font text-lg font-medium text-gray-900 dark:text-gray-100 mb-3'>
                                    {heroPost.title}
                                </h2>
                                <p className='leading-relaxed mb-3 text-gray-600 dark:text-gray-300 line-clamp-4'>{heroPost.description}</p>
                                <div className='flex items-center flex-wrap justify-between'>
                                    <Link
                                        href={`/${locale}/posts/${heroPost.slug}`}
                                        className='text-indigo-500 hover:underline hover:text-indigo-600 order-2 md:order-1 inline-flex items-center'
                                    >
                                        {lang === 'ja' ? 'もっと読む' : 'Read More'}
                                        <svg
                                            className='w-4 h-4 ml-2 animate-arrow'
                                            viewBox='0 0 24 24'
                                            stroke='currentColor'
                                            strokeWidth='2'
                                            fill='none'
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                        >
                                            <path d='M5 12h14'></path>
                                            <path d='M12 5l7 7-7 7'></path>
                                        </svg>
                                    </Link>
                                    <div className='order-1 md:order-2 flex items-center'>
                                        <span className='text-gray-400 mr-3 inline-flex items-center lg:ml-auto md:ml-0 ml-auto leading-none text-sm pr-3 py-1 border-r-2 border-gray-200 dark:border-gray-500'>
                                            {readTime}
                                        </span>
                                        <span className='items-center text-gray-400 text-sm py-1 inline-flex space-x-1'>
                                            <IoChatbubbleOutline />
                                            <DateFormatter date={String(heroPost.publishedAt)} lang={String(lang)} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}