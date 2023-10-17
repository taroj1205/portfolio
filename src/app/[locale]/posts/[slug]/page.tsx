import { format, parseISO } from 'date-fns'
import { allPosts } from 'contentlayer/generated'
import { getMDXComponent } from 'next-contentlayer/hooks'
import Link from 'next/link'
import { compareDesc } from 'date-fns'

export const generateStaticParams = async () => allPosts.map((post) => ({ slug: post._raw.flattenedPath }))

export const generateMetadata = ({ params }: { params: { slug: string; locale: string } }) => {
    const post = allPosts.find(post => post._raw.sourceFileDir === params.locale && post.slug.trim() === params.slug) as any;
    if (!post) return { title: '404' }
    return { title: post.title }
}

const PostLayout = ({ params }: { params: { slug: string; locale: string; } }) => {
    const post = allPosts.find(post => post._raw.sourceFileDir === params.locale && post.slug.trim() === params.slug) as any;

    if (!post) {
        return (
            <div className="flex flex-col items-center justify-center text-center">
                <h1 className="text-6xl font-bold text-gray-700 dark:text-gray-300 mb-4">
                    {params.locale === 'ja' ? '404' : '404'}
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                    {params.locale === 'ja' ? '投稿が見つかりません' : 'Post not found'}
                </p>
                <Link href={`/${params.locale}/posts`} className="text-blue-500 hover:underline">
                    {params.locale === 'ja' ? '投稿に戻る' : 'Go back to posts'}
                </Link>
            </div>
        )
    }

    const sortedPosts = [...allPosts]
        .filter(post => post._raw.sourceFileDir === params.locale)
        .sort((a, b) => compareDesc(new Date(a.publishedAt), new Date(b.publishedAt)));

    const currentIndex = sortedPosts.findIndex(p => p.slug === post.slug);
    const prevPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;
    const nextPost = currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;

    const Content = getMDXComponent(post.body.code)

    return (
        <article className="py-8 mx-auto max-w-2xl bg-gray-100 dark:bg-gray-800 shadow-lg rounded-lg">
            <div className="px-8 py-6">
                <time dateTime={post.date} className="mb-1 text-xs text-gray-400">
                    {format(parseISO(post.date), 'LLLL d, yyyy')}
                </time>
                <h1 className='text-4xl font-bold mb-4 text-gray-700 dark:text-white'>{post.title}</h1>
                <div className="prose lg:prose-lg text-black dark:text-white space-y-4 leading-snug">
                    <Content />
                </div>
                {prevPost || nextPost ? (
                    <div className="mt-4 flex justify-between">
                        {prevPost ? (
                            <Link href={`/${params.locale}/posts/${prevPost.slug}`} className="inline-block py-2 px-4 bg-blue-500 hover:bg-blue-700 text-white font-bold rounded">
                                {params.locale === 'ja' ? '前の投稿' : 'Previous Post'}
                            </Link>
                        ) : (
                            <div></div>
                        )}
                        {nextPost && (
                            <Link href={`${params.locale}/posts/${nextPost.slug}`} className="inline-block py-2 px-4 bg-blue-500 hover:bg-blue-700 text-white font-bold rounded">
                                {params.locale === 'ja' ? '次の投稿' : 'Next Post'}
                            </Link>
                        )}
                    </div>
                ) : (
                        <div className='mt-4'>
                            <Link href={`/${params.locale}/posts`} className="inline-block py-2 px-4 bg-blue-500 hover:bg-blue-700 text-white font-bold rounded">
                                {params.locale === 'ja' ? '一覧に戻る' : 'Go back to posts'}
                            </Link>
                    </div>
                )
                }
            </div>
        </article>
    )
}

export default PostLayout