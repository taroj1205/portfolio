'use client'
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useState, useEffect, useRef, useCallback } from 'react';
import { RiHome2Line, RiUserLine } from 'react-icons/ri';
import { usePathname as nextUsePathname, useSelectedLayoutSegment, useSelectedLayoutSegments } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import LanguageSwitcher from './LanguageSwitch';
import { FaBlog, FaCubes } from 'react-icons/fa';
import { usePathname, Link } from "@/lib/next-intl";

export default function Header() {
    const lang = useLocale();
    const pathname = usePathname();
    const segments = useSelectedLayoutSegment();
    console.log(segments)
    const currentPathname = nextUsePathname();
    // const dynamicPathname = pathname.startsWith('/apps') ? '/apps' : pathname.startsWith('/posts') ? '/posts' : pathname;
    const dynamicPathname = segments ? `/${segments}` : '/';
    console.log(dynamicPathname)
    const nextPathname = segments ? `/${lang}/${segments}` : currentPathname;

    console.log(nextPathname)

    const t = useTranslations('header');
    const [activeLinkStyle, setActiveLinkStyle] = useState('hidden');
    const [active, setActive] = useState(false);
    const activeRef = useRef<HTMLDivElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [scrolled, setScrolled] = useState(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>();

    const links = [
        { href: '/', text: t('home'), icon: <RiHome2Line /> },
        { href: '/about', text: t('about'), icon: <RiUserLine /> },
        { href: '/posts', text: t('blog'), icon: <FaBlog /> },
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
                    setActiveLinkStyle('fixed');
                }
                setActive(true);
            } else if (!active) {
                setActiveLinkStyle('hidden');
            }
        });
    }, [active, nextPathname]);

    useEffect(() => {
        handleResize();
    })

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
                    setActiveLinkStyle('fixed');
                }
                setActive(true);
            } else if (!active) {
                setActiveLinkStyle('hidden');
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
        <>
            <header className="relative w-full shadow-md bg-white dark:bg-gray-950">
                <div className='absolute top-0 z-10 progress bg-blue-500' style={{ width: scrollProgress + '%' }}></div>
                <div className='flex flex-col px-4 py-3 lg:flex-row items-center justify-between'>
                    <div className="flex items-center">
                        <div className='mr-2 lg:hidden'>
                            <LanguageSwitcher isHeader />
                        </div>
                        <Link href="/" className='flex items-center'>
                            <div className='text-lg lg:text-2xl'><Image src="/images/profile/pfp.webp" alt='profile picture' width={50} height={50} className='w-6 h-6 rounded-lg' /></div>
                            <h1 className="ml-2 text-md md:text-lg font-bold text-gray-900 dark:text-white">
                                {t('title')}
                            </h1>
                        </Link>
                        <div className='ml-2 hidden lg:block'>
                            <LanguageSwitcher isHeader />
                        </div>
                        <div className='ml-2 lg:hidden'>
                            <ThemeSwitcher />
                        </div>
                    </div>
                    <nav className='flex items-center justify-center relative'>
                        <div className='flex flex-row text-lg'>
                            <div className='flex flex-row justify-between w-[94vw] lg:w-full items-center'>
                                {links.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`flex lg:px-4 w-full justify-center whitespace-nowrap items-center ${dynamicPathname === link.href ? 'text-gray-700 dark:text-white' : 'text-gray-600 dark:text-gray-400'} lg:px-4 hover:text-black dark:hover:text-white transition-colors duration-200`}
                                        onMouseEnter={handleMouseEnter}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        <span className="mr-1 lg:mr-2">{link.icon}</span>
                                        {link.text}
                                    </Link>
                                ))}
                            </div>
                            <div className='lg:ml-2 hidden lg:flex'>
                                <ThemeSwitcher />
                            </div>
                        </div>
                    </nav>
                    <div
                        className={`absolute max-w-[10rem] md:max-w-[20rem] opacity-100 mt-4 lg:mt-2 left-0 h-[2px] bg-black dark:bg-gray-400 ${activeLinkStyle}`}
                        ref={activeRef}
                        style={{ transition: 'transform 0.3s ease-in-out, width 0.3s ease-in-out' }}
                    />
                </div>
            </header>
        </>
    );
}