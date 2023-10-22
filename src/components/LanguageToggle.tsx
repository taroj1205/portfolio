import React from "react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar } from "@nextui-org/react";
import { usePathname, useRouter } from "@/lib/next-intl";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

const LanguageToggle: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const currentLocale = useLocale();
    const params = useSearchParams();

    const handleLanguageChange = (locale: string) => {
        console.log(locale)
        console.log(`${pathname}?${params}`, { locale: locale });
        router.push(`${pathname}?${params}`, { locale: locale });
    };

    return (
        <Dropdown placement="bottom-end">
            <DropdownTrigger>
                {currentLocale === 'ja' ? (
                    <Avatar
                        as="button"
                        className="transition-transform h-6 w-6"
                        src="/svg/flag/jp.svg"
                    />
                ) : (
                    <Avatar
                        as="button"
                            className="transition-transform h-6 w-6"
                        src="/svg/flag/nz.svg"
                    />
                )}
            </DropdownTrigger>
            <DropdownMenu selectionMode="single" selectedKeys={[currentLocale]} aria-label="Language Options">
                <DropdownItem key="en" onClick={() => handleLanguageChange("en")}>
                    <div className="flex flex-row items-center">
                        <Image
                            className="transition-transform mr-1"
                            src="/svg/flag/nz.svg"
                            height={30}
                            width={30}
                            alt="New Zealand flag"
                        />
                        English
                    </div>
                </DropdownItem>
                <DropdownItem key="ja" onClick={() => handleLanguageChange("ja")} className="flex flex-row items-center">
                    <div className="flex flex-row items-center">
                        <Image
                            className="transition-transform mr-1"
                            src="/svg/flag/jp.svg"
                            height={30}
                            width={30}
                            alt="Japanese flag"
                        />
                        日本語
                    </div>
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );
};

export default LanguageToggle;