"use client";

import { Fragment, type ReactNode } from "react";
import { RecommendedProfileCard } from "./RecommendedProfileCard";

// The assistant's profile-recommendation directive: [[profile:<id>]]. The
// backend instructs the model to emit one of these (using an id from the
// supplied context) instead of naming a person in prose, so we can render an
// interactive, clickable card in its place. The /g regexes below are created
// fresh per call (a stateful lastIndex must not be shared/mutated module-wide).
const profileTokenRe = () => /\[\[profile:([0-9a-fA-F-]{6,})\]\]/g;

// Inline span tokens: **bold**, `code`, *italic*. Bold is listed first so a
// leading "**" matches as bold rather than (italic + literal "*").
const inlineRe = () => /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g;

interface MarkdownMessageProps {
  content: string;
  // While the reply is still streaming, a half-arrived token (e.g. "[[profile:")
  // must not flash as literal text — we trim any dangling, unterminated one.
  streaming?: boolean;
}

// Renders an assistant reply: a lightweight Markdown subset (headings, bold/
// italic/code, bullet & numbered lists, paragraphs) with [[profile:<id>]]
// directives replaced inline by clickable profile cards.
export function MarkdownMessage({ content, streaming }: MarkdownMessageProps) {
  let text = content;
  if (streaming) {
    // Drop a trailing, not-yet-complete token / opening brackets.
    text = text.replace(/\[\[[^\]]*$/, "");
  }

  // Split into ordered prose / profile-card segments, preserving sequence.
  const segments: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  const tokenRe = profileTokenRe();
  while ((match = tokenRe.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index);
    if (before.trim()) {
      segments.push(<MarkdownBlocks key={`t${key++}`} text={before} />);
    }
    segments.push(
      <RecommendedProfileCard key={`p${key++}`} userId={match[1]} />
    );
    lastIndex = match.index + match[0].length;
  }
  const tail = text.slice(lastIndex);
  if (tail.trim() || segments.length === 0) {
    segments.push(<MarkdownBlocks key={`t${key++}`} text={tail} />);
  }

  return <div className="space-y-2">{segments}</div>;
}

// Block-level parser: groups consecutive bullets/numbers into lists, recognises
// "#"-prefixed headings, and folds remaining runs of lines into paragraphs.
function MarkdownBlocks({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  const isBullet = (l: string) => /^\s*[-*]\s+/.test(l);
  const isNumber = (l: string) => /^\s*\d+\.\s+/.test(l);
  const isHeading = (l: string) => /^#{1,6}\s+/.test(l);

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const big = heading[1].length <= 2;
      blocks.push(
        <p
          key={key++}
          className={
            big
              ? "text-sm font-semibold text-white"
              : "text-[13px] font-semibold text-white/90"
          }
        >
          {renderInline(heading[2])}
        </p>
      );
      i++;
      continue;
    }

    if (isBullet(line)) {
      const items: string[] = [];
      while (i < lines.length && isBullet(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++} className="list-disc pl-5 space-y-1">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (isNumber(line)) {
      const items: string[] = [];
      while (i < lines.length && isNumber(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={key++} className="list-decimal pl-5 space-y-1">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Paragraph: gather consecutive plain lines (single newlines become <br>).
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !isHeading(lines[i]) &&
      !isBullet(lines[i]) &&
      !isNumber(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="leading-relaxed">
        {para.map((p, idx) => (
          <Fragment key={idx}>
            {idx > 0 && <br />}
            {renderInline(p)}
          </Fragment>
        ))}
      </p>
    );
  }

  return <div className="space-y-2 text-sm leading-relaxed">{blocks}</div>;
}

// Inline parser for a single line of text.
function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  const re = inlineRe();
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      out.push(
        <strong key={key++} className="font-semibold text-white">
          {tok.slice(2, -2)}
        </strong>
      );
    } else if (tok.startsWith("`")) {
      out.push(
        <code
          key={key++}
          className="rounded bg-black/30 px-1 py-0.5 text-[0.85em] font-mono"
        >
          {tok.slice(1, -1)}
        </code>
      );
    } else {
      out.push(<em key={key++}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
