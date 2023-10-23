import React from "react";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Link, Button, NavbarMenu, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, NavbarMenuItem } from "@nextui-org/react";
import Image from "next/image";
import { FaArchive, FaBlog, FaCubes, FaListAlt } from 'react-icons/fa';
import { RiHome2Line, RiUserLine } from 'react-icons/ri';
import { FaChartBar, FaComments, FaSearch } from 'react-icons/fa';
import { TbSchool } from 'react-icons/tb';
import { headers } from "next/headers";

interface ChevronDownProps extends React.SVGProps<SVGSVGElement> {
    size?: number;
}

type NestedType = {
    [key: string]: { href: string; text: string; icon: JSX.Element; description: string }[];
};

const ChevronDown = ({ fill, size, height, width, ...props }: ChevronDownProps) => {
    return (
        <svg
            fill="none"
            height={size || height || 24}
            viewBox="0 0 24 24"
            width={size || width || 24}
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path
                d="m19.92 8.95-6.52 6.52c-.77.77-2.03.77-2.8 0L4.08 8.95"
                stroke={fill}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeMiterlimit={10}
                strokeWidth={1.5}
            />
        </svg>
    );
};


const ja = {
    "about": "僕について",
    "apps": "アプリ",
    "chat": "チャット",
    "home": "ホーム",
    "title": "上鍵心太朗",
    "blog": "ブログ",
    "posts": {
        "list": {
            "name": "一覧",
            "description": "ブログ投稿一覧"
        },
        "archive": {
            "name": "アーカイブ",
            "description": "ブログ投稿のアーカイブ"
        }
    },
    "appsNest": {
        "chat": {
            "name": "チャット",
            "description": "チャットアプリ"
        },
        "ncea": {
            "name": "NCEA",
            "description": "NCEAアプリ"
        },
        "search": {
            "name": "検索",
            "description": "検索アプリ"
        },
        "analytics": {
            "name": "解析",
            "description": "解析アプリ"
        }
    }
}
const en = {
    "about": "About",
    "apps": "Apps",
    "chat": "Chat",
    "home": "Home",
    "title": "Shintaro Jokagi",
    "blog": "Blog",
    "posts": {
        "list": {
            "name": "List of Blogs",
            "description": "List of blog posts"
        },
        "archive": {
            "name": "Blog Archives",
            "description": "Archives of blog posts"
        }
    },
    "appsNest": {
        "chat": {
            "name": "Chat",
            "description": "Chat app"
        },
        "ncea": {
            "name": "NCEA",
            "description": "NCEA app"
        },
        "search": {
            "name": "Search",
            "description": "Search app"
        },
        "analytics": {
            "name": "Analytics",
            "description": "Analytics app"
        }
    }
}

export default function NextHeader() {
    const headerList = headers();
    const locale = headerList.get('x-current-locale') || 'en';

    const segment = headerList.get('x-slug') || '';
    console.log("segment", segment)

    const links = [
        { href: '/', text: locale === 'ja' ? ja.home : en.home, icon: <RiHome2Line /> },
        { href: '/about', text: locale === 'ja' ? ja.about : en.about, icon: <RiUserLine /> },
        { href: '/posts', text: locale === 'ja' ? ja.blog : en.blog, icon: <FaBlog /> },
        { href: '/apps', text: locale === 'ja' ? ja.apps : en.apps, icon: <FaCubes /> },
    ];

    const icons = {
        chevron: <ChevronDown fill="currentColor" size={16} />,
        list: <FaListAlt className="text-warning" size={30} />,
        archive: <FaArchive className="text-primary" size={30} />,
        chat: <FaComments className="text-warning" size={30} />,
        ncea: <TbSchool className="text-success" size={30} />,
        search: <FaSearch className="text-danger" size={30} />,
        analytics: <FaChartBar className="text-secondary" size={30} />,
    };

    const nested: NestedType = {
        blog: [
            { href: '/posts', text: locale === 'ja' ? ja.posts.list.name : en.posts.list.name, icon: icons.list, description: locale === 'ja' ? ja.posts.list.description : en.posts.list.description },
            { href: '/posts/archive', text: locale === 'ja' ? ja.posts.archive.name : en.posts.archive.name, icon: icons.archive, description: locale === 'ja' ? ja.posts.archive.description : en.posts.archive.description },
        ],
        apps: [
            { href: 'https://chat-taroj.vercel.app/', text: locale === 'ja' ? ja.appsNest.chat.name : en.appsNest.chat.name, icon: icons.chat, description: locale === 'ja' ? ja.appsNest.chat.description : en.appsNest.chat.description },
            { href: 'https://taroj.poyo.jp/apps/ncea', text: locale === 'ja' ? ja.appsNest.ncea.name : en.appsNest.ncea.name, icon: icons.ncea, description: locale === 'ja' ? ja.appsNest.ncea.description : en.appsNest.ncea.description },
            { href: '/apps/search', text: locale === 'ja' ? ja.appsNest.search.name : en.appsNest.search.name, icon: icons.search, description: locale === 'ja' ? ja.appsNest.search.description : en.appsNest.search.description },
            { href: 'https://analytics.eu.umami.is/share/V1djMkaLDvEhYDvY/taroj.vercel.app', text: locale === 'ja' ? ja.appsNest.analytics.name : en.appsNest.analytics.name, icon: icons.analytics, description: locale === 'ja' ? ja.appsNest.analytics.description : en.appsNest.analytics.description },
        ]
    };

    return (
        <Navbar
            classNames={{
                item: [
                    "flex",
                    "relative",
                    "h-full",
                    "items-center",
                    "data-[active=true]:after:content-['']",
                    "data-[active=true]:after:absolute",
                    "data-[active=true]:after:bottom-0",
                    "data-[active=true]:after:left-0",
                    "data-[active=true]:after:right-0",
                    "data-[active=true]:after:h-[2px]",
                    "data-[active=true]:after:rounded-[2px]",
                    "data-[active=true]:after:bg-primary",
                ],
            }}
            shouldHideOnScroll
        >
            <NavbarContent className="hidden lg:flex">
                <NavbarBrand>
                    <Image src="/images/profile/pfp.webp" alt='profile picture' width={50} height={50} className='w-6 h-6 rounded-lg' />
                    <p className="font-bold text-inherit ml-1">{locale === 'ja' ? ja.title : en.title}</p>
                </NavbarBrand>
            </NavbarContent>
            <NavbarContent className="flex gap-4" justify="center">
                {links.map((link) => {
                    if (link.href === '/posts' || link.href === '/apps') {
                        let slug = 'blog';
                        if (link.href === '/apps') {
                            slug = 'apps'
                        }
                        console.log("current slug", slug)
                        return (
                            <Dropdown key={link.href}>
                                <NavbarItem isActive={link.href === `/${segment}`}>
                                    <DropdownTrigger>
                                        <Button
                                            disableRipple
                                            className="p-0 bg-transparent data-[hover=true]:bg-transparent"
                                            startContent={link.icon}
                                            endContent={icons.chevron}
                                            radius="sm"
                                            variant="light"
                                        >
                                            {link.text}
                                        </Button>
                                    </DropdownTrigger>
                                </NavbarItem>
                                <DropdownMenu
                                    aria-label={`${link.text} menu`}
                                    className="w-[340px]"
                                    itemClasses={{
                                        base: "gap-4",
                                    }}
                                >
                                    {nested[slug] && nested[slug].map((nestedLink, index) => (
                                        <DropdownItem
                                            key={index}
                                            description={nestedLink.description}
                                            startContent={nestedLink.icon}
                                        >
                                            <Link
                                                color="foreground"
                                                href={`/${locale}${nestedLink.href}`} className="w-full"
                                            >
                                                {nestedLink.text}
                                            </Link>
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                        );
                    } else {
                        return (
                            <NavbarItem key={link.href} isActive={link.href === `/${segment}`}>
                                <Link color="foreground" href={`/${locale}${link.href === '/' ? '' : link.href}`}>
                                    <span className="mr-1 lg:mr-2">{link.icon}</span>
                                    {link.text}
                                </Link>
                            </NavbarItem>
                        );
                    }
                })}
                <NavbarMenu>
                    {links.map((link, index) => {
                        if (link.href === '/posts' || link.href === '/apps') {
                            let slug = 'blog';
                            if (link.href === '/apps') {
                                slug = 'apps'
                            }
                            console.log("current slug", slug)
                            return (
                                <Dropdown key={link.href}>
                                    <NavbarMenuItem key={`${link.href}-${index}`}>
                                        <DropdownTrigger>
                                            <Button
                                                disableRipple
                                                className="p-0 bg-transparent data-[hover=true]:bg-transparent"
                                                startContent={link.icon}
                                                endContent={icons.chevron}
                                                radius="sm"
                                                variant="light"
                                            >
                                                {link.text}
                                            </Button>
                                        </DropdownTrigger>
                                    </NavbarMenuItem>
                                    <DropdownMenu
                                        aria-label={`${link.text} menu`}
                                        className="w-[340px]"
                                    >
                                        {nested[slug] && nested[slug].map((nestedLink, index) => (
                                            <DropdownItem
                                                key={index}
                                                description={nestedLink.description}
                                                startContent={nestedLink.icon}
                                            >
                                                <Link
                                                    color="foreground"
                                                    href={`/${locale}${nestedLink.href}`} className="w-full"
                                                >
                                                    {nestedLink.text}
                                                </Link>
                                            </DropdownItem>
                                        ))}
                                    </DropdownMenu>
                                </Dropdown>
                            );
                        } else {
                            return (
                                <NavbarMenuItem key={`${link.href}-${index}`}>
                                    <Link className="py-2" color="foreground" href={`/${locale}${link.href === '/' ? '' : link.href}`}>
                                        <span className="mr-1 lg:mr-2">{link.icon}</span>
                                        {link.text}
                                    </Link>
                                </NavbarMenuItem>
                            );
                        }
                    })}
                </NavbarMenu>
            </NavbarContent>
        </Navbar>
    );
}
