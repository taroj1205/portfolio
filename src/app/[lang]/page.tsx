import * as stylex from "@stylexjs/stylex";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Fragment } from "react";

import partlyCertificate from "@/assets/hackathon/partly-certificate.jpg";
import partlyTeam from "@/assets/hackathon/partly.jpg";
import sesaCertificate from "@/assets/hackathon/sesa-certificate.jpg";
import sesaTeam from "@/assets/hackathon/sesa.jpg";
import lionRock from "@/assets/photos/lion-rock.jpg";
import lowTide from "@/assets/photos/low-tide.jpg";
import muriwai from "@/assets/photos/muriwai-gannets.jpg";
import nagoya from "@/assets/photos/nagoya-castle.jpg";
import gull from "@/assets/photos/red-billed-gull.jpg";
import selfie from "@/assets/photos/sakura-selfie.webp";
import sandstone from "@/assets/photos/sandstone-cliff.jpg";
import skyTower from "@/assets/photos/sky-tower.jpg";
import sunsetBark from "@/assets/photos/sunset-bark.jpg";
import sunsetWide from "@/assets/photos/sunset-wide.jpg";
import westCoast from "@/assets/photos/west-coast-cliffs.jpg";
import windyRock from "@/assets/photos/windy-rock.jpg";
import noteShot from "@/assets/shots/note.jpg";
import reversiShot from "@/assets/shots/reversi.jpg";
import typingShot from "@/assets/shots/typing.jpg";
import { Clock } from "@/components/clock";
import { Arrow } from "@/components/icons";
import { JourneyMap } from "@/components/journey-map";
import { Lately } from "@/components/lately";
import { Photos } from "@/components/photos";
import type { Photo } from "@/components/photos";
import { Section } from "@/components/section";
import { Shot } from "@/components/shot";
import { Work } from "@/components/work";
import { WorkTimeline } from "@/components/work-timeline";
import { fmt } from "@/lib/format";
import { getGitHub } from "@/lib/github";
import { getTranslator, intlLocale, isLocale } from "@/lib/i18n";
import { socials } from "@/lib/socials";
import { shared } from "@/styles/shared";

import { color, ease, media, shadow } from "../../styles/tokens.stylex";

export const revalidate = 3600;

const arrive = stylex.keyframes({
  from: { opacity: 0, rotate: "-4deg", translate: "0 96px" },
});
const thunk = stylex.keyframes({
  from: { opacity: 0, scale: 1.8 },
});
const surface = stylex.keyframes({
  from: { rotate: "7deg", translate: "0 118%" },
});
const draw = stylex.keyframes({ from: { strokeDashoffset: 1 } });

const styles = stylex.create({
  about: {
    alignItems: "start",
    columnGap: "1.5rem",
    display: "grid",
    gridTemplateColumns: "repeat(12, 1fr)",
    paddingTop: "clamp(5rem, 11vw, 8.5rem)",
  },
  aboutPhoto: {
    gridColumn: { default: "1 / span 4", [media.tablet]: "1 / -1" },
    position: { default: "sticky", [media.tablet]: "static" },
    top: "6rem",
    marginBottom: { default: null, [media.tablet]: "3rem" },
    marginInline: { default: null, [media.tablet]: "auto" },
    maxWidth: { default: null, [media.tablet]: "20rem" },
  },
  aboutImage: {
    aspectRatio: "4 / 5",
    borderColor: "#fff",
    borderRadius: 20,
    borderStyle: "solid",
    borderWidth: 8,
    boxShadow: shadow.lift,
    objectFit: "cover",
    objectPosition: "50% 35%",
    rotate: {
      default: "-2.5deg",
      [stylex.when.ancestor(":hover")]: {
        default: null,
        [media.hover]: "0deg",
      },
    },
    transitionDuration: "500ms",
    transitionProperty: "rotate",
    transitionTimingFunction: ease.spring,
  },
  aboutText: {
    gridColumn: { default: "6 / -1", [media.tablet]: "1 / -1" },
    maxWidth: "38rem",
  },
  aboutTitle: {
    marginBottom: "1.75rem",
  },
  also: {
    color: color.muted,
    marginTop: "2.5rem",
  },
  award: {
    color: color.muted,
  },
  awardEvent: {
    fontSize: "clamp(1.375rem, 2.4vw, 1.75rem)",
    marginBottom: "0.6rem",
  },
  awardImage: {
    aspectRatio: "3 / 2",
    borderRadius: 20,
    objectFit: "cover",
  },
  awardPhotos: {
    position: "relative",
  },
  awardText: {
    maxWidth: "32rem",
    paddingTop: "1.75rem",
  },
  awards: {
    display: "grid",
    gap: { default: "1.5rem", [media.tablet]: "3rem" },
    gridTemplateColumns: { default: "1fr 1fr", [media.tablet]: "1fr" },
  },
  certificate: {
    borderColor: "#fff",
    borderRadius: 6,
    borderStyle: "solid",
    borderWidth: 5,
    bottom: "-1.25rem",
    boxShadow: shadow.lift,
    position: "absolute",
    right: "1.25rem",
    rotate: {
      default: "4deg",
      [stylex.when.ancestor(":hover")]: {
        default: null,
        [media.hover]: "0deg",
      },
    },
    scale: {
      default: null,
      [stylex.when.ancestor(":hover")]: {
        default: null,
        [media.hover]: 1.06,
      },
    },
    transitionDuration: "500ms",
    transitionProperty: "rotate, scale",
    transitionTimingFunction: ease.spring,
    width: "38%",
  },
  certificateFlip: {
    rotate: {
      default: "-3deg",
      [stylex.when.ancestor(":hover")]: {
        default: null,
        [media.hover]: "0deg",
      },
    },
  },
  contact: {
    paddingBlock: "clamp(6rem, 14vw, 11rem) clamp(4rem, 8vw, 6rem)",
  },
  postcard: {
    animationFillMode: "both",
    animationName: {
      default: null,
      [media.motion]: {
        default: null,
        "@supports (animation-timeline: view())": arrive,
      },
    },
    animationRange: "entry 0% cover 40%",
    animationTimeline: "view()",
    animationTimingFunction: ease.out,
    backgroundColor: color.surface,
    borderRadius: 20,
    boxShadow: `${shadow.lift}, 0 2px 6px rgb(18 16 14 / 0.05)`,
    display: "grid",
    gridTemplateColumns: { default: "1.1fr 1fr", [media.tablet]: "1fr" },
    overflow: "clip",
  },
  message: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    padding: "clamp(1.75rem, 4.5vw, 3.5rem)",
  },
  contactTitle: {
    fontSize: "clamp(3.5rem, 8vw, 6.5rem)",
    fontWeight: 750,
    letterSpacing: "-0.05em",
    lineHeight: 0.9,
  },
  japaneseContactTitle: {
    fontSize: "clamp(1.75rem, 5vw, 3.5rem)",
    lineHeight: 1.25,
    whiteSpace: "nowrap",
  },
  contactText: {
    color: color.muted,
    fontSize: "clamp(1.0625rem, 1.4vw, 1.2rem)",
    maxWidth: "24rem",
  },
  address: {
    borderColor: color.line,
    borderStyle: "solid",
    borderWidth: {
      default: "0 0 0 1px",
      [media.tablet]: "1px 0 0",
    },
    padding: "clamp(1.75rem, 4.5vw, 3.5rem)",
    position: "relative",
  },
  // Sized in whole perforations (10px), so the holes land on every edge.
  stamp: {
    filter: "drop-shadow(0 4px 10px rgb(18 16 14 / 0.15))",
    position: "absolute",
    right: "clamp(1.25rem, 3vw, 2rem)",
    rotate: "4deg",
    top: "clamp(1.25rem, 3vw, 2rem)",
  },
  stampPaper: {
    backgroundColor: color.surface,
    display: "block",
    height: 110,
    mask: "linear-gradient(#000 0 0) center / calc(100% - 10px) calc(100% - 10px) no-repeat, radial-gradient(circle, transparent 3.5px, #000 4px) -5px -5px / 10px 10px",
    padding: 8,
    width: 90,
  },
  stampImage: {
    height: "100%",
    objectFit: "cover",
  },
  postmark: {
    animationFillMode: "both",
    animationName: {
      default: null,
      [media.motion]: {
        default: null,
        "@supports (animation-timeline: view())": thunk,
      },
    },
    animationRange: "entry 80% cover 50%",
    animationTimeline: "view()",
    animationTimingFunction: ease.out,
    alignItems: "center",
    borderColor: "rgb(30 54 201 / 0.55)",
    borderRadius: "50%",
    borderStyle: "solid",
    borderWidth: 2,
    color: "rgb(30 54 201 / 0.7)",
    display: "grid",
    fontSize: "0.62rem",
    fontWeight: 700,
    height: 92,
    justifyItems: "center",
    letterSpacing: "0.12em",
    lineHeight: 1.3,
    mixBlendMode: "multiply",
    paddingBlock: "1rem",
    position: "absolute",
    right: "clamp(4.5rem, 9vw, 6rem)",
    rotate: "-14deg",
    textTransform: "uppercase",
    top: "clamp(2.75rem, 6vw, 3.75rem)",
    width: 92,
  },
  postmarkTime: {
    fontSize: "0.85rem",
    letterSpacing: "0.02em",
  },
  lines: {
    marginTop: "clamp(8rem, 12vw, 9.5rem)",
  },
  line: {
    alignItems: "baseline",
    borderBottomColor: color.line,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    color: {
      default: color.ink,
      [media.hover]: { default: null, ":hover": color.cobalt },
    },
    columnGap: "0.75rem",
    display: "grid",
    gridTemplateColumns: "1fr auto auto",
    paddingBlock: "0.85rem 0.6rem",
    textDecoration: "none",
    transitionDuration: "160ms, 150ms",
    transitionProperty: "transform, color",
  },
  lineName: {
    fontSize: "clamp(1.5rem, 2.6vw, 2rem)",
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
  },
  lineHandle: {
    color: color.muted,
    fontSize: "0.9rem",
  },
  fact: {
    borderBottomColor: color.line,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    display: "grid",
    gap: { default: "1rem", [media.tablet]: "0.15rem" },
    gridTemplateColumns: { default: "8rem 1fr", [media.tablet]: "1fr" },
    paddingBlock: "0.85rem",
  },
  factLabel: {
    color: color.muted,
  },
  facts: {
    borderTopColor: color.line,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    marginTop: "2.5rem",
  },
  hero: {
    paddingBlock: "clamp(6.5rem, 18svh, 11rem) clamp(2rem, 4vw, 3rem)",
  },
  heroTitle: {
    fontSize: "clamp(3.25rem, 11vw, 9.5rem)",
    fontWeight: 750,
    letterSpacing: "-0.05em",
    lineHeight: 0.92,
  },
  japaneseTitle: {
    fontSize: "clamp(2rem, 8.5vw, 7.5rem)",
    lineHeight: 1.25,
    letterSpacing: "-0.02em",
  },
  heroMask: {
    display: "inline-block",
    marginBlock: "-0.08em -0.2em",
    overflowX: "visible",
    overflowY: "clip",
    paddingBlock: "0.08em 0.2em",
    verticalAlign: "top",
  },
  heroWord: (delay: string) => ({
    animationDelay: delay,
    animationDuration: "1s",
    animationFillMode: "both",
    animationName: { default: null, [media.motion]: surface },
    animationTimingFunction: ease.out,
    display: "inline-block",
    isolation: "isolate",
    position: "relative",
    transformOrigin: "0 100%",
  }),
  marker: {
    animationDelay: "900ms",
    animationDuration: "900ms",
    animationFillMode: "both",
    animationName: { default: null, [media.motion]: draw },
    animationTimingFunction: ease.drawer,
    bottom: "-0.1em",
    color: color.tangerine,
    height: "0.2em",
    left: "-0.02em",
    overflow: "visible",
    position: "absolute",
    strokeDasharray: 1,
    width: "calc(100% - 0.2em)",
    zIndex: -1,
  },
  intro: {
    color: color.muted,
    fontSize: "clamp(1.125rem, 1.6vw, 1.3rem)",
    marginLeft: "auto",
    marginTop: "clamp(1.25rem, 2.5vw, 2rem)",
    maxWidth: "34rem",
  },
  paragraph: {
    marginTop: "1rem",
  },
  project: {
    color: color.ink,
    display: "block",
    textDecoration: "none",
  },
  projectName: {
    alignItems: "center",
    display: "flex",
    fontSize: "1.375rem",
    gap: "0.4rem",
    marginBottom: "0.6rem",
    marginTop: "1.25rem",
  },
  projectShot: {
    boxShadow: {
      default: null,
      [stylex.when.ancestor(":hover")]: {
        default: null,
        [media.hover]: shadow.lift,
      },
    },
    transform: {
      default: null,
      [stylex.when.ancestor(":hover")]: {
        default: null,
        [media.hover]: "translateY(-4px)",
      },
    },
  },
  projectText: {
    color: color.muted,
    fontSize: "1rem",
  },
  projects: {
    display: "grid",
    gap: "2.5rem 1.5rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
  },
  prize: {
    backgroundColor: color.tangerineSoft,
    borderRadius: 999,
    color: color.tangerineInk,
    display: "inline-block",
    fontSize: "0.78rem",
    fontWeight: 650,
    letterSpacing: "0.04em",
    marginBottom: "0.75rem",
    paddingBlock: "0.25rem",
    paddingInline: "0.7rem",
    textTransform: "uppercase",
  },
});

const Home = async ({ params }: PageProps<"/[lang]">) => {
  const { lang: locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const t = getTranslator(locale);
  const greeting = t("hero.greeting", "Kia ora,").split(" ");
  const heroWords = [
    ...greeting,
    ...t("hero.name", "I'm Shintaro.").split(" "),
  ];
  const band: Photo[] = [
    {
      caption: t(
        "photos.captions.gull",
        "A red-billed gull, with Rangitoto behind"
      ),
      src: gull,
    },
    {
      caption: t("photos.captions.nagoya", "Nagoya Castle, just before sunset"),
      src: nagoya,
    },
    {
      caption: t("photos.captions.muriwai", "The gannet colony at Muriwai"),
      src: muriwai,
    },
    {
      caption: t("photos.captions.lionRock", "Lion Rock at Piha"),
      src: lionRock,
    },
    {
      caption: t("photos.captions.skyTower", "Sky Tower on a clear afternoon"),
      src: skyTower,
    },
    {
      caption: t("photos.captions.sunsetWide", "Last light over the harbour"),
      src: sunsetWide,
    },
  ];

  const gallery: Photo[] = [
    {
      caption: t("photos.captions.westCoast", "Cliffs on the west coast"),
      src: westCoast,
    },
    {
      caption: t(
        "photos.captions.sandstone",
        "Sandstone cliff and a quiet beach"
      ),
      src: sandstone,
    },
    {
      caption: t("photos.captions.sunsetBark", "Sunset beside an old tree"),
      src: sunsetBark,
    },
    {
      caption: t("photos.captions.lowTide", "Low tide, west coast"),
      src: lowTide,
    },
    {
      caption: t("photos.captions.windyRock", "A very windy afternoon"),
      src: windyRock,
    },
  ];

  const facts = [
    [
      t("about.facts.studying.label", "Studying"),
      t(
        "about.facts.studying.value",
        "Computer Science and IT Management, University of Auckland"
      ),
    ],
    [
      t("about.facts.working.label", "Working"),
      t(
        "about.facts.working.value",
        "Software engineer at Hazumi, remote from Auckland"
      ),
    ],
    [
      t("about.facts.previous.label", "Before that"),
      t(
        "about.facts.previous.value",
        "Teaching kids to code in Minecraft over Zoom, 2024 to 2025"
      ),
    ],
    [
      t("about.facts.languages.label", "Speaks"),
      t("about.facts.languages.value", "English and Japanese"),
    ],
  ] as const;

  const sideProjects = [
    {
      href: "https://nextjs-note-rss.vercel.app/",
      name: t("projects.note.name", "A reading list for my brother"),
      shot: noteShot,
      text: t(
        "projects.note.description",
        "My younger brother reads a lot on note.com, so I made him a simple page that puts the articles he likes in one list."
      ),
    },
    {
      href: "https://typing-game-nextjs.vercel.app/",
      name: t("projects.typing.name", "Typing game"),
      shot: typingShot,
      text: t(
        "projects.typing.description",
        "A typing game for practising English words. One of the first things I ever built."
      ),
    },
    {
      href: "https://nextjs-reversi.vercel.app/",
      name: t("projects.reversi.name", "Reversi"),
      shot: reversiShot,
      text: t(
        "projects.reversi.description",
        "The board game, also called Othello, that you can play in the browser."
      ),
    },
  ];

  const awards = [
    {
      alt: t(
        "hackathons.partly.alt",
        "Our team on stage holding the Most Production Ready certificate"
      ),
      certificate: partlyCertificate,
      event: t("hackathons.partly.event", "Partly × WDCC, July 2025"),
      photo: partlyTeam,
      prize: t("hackathons.partly.prize", "Most production ready"),
      text: t(
        "hackathons.partly.description",
        "Four of us built a search tool for Partly, a car parts company. The award went to the project closest to something you could actually launch."
      ),
    },
    {
      alt: t(
        "hackathons.sesa.alt",
        "All the winning teams in front of the Most Overengineered slide"
      ),
      certificate: sesaCertificate,
      event: t("hackathons.sesa.event", "SESA × WDCC, August 2025"),
      photo: sesaTeam,
      prize: t("hackathons.sesa.prize", "Most overengineered"),
      text: t(
        "hackathons.sesa.description",
        "Our team, the Exception Handlers, made Nostalgia: an app for looking back on old memories through RSS feeds. We may have gone a little overboard."
      ),
    },
  ];
  const github = await getGitHub();
  const now = new Date(github.updatedAt);
  const updated = now.toLocaleString(intlLocale(locale), {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: "Pacific/Auckland",
  });

  return (
    <>
      <section {...stylex.props(shared.wrap, styles.hero)}>
        <h1
          {...stylex.props(
            styles.heroTitle,
            locale === "ja" && styles.japaneseTitle
          )}
        >
          {heroWords.map((word, i) => (
            <Fragment key={word}>
              {i > 0 && " "}
              {i === greeting.length && <br />}
              <span {...stylex.props(styles.heroMask)}>
                <span {...stylex.props(styles.heroWord(`${80 + i * 110}ms`))}>
                  {word}
                  {i === heroWords.length - 1 && (
                    <svg
                      aria-hidden="true"
                      preserveAspectRatio="none"
                      viewBox="0 0 300 20"
                      {...stylex.props(styles.marker)}
                    >
                      <path
                        d="M3 13C70 6 170 3 297 9C210 8 110 11 36 17"
                        fill="none"
                        pathLength={1}
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="0.06em"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  )}
                </span>
              </span>
            </Fragment>
          ))}
        </h1>
        <p {...stylex.props(styles.intro, shared.enter("520ms"))}>
          {t(
            "hero.intro",
            "I study Computer Science and IT Management at the University of Auckland, build software at Hazumi, and help look after a couple of open-source projects. When I'm away from a screen, I'm usually out taking photos, like these."
          )}
        </p>
      </section>

      <Photos locale={locale} eager={3} photos={band} variant="band" />

      <section {...stylex.props(shared.wrap, styles.about)} id="about">
        <figure
          data-reveal
          id="me"
          {...stylex.props(styles.aboutPhoto, stylex.defaultMarker())}
        >
          <Image
            alt={t("about.photoAlt", "Me under a cherry blossom tree")}
            placeholder="blur"
            sizes="(max-width: 800px) 20rem, 30vw"
            src={selfie}
            {...stylex.props(styles.aboutImage)}
          />
        </figure>
        <div data-reveal {...stylex.props(styles.aboutText)}>
          <h2 {...stylex.props(shared.title, styles.aboutTitle)}>
            {t("about.title", "A bit about me")}
          </h2>
          <p>
            {t(
              "about.background",
              "I was born in Tokyo in 2005. After the 2011 earthquake, my family moved to Ehime. I later lived in Auckland, spent a year at school in the Philippines, and came back to New Zealand for good in 2019."
            )}
          </p>
          <p {...stylex.props(styles.paragraph)}>
            {t(
              "about.interests",
              "I taught myself to code in 2022 by making small games, and I still mostly build things because someone I know needs them. Outside of screens it's kendama, juggling, table tennis, badminton and football, even after three knee injuries."
            )}
          </p>
          <dl {...stylex.props(styles.facts)}>
            {facts.map(([label, value]) => (
              <div key={label} {...stylex.props(styles.fact)}>
                <dt {...stylex.props(styles.factLabel)}>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Section
        id="work"
        intro={t(
          "work.intro",
          "Most of my coding happens on GitHub, where {total} of my pull requests have been merged across work, open source and my own projects. The numbers on these cards update themselves."
        ).replace("{total}", fmt(github.total, locale))}
        title={t("work.title", "Things I've worked on")}
      >
        <Work
          locale={locale}
          projects={github.projects}
          upstream={github.upstream}
        />
      </Section>

      <Section
        id="lately"
        intro={t(
          "activity.intro",
          "Recent activity from my GitHub, with the latest update time shown below."
        )}
        title={t("activity.title", "Still shipping, most weeks.")}
      >
        <Lately
          contributionTotal={github.contributionTotal}
          locale={locale}
          monthly={github.monthly}
          recent={github.recent}
          updated={updated}
        />
      </Section>

      <Section
        id="jobs"
        intro={t(
          "timeline.intro",
          "Everything since 2024, including the times I was juggling a few things at once alongside uni."
        )}
        title={t("timeline.title", "Jobs and volunteering")}
      >
        <WorkTimeline locale={locale} now={now} />
      </Section>

      <Section
        id="journey"
        intro={t(
          "journey.intro",
          "Japan and New Zealand, with a detour to the Philippines for school."
        )}
        title={t("journey.title", "Where I've lived")}
      >
        <JourneyMap locale={locale} />
      </Section>

      <Section
        id="projects"
        title={t("projects.title", "Things I made for myself, or for family")}
      >
        <ul {...stylex.props(styles.projects)}>
          {sideProjects.map((project) => (
            <li data-reveal key={project.name}>
              <a
                href={project.href}
                {...stylex.props(
                  styles.project,
                  shared.pressable,
                  stylex.defaultMarker()
                )}
              >
                <Shot
                  alt={`${project.name} — ${t("projects.screenshot", "Screenshot")}`}
                  href={project.href}
                  shot={project.shot}
                  xstyle={styles.projectShot}
                />
                <h3 {...stylex.props(styles.projectName)}>
                  {project.name} <Arrow />
                </h3>
              </a>
              <p {...stylex.props(styles.projectText)}>{project.text}</p>
            </li>
          ))}
        </ul>
        <p data-reveal {...stylex.props(styles.also)}>
          {t("projects.clipboard.before", "Also: a")}{" "}
          <a href="https://github.com/taroj1205/tauri-clipboard-manager">
            {t("projects.clipboard.name", "clipboard manager for Windows")}
          </a>{" "}
          {t(
            "projects.clipboard.after",
            "that can search through everything you've copied, including images."
          )}
        </p>
      </Section>

      <Section
        id="hackathons"
        intro={t(
          "hackathons.intro",
          "Both were weekend hackathons run by WDCC, the web development club at uni."
        )}
        title={t("hackathons.title", "Two hackathons, two awards")}
      >
        <div {...stylex.props(styles.awards)}>
          {awards.map((award, i) => (
            <figure
              data-reveal
              key={award.prize}
              {...stylex.props(stylex.defaultMarker())}
            >
              <div {...stylex.props(styles.awardPhotos)}>
                <div data-reveal="wipe" {...stylex.props(shared.unveil)}>
                  <Image
                    alt={award.alt}
                    placeholder="blur"
                    sizes="(max-width: 800px) 100vw, 50vw"
                    src={award.photo}
                    {...stylex.props(styles.awardImage)}
                  />
                </div>
                <Image
                  alt={`${award.prize} — ${t("hackathons.certificate", "certificate")}`}
                  placeholder="blur"
                  sizes="(max-width: 800px) 45vw, 20vw"
                  src={award.certificate}
                  {...stylex.props(
                    styles.certificate,
                    i % 2 === 1 && styles.certificateFlip
                  )}
                />
              </div>
              <figcaption {...stylex.props(styles.awardText)}>
                <span {...stylex.props(styles.prize)}>{award.prize}</span>
                <h3 {...stylex.props(styles.awardEvent)}>{award.event}</h3>
                <p {...stylex.props(styles.award)}>{award.text}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section
        id="photos"
        intro={t(
          "photos.intro",
          "Mostly around Auckland. Tap one to see it bigger."
        )}
        title={t("photos.title", "More photos")}
      >
        <Photos locale={locale} photos={gallery} variant="gallery" />
      </Section>

      <section {...stylex.props(shared.wrap, styles.contact)} id="contact">
        <article {...stylex.props(styles.postcard)}>
          <div {...stylex.props(styles.message)}>
            <h2
              {...stylex.props(
                styles.contactTitle,
                locale === "ja" && styles.japaneseContactTitle
              )}
            >
              {t("contact.title", "Say hi.")}
            </h2>
            <p {...stylex.props(styles.contactText)}>
              {t(
                "contact.description",
                "Send me a message on any of these, whether it's about a project, uni, or just to chat."
              )}
            </p>
          </div>
          <div {...stylex.props(styles.address)}>
            <span aria-hidden="true" {...stylex.props(styles.stamp)}>
              <span {...stylex.props(styles.stampPaper)}>
                <Image
                  alt=""
                  sizes="80px"
                  src={skyTower}
                  {...stylex.props(styles.stampImage)}
                />
              </span>
            </span>
            <p {...stylex.props(styles.postmark)}>
              <span>{t("places.auckland", "Auckland")}</span>
              <span {...stylex.props(styles.postmarkTime)}>
                <Clock locale={locale} />
              </span>
              <span>NZ</span>
            </p>
            <ul {...stylex.props(styles.lines)}>
              {socials.map(([label, href, handle]) => (
                <li key={label}>
                  <a
                    href={href}
                    {...stylex.props(
                      styles.line,
                      shared.pressable,
                      stylex.defaultMarker()
                    )}
                  >
                    <span {...stylex.props(shared.display, styles.lineName)}>
                      {label}
                    </span>
                    <span {...stylex.props(styles.lineHandle)}>@{handle}</span>
                    <Arrow />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </section>
    </>
  );
};

export default Home;
