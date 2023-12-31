import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "./theme-provider";
import Footer from "@/components/Footer";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import metadata from "../metadata.json";
import { headers } from "next/headers";
import NextHeader from "@/components/NextHeader";
import ScrollToTopButton from "@/components/ScrollTop";
import Header from "@/components/Header";
import { Navbar } from "@/components/Navbar";

export async function generateMetadata({
	params,
}: {
	params: { locale: string };
}): Promise<Metadata | null> {
	const locale = params.locale;
	console.log("params", params);

	const headerList = headers();
	let slugValue = headerList.get("slug") || "home";

	const slugMap: { [key: string]: string } = {
		null: "home",
		"posts/categories": "categories",
		"posts/archives": "categories",
	};

	let slug = slugMap[slugValue] || slugValue;
	let pageMetadata = (metadata as Record<string, any>)[slug];

	if (slugValue.startsWith("posts/categories")) {
		slug = "category";
		pageMetadata = (metadata as Record<string, any>)[slug];
		const category = slugValue.split("/")[2];
		console.log("Category:", category);
		pageMetadata.title[locale] = pageMetadata.title[locale].replace(
			"#{category}",
			` #${category}`
		);
	} else if (slugValue.startsWith("posts/archives")) {
		slug = "category";
		pageMetadata = (metadata as Record<string, any>)[slug];
		console.log("Category:", "archives");
		pageMetadata.title[locale] = pageMetadata.title[locale].replace(
			"#{category}",
			""
		);
	} else if (slugValue.startsWith("posts")) {
		return null;
	} else if (
		slugValue.startsWith("apps/search") ||
		slugValue.startsWith("apps/generator/image")
	) {
		if (slugValue.startsWith("apps/search")) {
			slug = slugValue.split("/")[1];
		} else {
			slug = slugValue.split("/")[2];
		}
		pageMetadata = (metadata as Record<string, any>)[slug];
		console.log("Category:", slug);
	} else if (!pageMetadata) {
		slug = "404";
		pageMetadata = (metadata as Record<string, any>)[slug];
	}

	return {
		metadataBase: new URL(pageMetadata.metadataBase),
		title: pageMetadata.title[locale],
		description: pageMetadata.description[locale],
		icons: pageMetadata.icons,
		openGraph: {
			images: pageMetadata.openGraph.images.map(
				(image: { url: string; alt: { [key: string]: string } }) => ({
					url: image.url,
					alt: image.alt[locale],
				})
			),
		},
		twitter: {
			card: pageMetadata.twitter.card,
			title: pageMetadata.twitter.title[locale],
			description: pageMetadata.twitter.description[locale],
			site: pageMetadata.twitter.site,
			creator: pageMetadata.twitter.creator,
			images: pageMetadata.twitter.images.map(
				(image: { url: string; alt: { [key: string]: string } }) => ({
					url: image.url,
					alt: image.alt[locale],
				})
			),
		},
		viewport: pageMetadata.viewport,
	};
}

export default async function RootLayout({
	children,
	params: { locale },
}: {
	children: React.ReactNode;
	params: { locale: string };
}) {
	let messages;
	try {
		messages = (await import(`../../locales/${locale}/translation.json`))
			.default;
	} catch (error) {
		notFound();
	}

	return (
		<html lang={locale} className="dark" style={{ colorScheme: "dark" }}>
			<body className={`bg-white dark:bg-gray-900 scroll-smooth`}>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange>
					<NextIntlClientProvider locale={locale} messages={messages}>
						<div className="min-h-[100svh] flex flex-col bg-background/40">
							<Navbar />
							<main className="content relative pt-8 pb-6">{children}</main>
							<ScrollToTopButton />
							<Footer />
						</div>
						<Analytics />
						<Script
							async
							src="https://analytics.eu.umami.is/script.js"
							data-website-id="3531a168-c010-41c6-b82f-34f9f492f84a"></Script>
						<Script
							async
							src="https://www.googletagmanager.com/gtag/js?id=G-HF6EPWF0XB"></Script>
						<Script id="google-analytics" strategy="lazyOnload">
							{`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-HF6EPWF0XB');
              `}
						</Script>
						<Script id="ms_clarity" strategy="lazyOnload">
							{`
                (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "jf03ut1bzl");
              `}
						</Script>
						<Analytics />
					</NextIntlClientProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
