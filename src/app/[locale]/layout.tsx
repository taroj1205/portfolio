import './globals.css'
import type { Metadata } from 'next'
import { ThemeProvider } from './theme-provider'
import Footer from '@/components/Footer'
import { switchThemeDuration } from '@/constants/switch-theme-duration'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import Header from '@/components/Header'
import { Analytics } from '@vercel/analytics/react';
import Script from 'next/script'
import metadata from '../metadata.json';
import { headers } from 'next/headers'

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'ja' }];
}

export async function generateMetadata({ params }: { params: { locale: string; } }): Promise<Metadata | null> {
  const locale = params.locale;
  console.log("params", params)
  const headerList = headers();
  let slugValue = headerList.get('slug') as string;
  if (!slugValue) {
    slugValue = 'home';
  }
  let slugMap: { [key: string]: string } = { null: 'home', 'posts/categories': 'categories', 'posts/archives': 'categories' };
  let slug = slugMap[slugValue] || slugValue;

  let pageMetadata = (metadata as Record<string, any>)[slug];

  if (slugValue.startsWith('posts/categories')) {
    slug = 'category';
    pageMetadata = (metadata as Record<string, any>)[slug];
    const category = slugValue.split('/')[2];
    console.log("Category:", category)
    pageMetadata.title[locale] = pageMetadata.title[locale].replace('#{category}', (' #' + category));
  }
  else if (slugValue.startsWith('posts/archives')) {
    slug = 'category';
    pageMetadata = (metadata as Record<string, any>)[slug];
    console.log("Category:", 'archives')
    pageMetadata.title[locale] = pageMetadata.title[locale].replace('#{category}', '');
  }
  else if (slugValue.startsWith('posts')) return null;
  else if (!pageMetadata) {
    slug = '404';
    pageMetadata = (metadata as Record<string, any>)[slug];
  }

  console.log("Slug:", slug);

  return {
    metadataBase: new URL(pageMetadata.metadataBase),
    title: pageMetadata.title[locale],
    description: pageMetadata.description[locale],
    icons: pageMetadata.icons,
    openGraph: {
      images: pageMetadata.openGraph.images.map((image: { url: string, alt: { [key: string]: string } }) => ({
        url: image.url,
        alt: image.alt[locale],
      })),
    },
    twitter: {
      card: pageMetadata.twitter.card,
      title: pageMetadata.twitter.title[locale],
      description: pageMetadata.twitter.description[locale],
      site: pageMetadata.twitter.site,
      creator: pageMetadata.twitter.creator,
      images: pageMetadata.twitter.images.map((image: { url: string, alt: { [key: string]: string } }) => ({
        url: image.url,
        alt: image.alt[locale],
      })),
    },
    viewport: pageMetadata.viewport,
  }
};

export default async function RootLayout({
  children, params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  let messages;
  try {
    messages = (await import(`../../locales/${locale}/translation.json`)).default;
  } catch (error) {
    notFound();
  }

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <html lang={locale} className='bg-white dark:bg-gray-900'>
      <body
        className={`bg-white dark:bg-gray-900 ${switchThemeDuration}`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Header />
            <main className='content relative pt-8 pb-6 bg-white dark:bg-gray-900'>{children}</main>
            <Footer />
            <Script async src="https://analytics.eu.umami.is/script.js" data-website-id="3531a168-c010-41c6-b82f-34f9f492f84a"></Script>
            <Analytics />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}