import { headers } from 'next/headers';
import { allPosts } from "contentlayer/generated";
import { compareDesc } from "date-fns";
import ArticleCard from "@/components/PostCard";
import { notFound } from 'next/navigation';

export default function Blog() {
    const headersList = headers();

    const locale: string = headersList.get('x-current-locale') || 'en';

    console.log(locale);
    
    const posts = allPosts
        .filter(post => post.locale === locale && post.draft === true)
        .sort((a, b) => compareDesc(new Date(a.publishedAt), new Date(b.publishedAt)));
    
    if (!posts) notFound();

    return (
        <div className="container mx-auto px-5">
            <main>
                <h1 className="text-center text-3xl">{locale === 'ja' ? 'すべての投稿' : 'All posts'}</h1>

                <div className="h-12"></div>

                <div className="flex flex-wrap lg:space-x-12 items-start justify-start">
                    {posts.map((post, idx) => (
                        <ArticleCard category={post.category} key={idx} {...post} />
                    ))}
                </div>
            </main>
        </div>
    );
}