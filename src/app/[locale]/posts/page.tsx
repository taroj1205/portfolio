import { getAllPosts } from "@/lib/api";
import PostPreview from "@/components/PostPreview";
import PostHero from "@/components/PostHero";
import { useLocale, useTranslations } from "next-intl";
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
const locales = ['en', 'ja'] as const;
const { Link, useRouter, usePathname, redirect } = createSharedPathnamesNavigation({ locales });

export default function Home() {
    const t = useTranslations('blog');
    const lang = useLocale();
    const posts = getAllPosts(lang, ["title", "date", "excerpt", "coverImage", "slug"]);
    const recentPosts = posts.slice(0, 2);

    return (
        <div className="container mt-4 mx-auto px-5">
            <main>
                <div className="space-y-4">
                    <h1 className="text-center text-5xl">Welcome!</h1>
                    <p className="text-center text-xl">
                        Welcome to my blog using NextJS 13 and Tailwind CSS!
                    </p>
                </div>

                <div className="h-12"></div>

                <PostHero />

                <div className="h-16"></div>

                <p className="text-3xl mb-6">Recent Posts</p>
                <div className="grid md:grid-cols-2 grid-cols-1 mx-auto md:gap-32 gap-8">
                    {recentPosts.map((post) => (
                        <div key={post.title}>
                            <PostPreview post={post} />
                        </div>
                    ))}
                </div>
                <div className="h-16"></div>
                <Link
                    href="/blog"
                    className='text-xl md:text-lg text-blue-500 hover:text-blue-700 hover:underline flex items-center px-4 py-2 rounded-md  bg-blue-200 dark:bg-gray-700'>
                    {t('see more')} {' -> '}
                </Link>
            </main>
        </div>
    );
}