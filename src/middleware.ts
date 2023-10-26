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

        defaultLocale: 'en',
        localePrefix: 'always',
    });

    const response = handleI18nRouting(request);

    // Step 3: Alter the response
    response.headers.set('x-default-locale', defaultLocale);

    let currentLocale = 'en';
    if (locale && locale.includes('ja')) {
        currentLocale = 'ja';
    }

    response.headers.set('x-current-locale', currentLocale);
    // remove /locale from pathname
    const path = pathname.replace(`/${currentLocale}`, '');
    response.headers.set('x-slug', path)
    const pathWithoutFirstSlash = path.substring(1);
    response.headers.set('slug', pathWithoutFirstSlash);
    response.headers.set('x-full-path', request.nextUrl.href);

    console.log("User agent: ", request.headers.get('user-agent'));

    return response;
}

export const config = {
    // Skip all paths that should not be internationalized. This example skips the
    // folders "api", "_next" and all files with an extension (e.g. favicon.ico)
    matcher: ['/((?!api|_next|.*\\..*).*)']
};