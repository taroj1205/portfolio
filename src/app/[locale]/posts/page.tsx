import { compareDesc, format, parseISO } from "date-fns";
import { allPosts, Post } from "contentlayer/generated";
import { headers } from 'next/headers'
import Link from "next/link";
import PostHero from "@/components/PostHero";
import PostPreview from "@/components/PostPreview";

export default function Home() {
    const headerList = headers();
    const locale = headerList.get('x-current-locale') || 'en';
    const posts = allPosts
        .filter(post => post._raw.sourceFileDir === locale)
        .sort((a, b) => compareDesc(new Date(a.date), new Date(b.date)));

    console.log(locale)
    
    return (
        <div className="container mt-4 mx-auto px-5">
            <div>
                <div className="space-y-4">
                    <h1 className="text-center text-5xl">{locale === 'ja' ? 'ようこそ！' : 'Welcome!'}</h1>
                    <p className="text-center text-xl">
                        {locale === 'ja' ? 'Nextjs 13とTailwindCSSを使ったブログへようこそ！' : 'Welcome to my blog using NextJS 13 and TailwindCSS!'}
                    </p>
                </div>

                <div className="h-12"></div>

                <PostHero />

                <div className="h-16"></div>

                <p className="text-3xl mb-6">{locale === 'ja' ? '最近の投稿' : 'Recent posts'}</p>
                <div className="grid md:grid-cols-2 grid-cols-1 mx-auto md:gap-32 gap-8">
                    {posts.slice(0, 4).map((post, idx) => (
                        <PostPreview key={idx} {...post} />
                    ))}
                </div>
                <Link
                    href={`/${locale}/posts`}
                    className='text-xl mt-4 md:text-lg text-blue-500 hover:text-blue-600 hover:underline flex items-center px-4 py-2 rounded-md  bg-blue-200 dark:bg-gray-700'>
                    {locale === 'ja' ? 'もっと見る' : 'See more'} {' -> '}
                </Link>
            </div>
        </div>
    );
}