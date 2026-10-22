import type { Lang } from "./i18n";

const REPO_URL = "https://github.com/taroj1205/portfolio";
const HANDLE = "@taroj1205";

export interface ReportLabels {
  report: string;
  x: string;
  github: string;
}

export const reportLabels: Record<Lang, ReportLabels> = {
  en: {
    github: "Open a GitHub issue",
    report: "Report a problem",
    x: "Tell me on X",
  },
  ja: {
    github: "GitHubのIssueで報告",
    report: "問題を報告",
    x: "Xで伝える",
  },
};

const drafts: Record<Lang, (path: string) => { title: string; body: string }> =
  {
    en: (path) => ({
      body: `Game: ${path}\n\nWhat happened:\n\nDevice and browser:\n`,
      title: `Problem in ${path}`,
    }),
    ja: (path) => ({
      body: `ゲーム: ${path}\n\n何が起きたか:\n\n端末とブラウザ:\n`,
      title: `${path} の不具合`,
    }),
  };

export const reportUrls = (path: string, lang: Lang) => {
  const draft = drafts[lang](path);
  return {
    github: `${REPO_URL}/issues/new?${new URLSearchParams({ body: draft.body, title: draft.title }).toString()}`,
    x: `https://x.com/intent/tweet?${new URLSearchParams({ text: `${HANDLE} ${draft.title}: ` }).toString()}`,
  };
};
