'use client'
import Link from 'next-intl/link';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useState, useEffect, useRef, useCallback } from 'react';
import { RiHome2Line, RiUserLine } from 'react-icons/ri';
import { usePathname } from 'next-intl/client';
import { usePathname as nextUsePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import LanguageSwitcher from './LanguageSwitch';
import { FaCubes } from 'react-icons/fa';

export default function Header() {
    const pathname = usePathname();
    const currentPathname = nextUsePathname();
    const lang = useLocale();
    const nextPathname = pathname.startsWith('/apps') ? `/${lang}/apps` : currentPathname;
    const t = useTranslations('header');
    const [activeLinkStyle, setActiveLinkStyle] = useState('hidden');
    const [active, setActive] = useState(false);
    const activeRef = useRef<HTMLDivElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [scrolled, setScrolled] = useState(0);
    const timeoutRef = useRef <ReturnType<typeof setTimeout> | null>();

    const links = [
        { href: '/', text: t('home'), icon: <RiHome2Line /> },
        { href: '/about', text: t('about'), icon: <RiUserLine /> },
        { href: '/apps', text: t('apps'), icon: <FaCubes /> },
    ];

    const handleResize = useCallback((): void => {
        const links = document.querySelectorAll('nav a');
        links.forEach((link) => {
            if (link.getAttribute('href') === nextPathname) {
                if (activeRef.current) {
                    const width = link.getBoundingClientRect().width;
                    activeRef.current.style.width = `${width}px`;
                    const linkPosition = link.getBoundingClientRect();
                    activeRef.current.style.transform = `translate(${linkPosition.left}px, ${linkPosition.top + 1}px)`;
                    console.log(link.classList);
                    link.classList.add('text-gray-900');
                    link.classList.add('dark:text-white');
                    setActiveLinkStyle('fixed');
                }
                setActive(true);
            } else if (!active) {
                setActiveLinkStyle('hidden');
            }
        });
    }, [active, nextPathname]);

    useEffect(() => {
        setActive(false);
        const links = document.querySelectorAll('nav a');
        links.forEach((link) => {
            console.log(link.getAttribute('href'), nextPathname);
            if (link.getAttribute('href') === nextPathname) {
                if (activeRef.current) {
                    const width = link.getBoundingClientRect().width;
                    activeRef.current.style.width = `${width}px`;
                    const linkPosition = link.getBoundingClientRect();
                    activeRef.current.style.transform = `translate(${linkPosition.left}px, ${linkPosition.top + 1}px)`;
                    console.log(link.classList);
                    link.classList.add('text-gray-900');
                    link.classList.add('dark:text-white');
                    setActiveLinkStyle('fixed');
                }
                setActive(true);
            } else if (!active) {
                setActiveLinkStyle('hidden');
                link.classList.remove('text-gray-900');
                link.classList.remove('dark:text-white');
            }
        });

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(document.documentElement);
        window.addEventListener('resize', handleResize);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', handleResize);
        };
    }, [active, handleResize, nextPathname]);

    const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
        const target = e.currentTarget;
        console.log(nextPathname, target.href, `/${target.href.split('/').pop()}`);
        // if (nextPathname === `/${target.href.split('/').pop()}`) {
        if (activeRef.current) {
            const width = target.getBoundingClientRect().width;
            const linkPosition = target.getBoundingClientRect();
            const distance = linkPosition.left - activeRef.current.getBoundingClientRect().left;
            activeRef.current.style.width = `${width + distance}px`;
            activeRef.current.style.height = '2px';
            timeoutRef.current = setTimeout(() => {
                if (activeRef.current) {
                    activeRef.current.style.width = `${width + 20}px`;
                    activeRef.current.style.transform = `translate(${linkPosition.left - 10}px, ${linkPosition.top + 1}px)`;
                }
            }, 100)
            console.log(activeRef.current?.style.transform);
        }
        // }
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
        console.log(nextPathname);
        // if (nextPathname === `/${target.href.split('/').pop()}`) {
        //     if (activeRef.current) {
        //         const width = target.getBoundingClientRect().width;

        //         const linkPosition = target.getBoundingClientRect();
        //         activeRef.current.style.width = `${width}px`;
        //         activeRef.current.style.transform = `translate(${linkPosition.left}px, ${linkPosition.top + 1}px)`;
        //         console.log(activeRef.current?.style.transform);
        //     }
        // }
        if (timeoutRef.current && activeRef.current) {
            clearTimeout(timeoutRef.current);
            activeRef.current.style.height = `${2}px`;
            handleResize();
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            const main = document.querySelector('.content') as HTMLDivElement;
            const windowHeight = window.innerHeight as number;
            const fullHeight = main.scrollHeight as number;
            if (!fullHeight) return;
            const scrollTop = window.scrollY as number;
            if (windowHeight === fullHeight) { setScrollProgress(0); return; }
            const progress = (scrollTop / (fullHeight - windowHeight)) * 100;
            setScrollProgress(progress);
            setScrolled(scrollTop);
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            setScrollProgress(0);
            setScrolled(0);
        };
    }, []);

    return (
        <header className="fixed top-0 z-10 w-full px-4 py-3 shadow-md bg-white dark:bg-gray-950">
            <div className='flex flex-col md:flex-row items-center justify-between'>
                <div className="flex items-center">
                    <div className='mr-2 sm:hidden'>
                        <LanguageSwitcher isHeader />
                    </div>
                    <Link href="/" className='flex items-center'>
                        <div className='text-lg lg:text-2xl'><Image src="/images/profile/pfp.webp" alt='profile picture' width={50} height={50} className='w-6 h-6 rounded-lg' /></div>
                        <h1 className="ml-2 text-md md:text-lg font-bold text-gray-900 dark:text-white">
                            {t('title')}
                        </h1>
                    </Link>
                    <div className='ml-2 hidden sm:block'>
                        <LanguageSwitcher isHeader />
                    </div>
                    <div className='ml-2 sm:hidden'>
                        <ThemeSwitcher />
                    </div>
                </div>
                <nav className='flex items-center justify-center relative'>
                    <div className='flex flex-row text-lg'>
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center ${pathname === link.href ? 'text-gray-700 dark:text-gray-300' : 'text-gray-600 dark:text-gray-400'} px-1 sm:px-4 hover:text-black dark:hover:text-white transition-colors duration-200`}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            >
                                <span className="mr-2">{link.icon}</span>
                                {link.text}
                            </Link>
                        ))}
                        <div className='md:ml-2 hidden sm:flex'>
                            <ThemeSwitcher />
                        </div>
                    </div>
                </nav>
                <div
                    className={`fixed max-w-[10rem] opacity-100 mt-3 sm:mt-4 md:mt-0 left-0 h-[2px] bg-blue-500 dark:bg-blue-600 ${activeLinkStyle}`}
                    ref={activeRef}
                    style={{ transition: 'transform 0.3s ease-in-out, width 0.3s ease-in-out' }}
                />
            </div>
            <div className='progress mt-3 bg-blue-500' style={{ width: scrollProgress + '%' }}></div>
        </header>
    );
}
