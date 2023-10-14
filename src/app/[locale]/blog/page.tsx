import { getAllPosts } from "@/lib/api";
import PostPreview from "@/components/PostPreview";
import { useTranslations } from "next-intl";
import { getLocale } from "next-intl/server";

export default function Blog() {
    const t = useTranslations('blog');
    const lang = getLocale(); // en or ja

    const posts = getAllPosts(lang, ["title", "date", "excerpt", "coverImage", "slug"]);

    return (
        <div className="container mx-auto px-5">
            <main>
                <h1 className="text-center text-3xl">{t('all posts')}</h1>

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