"use client";

/**
 * LegislationExplorer — the core product experience, rebuilt live from the
 * authenticated-by-proxy bill service (LegiScan + AI summaries).
 *
 * Features: live search of Congress + state feeds · level filters · new/passed
 * · topic filter · discover (shuffle) · expandable details · share ·
 * contact-your-representative.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";
import { BillCard } from "@/components/site/legislation/BillCard";
import ShareDialog, { shareOrCopy } from "@/components/site/legislation/ShareDialog";
import ContactRepDialog from "@/components/site/legislation/ContactRepDialog";
import type { Bill, LegislationLevel, LegislationResponse } from "@/lib/legislation";
import { CARD_LIMIT, isPassed, isNew, matchesTopic, shuffle } from "@/lib/legislation";
import { POLICY_AREAS, US_STATES } from "@/lib/states";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type LevelFilter = "All" | LegislationLevel;
type StatusFilter = "All" | "New" | "Passed";
type TopicFilter = string; // "All" | policy area

const chipBase =
  "chip cursor-pointer select-none transition-all duration-200 hover:-translate-y-px active:translate-y-0";
const chipOff = "border-navy/20 text-navy/70 hover:border-navy/45";
const chipOnDark = "border-icy bg-icy text-navy font-semibold";

export default function LegislationExplorer() {
  /* ---------------- state ---------------- */
  const [state, setState] = useState("FL");
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [level, setLevel] = useState<LevelFilter>("All");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [topic, setTopic] = useState<TopicFilter>("All");
  const [order, setOrder] = useState<"curated" | "newest" | "shuffle">("curated");
  const [shuffledIds, setShuffledIds] = useState<string[] | null>(null);

  const [data, setData] = useState<LegislationResponse>({ bills: [], availableLevels: ["Federal"] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [shareBill, setShareBill] = useState<Bill | null>(null);
  const [contactBill, setContactBill] = useState<Bill | null>(null);
  const [toast, setToast] = useState("");

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2600);
  }, []);

  /* ---------------- data ---------------- */
  const load = useCallback(
    async (stateCode: string, q: string, signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/legislation?state=${encodeURIComponent(stateCode)}${q ? `&q=${encodeURIComponent(q)}` : ""}`,
          { signal, cache: "no-store" },
        );
        const json = (await res.json()) as LegislationResponse & { error?: string };
        if (json.error === "upstream-unreachable") {
          setError("The legislative record is not responding right now. Try again in a moment.");
        }
        setData({
          bills: json.bills?.length ? json.bills : [],
          availableLevels: json.availableLevels?.length ? json.availableLevels : ["Federal"],
        });
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          setError("The legislative record is not responding right now. Try again in a moment.");
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // initial load
  useEffect(() => {
    const controller = new AbortController();
    load(state, "", controller.signal);
    return () => controller.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onStateChange = (code: string) => {
    setState(code);
    setSearchTerm("");
    setQuery("");
    load(code, "");
  };

  const onSubmitSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (q.length < 2) {
      showToast("Enter at least two characters to search.");
      return;
    }
    setSearchTerm(q);
    load(state, q);
  };

  const onClearSearch = () => {
    setQuery("");
    setSearchTerm("");
    load(state, "");
  };

  /* ---------------- derived ---------------- */
  const availableLevels = data.availableLevels ?? ["Federal"];
  const hasState = availableLevels.includes("State");
  const hasMunicipal = availableLevels.includes("Municipal");

  const visible = useMemo(() => {
    let list = data.bills;
    if (level !== "All") list = list.filter((b) => b.level === level);
    if (status === "New") list = list.filter((b) => isNew(b));
    if (status === "Passed") list = list.filter((b) => isPassed(b));
    if (topic !== "All") list = list.filter((b) => matchesTopic(b, topic));
    if (order === "newest") {
      list = [...list].sort(
        (a, b) => new Date(b.introduced_date).getTime() - new Date(a.introduced_date).getTime(),
      );
    } else if (order === "shuffle" && shuffledIds) {
      const rank = new Map(shuffledIds.map((id, i) => [id, i]));
      list = [...list].sort((a, b) => (rank.get(`${a.id}`) ?? 0) - (rank.get(`${b.id}`) ?? 0));
    }
    return list.slice(0, CARD_LIMIT);
  }, [data.bills, level, status, topic, order, shuffledIds]);

  const counts = {
    total: data.bills.length,
    shown: visible.length,
  };

  const gridRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      if (typeof window === "undefined") return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const items = gsap.utils.toArray<HTMLElement>(".spw-bill-item");

      if (reduce) {
        gsap.set(items, { scale: 1, clearProps: "all" });
        return;
      }

      // Each bill card scrubs scale 0 → 1 → 0 across its full pass through the
      // viewport: it grows in from its transform-origin corner, peaks at
      // centre, then shrinks away — "comes and goes".
      items.forEach((el) => {
        if (el.dataset.expanded === "true") {
          gsap.set(el, { scale: 1 });
          return;
        }

        gsap
          .timeline({
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          })
          .fromTo(
            el,
            { scale: 0 },
            { scale: 1, ease: "power2.out", duration: 0.5 },
          )
          .to(el, { scale: 0, ease: "power2.in", duration: 0.5 });
      });

      ScrollTrigger.refresh();
    },
    { scope: gridRef, dependencies: [visible.length, expandedId], revertOnUpdate: true },
  );

  const doDiscover = () => {
    if (visible.length < 2) return;
    setShuffledIds(shuffle(visible).map((b) => b.id as string));
    setOrder("shuffle");
    setTimeout(() => {
      document
        .getElementById("bill-grid")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const resetAll = () => {
    setLevel("All");
    setStatus("All");
    setTopic("All");
    setOrder("curated");
    setShuffledIds(null);
  };

  const isFiltering = level !== "All" || status !== "All" || topic !== "All" || order !== "curated";

  /* ---------------- chrome ---------------- */
  const filterRail = (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.2em] text-icy/50">Show</span>
      <button type="button" onClick={() => { setLevel("All"); setStatus("All"); }} className={`${chipBase} ${level === "All" && status === "All" ? chipOnDark : chipOff}`}>
        All
      </button>
      {availableLevels.includes("Federal") && (
        <button type="button" onClick={() => setLevel(level === "Federal" ? "All" : "Federal")} className={`${chipBase} ${level === "Federal" ? chipOnDark : chipOff}`}>
          Federal
        </button>
      )}
      {hasState && (
        <button type="button" onClick={() => setLevel(level === "State" ? "All" : "State")} className={`${chipBase} ${level === "State" ? chipOnDark : chipOff}`}>
          State
        </button>
      )}
      {hasMunicipal && (
        <button type="button" onClick={() => setLevel(level === "Municipal" ? "All" : "Municipal")} className={`${chipBase} ${level === "Municipal" ? chipOnDark : chipOff}`}>
          Municipal
        </button>
      )}
      <button type="button" onClick={() => setStatus(status === "New" ? "All" : "New")} className={`${chipBase} ${status === "New" ? "border-berry bg-berry text-paper" : chipOff}`}>
        New
      </button>
      <button type="button" onClick={() => setStatus(status === "Passed" ? "All" : "Passed")} className={`${chipBase} ${status === "Passed" ? "border-berry bg-berry text-paper" : chipOff}`}>
        Passed
      </button>
      <select
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        aria-label="Filter by topic"
        className="chip cursor-pointer border-navy/20 bg-navy-800 text-icy/80 hover:border-icy/50"
      >
        <option value="All">Topic — All</option>
        {POLICY_AREAS.map((area) => (
          <option key={area} value={area}>{area}</option>
        ))}
      </select>
      {isFiltering && (
        <button
          type="button"
          onClick={resetAll}
          className="ml-1 font-mono text-[10px] uppercase tracking-[0.18em] text-berry underline decoration-berry/40 underline-offset-4 hover:decoration-berry"
        >
          Reset
        </button>
      )}
    </div>
  );

  return (
    <section id="legislation" className="scroll-mt-20 grain relative overflow-hidden bg-[#060913] text-paper border-none" aria-labelledby="legislation-heading">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        aria-hidden="true"
      />
      <div className="shell relative py-20 sm:py-28">
        {/* heading */}
        <div className="flex flex-col gap-6 border-b hairline-light pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-berry">The Feed / Live Record</p>
            <h2 id="legislation-heading" className="mt-3 font-display text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.02em]">
              Explore <span className="italic text-icy">legislation</span>.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-icy/60">
            A live window into the same record the app reads: federal and state bills,
            plain-language summaries, one-tap advocacy. No account required to begin.
          </p>
        </div>

        {/* controls */}
        <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-stretch">
          {/* search */}
          <form
            onSubmit={onSubmitSearch}
            className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center"
            role="search"
            aria-label="Search legislation"
          >
            <div className="relative flex-1">
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-icy/50"
              >
                <circle cx="6.5" cy="6.5" r="4.75" stroke="currentColor" strokeWidth="1.4" />
                <path d="M10 10l4 4" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchTerm ? "Search Congress and your state…" : "Search Congress — bill №, topic, keyword…"}
                aria-label="Search bills"
                className="h-12 w-full rounded-xl border hairline-light bg-navy-800/80 pl-11 pr-4 text-sm text-paper placeholder:text-icy/35 focus:border-icy/50"
              />
              {query && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full border hairline-light text-icy/60 hover:text-paper"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              className="h-12 shrink-0 rounded-xl bg-icy px-6 text-sm font-bold text-navy transition-colors hover:bg-paper"
            >
              Search
            </button>
          </form>

          {/* state + discover */}
          <div className="flex gap-2">
            <label className="relative flex-1 sm:flex-none">
              <span className="sr-only">Choose a state feed</span>
              <select
                value={state}
                onChange={(e) => onStateChange(e.target.value)}
                className="h-12 w-full rounded-xl border hairline-light bg-navy-800/80 px-4 text-sm font-medium text-paper focus:border-icy/50 sm:w-52"
              >
                {US_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code === "US" ? "Federal only" : `${s.code} — ${s.name}`}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={doDiscover}
              disabled={visible.length < 2 || loading}
              title="Shuffle the currently filtered bills"
              className="group flex h-12 items-center gap-2 rounded-xl border hairline-light px-5 text-sm font-semibold text-icy transition-all hover:border-icy/60 hover:bg-icy/10 disabled:opacity-40"
            >
              <svg width="14" height="14" viewBox="0 0 16 14" fill="none" aria-hidden="true" className="transition-transform duration-500 group-hover:rotate-180">
                <path d="M1 2h3.5c2.5 0 4 2 5 5s2.5 5 5 5H15M1 12h3.5c2.5 0 4-2 5-5s2.5-5 5-5H15" stroke="currentColor" strokeWidth="1.4" />
                <path d="M13 0l2.5 2-2.5 2M13 8l2.5 2-2.5 2" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              Discover
            </button>
          </div>
        </div>

        {/* filter rail */}
        <div className="no-scrollbar mt-5 overflow-x-auto pb-1">{filterRail}</div>

        {/* result meta */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-icy/50">
          <span aria-live="polite">
            {loading
              ? "Reading the record…"
              : `${searchTerm ? `Search — “${searchTerm}”` : "Feed"} · ${counts.shown} shown / ${counts.total} on file${
                  order === "shuffle" ? " · shuffled" : order === "newest" ? " · newest first" : ""
                }`}
          </span>
          <span className="hidden sm:block">Source — LegiScan official bill data</span>
        </div>

        {/* error */}
        {error && (
          <div role="alert" className="mt-6 border border-berry/40 bg-berry/15 px-5 py-4 text-sm text-paper">
            {error}{" "}
            <button type="button" onClick={() => load(state, searchTerm)} className="ml-2 underline underline-offset-2">
              Retry
            </button>
          </div>
        )}

        {/* grid */}
        <div id="bill-grid" className="mt-6">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading bills">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`border hairline-light bg-navy-800/60 p-6 ${i === 0 ? "sm:col-span-2 xl:row-span-2 aspect-[16/9]" : ""}`}>
                  <div className="flex gap-2">
                    <div className="h-5 w-20 animate-pulse rounded-full bg-icy/10" />
                    <div className="h-5 w-24 animate-pulse rounded-full bg-icy/10" />
                  </div>
                  <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-icy/10" />
                  <div className="mt-3 h-3 w-1/3 animate-pulse rounded bg-icy/10" />
                  <div className="mt-6 space-y-2">
                    <div className="h-3 w-full animate-pulse rounded bg-icy/10" />
                    <div className="h-3 w-full animate-pulse rounded bg-icy/10" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-icy/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="border hairline-light bg-navy-800/50 px-6 py-16 text-center">
              <p className="font-display text-2xl text-paper">Nothing in this view of the record.</p>
              <p className="mt-2 text-sm text-icy/60">
                {searchTerm
                  ? "Try another bill number or a broader keyword."
                  : "Loosen a filter, or choose another state feed."}
              </p>
              {isFiltering && (
                <button
                  type="button"
                  onClick={resetAll}
                  className="mt-6 rounded-full bg-icy px-6 py-3 text-sm font-bold text-navy hover:bg-paper"
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <div ref={gridRef} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((bill, i) => {
                const isExpanded = expandedId === String(bill.id);
                const colIndex = i % 3;
                const origin =
                  colIndex === 0
                    ? "right bottom"
                    : colIndex === 1
                      ? "center bottom"
                      : "left bottom";

                return (
                  <div
                    key={bill.id}
                    data-expanded={isExpanded ? "true" : "false"}
                    className={cn(
                      "spw-bill-item h-full",
                      isExpanded && "sm:col-span-2 xl:col-span-3 z-10"
                    )}
                    style={{
                      transformOrigin: isExpanded ? "center center" : origin,
                      willChange: "transform",
                    }}
                  >
                    <BillCard
                      bill={bill}
                      delay={i % CARD_LIMIT}
                      expanded={isExpanded}
                      onToggleExpand={() => setExpandedId(isExpanded ? null : String(bill.id))}
                      onShare={() => setShareBill(bill)}
                      onContact={() => setContactBill(bill)}
                      onFilterLevel={(l) => {
                        setLevel(l);
                        document.getElementById("bill-grid")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      onFilterTopic={(t) => {
                        setTopic(t);
                        document.getElementById("bill-grid")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      onFilterStatus={(s) => {
                        setStatus((cur) => (cur === s ? "All" : s));
                        document.getElementById("bill-grid")?.scrollIntoView({ behavior: "smooth" });
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* footnote */}
        <p className="mt-8 pt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-icy/45">
          Every card above is a real bill from the public record. Summaries are
          translation aids, not legal advice · Bill data via LegiScan
        </p>
      </div>

      {/* overlays */}
      <ShareDialog bill={shareBill} open={!!shareBill} onClose={() => setShareBill(null)} />
      <ContactRepDialog bill={contactBill} open={!!contactBill} onClose={() => setContactBill(null)} />

      {/* toast */}
      <div aria-live="polite" className="pointer-events-none fixed bottom-6 left-1/2 z-[85] -translate-x-1/2">
        {toast && (
          <p className="rounded-full border hairline-light bg-navy-800 px-5 py-3 text-sm text-paper shadow-2xl">
            {toast}
          </p>
        )}
      </div>
    </section>
  );
}
