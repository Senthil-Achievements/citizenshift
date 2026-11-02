"use client";

/**
 * ContactRepDialog — the advocacy step of the record.
 *
 * The bill service's representative lookup is reserved for signed-in members of
 * the upstream app, and third-party rep databases routinely carry stale names.
 * So this dialog does what advocacy tools should: it hands the user verified,
 * *official* lookup channels with the ZIP already applied, plus a short
 * constitutional script for making the call. CitizenShift never composes the
 * message — the words belong to the constituents.
 */

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import type { Bill } from "@/lib/legislation";
import { billDisplayNumber, billTitle } from "@/lib/legislation";
import { STATE_NAME_BY_CODE, US_STATES } from "@/lib/states";

const SENATE_WIZARD = "https://www.senate.gov/senators/senators-contactwizard.htm";

export default function ContactRepDialog({
  bill,
  open,
  onClose,
}: {
  bill: Bill | null;
  open: boolean;
  onClose: () => void;
}) {
  const [state, setState] = useState("NY");
  const [zipcode, setZipcode] = useState("");
  const zipValid = /^\d{5}$/.test(zipcode);

  const houseLink = zipValid
    ? `https://www.house.gov/htbin/findrep?ZIP=${zipcode}&ZIP4=`
    : "https://www.house.gov/representatives/find-your-representative";

  return (
    <Modal open={open && !!bill} onClose={onClose} label="Contact your representatives">
      {bill && (
        <div className="p-6 sm:p-8">
          <p className="eyebrow text-berry">Contact Your Representatives</p>
          <h3 className="mt-2 font-display text-xl font-semibold leading-snug text-navy">
            Speak on: {billTitle(bill)}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-navy/70">
            Official channels, no scripts written for you. Identify yourself as a
            constituent, cite <span className="font-mono text-[12px] font-semibold text-navy">{billDisplayNumber(bill)}</span>,
            and state your position in one clear sentence.
          </p>

          {/* state + ZIP */}
          <div className="mt-5 grid gap-2 sm:grid-cols-[auto_1fr]">
            <label className="sr-only" htmlFor="rep-state">State</label>
            <select
              id="rep-state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="h-12 rounded-xl border hairline bg-paper px-3 text-sm font-medium text-navy"
            >
              {US_STATES.filter((s) => s.code !== "US").map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="rep-zip">ZIP code</label>
            <input
              id="rep-zip"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="ZIP code, to find your House rep"
              value={zipcode}
              maxLength={5}
              onChange={(e) => setZipcode(e.target.value.replace(/\D/g, ""))}
              className="h-12 rounded-xl border hairline bg-paper px-4 text-sm text-navy placeholder:text-navy/35"
            />
          </div>

          {/* official actions */}
          <div className="mt-5 space-y-2.5">
            <a
              href={houseLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between rounded-xl bg-navy px-5 py-4 text-sm font-semibold text-icy transition-colors hover:bg-navy-600"
            >
              <span>
                <span className="block">Find your U.S. Representative</span>
                <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-icy/60">
                  Official ZIP lookup via House.gov{state && STATE_NAME_BY_CODE[state] ? ` · ${STATE_NAME_BY_CODE[state]}` : ""}
                </span>
              </span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">
                <path d="M2 12L12 2M5 2h7v7" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </a>
            <a
              href={SENATE_WIZARD}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between rounded-xl border hairline px-5 py-4 text-sm font-semibold text-navy transition-colors hover:bg-icy-100"
            >
              <span>
                <span className="block">Contact your two U.S. Senators</span>
                <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50">
                  Official Senate contact wizard · choose {STATE_NAME_BY_CODE[state] ?? "your state"}
                </span>
              </span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">
                <path d="M2 12L12 2M5 2h7v7" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </a>
          </div>

          {/* how to talk to your legislator */}
          <div className="mt-5 border hairline bg-icy-50 p-4">
            <p className="eyebrow text-navy/50">Make the call count</p>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-[13px] leading-relaxed text-navy/75">
              <li>Open with your name and ZIP code — offices weigh constituents first.</li>
              <li>Cite the bill: “This is about {billDisplayNumber(bill)}, {billTitle(bill).slice(0, 60)}…”</li>
              <li>Say your position in one sentence, then say why in one sentence.</li>
              <li>Staff record every position. Being clear is more effective than being loud.</li>
            </ol>
          </div>

          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-navy/40">
            CitizenShift does not compose messages to legislators. Representatives are
            verified on official House and Senate pages only.
          </p>
        </div>
      )}
    </Modal>
  );
}
