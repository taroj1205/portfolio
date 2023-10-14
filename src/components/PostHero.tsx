import DateFormatter from "@/components/DateFormatter";
import Image from "next/image";
import { getPostBySlug } from "@/lib/api";
import Link from "next-intl/link";
import { useLocale } from "next-intl";
import aboutImage from "../../public/blog/thumbnail/about.webp";

type Items = {
    [key: string]: string;
};

export default function PostHero() {
    const lang = useLocale();
    const heroPost = getPostBySlug("about", lang, [
        "title",
        "excerpt",
        "slug",
        "date",
        "coverImage",
    ]);

    return (
        <Link href={`/posts/${heroPost.slug}`}>
            <div className="w-full mx-auto group p-4 bg-gray-100 dark:bg-gray-800 shadow-md rounded-md">
                <div className="w-full h-64 md:h-96 relative">
                    <Image
                        alt={`cover image for ${heroPost.title}`}
                        src={aboutImage}
                        className="object-cover rounded-t-md"
                    />
                </div>

                <div className="grid mt-4 md:grid-cols-2 grid-cols-1 gap-4">
                    <div className="mb-2">
                        <p className="font-semibold text-xl group-hover:underline text-gray-800 dark:text-white">
                            {heroPost.title}
                        </p>
                        <DateFormatter dateString={heroPost.date} />
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                        {lang === 'ja' ? (heroPost.excerpt.length > 150 ? heroPost.excerpt.substring(0, 150) + "..." : heroPost.excerpt) : (heroPost.excerpt.length > 300 ? heroPost.excerpt.substring(0, 300) + "..." : heroPost.excerpt)}
                    </p>
                </div>
            </div>
        </Link>
    );
}