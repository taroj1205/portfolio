"use client";
import { Link as IntlLink, usePathname } from "@/lib/next-intl";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useRef, useState } from "react";
import { FaCircle } from "react-icons/fa";
import { Inter } from "next/font/google";
import Image from "next/image";
import {
	FaFacebook,
	FaGithub,
	FaInstagram,
	FaLinkedin,
	FaTwitter,
	FaYoutube,
} from "react-icons/fa";

const inter = Inter({ subsets: ["latin"] });

type NestedType = {
	[key: string]: {
		href: string;
		text: string;
		icon: JSX.Element;
		description: string;
	}[];
};

const Footer = () => {
	const t = useTranslations("footer");
	const locale = useLocale();

	const pathname = usePathname();

	const footerLinks = [
		{ href: "/", text: t("home") },
		{ href: "/about", text: t("about") },
		{ href: "/posts", text: t("blog") },
		{ href: "/apps", text: t("apps") },
	];

	return (
		<footer
			className={`${inter.className} w-full mt-auto font-sans backdrop-blur-lg backdrop-saturate-150 bg-background/70 border-t border-divider`}>
			<div className="mx-auto p-4 max-w-4xl flex flex-col md:flex-row justify-start md:justify-between items-start md:items-center w-full">
				<ul className="flex flex-row text-sm">
					<li>
						<Link
							href={`/${locale === "en" ? "ja" : "en"}${pathname}`}
							className="group py-1 px-2 flex flex-row space-x-1 text-sm text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-300 ease-in-out">
							{locale === "en" ? (
								<Image
									src="/svg/flag/jp.svg"
									alt="Theme"
									width={24}
									height={24}
									className="w-5 h-5 brightness-75 group-hover:brightness-100 transition-all duration-300 ease-in-out"
								/>
							) : (
								<Image
									src="/svg/flag/nz.svg"
									alt="Theme"
									width={24}
									height={24}
									className="w-5 h-5 brightness-75 group-hover:brightness-100 transition-all duration-300 ease-in-out"
								/>
							)}
							<p>{locale === "en" ? "日本語" : "English"}</p>
						</Link>
					</li>
					{footerLinks.map((link, index) => (
						<React.Fragment key={index}>
							<li className="flex items-center justify-center">
								{index < footerLinks.length && (
									<FaCircle className="self-center text-[0.2rem] text-gray-600 dark:text-gray-400" />
								)}
								<IntlLink
									href={link.href}
									className="px-2 py-1 text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-300">
									{link.text}
								</IntlLink>
							</li>
						</React.Fragment>
					))}
				</ul>
				<ul className="flex flex-row text-sm">
					<li className="py-1 flex items-center justify-center">
						<Link
							href="https://github.com/taroj1205"
							target="_blank"
							rel="noopener"
							className="px-2 py-1 space-x-1 flex flex-row items-center justify-center text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-300">
							<FaGithub />
							<p>GitHub</p>
						</Link>
						<FaCircle className="self-center text-[0.4rem] text-gray-600 dark:text-gray-400" />
						<Dropdown />
					</li>
				</ul>
			</div>
		</footer>
	);
};

type DropdownProps = {
	items: {
		href: string;
		text: string;
		icon: JSX.Element;
	}[];
};

const icons = {
	twitter: <FaTwitter className="text-blue-400" size={30} />,
	facebook: <FaFacebook className="text-primary" size={30} />,
	youtube: <FaYoutube className="text-red-600" size={30} />,
	github: <FaGithub className="text-gray-900 dark:text-white" size={30} />,
	linkedin: (
		<FaLinkedin className="text-blue-700 dark:text-blue-500" size={30} />
	),
	instagram: <FaInstagram className="text-pink-600" size={30} />,
};

const Dropdown = () => {
	const [isOpen, setIsOpen] = useState(false);
	const pathname = usePathname();
	const t = useTranslations("footer");

	const nested: NestedType = {
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

	const items = nested["social"] as DropdownProps["items"];

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
		<div className="relative flex items-center md:h-full w-full ml-2" ref={ref}>
			<div
				onClick={() => setIsOpen(!isOpen)}
				data-active={pathname.startsWith(items[0].href.toString())}
				data-menu-open={isOpen}
				className="select-none cursor-pointer w-full transition-all h-full text-gray-600 dark:text-gray-400 flex items-center space-x-2 justify-start">
				<span>{t("name")}</span>
			</div>
			{isOpen && (
				<div className="absolute w-fit z-10 bottom-7 right-0 min-w-[10rem] rounded-md shadow-lg bg-white dark:bg-zinc-800 ring-1 ring-black ring-opacity-5">
					<div className="py-1">
						{items.map((item, index) => (
							<Link
								key={index}
								target="_blank"
								rel="noopener"
								className="flex flex-row w-full space-x-2 items-center pl-2.5 pr-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 hover:text-gray-900 hover:dark:bg-zinc-700"
								href={item.href}>
								{item.icon}
								<div className="whitespace-nowrap ml-1">{item.text}</div>
							</Link>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default Footer;
