import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import DateFormatter from './DateFormatter';
import { IoChatbubbleOutline } from 'react-icons/io5';

export default function PostCard({ image, category, title, description, readingTime, publishedAt, url, locale, draft }: { image: string, category: string | undefined, title: string, description: string, readingTime: any, publishedAt: string, url: string, locale: string, draft: boolean }) {
    if (draft || url === '/posts/about') return null;
    const readTime = `${Math.round(readingTime.minutes)}${locale === 'ja' ? '分で読めます' : ' min to read'}`
    const categories = category?.split(',') || [];
    return (
        <div className='w-full sm:max-w-[25rem] h-full'>
            <section className='text-gray-600'>
                <div className='container py-6 mx-auto'>
                    <div className='flex flex-wrap -m-4'>
                        <div className='p-4'>
                            <div className='h-full border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'>
                                <Image
                                    className='lg:h-48 md:h-36 w-full object-cover object-center'
                                    src={image}
                                    width={720}
                                    height={400}
                                    alt='blog'
                                />
                                <div className='p-6'>
                                    <h3 className='tracking-widest text-xs font-medium mb-1'>
                                        {categories.map((item: any, index: any) => (
                                            <Link className='text-gray-400 hover:underline hover:text-gray-500' href={`/${locale}/posts/categories/${item}`} key={index}>#{item}</Link>
                                        ))}
                                    </h3>
                                    <h2 className='title-font text-lg font-medium text-gray-900 dark:text-gray-100 mb-3'>
                                        {title}
                                    </h2>
                                    <p className='md:h-20 leading-relaxed mb-3 text-gray-600 dark:text-gray-300 line-clamp-3'>{description}</p>
                                    <div className='flex items-center flex-wrap justify-between'>
                                        <Link
                                            href={`/${locale}${url === '/posts/about' ? '/about' : url}`}
                                            className='text-indigo-500 hover:underline hover:text-indigo-600 inline-flex items-center justify-center'
                                        >
                                            {locale === 'ja' ? 'もっと読む' : 'Read More'}
                                            <svg
                                                className='w-4 h-4 ml-1'
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
                                        <div className='flex items-center'>
                                            <span className='text-gray-400 mr-3 inline-flex items-center lg:ml-auto md:ml-0 ml-auto leading-none text-sm pr-3 py-1 border-r-2 border-gray-200 dark:border-gray-500'>
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