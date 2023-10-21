'use client'
import { Link } from '@/lib/next-intl';
import { useTranslations } from 'next-intl';
import React from 'react';
import { AiOutlineEdit } from 'react-icons/ai';

const Footer = () => {
    const t = useTranslations('footer');
    
    return (
        <footer className="z-10 w-full bg-gray-200 dark:bg-gray-950 mt-auto">
            <div className="mx-auto p-4">
                <div className="flex justify-between items-center mx-auto md:max-w-2xl">
                    <div className="flex flex-col">
                        <div>
                        <p className="text-black dark:text-gray-300">
                            &copy; {new Date().getFullYear()} {t('name')} | {t('all_rights_reserved')}
                        </p>
                        <Link href="mailto:taroj1205@gmail.com" className="text-black dark:text-gray-300">
                            taroj1205@gmail.com
                            </Link>
                        </div>
                        <div>
                            <Link
                                href="https://crowdin.com/project/taroj1205/"
                                className="flex mt-2"
                            >
                                <span className="flex items-center bg-gray-300 dark:bg-gray-900 hover:bg-gray-400 dark:hover:bg-black text-black dark:text-white font-bold py-2 px-4 rounded-lg">
                                    <AiOutlineEdit className="mr-2" />
                                    {t('edit_on_crowdin')}
                                </span>
                            </Link>
                        </div>
                    </div>
                    <div className='flex flex-col flex-shrink-0'>
                        <p className="text-black dark:text-white font-bold mb-2">{t('sitemap')}</p>
                        <ul className="text-right md:text-left flex flex-col">
                            <li>
                                <Link href="/" className="text-blue-700 dark:text-blue-500 hover:underline">
                                    {t('home')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="text-blue-700 dark:text-blue-500 hover:underline">
                                    {t('about')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/posts" className="text-blue-700 dark:text-blue-500 hover:underline">
                                    {t('blog')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/apps" className="text-blue-700 dark:text-blue-500 hover:underline">
                                    {t('apps')}
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
