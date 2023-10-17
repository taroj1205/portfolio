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

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'ja' }];
}

export const metadata: Metadata = {
  metadataBase: new URL('https://taroj.vercel.app'),
  title: 'taroj.vercel.app',
  description: 'A website for Shintaro Jokagi',
  icons:
  {
    icon: '/favicon.ico',
  },
  openGraph: {
    images: [
      {
        url:
          '/images/thumbnail/thumbnail.png',
        alt: 'Shintaro Jokagi Website Thumbnail',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'taroj.poyo.jp',
    description: 'A website for Shintaro Jokagi',
    site: '@taroj1205',
    creator: '@taroj1205',
    images: [
      {
        url:
          '/images/thumbnail/thumbnail.png',
        alt: 'Shintaro Jokagi Website Thumbnail',
      }
    ]
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
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
        className={` bg-white dark:bg-gray-900 ${switchThemeDuration}`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Header />
            <main className='content relative pt-24 pb-6 bg-white dark:bg-gray-900'>{children}</main>
            <Footer />
            <Script async src="https://analytics.eu.umami.is/script.js" data-website-id="3531a168-c010-41c6-b82f-34f9f492f84a"></Script>
            <Analytics />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}