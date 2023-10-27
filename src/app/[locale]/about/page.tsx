import '../code.css';
import { allPosts } from 'contentlayer/generated'
import { getMDXComponent } from 'next-contentlayer/hooks'
import { compareDesc } from 'date-fns'
import Image from 'next/image'
import DateFormatter from '@/components/DateFormatter';
import { IoChatbubbleOutline } from 'react-icons/io5';
import Link from 'next/link';
import TableContents from '@/components/TableContents';
import markdownStyles from '../posts/[...slug]/markdown-styles.module.css';
import WordCounter from '@/components/WordCounter';
import { notFound } from 'next/navigation';
import metadata from '@/app/metadata.json';
import Education from '@/components/Education';
import NCEA from '@/components/NCEA/Ncea';
import SchoolHistory from '@/components/SchoolHistory';
import { Kbd, KbdKey } from "@nextui-org/react";
import Socials from '@/components/Socials';
import {BsArrowLeft, BsArrowRight} from "react-icons/bs";

export const dynamic = 'force-dynamic';

const usedcomponents = {
    Education,
    NCEA,
    SchoolHistory,
    TableContents,
    WordCounter,
    Kbd(props: { keys: KbdKey[], text: string }) {
        return <Kbd keys={props.keys}>{props.text}</Kbd>;
    }
}

export const generateStaticParams = async () => {
    return allPosts.map((post) => {
        const slug = post.path.split('/').filter(Boolean);
        return { params: { slug: slug } };
    });
}

export const generateMetadata = ({ params }: { params: { slug: string; locale: string } }) => {
    const locale = params.locale;
    const path = 'about';
    const post = allPosts.find(post => post.locale === locale && post.path.trim() === path && post.draft !== true) as any;


    if (!post) {
        console.log("post not found")
        notFound()
    };

    let pageMetadata = (metadata as Record<string, any>)['blog-post'];

    // Replace placeholders with actual values
    let title = post.title;
    let description = post.description;
    let imageUrl = post.image;

    return {
        metadataBase: new URL(pageMetadata.metadataBase),
        title: pageMetadata.title[locale].replace('{title}', title),
        description: pageMetadata.description[locale].replace('{description}', description),
        icons: pageMetadata.icons,
        openGraph: {
            images: pageMetadata.openGraph.images.map((image: { url: string, alt: { [key: string]: string } }) => ({
                url: image.url.replace('{image}', imageUrl),
                alt: image.alt[locale],
            })),
        },
        twitter: {
            card: pageMetadata.twitter.card,
            title: pageMetadata.twitter.title[locale].replace('{title}', title),
            description: pageMetadata.twitter.description[locale].replace('{description}', description),
            site: pageMetadata.twitter.site,
            creator: pageMetadata.twitter.creator,
            images: pageMetadata.twitter.images.map((image: { url: string, alt: { [key: string]: string } }) => ({
                url: image.url.replace('{image}', imageUrl),
                alt: image.alt[locale],
            })),
        },
        viewport: pageMetadata.viewport
    }
}

const PostLayout = ({ params }: { params: { slug: string; locale: string; } }) => {
    const path = 'about';
    const post = allPosts.find(post => post.locale === params.locale && post.path.trim() === path && post.draft !== true) as any;


    if (!post) {
        console.log("post not found")
        notFound()
    };

    const sortedPosts = [...allPosts]
        .filter(post => post.locale === params.locale)
        .sort((a, b) => compareDesc(new Date(a.publishedAt), new Date(b.publishedAt)));

    const currentIndex = sortedPosts.findIndex(p => p.path.trim() === post.path.trim());
    const prevPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;
    const nextPost = currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;

    const Content = getMDXComponent(post.body.code)

    const categories = post.category?.split(',') || [];
    const readTime = `${Math.round(post.readingTime.minutes)}${post.locale === 'ja' ? '分で読めます' : ' min to read'}`

    return (
        <div className='md:px-2'>
            <div className='mx-auto max-w-3xl p-4 md:px-6 md:rounded-lg'>
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
                    className='md:h-[18rem] h-[14rem] mt-3 mb-2 w-full object-cover object-center'
                    src={post.image}
                    width={720}
                    height={400}
                    alt='blog'
                />
                <div className='flex flex-col md:flex-row items-start md:justify-between md:items-center my-4'>
                    <div className='flex flex-col'>
                        <div className='flex items-center rounded-lg space-x-4'>
                            <Image src={post.author.image} width={50} height={50} alt='blog' className='rounded-full' />

                            <div className='text-gray-800 dark:text-gray-200 flex flex-col'>
                                <strong className='text-lg'>{post.author.name}</strong>
                                <span className='text-sm mb-1'>{post.locale === 'ja' ? '高校生' : 'High School Student'}</span>
                                <Socials />
                            </div>
                        </div>
                    </div>
                </div>
                <article className={`${markdownStyles['markdown']} mx-auto space-y-4 leading-snug prose-md prose prose-indigo lg:prose-lg rounded-lg`}>
                    <Content components={usedcomponents} />
                </article>
                <div className="mt-4">
                    <Link href={'/posts'} className="flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                        <BsArrowLeft className="mr-2" />
                        {post.locale === 'ja' ? '投稿一覧へ' : 'Back to posts'}
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default PostLayout