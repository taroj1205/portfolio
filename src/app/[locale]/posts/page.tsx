import { compareDesc, format, parseISO } from "date-fns";
import { allPosts, Post } from "contentlayer/generated";
import { headers } from 'next/headers'
import PostHero from "@/components/PostHero";
import ArticleCard from "@/components/PostCard";

export default function Home() {
    const headerList = headers();
    const locale = headerList.get('x-current-locale') || 'en';
    const posts = allPosts
        .filter(post => post._raw.sourceFileDir === locale)
        .sort((a, b) => compareDesc(new Date(a.publishedAt), new Date(b.publishedAt)));

    console.log(locale)
    
    return (
        <div className="container mx-auto px-5">
            <div>
                <div className="space-y-4">
                    <h1 className="text-center text-5xl">{locale === 'ja' ? 'ようこそ！' : 'Welcome!'}</h1>
                    <p className="text-center text-xl">
                        {locale === 'ja' ? 'Nextjs 13とTailwindCSSを使ったブログへようこそ！' : 'Welcome to my blog using NextJS 13 and TailwindCSS!'}
                    </p>
                </div>

                <PostHero />

                <p className="text-3xl mt-4">{locale === 'ja' ? '最近の投稿' : 'Recent posts'}</p>
                <div className="flex flex-wrap lg:space-x-12 items-start justify-start">
                    {posts.slice(0, 4).map((post, idx) => (
                        <ArticleCard key={idx} {...post} category={post.category} />
                    ))}
                </div>
                {/* <Link
                    href={`/${locale}/blog`}
                    className='mx-4 text-2xl mt-4 md:text-xl font-bold text-blue-700 hover:text-blue-800 hover:underline flex items-center px-6 py-3 rounded-lg bg-blue-200 dark:bg-blue-800 dark:text-white dark:hover:bg-blue-700 transition-colors duration-200'>
                    {locale === 'ja' ? 'もっと見る' : 'See more'} {' -> '}
                </Link> */}
            </div>
        </div>
    );
}