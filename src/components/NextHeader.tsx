'use client'
import React, { useEffect } from "react";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Button, NavbarMenuToggle, NavbarMenu, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, NavbarMenuItem } from "@nextui-org/react";
import Image from "next/image";
import { FaArchive, FaBlog, FaCubes, FaListAlt, FaSpinner } from 'react-icons/fa';
import {RiAiGenerate, RiHome2Line, RiUserLine} from 'react-icons/ri';
import { FaChartBar, FaComments, FaSearch } from 'react-icons/fa';
import { TbSchool } from 'react-icons/tb';
import { useSelectedLayoutSegment } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/next-intl";
import LanguageToggle from "./LanguageToggle";
import ThemeToggle from "./ThemeToggle";
import { FcPlanner } from 'react-icons/fc';

interface ChevronDownProps extends React.SVGProps<SVGSVGElement> {
    size?: number;
}

type NestedType = {
    [key: string]: { href: string; text: string; icon: JSX.Element; description: string }[];
};

const ChevronDown = ({ fill, size, height, width, ...props }: ChevronDownProps) => {
    const [mounted, setMounted] = React.useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);
    if (!mounted) {
        return <FaSpinner className="animate-spin text-gray-500 w-4 h-4" />
    }

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

export default function NextHeader() {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const t = useTranslations('header');
    const segment = useSelectedLayoutSegment() || '';


    const links = [
        { href: '/', text: t('home'), icon: <RiHome2Line /> },
        { href: '/about', text: t('about'), icon: <RiUserLine /> },
        { href: '/posts', text: t('blog'), icon: <FaBlog /> },
        { href: '/apps', text: t('apps'), icon: <FaCubes /> },
    ];

    const icons = {
			chevron: <ChevronDown fill="currentColor" size={16} />,
			list: <FaListAlt className="text-warning" size={30} />,
			archive: <FaArchive className="text-primary" size={30} />,
			chat: <FaComments className="text-warning" size={30} />,
			ncea: <TbSchool className="text-success" size={30} />,
			search: <FaSearch className="text-danger" size={30} />,
			analytics: <FaChartBar className="text-secondary" size={30} />,
			generator: <RiAiGenerate className="text-primary" size={30} />,
			plan: <FcPlanner className="text-success" size={30} />,
		};

    const nested: NestedType = {
			blog: [
				{
					href: "/posts",
					text: t("posts.list.name"),
					icon: icons.list,
					description: t("posts.list.description"),
				},
				{
					href: "/posts/archives",
					text: t("posts.archive.name"),
					icon: icons.archive,
					description: t("posts.archive.description"),
				},
			],
			apps: [
				// {
				// 	href: "/schedule",
				// 	text: t("schedule.name"),
				// 	icon: icons.plan,
				// 	description: t("schedule.description"),
				// },
				{
					href: "https://chat-taroj.vercel.app/",
					text: t("chat.name"),
					icon: icons.chat,
					description: t("chat.description"),
				},
				{
					href: "https://taroj.poyo.jp/apps/ncea",
					text: "NCEA",
					icon: icons.ncea,
					description: t("ncea.description"),
				},
				{
					href: "/apps/search",
					text: t("search.name"),
					icon: icons.search,
					description: t("search.description"),
				},
				{
					href: "/apps/generator/image",
					text: t("generator.name"),
					icon: icons.generator,
					description: t("generator.description"),
				},
				{
					href: "https://analytics.eu.umami.is/share/V1djMkaLDvEhYDvY/taroj.vercel.app",
					text: t("analytics.name"),
					icon: icons.analytics,
					description: t("analytics.description"),
				},
			],
		};

    useEffect(() => {
        setIsMenuOpen(false);
        console.log("menu closed!")
    }, [segment])

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
            isMenuOpen={isMenuOpen}
            onMenuOpenChange={() => setIsMenuOpen(!isMenuOpen)}
            isBordered
        >
            <NavbarContent>
                <NavbarMenuToggle
                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                    className="sm:hidden"
                />
                <NavbarBrand>
                    <Link href="/" className='flex text-black dark:text-white items-center'>
                        <Image src="/images/profile/pfp.webp" alt='profile picture' width={50} height={50} className='w-6 h-6 rounded-lg' />
                        <p className="font-bold text-inherit ml-1 lg:ml-2">{t('title')}</p>
                    </Link>
                </NavbarBrand>
            </NavbarContent>

            <NavbarContent className="hidden sm:flex gap-4" justify="center">
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
                                            radius="md"
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
                                            as={Link}
                                            href={nestedLink.href}
                                            className="text-black dark:text-white"
                                        >
                                            {nestedLink.text}
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                        );
                    } else {
                        return (
                            <NavbarItem key={link.href} isActive={link.href === `/${segment}`}>
                                <Link className="flex text-black dark:text-white items-center" href={`${link.href}`}>
                                    <span className="mr-1 lg:mr-2">{link.icon}</span>
                                    {link.text}
                                </Link>
                            </NavbarItem>
                        );
                    }
                })}
            </NavbarContent>
            <NavbarContent justify="end">
                <NavbarItem className="flex space-x-3">
                    <LanguageToggle />
                    <ThemeToggle />
                </NavbarItem>
            </NavbarContent>
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
                                            radius="md"
                                            variant="light"
                                        >
                                            {link.text}
                                        </Button>
                                    </DropdownTrigger>
                                </NavbarMenuItem>
                                <DropdownMenu
                                    aria-label={`${link.text} menu`}
                                    className="w-[340px]"
                                    itemClasses={{
                                        base: "gap-4"
                                    }}
                                >
                                    {nested[slug] && nested[slug].map((nestedLink, index) => (
                                        <DropdownItem
                                            key={index}
                                            description={nestedLink.description}
                                            startContent={nestedLink.icon}
                                            as={Link}
                                            href={nestedLink.href}
                                            className="text-black dark:text-white"
                                        >
                                            {nestedLink.text}
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                        );
                    } else {
                        return (
                            <NavbarMenuItem key={`${link.href}-${index}`}>
                                <Link className="py-2 flex text-black dark:text-white items-center" href={link.href}>
                                    <span className="mr-1 lg:mr-2">{link.icon}</span>
                                    {link.text}
                                </Link>
                            </NavbarMenuItem>
                        );
                    }
                })}
            </NavbarMenu >
        </Navbar >
    );
}
