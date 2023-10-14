import { getPostBySlug } from "@/lib/api";
import markdownToHtml from "@/lib/markdownToHtml";
import markdownStyles from "./markdown-styles.module.css";
import { useLocale } from "next-intl";
import Image from "next/image";
import DateFormatter from "@/components/DateFormatter";

export default async function Post({ params }: { params: { slug: string } }) {
    const lang = useLocale();
    const post = getPostBySlug(params.slug, lang, ["title", "author", "content", "date", "coverImage"]);

    const content = await markdownToHtml(post.content || "");

    return (
        <div className="container mx-auto">
            <main>
                <div className="w-full h-16 text-black dark:text-white">
                    <p className="text-2xl">{post.title}</p>
                    <p className="text-gray-400">{post.author}</p>
                    {post.coverImage && (
                        <Image
                            src={post.coverImage}
                            alt={`Cover Image for ${post.title}`}
                            width={500}
                            height={300}
                        />
                    )}
                    <p className="text-gray-400">
                        <DateFormatter dateString={post.date} />
                    </p>
                    <div
                        className={markdownStyles["markdown"]}
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                </div>
            </main>
        </div>
    );
}