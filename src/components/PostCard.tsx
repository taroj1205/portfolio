import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import DateFormatter from './DateFormatter';
import { IoChatbubbleOutline } from 'react-icons/io5';

export default function ArticleCard({ image, category, title, description, readingTime, publishedAt, slug, locale }: { image: string, category: any, title: string, description: string, readingTime: any, publishedAt: string, slug: string, locale: string }) {
    // minutes to text
    const readTime = `${Math.round(readingTime.minutes)}${locale === 'ja' ? '分で読めます' : ' min to read'}`

    return (
        <div className='max-w-[30rem]'>
            <section className='text-gray-600 body-font'>
                <div className='container px-5 py-6 mx-auto'>
                    <div className='flex flex-wrap -m-4'>
                        <div className='p-4'>
                            <div className='h-full border-2 border-gray-200 dark:border-gray-700 border-opacity-60 rounded-lg overflow-hidden'>
                                <Image
                                    className='lg:h-48 md:h-36 w-full object-cover object-center'
                                    src={image}
                                    width={720}
                                    height={400}
                                    alt='blog'
                                />
                                <div className='p-6'>
                                    <h2 className='tracking-widest text-xs title-font font-medium text-gray-400 mb-1'>
                                        {category}
                                    </h2>
                                    <h1 className='title-font text-lg font-medium text-gray-900 dark:text-gray-100 mb-3'>
                                        {title}
                                    </h1>
                                    <p className='leading-relaxed mb-3 text-gray-600 dark:text-gray-300 line-clamp-2'>{description}</p>
                                    <div className='flex items-center flex-wrap '>
                                        <Link
                                            href={`/posts/${slug}`}
                                            className='text-indigo-500 inline-flex items-center md:mb-2 lg:mb-0'
                                        >
                                            {locale === 'ja' ? 'もっと読む' : 'Read More'}
                                            <svg
                                                className='w-4 h-4 ml-2'
                                                viewBox='0 0 24 24'
                                                stroke='currentColor'
                                                strokeWidth='2'
                                                fill='none'
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                            >
                                                <path d='M5 12h14'></path>
                                                <path d='M12 5l7 7-7 7'></path>
                                            </svg>
                                        </Link>
                                        <div className='ml-2'>
                                            <span className='text-gray-400 mr-3 inline-flex items-center lg:ml-auto md:ml-0 ml-auto leading-none text-sm pr-3 py-1 border-r-2 border-gray-200'>
                                                {readTime}
                                            </span>
                                            <span className='items-center text-gray-400 text-sm py-1 inline-flex space-x-1'>
                                                <IoChatbubbleOutline />
                                                <DateFormatter date={String(publishedAt)} lang={String(locale)} />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}