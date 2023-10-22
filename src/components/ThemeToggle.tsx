'use client'
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar } from "@nextui-org/react";
import { FiMonitor, FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "next-themes";
import { FaSpinner } from "react-icons/fa";
import { useEffect, useState } from "react";

const ThemeToggle: React.FC = () => {
    const [mounted, setMounted] = useState(false);
    const { theme, resolvedTheme, setTheme } = useTheme();

    useEffect(() => {
        console.log(theme);
        setMounted(true);
    }, [theme]);

    return (
        <Dropdown placement="bottom-end">
            <DropdownTrigger>
                {mounted ? (
                    resolvedTheme === 'dark' ? (
                        <Avatar
                            as="button"
                            className="transition-transform bg-transparent h-6 w-6"
                            src="/svg/theme/moon.svg"
                        />
                    ) : (
                        <Avatar
                            as="button"
                            className="transition-transform bg-transparent h-6 w-6"
                            src="/svg/theme/sun.svg"
                        />
                    )
                ) : (
                    <FaSpinner className="animate-spin text-gray-500 w-6 h-6" />
                )}
            </DropdownTrigger>
            <DropdownMenu selectionMode="single" selectedKeys={theme ? [theme] : undefined} aria-label="Theme Options">
                <DropdownItem key="light" onClick={() => setTheme('light')}>
                    <div className="flex flex-row items-center">
                        <FiSun className="transition-transform mr-1" />
                        Light
                    </div>
                </DropdownItem>
                <DropdownItem key="dark" onClick={() => setTheme('dark')}>
                    <div className="flex flex-row items-center">
                        <FiMoon className="transition-transform mr-1" />
                        Dark
                    </div>
                </DropdownItem>
                <DropdownItem key="system" onClick={() => setTheme('system')}>
                    <div className="flex flex-row items-center">
                        <FiMonitor className="transition-transform mr-1" />
                        System
                    </div>
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );
};

export default ThemeToggle;