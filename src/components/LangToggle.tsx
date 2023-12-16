"use client";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { FiMonitor, FiMoon, FiSun, FiCheck } from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";
import { useLocale } from "next-intl";
import Image from "next/image";
import { usePathname, useRouter } from "@/lib/next-intl";

export const LangToggle = () => {
	const [mounted, setMounted] = useState(false);
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

	useEffect(() => {
		setMounted(true);
	}, []);

	const [isOpen, setIsOpen] = useState(false);
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
    
    const changeLocale = (locale: string) => {
        router.push(pathname, {locale})
    }

	return (
		<div className="relative inline-block text-left" ref={ref}>
			<div>
				<button
					type="button"
					className={`flex items-center justify-center w-fit p-1 mr-1 md:mr-0 rounded-full active:scale-95 duration-200 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50`}
					onClick={() => setIsOpen(!isOpen)}>
					{mounted ? (
						locale === "ja" ? (
							<Image
								src="/svg/flag/jp.svg"
								alt="Theme"
								width={24}
								height={24}
								className="w-6 h-6"
							/>
						) : (
							<Image
								src="/svg/flag/nz.svg"
								alt="Theme"
								width={24}
								height={24}
								className="w-6 h-6"
							/>
						)
					) : (
						<FaSpinner className="animate-spin text-gray-500 w-6 h-6" />
					)}
				</button>
			</div>
			{isOpen && (
				<div className="popup origin-top-right absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-white dark:bg-gray-900 ring-1 ring-black ring-opacity-5 focus:outline-none">
					<div
						className="py-1"
						role="menu"
						aria-orientation="vertical"
						aria-labelledby="options-menu">
						<button
							className={`block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 w-full text-left ${
								locale === "ja" ? "bg-gray-100 dark:bg-gray-700" : ""
							}`}
							role="menuitem"
							onClick={() => {
								changeLocale("ja");
								setIsOpen(false);
							}}>
							<div className="flex flex-row gap-1 items-center">
								<Image
									src="/svg/flag/jp.svg"
									alt="Theme"
									width={24}
									height={24}
									className="w-6 h-6"
								/>
								日本語
								{locale === "ja" && (
									<div className="ml-auto">
										<FiCheck className="text-green-500 w-4 h-4" />
									</div>
								)}
							</div>
						</button>
						<button
							className={`block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 w-full text-left ${
								locale === "en" ? "bg-gray-100 dark:bg-gray-700" : ""
							}`}
							role="menuitem"
							onClick={() => {
								changeLocale("en");
								setIsOpen(false);
							}}>
							<div className="flex flex-row gap-1 items-center">
								<Image
									src="/svg/flag/nz.svg"
									alt="Theme"
									width={24}
									height={24}
									className="w-6 h-6"
								/>
								English
								{locale === "en" && (
									<div className="ml-auto">
										<FiCheck className="text-green-500 w-4 h-4" />
									</div>
								)}
							</div>
						</button>
					</div>
				</div>
			)}
		</div>
	);
};
