"use client";

import * as stylex from "@stylexjs/stylex";
import { useEffect, useState } from "react";

import { media } from "../styles/tokens.stylex";

const grain = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="64"><filter id="g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.04 0.7" seed="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.18 0.82"/></filter><rect width="256" height="64" filter="url(#g)"/></svg>'
)}")`;

const appear = stylex.keyframes({ from: { opacity: 0 } });

const styles = stylex.create({
  mark: (left: number, top: number, width: number, height: number) => ({
    animationDuration: "200ms",
    animationName: { default: null, [media.motion]: appear },
    animationTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
    backgroundImage:
      "linear-gradient(85deg, rgb(224 65 43 / 0.42) 2px, rgb(224 65 43 / 0.26) min(10px, 40%), rgb(224 65 43 / 0.28) max(calc(100% - 10px), 60%), rgb(224 65 43 / 0.46) calc(100% - 2px))",
    clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)",
    height,
    left,
    maskImage: grain,
    pointerEvents: "none",
    position: "absolute",
    top,
    width,
    zIndex: 39,
  }),
});

interface Line {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

const unclipped: Line = {
  bottom: Number.POSITIVE_INFINITY,
  left: Number.NEGATIVE_INFINITY,
  right: Number.POSITIVE_INFINITY,
  top: Number.NEGATIVE_INFINITY,
};

const clipOf = (el: Element | null, seen: Map<Element, Line>): Line => {
  if (!el || el === document.body) {
    return unclipped;
  }

  const known = seen.get(el);

  if (known) {
    return known;
  }

  const outer = clipOf(el.parentElement, seen);
  const style = getComputedStyle(el);
  const box = el.getBoundingClientRect();
  const clipX = style.overflowX !== "visible";
  const clipY = style.overflowY !== "visible";

  const clip = {
    bottom: clipY ? Math.min(outer.bottom, box.bottom) : outer.bottom,
    left: clipX ? Math.max(outer.left, box.left) : outer.left,
    right: clipX ? Math.min(outer.right, box.right) : outer.right,
    top: clipY ? Math.max(outer.top, box.top) : outer.top,
  };

  seen.set(el, clip);

  return clip;
};

const leadingOf = (el: Element | null) => {
  const value = el ? getComputedStyle(el).lineHeight : "";

  return value.endsWith("px")
    ? Number(value.slice(0, -2))
    : Number.POSITIVE_INFINITY;
};

const measure = (): Line[] => {
  const selection = getSelection();

  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return [];
  }

  const range = selection.getRangeAt(0);

  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT
  );

  const lines: Line[] = [];
  const piece = document.createRange();
  const seen = new Map<Element, Line>();

  for (
    let node: Node | null = walker.currentNode;
    node !== null;
    node = walker.nextNode()
  ) {
    if (node.nodeType !== Node.TEXT_NODE || !range.intersectsNode(node)) {
      continue;
    }

    piece.selectNodeContents(node);

    if (node === range.startContainer) {
      piece.setStart(node, range.startOffset);
    }

    if (node === range.endContainer) {
      piece.setEnd(node, range.endOffset);
    }

    const clip = clipOf(node.parentElement, seen);

    const leading = leadingOf(node.parentElement);

    for (const glyphs of piece.getClientRects()) {
      const height = Math.min(leading, glyphs.height);

      const middle = (glyphs.top + glyphs.bottom) / 2;

      const box = {
        bottom: Math.min(middle + height / 2, clip.bottom),
        left: Math.max(glyphs.left, clip.left),
        right: Math.min(glyphs.right, clip.right),
        top: Math.max(middle - height / 2, clip.top),
      };

      if (box.right - box.left < 1 || box.bottom - box.top < 1) {
        continue;
      }

      const line = lines.find(
        (l) =>
          Math.min(l.bottom, box.bottom) - Math.max(l.top, box.top) >
            Math.min(l.bottom - l.top, box.bottom - box.top) / 2 &&
          box.left <= l.right + 24 &&
          box.right >= l.left - 24
      );

      if (line) {
        line.left = Math.min(line.left, box.left);
        line.right = Math.max(line.right, box.right);
        line.top = Math.min(line.top, box.top);
        line.bottom = Math.max(line.bottom, box.bottom);
      } else {
        lines.push({ ...box });
      }
    }
  }

  return lines.map((line) => ({
    bottom: line.bottom + scrollY,
    left: line.left + scrollX,
    right: line.right + scrollX,
    top: line.top + scrollY,
  }));
};

export const Highlighter = () => {
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    let last = "[]";

    const update = () => {
      frame = 0;
      const next = measure();
      const key = JSON.stringify(next);

      if (key === last) {
        return;
      }

      last = key;
      setLines(next);
      frame = requestAnimationFrame(update);
    };

    const schedule = () => {
      if (frame === 0) {
        frame = requestAnimationFrame(update);
      }
    };

    root.dataset.highlighter = "";
    document.addEventListener("selectionchange", schedule);
    addEventListener("scroll", schedule, { capture: true, passive: true });
    addEventListener("resize", schedule);

    return () => {
      delete root.dataset.highlighter;
      cancelAnimationFrame(frame);
      document.removeEventListener("selectionchange", schedule);
      removeEventListener("scroll", schedule, { capture: true });
      removeEventListener("resize", schedule);
    };
  }, []);

  return lines.map((line, i) => (
    <span
      aria-hidden="true"
      key={i}
      {...stylex.props(
        styles.mark(
          line.left - 4,
          line.top + 1,
          line.right - line.left + 8,
          line.bottom - line.top - 1
        )
      )}
    />
  ));
};
