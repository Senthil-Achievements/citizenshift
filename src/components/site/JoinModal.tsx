"use client";

/**
 * JoinModal — the "Join the Movement" / "Sign In" entry point.
 * Personalised accounts are rolling out in phases; entry is honest:
 * we route interest to the organisation's verified inbox (no dead ends,
 * no fake auth forms).
 */

import { useState } from "react";
import Modal from "@/components/ui/Modal";

const EMAIL = "erin.chouinard@citizenshift.us";

export default function JoinModal({
  open,
  onClose,
  intent,
}: {
  open: boolean;
  onClose: () => void;
  intent: "join" | "signin";
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  };

  return (
    <Modal open={open} onClose={onClose} label={intent === "join" ? "Join the Movement" : "Sign in"}>
      <div className="border-b hairline bg-icy-50 px-6 py-5 sm:px-8">
        <p className="eyebrow text-berry">
          {intent === "join" ? "Join the Movement" : "Account Access"}
        </p>
        <h3 className="mt-2 font-display text-2xl leading-snug text-navy">
          {intent === "join"
            ? "Be first in line for a personalised feed."
            : "Personalised accounts are rolling out in phases."}
        </h3>
      </div>

      <div className="space-y-4 px-6 py-6 sm:px-8">
        <p className="text-sm leading-relaxed text-navy/80">
          {intent === "join"
            ? "CitizenShift is personalising legislation by geography and policy interest in phases. Tell the team you want early access and they will add you to the rollout."
            : "Accounts for saved, personalised bill feeds are being released in phases. Request access through the team and they will respond from the verified inbox."}
        </p>

        <div className="border hairline bg-paper p-4">
          <p className="eyebrow text-navy/50">Verified contact</p>
          <a
            href={`mailto:${EMAIL}?subject=${encodeURIComponent(
              intent === "join" ? "Requesting early access — CitizenShift" : "Sign-in request — CitizenShift",
            )}`}
            className="mt-1 block font-mono text-sm text-berry underline decoration-berry/30 underline-offset-4 hover:decoration-berry"
          >
            {EMAIL}
          </a>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            href={`mailto:${EMAIL}?subject=${encodeURIComponent(
              intent === "join" ? "Requesting early access — CitizenShift" : "Sign-in request — CitizenShift",
            )}`}
            className="flex-1 rounded-full bg-navy px-5 py-3 text-center text-sm font-semibold text-icy transition-colors hover:bg-navy-600"
          >
            {intent === "join" ? "Email the team" : "Email for access"}
          </a>
          <button
            type="button"
            onClick={copy}
            className="flex-1 rounded-full border hairline px-5 py-3 text-sm font-semibold text-navy transition-colors hover:bg-icy-100"
          >
            {copied ? "Address copied ✓" : "Copy address"}
          </button>
        </div>

        <p className="pt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-navy/40">
          No passwords collected here — access flows through the verified team only.
        </p>
      </div>
    </Modal>
  );
}
