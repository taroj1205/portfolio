"use client";
import { Link } from "@/lib/next-intl";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { FaArchive, FaBlog, FaListAlt } from "react-icons/fa";

type NestedType = {
	[key: string]: {
		href: string;
		text: string;
		icon: JSX.Element;
		description: string;
	}[];
};

const Dropdown = () => {
	const [isOpen, setIsOpen] = useState(false);
	const t = useTranslations("header");

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

	const icons = {
		list: <FaListAlt className="text-warning" size={30} />,
		archive: <FaArchive className="text-primary" size={30} />,
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
	};

	return (
		<div className="relative flex items-center md:h-full w-fit" ref={ref}>
			<div
				onClick={() => setIsOpen(!isOpen)}
				data-menu-open={isOpen}
				className="navbar-link cursor-pointer w-full transition-all h-full text-black dark:text-white flex items-center space-x-2 justify-start">
				<FaBlog />
				<span>{t("blog")}</span>
				<div
					className="navbar-dropdown before:bg-black after:bg-black dark:before:bg-white dark:after:bg-white"
					data-menu-open={isOpen}
				/>
			</div>
			{isOpen && (
				<div className="absolute w-fit z-10 top-8 left-0 min-w-[10rem] rounded-md shadow-lg bg-white dark:bg-zinc-800 ring-1 ring-black ring-opacity-5">
					<div className="py-1">
						{nested["blog"].map((item, index) => (
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

export default Dropdown;
