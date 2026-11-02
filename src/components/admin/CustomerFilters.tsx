"use client";

/**
 * CustomerFilters — GET form driving the server-rendered customer list.
 *
 * Plain form submission (no client-side data fetching) so the secret-key admin
 * API is never called from the browser. All state lives in the URL, which also
 * makes the filtered view linkable and back-button friendly.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CustomerFilters({
  action,
  initial,
  providerOptions,
}: {
  action: string;
  initial: {
    q: string;
    provider: string;
    onboarding: string;
    created_from: string;
    created_to: string;
  };
  providerOptions: string[];
}) {
  const router = useRouter();
  const [q, setQ] = useState(initial.q);
  const [provider, setProvider] = useState(initial.provider);
  const [onboarding, setOnboarding] = useState(initial.onboarding);
  const [createdFrom, setCreatedFrom] = useState(initial.created_from);
  const [createdTo, setCreatedTo] = useState(initial.created_to);

  const hasFilters = Boolean(
    initial.q || initial.provider || initial.onboarding || initial.created_from || initial.created_to,
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (provider) sp.set("provider", provider);
    if (onboarding) sp.set("onboarding", onboarding);
    if (createdFrom) sp.set("created_from", createdFrom);
    if (createdTo) sp.set("created_to", createdTo);
    const s = sp.toString();
    router.push(s ? `${action}?${s}` : action);
  }

  function clear() {
    setQ("");
    setProvider("");
    setOnboarding("");
    setCreatedFrom("");
    setCreatedTo("");
    router.push(action);
  }

  const control =
    "h-10 w-full rounded-lg border hairline bg-paper px-3 text-sm text-navy placeholder:text-navy/35 focus:border-navy/40 focus:outline-none";

  return (
    <form
      onSubmit={submit}
      role="search"
      aria-label="Filter customers"
      className="border hairline bg-paper p-4"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div>
          <label htmlFor="cf-q" className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">
            Search
          </label>
          <input
            id="cf-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Email or username"
            className={`mt-1 ${control}`}
          />
        </div>

        <div>
          <label htmlFor="cf-provider" className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">
            Provider
          </label>
          <select
            id="cf-provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className={`mt-1 ${control}`}
          >
            <option value="">All providers</option>
            {providerOptions.map((p) => (
              <option key={p} value={p}>
                {p === "google" ? "Google" : p === "email" ? "Email" : p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="cf-onboarding" className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">
            Onboarding
          </label>
          <select
            id="cf-onboarding"
            value={onboarding}
            onChange={(e) => setOnboarding(e.target.value)}
            className={`mt-1 ${control}`}
          >
            <option value="">Any status</option>
            <option value="complete">Complete</option>
            <option value="in_progress">In progress</option>
            <option value="not_started">Not started</option>
          </select>
        </div>

        <div>
          <label htmlFor="cf-from" className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">
            Registered from
          </label>
          <input
            id="cf-from"
            type="date"
            value={createdFrom}
            onChange={(e) => setCreatedFrom(e.target.value)}
            className={`mt-1 ${control}`}
          />
        </div>

        <div>
          <label htmlFor="cf-to" className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">
            Registered to
          </label>
          <input
            id="cf-to"
            type="date"
            value={createdTo}
            onChange={(e) => setCreatedTo(e.target.value)}
            className={`mt-1 ${control}`}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="submit"
          className="h-10 rounded-full bg-navy px-5 text-sm font-semibold text-paper hover:bg-navy-600"
        >
          Apply filters
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={clear}
            className="h-10 rounded-full border hairline px-5 text-sm font-semibold text-navy hover:border-navy/40"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
