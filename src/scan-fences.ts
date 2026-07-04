/**
 * A single fenced code block discovered in raw markdown.
 */
export interface ScannedFence {
  /** The fence language (first word of the info string), e.g. `dgmo`. */
  lang: string;
  /** Everything after the language on the info line, e.g. `showcase palette=slate`. */
  meta: string;
  /** The code between the fences, with the opening fence's indentation stripped. */
  content: string;
}

const OPEN_FENCE = /^(\s{0,3})(`{3,}|~{3,})(.*)$/;

/**
 * Lightweight CommonMark-ish fenced-code scanner used by the Vite pre-pass.
 *
 * We do NOT run markdown-it here (it is only a devDependency): the pre-pass
 * runs in a Vite `transform` hook with no access to VitePress's `md` instance,
 * and pulling markdown-it in as a runtime dep just to re-tokenize would be
 * wasteful. Instead this scanner extracts the same (lang, meta, content) a
 * fence token carries, for the common cases that appear in docs:
 *
 *   - ``` and ~~~ fences, 3+ markers, matching close marker of >= length
 *   - up to 3 spaces of opening-fence indentation (stripped from content lines)
 *   - unterminated fences run to end-of-document (CommonMark rule)
 *
 * The cache key hashes `content.trim()`, so the exact trailing-newline handling
 * doesn't need to match markdown-it byte-for-byte — only the inner code lines
 * do, and those are unambiguous.
 */
export function scanFences(markdown: string): ScannedFence[] {
  const lines = markdown.split('\n');
  const out: ScannedFence[] = [];

  for (let i = 0; i < lines.length; i++) {
    const open = OPEN_FENCE.exec(lines[i]);
    if (!open) continue;

    const indent = open[1].length;
    const marker = open[2];
    const markerChar = marker[0];
    const markerLen = marker.length;
    const info = open[3].trim();

    // Info strings on backtick fences may not contain a backtick (CommonMark).
    if (markerChar === '`' && info.includes('`')) continue;

    const closeRe = new RegExp(
      `^\\s{0,3}${markerChar === '`' ? '`' : '~'}{${markerLen},}\\s*$`
    );

    const body: string[] = [];
    let j = i + 1;
    for (; j < lines.length; j++) {
      if (closeRe.test(lines[j])) break;
      body.push(stripIndent(lines[j], indent));
    }

    const spaceIdx = info.search(/\s/);
    const lang = spaceIdx === -1 ? info : info.slice(0, spaceIdx);
    const meta = spaceIdx === -1 ? '' : info.slice(spaceIdx + 1).trim();

    out.push({ lang, meta, content: body.join('\n') });

    // Resume after the closing fence (or at end-of-doc for an unterminated one).
    i = j;
  }

  return out;
}

function stripIndent(line: string, indent: number): string {
  let n = 0;
  while (n < indent && n < line.length && line[n] === ' ') n++;
  return line.slice(n);
}
