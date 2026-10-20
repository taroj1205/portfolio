export interface Share {
  text: string;
  url: string;
  image: string;
}

export interface ShareLabels {
  share: string;
  shareImage: string;
  saveImage: string;
  shareLink: string;
  postX: string;
  copyLink: string;
  copied: string;
}

export const postUrl = (share: Share) =>
  `https://x.com/intent/tweet?${new URLSearchParams({ text: share.text, url: share.url }).toString()}`;
