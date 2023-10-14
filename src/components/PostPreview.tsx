import DateFormatter from "@/components/DateFormatter";
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
const locales = ['en', 'ja'] as const;
const { Link, useRouter, usePathname, redirect } = createSharedPathnamesNavigation({ locales });
import Image from "next/image";

type Items = {
    [key: string]: string;
};

export default function PostPreview({ post }: { post: Items }) {
    return (
        <div className="w-full mx-auto group p-4 bg-gray-100 dark:bg-gray-800 shadow-md rounded-md">
            <Link href={`/posts/${post.slug}`}>
                {post?.coverImage && (
                    <Image
                        alt={`cover image for ${post.title}`}
                        src={post.coverImage}
                        width={400}
                        height={400}
                        style={{ width: "100%" }}
                    />
                )}
                <div className="mt-4 space-y-2">
                    <p className="font-semibold text-xl group-hover:underline text-gray-800 dark:text-white">
                        {post.title}
                    </p>
                    <DateFormatter dateString={post.date} />
                    <p className="text-gray-600 dark:text-gray-300">{post.excerpt}</p>
                </div>
            </Link>
        </div>
    );
}