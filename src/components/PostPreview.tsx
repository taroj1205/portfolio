import Link from 'next-intl/link';
import Image from "next/image";
import { getMDXComponent } from "next-contentlayer/hooks";
import DateFormatter from './DateFormatter';


export default function PostPreview(post: any) {
    const Content = getMDXComponent(post.body.code);

    return (
        <div className="w-full mx-auto group p-4 bg-gray-100 dark:bg-gray-800 shadow-md rounded-md">
            <Link href={`/posts/${post.slug}`}>
                {post.image && (
                    <Image
                        alt={`cover image for ${post.title}`}
                        src={post.image}
                        width={400}
                        height={400}
                        style={{ width: "100%" }}
                    />
                )}
                <div className="mt-4 space-y-2">
                    <p className="font-semibold text-xl group-hover:underline text-gray-800 dark:text-white">
                        {post.title}
                    </p>
                    {/* <DateFormatter dateString={post.date} />
                     */}
                    <DateFormatter date={String(post.publishedAt)} lang={String(post.locale)} />
                    <div className="text-gray-600 dark:text-gray-300 line-clamp-5 md:line-clamp-6">
                        <Content />
                    </div>
                </div>
            </Link>
        </div>
    );
}