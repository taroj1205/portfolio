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
					className={`flex items-center justify-center w-fit p-1 mr-1 md:mr-0 rounded-md active:scale-95 duration-200 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50`}
					onClick={() => setIsOpen(!isOpen)}>
					{mounted ? (
						resolvedTheme === "dark" ? (
							<FiMoon className="text-indigo-500 w-6 h-6" />
						) : resolvedTheme === "light" ? (
							<FiSun className="text-yellow-500 w-6 h-6" />
						) : (
							<div className="text-gray-500 w-6 h-6">
								<svg
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg">
									<path
										d="M12 2C6.486 2 2 6.486 2 12C2 17.514 6.486 22 12 22C17.514 22 22 17.514 22 12C22 6.486 17.514 2 12 2ZM12 20C7.582 20 4 16.418 4 12C4 7.582 7.582 4 12 4C16.418 4 20 7.582 20 12C20 16.418 16.418 20 12 20Z"
										fill="currentColor"
									/>
									<path
										d="M12 6C10.897 6 10 6.897 10 8V12H14V8C14 6.897 13.103 6 12 6Z"
										fill="currentColor"
									/>
									<path
										d="M12 18C13.103 18 14 17.103 14 16V12H10V16C10 17.103 10.897 18 12 18Z"
										fill="currentColor"
									/>
								</svg>
							</div>
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
							type="button"
							className={`block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:dark:bg-[#0d101b] hover:text-gray-900 dark:hover:text-gray-100 w-full text-left ${
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
							className={`block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:dark:bg-[#0d101b] hover:text-gray-900 dark:hover:text-gray-100 w-full text-left ${
								theme === "dark" ? "bg-gray-100 dark:dark:bg-[#0d101b]" : ""
							}`}
							role="menuitem"
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
							className={`block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:dark:bg-[#0d101b] hover:text-gray-900 dark:hover:text-gray-100 w-full text-left ${
								theme === "system" ? "bg-gray-100 dark:dark:bg-[#0d101b]" : ""
							}`}
							role="menuitem"
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
