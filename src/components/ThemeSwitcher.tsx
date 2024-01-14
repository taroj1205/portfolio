"use client";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { FiMonitor, FiMoon, FiSun, FiCheck } from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";

export const ThemeSwitcher = () => {
	const [mounted, setMounted] = useState(false);
	const { theme, resolvedTheme, setTheme } = useTheme();

	useEffect(() => {
		console.log(theme);
		setMounted(true);
	}, [theme]);

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

	return (
		<div className="relative inline-block text-left" ref={ref}>
			<div>
				<button
					type="button"
					title="Switch theme"
					className={`flex items-center justify-center w-fit p-1 mr-1 md:mr-0 rounded-md active:scale-95 duration-200 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50`}
					onClick={() => setIsOpen(!isOpen)}>
					<FiMoon className="text-indigo-500 w-6 h-6 hidden dark:block" />
					<FiSun className="text-yellow-500 w-6 h-6 dark:hidden" />
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
							type="button"
							title="Switch to light theme"
							className={`block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:dark:bg-[#0d101b] transition-colors duration-200 ease-in-out hover:text-gray-900 dark:hover:text-gray-100 w-full text-left ${
								theme === "light" ? "bg-gray-100 dark:dark:bg-[#0d101b]" : ""
							}`}
							role="menuitem"
							onClick={() => {
								setTheme("light");
								setIsOpen(false);
							}}>
							<div className="flex flex-row gap-1 items-center">
								<FiSun />
								Light
								{theme === "light" && (
									<div className="ml-auto">
										<FiCheck className="text-green-500 w-4 h-4" />
									</div>
								)}
							</div>
						</button>
						<button
							className={`block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:dark:bg-[#0d101b] transition-colors duration-200 ease-in-out hover:text-gray-900 dark:hover:text-gray-100 w-full text-left ${
								theme === "dark" ? "bg-gray-100 dark:dark:bg-[#0d101b]" : ""
							}`}
							role="menuitem"
							title="Switch to dark theme"
							onClick={() => {
								setTheme("dark");
								setIsOpen(false);
							}}>
							<div className="flex flex-row gap-1 items-center">
								<FiMoon />
								Dark
								{theme === "dark" && (
									<div className="ml-auto">
										<FiCheck className="text-green-500 w-4 h-4" />
									</div>
								)}
							</div>
						</button>
						<button
							className={`block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:dark:bg-[#0d101b] transition-colors duration-200 ease-in-out hover:text-gray-900 dark:hover:text-gray-100 w-full text-left ${
								theme === "system" ? "bg-gray-100 dark:dark:bg-[#0d101b]" : ""
							}`}
							role="menuitem"
							title="Switch to system theme"
							onClick={() => {
								setTheme("system");
								setIsOpen(false);
							}}>
							<div className="flex flex-row gap-1 items-center">
								<FiMonitor />
								System
								{theme === "system" && (
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
