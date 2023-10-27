'use client'
import React from "react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar } from "@nextui-org/react";
import { usePathname, useRouter } from "@/lib/next-intl";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import nzFlag from "@/../public/svg/flag/nz.svg";
import jpFlag from "@/../public/svg/flag/jp.svg";

const LanguageToggle: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const currentLocale = useLocale();
    const params = useSearchParams();

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null
    }

    // const handleLanguageChange = (locale: string) => {
    //     console.log(locale, params, params.toString().length, pathname);
    //     if (params.toString().length > 0) {
    //         router.push(`${pathname}${params ? `?${params.toString()}` : ''}`, { locale: locale });
    //         return;
    //     }
    //     router.push(`${pathname}`, { locale: locale });
    // };

    return (
        <Dropdown placement="bottom-end">
            <DropdownTrigger>
                {currentLocale === 'ja' ? (
                    <Avatar
                        as="button"
                        title="日本語"
                        className="transition-transform h-6 w-6"
                        src="/svg/flag/jp.svg"
                    />
                ) : (
                    <Avatar
                        as="button"
                        title="English"
                        className="transition-transform h-6 w-6"
                        src="/svg/flag/nz.svg"
                    />
                )}
            </DropdownTrigger>
            <DropdownMenu selectionMode="single" selectedKeys={[currentLocale]} aria-label="Language Options">
                <DropdownItem key="en" as={Link} href={`/en${pathname}`} lang="en" className="text-black dark:text-white">
                    <div className="flex flex-row items-center text-black dark:text-white">
                        <Image
                            className="transition-transform mr-1"
                            src={nzFlag}
                            height={30}
                            width={30}
                            alt="New Zealand flag"
                            priority
                        />
                        English
                    </div>
                </DropdownItem>
                <DropdownItem key="ja" as={Link} href={`/ja${pathname}`} lang="ja" className="flex flex-row items-center text-white">
                    <div className="flex flex-row items-center text-black dark:text-white">
                        <Image
                            className="transition-transform mr-1"
                            src={jpFlag}
                            height={30}
                            width={30}
                            alt="Japanese flag"
                            priority
                        />
                        日本語
                    </div>
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );
};

export default LanguageToggle;