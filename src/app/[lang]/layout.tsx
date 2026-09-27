import * as stylex from "@stylexjs/stylex";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContactLinks } from "@/components/contact-links";
import { getTranslator, isLocale } from "@/lib/i18n";
import { shared } from "@/styles/shared";

import { color, media } from "../../styles/tokens.stylex";

import "../globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const generateStaticParams = () => [{ lang: "en" }, { lang: "ja" }];

export const generateMetadata = async ({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> => {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }
  const t = getTranslator(lang);
  return {
    alternates: { languages: { en: "/", ja: "/ja", "x-default": "/" } },
    description: t(
      "metadata.description",
      "Shintaro Jokagi studies Computer Science and IT Management at the University of Auckland, works as a software engineer at Hazumi, helps maintain Yamada UI and the Zen Browser website, and takes a lot of photos of the coast."
    ),
    title: "Shintaro Jokagi",
  };
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f5f1ea",
};

const styles = stylex.create({
  languages: {
    position: "absolute",
    top: "1rem",
    left: "clamp(1rem, 4vw, 3rem)",
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    minHeight: 44,
    fontSize: "0.9375rem",
  },
  languageLink: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 44,
  },
  body: {
    paddingBottom: {
      default: 0,
      [media.tablet]: "calc(85px + env(safe-area-inset-bottom))",
    },
  },
  footer: {
    borderTopColor: color.line,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    color: color.muted,
    fontSize: "0.9375rem",
    paddingBlock: "2rem 3rem",
  },
  skip: {
    backgroundColor: color.ink,
    borderRadius: 999,
    color: "#fff",
    left: "0.75rem",
    paddingBlock: "0.5rem",
    paddingInline: "1rem",
    position: "absolute",
    top: "0.75rem",
    translate: { default: "0 -200%", ":focus": "0" },
    zIndex: 100,
  },
});

const RootLayout = async ({ children, params }: LayoutProps<"/[lang]">) => {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }
  const t = getTranslator(lang);
  return (
    <html className={`${display.variable} ${body.variable}`} lang={lang}>
      <body {...stylex.props(styles.body)}>
        <a href="#main" {...stylex.props(styles.skip)}>
          {t("navigation.skip", "Skip to content")}
        </a>
        <nav aria-label="Language / 言語" {...stylex.props(styles.languages)}>
          <Link
            {...stylex.props(styles.languageLink)}
            href="/"
            scroll={false}
            hrefLang="en"
            lang="en"
            aria-current={lang === "en" ? "page" : undefined}
          >
            English
          </Link>
          <span aria-hidden="true"> / </span>
          <Link
            {...stylex.props(styles.languageLink)}
            href="/ja"
            scroll={false}
            hrefLang="ja"
            lang="ja"
            aria-current={lang === "ja" ? "page" : undefined}
          >
            日本語
          </Link>
        </nav>
        <ContactLinks locale={lang} />
        <main id="main">{children}</main>
        <footer {...stylex.props(shared.wrap, styles.footer)}>
          <p>© {new Date().getFullYear()} Shintaro Jokagi</p>
        </footer>
        <Analytics />
      </body>
    </html>
  );
};

export default RootLayout;
