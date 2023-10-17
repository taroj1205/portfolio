import PostPreview from "@/components/PostPreview";
import { headers } from 'next/headers';
import { allPosts } from "contentlayer/generated";
import { compareDesc } from "date-fns";

export default function Blog() {
    const headersList = headers();

    const locale: string = headersList.get('x-current-locale') || 'en';

    console.log(locale);
    
    const posts = allPosts
        .filter(post => post._raw.sourceFileDir === locale)
        .sort((a, b) => compareDesc(new Date(a.publishedAt), new Date(b.publishedAt)));


    return (
        <div className="container mx-auto px-5">
            <main>
                <h1 className="text-center text-3xl">{locale === 'ja' ? 'すべての投稿' : 'All posts'}</h1>

                <div className="h-12"></div>

                <div className="grid md:grid-cols-2 grid-cols-1 lg:gap-32 gap-8">
                    {posts.map((post, idx) => (
                        <PostPreview key={idx} {...post} />
                    ))}
                </div>
            </main>
        </div>
    );
}