import * as stylex from "@stylexjs/stylex";
import Image from "next/image";
import { notFound } from "next/navigation";

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

const band: Photo[] = [
  { caption: "A red-billed gull, with Rangitoto behind", src: gull },
  { caption: "Nagoya Castle, just before sunset", src: nagoya },
  { caption: "The gannet colony at Muriwai", src: muriwai },
  { caption: "Lion Rock at Piha", src: lionRock },
  { caption: "Sky Tower on a clear afternoon", src: skyTower },
  { caption: "Last light over the harbour", src: sunsetWide },
];

const gallery: Photo[] = [
  { caption: "Cliffs on the west coast", src: westCoast },
  { caption: "Sandstone cliff and a quiet beach", src: sandstone },
  { caption: "Sunset beside an old tree", src: sunsetBark },
  { caption: "Low tide, west coast", src: lowTide },
  { caption: "A very windy afternoon", src: windyRock },
];

const facts = [
  ["Studying", "Computer Science and IT Management, University of Auckland"],
  ["Working", "Software engineer at Hazumi, remote from Auckland"],
  ["Before that", "Teaching kids to code in Minecraft over Zoom, 2024 to 2025"],
  ["Speaks", "English and Japanese"],
] as const;

const sideProjects = [
  {
    href: "https://nextjs-note-rss.vercel.app/",
    name: "A reading list for my brother",
    shot: noteShot,
    text: "My younger brother reads a lot on note.com, so I made him a simple page that puts the articles he likes in one list.",
  },
  {
    href: "https://typing-game-nextjs.vercel.app/",
    name: "Typing game",
    shot: typingShot,
    text: "A typing game for practising English words. One of the first things I ever built.",
  },
  {
    href: "https://nextjs-reversi.vercel.app/",
    name: "Reversi",
    shot: reversiShot,
    text: "The board game, also called Othello, that you can play in the browser.",
  },
];

const awards = [
  {
    alt: "Our team on stage holding the Most Production Ready certificate",
    certificate: partlyCertificate,
    event: "Partly × WDCC, July 2025",
    photo: partlyTeam,
    prize: "Most production ready",
    text: "Four of us built a search tool for Partly, a car parts company. The award went to the project closest to something you could actually launch.",
  },
  {
    alt: "All the winning teams in front of the Most Overengineered slide",
    certificate: sesaCertificate,
    event: "SESA × WDCC, August 2025",
    photo: sesaTeam,
    prize: "Most overengineered",
    text: "Our team, the Exception Handlers, made Nostalgia: an app for looking back on old memories through RSS feeds. We may have gone a little overboard.",
  },
];

const arrive = stylex.keyframes({
  from: { opacity: 0, rotate: "-4deg", translate: "0 96px" },
});
const thunk = stylex.keyframes({
  from: { opacity: 0, scale: 1.8 },
});

const recede = stylex.keyframes({
  to: { filter: "blur(6px)", opacity: 0, scale: 0.97, translate: "0 -4%" },
});

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
    animationFillMode: "both",
    animationName: {
      default: null,
      [media.motion]: {
        default: null,
        "@supports (animation-timeline: view())": recede,
      },
    },
    animationRange: "exit 30% exit 100%",
    animationTimeline: "view()",
    animationTimingFunction: "linear",
    transformOrigin: "0 100%",
    paddingBlock: "clamp(4rem, 9vw, 7rem) clamp(2rem, 4vw, 3rem)",
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
  heroWord: {
    display: "inline-block",
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
          <span {...stylex.props(styles.heroWord, shared.enter("60ms"))}>
            {t("Kia ora,")}
          </span>{" "}
          <span {...stylex.props(styles.heroWord, shared.enter("150ms"))}>
            {t("I'm Shintaro.")}
          </span>
        </h1>
        <p {...stylex.props(styles.intro, shared.enter("240ms"))}>
          {t(
            "I study Computer Science and IT Management at the University of Auckland, build software at Hazumi, and help look after a couple of open-source projects. When I'm away from a screen, I'm usually out taking photos, like these."
          )}
        </p>
      </section>

      <Photos
        locale={locale}
        eager={3}
        photos={band.map((photo) => ({ ...photo, caption: t(photo.caption) }))}
        variant="band"
      />

      <section {...stylex.props(shared.wrap, styles.about)} id="about">
        <figure
          id="me"
          {...stylex.props(
            styles.aboutPhoto,
            shared.reveal,
            stylex.defaultMarker()
          )}
        >
          <Image
            alt={t("Me under a cherry blossom tree")}
            placeholder="blur"
            sizes="(max-width: 800px) 20rem, 30vw"
            src={selfie}
            {...stylex.props(styles.aboutImage)}
          />
        </figure>
        <div {...stylex.props(styles.aboutText, shared.reveal)}>
          <h2 {...stylex.props(shared.title, styles.aboutTitle)}>
            {t("A bit about me")}
          </h2>
          <p>
            {t(
              "I was born in Tokyo in 2005. After the 2011 earthquake, my family moved to Ehime. I later lived in Auckland, spent a year at school in the Philippines, and came back to New Zealand for good in 2019."
            )}
          </p>
          <p {...stylex.props(styles.paragraph)}>
            {t(
              "I taught myself to code in 2022 by making small games, and I still mostly build things because someone I know needs them. Outside of screens it's kendama, juggling, table tennis, badminton and football, even after three knee injuries."
            )}
          </p>
          <dl {...stylex.props(styles.facts)}>
            {facts.map(([label, value]) => (
              <div key={label} {...stylex.props(styles.fact)}>
                <dt {...stylex.props(styles.factLabel)}>{t(label)}</dt>
                <dd>{t(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Section
        id="work"
        intro={
          locale === "ja"
            ? `仕事や個人開発、OSSで出したPRは、これまでに${fmt(github.total, locale)}件マージされました。数字はGitHubから自動で更新しています。`
            : `Most of my coding happens on GitHub, where ${fmt(github.total, locale)} of my pull requests have been merged across work, open source and my own projects. The numbers on these cards update themselves.`
        }
        title={t("Things I've worked on")}
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
          "Recent activity from my GitHub, with the latest update time shown below."
        )}
        title={t("Still shipping, most weeks.")}
      >
        <Lately
          locale={locale}
          monthly={github.monthly}
          recent={github.recent}
          updated={updated}
        />
      </Section>

      <Section
        id="jobs"
        intro={t(
          "Everything since 2024, including the times I was juggling a few things at once alongside uni."
        )}
        title={t("Jobs and volunteering")}
      >
        <WorkTimeline locale={locale} now={now} />
      </Section>

      <Section
        id="journey"
        intro={t(
          "Japan and New Zealand, with a detour to the Philippines for school."
        )}
        title={t("Where I've lived")}
      >
        <JourneyMap locale={locale} />
      </Section>

      <Section
        id="projects"
        title={t("Things I made for myself, or for family")}
      >
        <ul {...stylex.props(styles.projects)}>
          {sideProjects.map((project) => (
            <li key={project.name} {...stylex.props(shared.reveal)}>
              <a
                href={project.href}
                {...stylex.props(
                  styles.project,
                  shared.pressable,
                  stylex.defaultMarker()
                )}
              >
                <Shot
                  alt={`${t(project.name)} — ${t("Screenshot")}`}
                  href={project.href}
                  shot={project.shot}
                  xstyle={styles.projectShot}
                />
                <h3 {...stylex.props(styles.projectName)}>
                  {t(project.name)} <Arrow />
                </h3>
              </a>
              <p {...stylex.props(styles.projectText)}>{t(project.text)}</p>
            </li>
          ))}
        </ul>
        <p {...stylex.props(styles.also, shared.reveal)}>
          {t("Also: a")}{" "}
          <a href="https://github.com/taroj1205/tauri-clipboard-manager">
            {t("clipboard manager for Windows")}
          </a>{" "}
          {t(
            "that can search through everything you've copied, including images."
          )}
        </p>
      </Section>

      <Section
        id="hackathons"
        intro={t(
          "Both were weekend hackathons run by WDCC, the web development club at uni."
        )}
        title={t("Two hackathons, two awards")}
      >
        <div {...stylex.props(styles.awards)}>
          {awards.map((award, i) => (
            <figure
              key={award.prize}
              {...stylex.props(shared.reveal, stylex.defaultMarker())}
            >
              <div {...stylex.props(styles.awardPhotos)}>
                <Image
                  alt={t(award.alt)}
                  placeholder="blur"
                  sizes="(max-width: 800px) 100vw, 50vw"
                  src={award.photo}
                  {...stylex.props(styles.awardImage, shared.unveil)}
                />
                <Image
                  alt={`${t(award.prize)} — ${t("certificate")}`}
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
                <span {...stylex.props(styles.prize)}>{t(award.prize)}</span>
                <h3 {...stylex.props(styles.awardEvent)}>{t(award.event)}</h3>
                <p {...stylex.props(styles.award)}>{t(award.text)}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section
        id="photos"
        intro={t("Mostly around Auckland. Tap one to see it bigger.")}
        title={t("More photos")}
      >
        <Photos
          locale={locale}
          photos={gallery.map((photo) => ({
            ...photo,
            caption: t(photo.caption),
          }))}
          variant="gallery"
        />
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
              {t("Say hi.")}
            </h2>
            <p {...stylex.props(styles.contactText)}>
              {t(
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
              <span>{t("Auckland")}</span>
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
