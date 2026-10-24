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

const issueTemplates: Record<Lang, string> = {
  en: "bug-report.yml",
  ja: "bug-report.ja.yml",
};

const titles: Record<Lang, (path: string) => string> = {
  en: (path) => `Problem in ${path}`,
  ja: (path) => `${path} の不具合`,
};

export const reportUrls = (path: string, lang: Lang) => {
  const title = titles[lang](path);

  return {
    github: `${REPO_URL}/issues/new?${new URLSearchParams({ game: path, template: issueTemplates[lang], title }).toString()}`,
    x: `https://x.com/intent/tweet?${new URLSearchParams({ text: `${HANDLE} ${title}: ` }).toString()}`,
  };
};
