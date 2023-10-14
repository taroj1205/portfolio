import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

export default async function middleware(request: NextRequest) {
    // Step 1: Use the incoming request
    const defaultLocale = request.headers.get('x-default-locale') || 'en';
    const pathname = request.nextUrl.pathname;
    const locale = pathname.split('/')[1];

    // Step 2: Create and call the next-intl middleware
    const handleI18nRouting = createIntlMiddleware({
        // A list of all locales that are supported
        locales: ['en', 'ja'],

        // If this locale is matched, pathnames work without a prefix (e.g. `/about`)
        defaultLocale: 'en',
        localePrefix: 'always',
    });

    const response = handleI18nRouting(request);

    // Step 3: Alter the response
    response.headers.set('x-default-locale', defaultLocale);

    console.log(locale);

    let currentLocale = 'en';
    if (locale && locale.includes('ja')) {
        currentLocale = 'ja';
    }

    response.headers.set('x-current-locale', currentLocale);

    return response;
}

export const config = {
    // Skip all paths that should not be internationalized. This example skips the
    // folders "api", "_next" and all files with an extension (e.g. favicon.ico)
    matcher: ['/((?!api|_next|.*\\..*).*)']
};
