import { getAllPosts } from "@/lib/api";
import PostPreview from "@/components/PostPreview";
import { headers } from 'next/headers';

export default function Blog() {
    const headersList = headers();

    const locale: string = headersList.get('x-current-locale') || 'en';

    console.log(locale);
    
    const posts = getAllPosts(locale, ["title", "date", "excerpt", "coverImage", "slug"]);


    return (
        <div className="container mx-auto px-5">
            <main>
                <h1 className="text-center text-3xl">{locale === 'ja' ? 'すべての投稿' : 'All posts'}</h1>

                <div className="h-12"></div>

                <div className="grid md:grid-cols-2 grid-cols-1 lg:gap-32 gap-8">
                    {posts.map((post) => (
                        <div key={post.title}>
                            <PostPreview post={post} />
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}