"use client";
import {
	FaArchive,
	FaBlog,
	FaCubes,
	FaFacebook,
	FaGamepad,
	FaGithub,
	FaInstagram,
	FaKeyboard,
	FaLinkedin,
	FaListAlt,
	FaTwitter,
	FaYoutube,
} from "react-icons/fa";
import { RiAiGenerate, RiHome2Line, RiUserLine } from "react-icons/ri";
import { FaChartBar, FaComments, FaSearch } from "react-icons/fa";
import { TbSchool } from "react-icons/tb";
import { FcPlanner } from "react-icons/fc";
import { SlSocialDropbox } from "react-icons/sl";
import { useTranslations } from "next-intl";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { Link, usePathname } from "@/lib/next-intl";
import { LangToggle } from "./LangToggle";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImPointUp } from "react-icons/im";

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
	twitter: <FaTwitter className="text-blue-400" size={30} />,
	facebook: <FaFacebook className="text-primary" size={30} />,
	youtube: <FaYoutube className="text-red-600" size={30} />,
	github: <FaGithub className="text-gray-900 dark:text-white" size={30} />,
	linkedin: (
		<FaLinkedin className="text-blue-700 dark:text-blue-500" size={30} />
	),
	instagram: <FaInstagram className="text-pink-600" size={30} />,
	connect4: <FaGamepad className="text-blue-600" size={30} />,
	typing: <FaKeyboard className="text-green-600" size={30} />
};

export const Navbar = () => {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const pathname = usePathname();
	const t = useTranslations("header");
	const links = [
		{ href: "/", text: t("home"), icon: <RiHome2Line /> },
		{ href: "/about", text: t("about"), icon: <RiUserLine /> },
	];

	useEffect(() => {
		setMobileMenuOpen(false);
	}, [pathname]);

	return (
		<>
			<div data-menu-open={mobileMenuOpen} className="h-16"></div>
			<nav
				data-menu-open={mobileMenuOpen}
				className="flex h-fit flex-col min-h-[4rem] z-40 w-full items-center justify-center data-[menu-open=true]:h-[100svh] data-[menu-open=true]:justify-start data-[menu-open=true]:border-none fixed top-0 inset-x-0 backdrop-blur-lg data-[menu-open=true]:backdrop-blur-xl backdrop-saturate-150 bg-background/70">
				<div
					data-menu-open={mobileMenuOpen}
					className={`flex items-center h-16 min-h-[4rem] justify-between md:hidden w-full px-2 pl-3`}>
					{/* Mobile hamburger menu button */}
					<div className="relative group">
						<button
							title="Menu"
							type="button"
							className="focus:outline-none h-full w-fit p-1"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
							<div
								data-menu-open={mobileMenuOpen}
								className="menu-toggle before:bg-black after:bg-black dark:before:bg-white dark:after:bg-white"></div>
						</button>
						<div
							data-show={!mobileMenuOpen && pathname === "/"}
							className="absolute top-12 left-0 data-[show=false]:hidden md:hidden animate-bounce">
							{/* <svg
								xmlns="http://www.w3.org/2000/svg"
								width="50"
								height="70"
								viewBox="0 0 50 70"
							className="animate-disappear-arrow">
								<path
									d="M15,40 Q15,25 15,10"
									stroke="currentColor"
									strokeWidth="2"
									fill="none"
								/>
								<polyline
									points="10,15 15,10 20,15"
									stroke="currentColor"
									strokeWidth="2"
									fill="none"
								/>
							</svg> */}
							<ImPointUp size={30} />
						</div>
					</div>
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
					<div className="flex items-center justify-center md:hidden">
						<LangToggle />
						<ThemeSwitcher />
					</div>
				</div>
				{/* Mobile menu */}
				{mobileMenuOpen && (
					<div className="flex flex-col justify-start h-full md:hidden px-6 w-full">
						{links.map((link, index) => (
							<Link
								key={index}
								href={link.href}
								className="text-black py-2 dark:text-white flex items-center space-x-2">
								{link.icon}
								<span>{link.text}</span>
							</Link>
						))}
						<Dropdown name="social" />
						<Dropdown name="blog" />
						<Dropdown name="apps" />
					</div>
				)}
				<header className="hidden h-16 z-40 md:flex px-6 gap-4 w-full flex-row relative flex-nowrap items-center justify-between max-w-[1024px]">
					<div className="h-full flex flex-grow items-center justify-start">
						<Link
							href="/"
							className="text-black dark:text-white flex items-center">
							<Image
								src="/images/profile/pfp.webp"
								alt="profile picture"
								width={50}
								height={50}
								className="w-6 h-6 rounded-lg"
							/>
							<p className="font-bold text-inherit ml-1 md:ml-2">
								{t("title")}
							</p>
						</Link>
					</div>
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
						<Dropdown name="social" />
						<Dropdown name="blog" />
						<Dropdown name="apps" />
					</div>
					<div className="hidden h-full md:flex flex-grow space-x-1.5 items-center justify-end">
						<LangToggle />
						<ThemeSwitcher />
					</div>
				</header>
				<div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
			</nav>
		</>
	);
};

type DropdownProps = {
	items: {
		href: string;
		text: string;
		icon: JSX.Element;
		description: string;
	}[];
};

const Dropdown = ({ name }: { name: string }) => {
	const [isOpen, setIsOpen] = useState(false);
	const pathname = usePathname();
	const t = useTranslations("header");

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
				href: "https://connect4-taroj.vercel.app/",
				text: t("connect4.name"),
				icon: icons.connect4,
				description: t("connect4.description"),
			},
			{
				href: "https://typing-game-nextjs.vercel.app/",
				text: t("typing.name"),
				icon: icons.typing,
				description: t("typing.description"),
			},
			// {
			// 	href: "https://taroj.poyo.jp/apps/ncea",
			// 	text: "NCEA",
			// 	icon: icons.ncea,
			// 	description: t("ncea.description"),
			// },
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
		social: [
			{
				href: "https://twitter.com/taroj1205",
				text: "Twitter",
				icon: icons.twitter,
				description: "",
			},
			{
				href: "https://github.com/taroj1205",
				text: "GitHub",
				icon: icons.github,
				description: "",
			},
			{
				href: "https://instagram.com/taroj1205",
				text: "Instagram",
				icon: icons.instagram,
				description: "",
			},
			{
				href: "https://youtube.com/@taroj1205",
				text: "YouTube",
				icon: icons.youtube,
				description: "",
			},
			{
				href: "https://linkedin.com/in/taroj",
				text: "LinkedIn",
				icon: icons.linkedin,
				description: "",
			},
			{
				href: "https://facebook.com/taroj1205",
				text: "Facebook",
				icon: icons.facebook,
				description: "",
			},
		],
	};

	const items = nested[name] as DropdownProps["items"];

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
	}, [pathname]);

	return (
		<div className="relative flex items-center md:h-full w-full" ref={ref}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				data-active={pathname.startsWith(items[0].href.toString())}
				data-menu-open={isOpen}
				className="navbar-link select-none cursor-pointer w-full my-2 transition-all h-full text-black dark:text-white flex items-center space-x-2 justify-start">
				{name === "blog" ? (
					<>
						<FaBlog />
						<span>{t("blog")}</span>
					</>
				) : name === "apps" ? (
					<>
						<FaCubes />
						<span>{t("apps")}</span>
					</>
				) : (
					<>
						<SlSocialDropbox />
						<span>{t("social")}</span>
					</>
				)}
				<div
					className="navbar-dropdown before:bg-black after:bg-black dark:before:bg-white dark:after:bg-white"
					data-menu-open={isOpen}
				/>
			</button>
			{isOpen && (
				<div className="absolute w-fit z-10 top-10 md:top-14 left-0 min-w-[10rem] rounded-md shadow-lg bg-white dark:bg-zinc-800 ring-1 ring-black ring-opacity-5">
					<div className="py-1">
						{name === "apps" ||
							(name === "social" && (
								<div className="flex flex-row w-full space-x-2 items-center justify-center py-2 text-sm font-semibold text-red-500 dark:text-red-400 cursor-default select-none">
									{t("apps external")}
								</div>
							))}
						{items.map((item, index) => (
							<Link
								key={index}
								target={
									name === "apps" || name === "social" ? "_blank" : "_self"
								}
								rel="noopener"
								className="group flex flex-row w-full space-x-2 items-center pl-2.5 pr-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 hover:text-gray-900 hover:dark:bg-zinc-700"
								href={item.href}>
								{item.icon}
								<div className="whitespace-nowrap group-hover:text-black dark:group-hover:text-white ml-1">
									{item.text}
									{name === "apps" && <div className="mt-1 text-sm text-gray-500">{item.description}</div>}
								</div>
							</Link>
						))}
					</div>
				</div>
			)}
		</div>
	);
};
