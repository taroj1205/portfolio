import * as stylex from "@stylexjs/stylex";
import Image from "next/image";

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
import { socials } from "@/lib/socials";
import { shared } from "@/styles/shared";

import { color, ease, media, shadow } from "../styles/tokens.stylex";

// ISR: rebuild this page in the background at most once an hour, so the
// GitHub numbers stay fresh without a redeploy.
export const revalidate = 3600;

const band: Photo[] = [
  { caption: "A red-billed gull, with Rangitoto behind", src: gull },
  { caption: "Nagoya Castle, just before sunset", src: nagoya },
  { caption: "The gannet colony at Muriwai", src: muriwai },
  { caption: "Lion Rock at Piha", src: lionRock },
  { caption: "Sky Tower on a clear afternoon", src: skyTower },
  { caption: "Last light over the harbour", src: sunsetWide },
];

// Ordered so the justified rows break evenly from phone to desktop.
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

// The hero softens and drifts back as it scrolls away.
const recede = stylex.keyframes({
  to: { filter: "blur(6px)", opacity: 0, scale: 0.97, translate: "0 -4%" },
});

// The last few hundred pixels of the page pour colour into the links.
const pour = stylex.keyframes({
  from: { backgroundSize: "0% 100%, 100% 100%" },
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
    marginBottom: { default: null, [media.tablet]: "3rem" },
    marginInline: { default: null, [media.tablet]: "auto" },
    maxWidth: { default: null, [media.tablet]: "20rem" },
  },
  // Stuck on slightly crooked; it straightens when you reach for it.
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
  // Pinned over the corner of the team photo, and straightened on hover.
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
    paddingBlock: "clamp(5rem, 11vw, 8.5rem)",
  },
  contactText: {
    color: color.muted,
    marginTop: "1rem",
    maxWidth: "30rem",
  },
  social: {
    animationFillMode: "both",
    animationName: {
      default: null,
      "@supports (animation-timeline: scroll())": pour,
    },
    animationRange: "calc(100% - 320px) 100%",
    animationTimeline: "scroll()",
    animationTimingFunction: "linear",
    backgroundClip: "text",
    backgroundImage: `linear-gradient(90deg, ${color.cobalt}, ${color.tangerine}), linear-gradient(${color.ink}, ${color.ink})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "100% 100%, 100% 100%",
    color: "transparent",
    display: "inline-block",
    fontSize: "clamp(1.75rem, 7vw, 5.5rem)",
    letterSpacing: "-0.045em",
    lineHeight: 1.05,
    overflowWrap: "anywhere",
    textDecorationThickness: {
      default: "2px",
      [media.hover]: { default: null, ":hover": "5px" },
    },
    textDecorationColor: color.cobalt,
    transitionDuration: "200ms",
    transitionProperty: "text-decoration-thickness",
  },
  socials: {
    columnGap: "0.4em",
    display: "flex",
    flexWrap: "wrap",
    marginTop: "clamp(1.5rem, 4vw, 2.5rem)",
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
    paddingBlock: "clamp(2.5rem, 7vw, 5.5rem) clamp(2rem, 4vw, 3rem)",
  },
  heroTitle: {
    fontSize: "clamp(3.25rem, 11vw, 9.5rem)",
    fontWeight: 750,
    letterSpacing: "-0.05em",
    lineHeight: 0.92,
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

const Home = async () => {
  const github = await getGitHub();
  const now = new Date(github.updatedAt);
  const updated = now.toLocaleString("en-NZ", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: "Pacific/Auckland",
  });

  return (
    <>
      <section {...stylex.props(shared.wrap, styles.hero)}>
        <h1 {...stylex.props(styles.heroTitle)}>
          <span {...stylex.props(styles.heroWord, shared.enter("60ms"))}>
            Kia ora,
          </span>{" "}
          <span {...stylex.props(styles.heroWord, shared.enter("150ms"))}>
            I&apos;m Shintaro.
          </span>
        </h1>
        <p {...stylex.props(styles.intro, shared.enter("240ms"))}>
          I study computer science at the University of Auckland, build software
          for a company in Tokyo, and help look after a couple of open-source
          projects. When I&apos;m away from a screen, I&apos;m usually out
          taking photos, like these.
        </p>
      </section>

      <Photos eager={3} photos={band} variant="band" />

      <section {...stylex.props(shared.wrap, styles.about)} id="about">
        <figure
          {...stylex.props(
            styles.aboutPhoto,
            shared.reveal,
            stylex.defaultMarker()
          )}
        >
          <Image
            alt="Me under a cherry blossom tree"
            placeholder="blur"
            sizes="(max-width: 800px) 20rem, 30vw"
            src={selfie}
            {...stylex.props(styles.aboutImage)}
          />
        </figure>
        <div {...stylex.props(styles.aboutText, shared.reveal)}>
          <h2 {...stylex.props(shared.title, styles.aboutTitle)}>
            A bit about me
          </h2>
          <p>
            I was born in Tokyo in 2005. After the 2011 earthquake my family
            moved to Ehime, and since then I&apos;ve lived in Auckland, spent a
            year at school in the Philippines, and came back to New Zealand for
            good in 2019.
          </p>
          <p {...stylex.props(styles.paragraph)}>
            I taught myself to code in 2022 by making small games, and I still
            mostly build things because someone I know needs them. Outside of
            screens it&apos;s kendama, juggling, table tennis, badminton and
            football, even after three knee injuries.
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
        intro={`Most of my coding happens on GitHub, where ${fmt(github.total)} of my pull requests have been merged across work, open source and my own projects. The numbers on these cards update themselves.`}
        title="Things I've worked on"
      >
        <Work projects={github.projects} upstream={github.upstream} />
      </Section>

      <Section
        id="lately"
        intro="This part keeps itself up to date. The site re-reads my GitHub about once an hour, so what you see here is never much older than that."
        title="Still shipping, most weeks."
      >
        <Lately
          monthly={github.monthly}
          recent={github.recent}
          updated={updated}
        />
      </Section>

      <Section
        id="jobs"
        intro="Everything since 2024, including the times I was juggling a few things at once alongside uni."
        title="Jobs and volunteering"
      >
        <WorkTimeline now={now} />
      </Section>

      <Section
        id="journey"
        intro="Japan and New Zealand, with a detour to the Philippines for school."
        title="Where I've lived"
      >
        <JourneyMap />
      </Section>

      <Section id="projects" title="Things I made for myself, or for family">
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
                  alt={`Screenshot of ${project.name}`}
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
        <p {...stylex.props(styles.also, shared.reveal)}>
          Also: a{" "}
          <a href="https://github.com/taroj1205/tauri-clipboard-manager">
            clipboard manager for Windows
          </a>{" "}
          that can search through everything you&apos;ve copied, including
          images.
        </p>
      </Section>

      <Section
        id="hackathons"
        intro="Both were weekend hackathons run by WDCC, the web development club at uni."
        title="Two hackathons, two awards"
      >
        <div {...stylex.props(styles.awards)}>
          {awards.map((award, i) => (
            <figure
              key={award.prize}
              {...stylex.props(shared.reveal, stylex.defaultMarker())}
            >
              <div {...stylex.props(styles.awardPhotos)}>
                <Image
                  alt={award.alt}
                  placeholder="blur"
                  sizes="(max-width: 800px) 100vw, 50vw"
                  src={award.photo}
                  {...stylex.props(styles.awardImage)}
                />
                <Image
                  alt={`The ${award.prize} certificate`}
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
        intro="Mostly around Auckland. Tap one to see it bigger."
        title="More photos"
      >
        <Photos photos={gallery} variant="gallery" />
      </Section>

      <section {...stylex.props(shared.wrap, styles.contact)} id="contact">
        <h2 {...stylex.props(shared.title, shared.reveal)}>Say hi</h2>
        <p {...stylex.props(styles.contactText, shared.reveal)}>
          Send me a message on any of these, whether it&apos;s about a project,
          uni, or just to chat.
        </p>
        <p {...stylex.props(styles.socials)}>
          {socials.map(([label, href]) => (
            <a
              href={href}
              key={label}
              {...stylex.props(shared.display, styles.social)}
            >
              {label}
            </a>
          ))}
        </p>
      </section>
    </>
  );
};

export default Home;
