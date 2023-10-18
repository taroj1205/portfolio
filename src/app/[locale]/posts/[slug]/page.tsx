import { allPosts } from 'contentlayer/generated'
import { getMDXComponent, useMDXComponent } from 'next-contentlayer/hooks'
import { compareDesc } from 'date-fns'
import Image from 'next/image'
import DateFormatter from '@/components/DateFormatter';
import { IoChatbubbleOutline } from 'react-icons/io5';
import Link from 'next/link';
import NCEA from '@/components/NCEA/Ncea';

const usedcomponents = {
    NCEA,
}

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
    const categories = post.category?.split(',') || [];
    const readTime = `${Math.round(post.readingTime.minutes)}${post.locale === 'ja' ? '分で読めます' : ' min to read'}`

    return (
        <div className='md:px-4 md:py-24'>
            <div className='mx-auto max-w-2xl p-4 md:px-6 md:rounded-lg'>
                <p className='block text-center text-base font-semibold uppercase tracking-wide'>
                    {categories.map((item: any, index: any) => (
                        <Link className='text-indigo-600 hover:text-indigo-700 hover:underline' href={`/posts/categories/${item}`} key={index}>#{item}</Link>
                    ))}
                </p>
                <h1 className='my-2 block text-center text-3xl font-extrabold leading-8 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl'>
                    {post.title}
                </h1>
                <div className='flex items-center justify-center'>
                    <span className='text-gray-600 dark:text-gray-400 mr-3 inline-flex items-center leading-none text-sm pr-3 py-1 border-r-2 border-gray-200 dark:border-gray-600'>
                        {readTime}
                    </span>
                    <span className='items-center text-gray-600 dark:text-gray-400 text-sm py-1 inline-flex space-x-1'>
                        <IoChatbubbleOutline />
                        <DateFormatter date={String(post.publishedAt)} lang={String(post.locale)} />
                    </span>
                </div>
                <Image
                    className='lg:h-48 mt-3 mb-2 md:h-36 w-full object-cover object-center'
                    src={post.image}
                    width={720}
                    height={400}
                    alt='blog'
                />
                <div className='flex flex-col md:flex-row items-start md:justify-between md:items-center mt-4'>
                    <div>
                        <div className='flex items-center rounded-lg space-x-4'>
                            <Image src={post.author.image} width={50} height={50} alt='blog' className='rounded-full' />

                            <div className='text-gray-800 dark:text-gray-200'>
                                <strong className='text-lg'>{post.author.name}</strong>
                                <br />
                                <span className='text-sm'>{post.locale === 'ja' ? '高校生' : 'High School Student'}</span>
                            </div>
                        </div>
                    </div>

                </div>
                <article className='mx-auto space-y-4 leading-snug prose-md prose prose-indigo py-4 md:py-6 lg:prose-lg rounded-lg'>
                    <Content components={usedcomponents} />
                </article>
                {prevPost || nextPost ? (
                    <div className="mt-4 flex justify-between">
                        {prevPost ? (
                            <Link href={`/${params.locale}/posts/${prevPost.slug}`} className="inline-block py-2 px-4 bg-blue-500 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-bold rounded">
                                {params.locale === 'ja' ? '前の投稿' : 'Previous Post'}
                            </Link>
                        ) : (
                            <div></div>
                        )}
                        {nextPost && (
                            <Link href={`/${params.locale}/posts/${nextPost.slug}`} className="inline-block py-2 px-4 bg-blue-500 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-bold rounded">
                                {params.locale === 'ja' ? '次の投稿' : 'Next Post'}
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className='mt-4'>
                            <Link href={`/${params.locale}/posts`} className="inline-block py-2 px-4 bg-blue-500 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-bold rounded">
                            {params.locale === 'ja' ? '一覧に戻る' : 'Go back to posts'}
                        </Link>
                    </div>
                )
                }
            </div>
        </div>
    )
}

export default PostLayout