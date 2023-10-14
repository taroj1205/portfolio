import DateFormatter from "@/components/DateFormatter";
import Image from "next/image";
import { getPostBySlug } from "@/lib/api";
import Link from 'next-intl/link';
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
                        <DateFormatter dateString={heroPost.date} />
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 line-clamp-5">
                        {heroPost.excerpt}
                    </p>
                </div>
            </div>
        </Link>
    );
}