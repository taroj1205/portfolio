import { createSharedPathnamesNavigation } from "next-intl/navigation";

const locales = ['en', 'ja'] as const;
export const { Link, useRouter, usePathname, redirect } = createSharedPathnamesNavigation({ locales });