"use client";
import { FaArchive, FaBlog, FaCubes, FaListAlt } from "react-icons/fa";
import { RiAiGenerate, RiHome2Line, RiUserLine } from "react-icons/ri";
import { FaChartBar, FaComments, FaSearch } from "react-icons/fa";
import { TbSchool } from "react-icons/tb";
import { FcPlanner } from "react-icons/fc";
import { useTranslations } from "next-intl";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { Link, usePathname } from "@/lib/next-intl";
import { LangToggle } from "./LangToggle";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSelectedLayoutSegment } from "next/navigation";

interface ChevronDownProps extends React.SVGProps<SVGSVGElement> {
	size?: number;
}

type NestedType = {
	[key: string]: {
		href: string;
		text: string;
		icon: JSX.Element;
		description: string;
	}[];
};

const ChevronDown = ({
	fill,
	size,
	height,
	width,
	...props
}: ChevronDownProps) => {
	return (
		<svg
			fill="none"
			height={size || height || 24}
			viewBox="0 0 24 24"
			width={size || width || 24}
			xmlns="http://www.w3.org/2000/svg"
			{...props}>
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

export const Navbar = () => {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const pathname = usePathname();
	const segment = useSelectedLayoutSegment() || "";
	const t = useTranslations("header");
	const links = [
		{ href: "/", text: t("home"), icon: <RiHome2Line /> },
		{ href: "/about", text: t("about"), icon: <RiUserLine /> },
	];

	useEffect(() => {
		setMobileMenuOpen(false);
	}, [segment]);

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
			{
				href: "/schedule",
				text: t("schedule.name"),
				icon: icons.plan,
				description: t("schedule.description"),
			},
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

	return (
		<>
			<div data-menu-open={mobileMenuOpen} className="h-16"></div>
			<nav
				data-menu-open={mobileMenuOpen}
				className="flex h-fit flex-col min-h-[4rem] z-40 w-full items-center justify-center data-[menu-open=true]:h-[100dvh] data-[menu-open=true]:justify-start data-[menu-open=true]:border-none fixed top-0 inset-x-0 border-b border-divider backdrop-blur-lg data-[menu-open=true]:backdrop-blur-xl backdrop-saturate-150 bg-background/70">
				<div
					data-menu-open={mobileMenuOpen}
					className={`flex items-center h-16 justify-between md:hidden w-full px-2 pl-3`}>
					{/* Mobile hamburger menu button */}
					<button
						title="Menu"
						type="button"
						className="focus:outline-none h-full w-fit p-1"
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
						<div
							data-menu-open={mobileMenuOpen}
							className="menu-toggle before:bg-black after:bg-black dark:before:bg-white dark:after:bg-white"></div>
					</button>
					<div className="flex items-center justify-center md:hidden">
						<LangToggle />
						<ThemeSwitcher />
					</div>
				</div>
				{/* Mobile menu */}
				{mobileMenuOpen && (
					<div className="flex flex-col justify-center md:hidden px-6 w-full">
						{links.map((link, index) => (
							<Link
								key={index}
								href={link.href}
								className="text-black py-2 dark:text-white flex items-center space-x-2">
								{link.icon}
								<span>{link.text}</span>
							</Link>
						))}
						<Dropdown items={nested["blog"]} />
						<Dropdown items={nested["apps"]} />
					</div>
				)}
				<header className="hidden h-16 z-40 md:flex px-6 gap-4 w-full flex-row relative flex-nowrap items-center justify-between max-w-[1024px]">
					<Link
						href="/"
						className="h-full flex flex-grow text-black dark:text-white items-center justify-start">
						<Image
							src="/images/profile/pfp.webp"
							alt="profile picture"
							width={50}
							height={50}
							className="w-6 h-6 rounded-lg"
						/>
						<p className="font-bold text-inherit ml-1 md:ml-2">{t("title")}</p>
					</Link>
					{/* Desktop menu */}
					<div
						className={`hidden h-full md:flex space-x-4 items-center justify-center`}>
						{links.map((link, index) => (
							<Link
								key={index}
								href={link.href}
								data-active={pathname === link.href}
								className="navbar-link h-full text-black dark:text-white flex items-center space-x-2">
								{link.icon}
								<span>{link.text}</span>
							</Link>
						))}
						<Dropdown items={nested["blog"]} />
						<Dropdown items={nested["apps"]} />
					</div>
					<div className="hidden h-full md:flex flex-grow space-x-1.5 items-center justify-end">
						<LangToggle />
						<ThemeSwitcher />
					</div>
				</header>
			</nav>
		</>
	);
};

type DropdownProps = {
	items: {
		href: string;
		text: string;
		icon: JSX.Element;
	}[];
};

const Dropdown = ({ items }: DropdownProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const pathname = usePathname();
	const t = useTranslations("header");
	const segment = useSelectedLayoutSegment();

	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (ref.current && !ref.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [ref]);

	useEffect(() => {
		setIsOpen(false);
	}, [segment]);

	return (
		<div className="relative flex items-center md:h-full w-full" ref={ref}>
			<div
				onClick={() => setIsOpen(!isOpen)}
				data-active={pathname.startsWith(items[0].href.toString())}
				data-menu-open={isOpen}
				className="navbar-link cursor-pointer w-full my-2 transition-all h-full text-black dark:text-white flex items-center space-x-2 justify-start">
				{items[0].href === "/posts" ? (
					<>
						<FaBlog />
						<span>{t("blog")}</span>
					</>
				) : (
					<>
						<FaCubes />
						<span>{t("apps")}</span>
					</>
				)}
				<div
					className="navbar-dropdown before:bg-black after:bg-black dark:before:bg-white dark:after:bg-white"
					data-menu-open={isOpen}
				/>
			</div>
			{isOpen && (
				<div className="absolute w-fit z-10 top-10 md:top-14 left-0 min-w-[10rem] rounded-md shadow-lg bg-white dark:bg-zinc-800 ring-1 ring-black ring-opacity-5">
					<div className="py-1">
						{items.map((item, index) => (
							<Link
								key={index}
								className="flex flex-row w-full space-x-2 items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 hover:text-gray-900 hover:dark:bg-zinc-700"
								href={item.href}>
								{item.icon}
								<div className="whitespace-nowrap">{item.text}</div>
							</Link>
						))}
					</div>
				</div>
			)}
		</div>
	);
};
