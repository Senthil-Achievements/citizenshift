/**
 * original-bills.ts — parse and re-render the ORIGINAL CitizenShift bill page.
 *
 * Fidelity contract (docs/content-fidelity-policy.md):
 *   renderCapture(parseCapture(text)) MUST equal `text` byte-for-byte for every
 *   captured page. If it does not, the parse is lossy and must not be used.
 *   Nothing here rewrites, normalises or "cleans" legislative text.
 *
 * Source of truth: content/original/rendered/captured-50.json (machine-captured
 * from the original site's DOM — never hand-transcribed).
 *
 * Pure module: no fs, no network. Safe to import from client and server.
 */

export interface OriginalLink {
  text: string;
  href: string;
}

export interface OriginalSponsor {
  /** e.g. "DS" */
  initials: string;
  /** e.g. "Darren Soto" — verbatim */
  name: string;
  /** e.g. "D · HD-FL-9" — verbatim, includes the middle dot */
  meta: string;
  /** e.g. "PRIMARY SPONSOR" | "CO-SPONSOR" */
  role: string;
  /** external sponsor URL, unchanged (null when the original had none) */
  href: string | null;
}

export interface OriginalBill {
  id: string;
  /** original path, e.g. "/bills/2161200" */
  sourcePath: string;
  level: string;
  emoji: string;
  policyArea: string;
  status: string;
  /** official title, verbatim */
  title: string;
  billNumber: string;
  jurisdiction: string;
  /** e.g. "October 22, 2026" — verbatim */
  introducedDate: string;
  currentStatus: string;
  sponsors: OriginalSponsor[];
  /** the six fixed progress steps, verbatim */
  progressSteps: string[];
  /** official summary, verbatim */
  summary: string;
  cta: string;
  /** present only when the original rendered an "Original Bill Text" block */
  originalTextSection: string | null;
  originalTextLinkText: string | null;
  originalTextHref: string | null;
}

const PROGRESS_STEPS = [
  "Introduced",
  "Committee",
  "Chamber",
  "Passed Chamber",
  "Both Chambers",
  "Passed",
];

/**
 * Parses the captured innerText of an original bill page.
 * Throws on any structure it does not recognise — never guesses.
 */
export function parseCapture(
  id: string,
  sourcePath: string,
  text: string,
  links: OriginalLink[],
): OriginalBill {
  const L = text.split("\n");
  const fail = (msg: string): never => {
    throw new Error(`parseCapture(${id}): ${msg}`);
  };

  // Fixed header: 24 lines up to and including the blank before "Sponsors (n)"
  if (L[0] !== "Back to Feed") fail(`line 1 expected "Back to Feed", got ${JSON.stringify(L[0])}`);
  if (L[12] !== "Jurisdiction") fail(`line 13 expected "Jurisdiction", got ${JSON.stringify(L[12])}`);
  if (L[16] !== "Introduced") fail(`line 17 expected "Introduced", got ${JSON.stringify(L[16])}`);
  if (L[20] !== "Current Status") fail(`line 21 expected "Current Status", got ${JSON.stringify(L[20])}`);
  if (L[9] !== "Share" || L[10] !== "Contact Your Rep") {
    fail(`lines 10-11 expected Share/Contact Your Rep, got ${JSON.stringify(L.slice(9, 11))}`);
  }

  const sponsorsHeader = L[24];
  const m = /^Sponsors \((\d+)\)$/.exec(sponsorsHeader ?? "");
  if (!m) fail(`line 25 expected "Sponsors (n)", got ${JSON.stringify(sponsorsHeader)}`);
  const sponsorCount = Number(m![1]);

  // Sponsor blocks: 7 lines each (initials, name, "", meta, "", role, "")
  const sponsors: OriginalSponsor[] = [];
  const linkByName = new Map<string, string>();
  for (const l of links) {
    if (l.href && !linkByName.has(l.text)) linkByName.set(l.text, l.href);
  }

  let i = 25;
  for (let n = 0; n < sponsorCount; n++) {
    const block = L.slice(i, i + 7);
    if (block.length < 7) fail(`sponsor ${n + 1} truncated at line ${i + 1}`);
    if (block[2] !== "" || block[4] !== "" || block[6] !== "") {
      fail(`sponsor ${n + 1} expected blank separators, got ${JSON.stringify(block)}`);
    }
    sponsors.push({
      initials: block[0],
      name: block[1],
      meta: block[3],
      role: block[5],
      href: linkByName.get(block[1]) ?? null,
    });
    i += 7;
  }

  // Six fixed progress steps
  const progressSteps = L.slice(i, i + 6);
  if (JSON.stringify(progressSteps) !== JSON.stringify(PROGRESS_STEPS)) {
    fail(`expected the six progress steps, got ${JSON.stringify(progressSteps)}`);
  }
  i += 6;

  if (L[i] !== "Summary") fail(`expected "Summary" at line ${i + 1}, got ${JSON.stringify(L[i])}`);
  i += 1;
  if (L[i] !== "") fail(`expected blank after Summary at line ${i + 1}`);
  i += 1;

  const summary = L[i];
  if (summary === undefined || summary === "") fail("missing summary");
  i += 1;

  if (L[i] !== "") fail(`expected blank after summary at line ${i + 1}`);
  i += 1;

  const cta = L[i];
  if (cta !== "Generate plain-language summaryContact Your Rep") {
    fail(`expected CTA at line ${i + 1}, got ${JSON.stringify(cta)}`);
  }
  i += 1;

  // Optional "Original Bill Text" / "Read Original Text" block
  let originalTextSection: string | null = null;
  let originalTextLinkText: string | null = null;
  let originalTextHref: string | null = null;

  const rest = L.slice(i);
  if (rest.length > 0) {
    if (rest[0] !== "Original Bill Text") {
      fail(`unexpected trailing content: ${JSON.stringify(rest.slice(0, 3))}`);
    }
    if (rest[1] !== "Read Original Text") {
      fail(`expected "Read Original Text", got ${JSON.stringify(rest[1])}`);
    }
    if (rest.length > 2 && rest.slice(2).some((x) => x !== "")) {
      fail(`unexpected content after Original Bill Text: ${JSON.stringify(rest.slice(2))}`);
    }
    originalTextSection = "Original Bill Text";
    originalTextLinkText = "Read Original Text";
    originalTextHref = links.find((l) => l.text === "Read Original Text")?.href ?? null;
    if (!originalTextHref) fail("Original Bill Text block present but no link captured");
  }

  return {
    id,
    sourcePath,
    level: L[1],
    emoji: L[2],
    policyArea: L[3],
    status: L[4],
    title: L[5],
    billNumber: L[7],
    jurisdiction: L[14],
    introducedDate: L[18],
    currentStatus: L[22],
    sponsors,
    progressSteps,
    summary,
    cta,
    originalTextSection,
    originalTextLinkText,
    originalTextHref,
  };
}

/** Rebuilds the exact captured text from a parsed record. */
export function renderCapture(b: OriginalBill): string {
  const out: string[] = [];
  out.push("Back to Feed");
  out.push(b.level);
  out.push(b.emoji);
  out.push(b.policyArea);
  out.push(b.status);
  out.push(b.title);
  out.push("");
  out.push(b.billNumber);
  out.push("");
  out.push("Share");
  out.push("Contact Your Rep");
  out.push("");
  out.push("Jurisdiction");
  out.push("");
  out.push(b.jurisdiction);
  out.push("");
  out.push("Introduced");
  out.push("");
  out.push(b.introducedDate);
  out.push("");
  out.push("Current Status");
  out.push("");
  out.push(b.currentStatus);
  out.push("");
  out.push(`Sponsors (${b.sponsors.length})`);
  for (const s of b.sponsors) {
    out.push(s.initials, s.name, "", s.meta, "", s.role, "");
  }
  out.push(...b.progressSteps);
  out.push("Summary");
  out.push("");
  out.push(b.summary);
  out.push("");
  out.push(b.cta);
  if (b.originalTextSection) {
    out.push(b.originalTextSection);
    out.push(b.originalTextLinkText!);
  }
  return out.join("\n");
}
