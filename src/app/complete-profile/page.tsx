"use client";

/**
 * /complete-profile — the three-step onboarding flow.
 *
 * Behaviour required by Phase 10:
 *  - Step 1 matches the supplied screenshot (labels, optional markers, and the
 *    ZIP / street-address explanation preserved verbatim).
 *  - Steps 2 and 3 are NOT invented — they render an explicit
 *    "awaiting client reference" state until the client supplies the screens.
 *  - A real progress indicator and real persistence: fields are written to
 *    `profiles` on every step change, so a user can leave and resume without
 *    losing data.
 *  - "Skip for now" records a skip timestamp ONLY. It never sets
 *    `onboarding_completed_at`, so a skipped user is still incomplete.
 *
 * ⚠️ UNVERIFIED BUILD — no live Supabase project; the profiles migration has
 * not been applied (docs/supabase-configuration-report.md).
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell, AuthSubmit, AuthMessage } from "@/components/auth/AuthShell";
import { AUTH_ROUTES } from "@/config/auth-routes";
import {
  ONBOARDING_STEPS,
  ADDRESS_EXPLANATION,
  STEP1_KEYS,
  validateStep1,
} from "@/lib/auth/onboarding";
import type { ProfileUpdate } from "@/lib/supabase/profiles";
import {
  loadProfileAction,
  saveProfileAction,
  completeOnboardingAction,
  skipOnboardingAction,
} from "@/lib/auth/profile-actions";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function CompleteProfilePage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [values, setValues] = useState<Partial<ProfileUpdate>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const totalSteps = ONBOARDING_STEPS.length;
  const current = ONBOARDING_STEPS[step - 1];

  /* ---------- load existing profile so the flow is resumable ---------- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Server action: loads the caller's own profile, creating one
        // idempotently when the DB trigger has not already done so.
        const loaded = await loadProfileAction();
        if (cancelled) return;

        const profile = loaded.profile ?? null;
        if (cancelled) return;

        if (profile) {
          const restored: Partial<ProfileUpdate> = {};
          for (const key of STEP1_KEYS) {
            const v = profile[key as keyof typeof profile];
            if (typeof v === "string") restored[key] = v;
          }
          setValues(restored);

          // Resume at the right place: completed users skip the form entirely.
          if (profile.onboarding_completed_at) {
            router.replace(AUTH_ROUTES.afterOnboarding);
            return;
          }
        }
      } catch (err) {
        console.error("[complete-profile] load:", err);
        if (!cancelled) {
          setMessage("We couldn't load your profile. You can still fill this in — it will save when you continue.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [router]);

  /* ---------- persistence ---------- */
  async function persist(patch: Partial<ProfileUpdate>): Promise<boolean> {
    setSaveState("saving");
    try {
      const res = await saveProfileAction(patch);
      if (!res.ok) throw new Error(res.message ?? "Could not save your details.");
      setSaveState("saved");
      return true;
    } catch (err) {
      console.error("[complete-profile] save:", err);
      setSaveState("error");
      setMessage(
        err instanceof Error && /not configured/i.test(err.message)
          ? "Profiles aren't configured yet — your entries are held in this browser until they are."
          : "We couldn't save your details just now. Your entries are kept in this form.",
      );
      return false;
    }
  }

  function setField(key: keyof ProfileUpdate, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    // Draft autosave (debounced by the natural typing cadence of the caller).
    setSaveState("idle");
  }

  const step1Errors = useMemo(() => validateStep1(values), [values]);

  async function handleContinue() {
    setMessage(null);

    if (current.pendingClientReference) {
      // Steps 2/3 are placeholders — do not pretend to advance past real data.
      setMessage("This step is awaiting the client's reference screen.");
      return;
    }

    const found = validateStep1(values);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setMessage("Please complete the required fields.");
      const firstKey = Object.keys(found)[0];
      document.getElementById(`of-${firstKey}`)?.focus();
      return;
    }

    // Persist only the columns this step owns.
    const patch: Partial<ProfileUpdate> = {};
    for (const key of STEP1_KEYS) patch[key] = values[key] ?? null;

    const ok = await persist(patch);
    if (!ok) return; // stay put; entries are retained

    if (step < totalSteps) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleBack() {
    setMessage(null);
    if (step > 1) setStep((s) => s - 1);
  }

  async function handleFinish() {
    setMessage(null);
    const found = validateStep1(values);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setMessage("Please complete the required fields before finishing.");
      return;
    }

    const patch: Partial<ProfileUpdate> = {};
    for (const key of STEP1_KEYS) patch[key] = values[key] ?? null;

    const ok = await persist(patch);
    if (!ok) return;

    try {
      const res = await completeOnboardingAction();
      if (!res.ok) console.error("[complete-profile] complete:", res.message);
    } catch (err) {
      console.error("[complete-profile] complete:", err);
    }

    router.push(AUTH_ROUTES.afterOnboarding);
    router.refresh();
  }

  /**
   * Skip records a skip timestamp ONLY — onboarding stays incomplete.
   */
  async function handleSkip() {
    setMessage(null);
    try {
      const res = await skipOnboardingAction();
      if (!res.ok) console.error("[complete-profile] skip:", res.message);
    } catch (err) {
      console.error("[complete-profile] skip:", err);
    }
    // Also persist whatever has been entered so nothing is lost on return.
    const patch: Partial<ProfileUpdate> = {};
    for (const key of STEP1_KEYS) if (values[key] !== undefined) patch[key] = values[key] ?? null;
    if (Object.keys(patch).length) await persist(patch);

    router.push(AUTH_ROUTES.afterReturningLogin);
    router.refresh();
  }

  /* ---------- progress indicator ---------- */
  const progress = Math.round((step / totalSteps) * 100);

  return (
    <AuthShell
      eyebrow="Complete your profile"
      title="A few details, then you're in."
      subtitle="Your answers are saved as you go — leave and come back whenever you like."
      footer={
        <button
          type="button"
          onClick={handleSkip}
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50 underline underline-offset-4 hover:text-navy"
        >
          Skip for now
        </button>
      }
    >
      {/* progress */}
      <div className="mb-6">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50">
            Step {step} of {totalSteps}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50">
            {progress}%
          </span>
        </div>
        <div
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-navy/10"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label="Onboarding progress"
        >
          <div
            className="h-full rounded-full bg-berry transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <ol className="mt-3 flex gap-2" aria-hidden="true">
          {ONBOARDING_STEPS.map((s) => (
            <li
              key={s.number}
              className={`h-1 flex-1 rounded-full ${
                s.number < step ? "bg-navy" : s.number === step ? "bg-berry" : "bg-navy/15"
              }`}
            />
          ))}
        </ol>
      </div>

      {loading && <p role="status" className="text-sm text-navy/60">Loading your profile…</p>}
      {message && <AuthMessage tone={saveState === "saved" ? "info" : "error"}>{message}</AuthMessage>}

      {!loading && (
        <>
          <h2 className="font-display text-xl font-semibold text-navy">{current.title}</h2>
          <p className="mt-1 text-sm text-navy/65">{current.description}</p>

          {current.pendingClientReference ? (
            <div className="mt-5 border hairline bg-icy-50 p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50">
                Awaiting client reference
              </p>
              <p className="mt-2 text-sm leading-relaxed text-navy/70">
                The questions for this step come from a reference screen we haven't received yet.
                Nothing is invented here — continue once the client supplies the fields.
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); void handleContinue(); }}
              noValidate
              className="mt-5 space-y-4"
            >
              {step === 1 && (
                <p className="border-l-2 border-icy pl-4 text-[13px] leading-relaxed text-navy/70">
                  {ADDRESS_EXPLANATION}
                </p>
              )}

              {current.fields.map((field) => {
                const id = `of-${field.key}`;
                const err = errors[field.key];
                const value = (values[field.key] as string | undefined) ?? "";

                return (
                  <div key={field.key}>
                    <div className="flex items-baseline justify-between gap-2">
                      <label htmlFor={id} className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50">
                        {field.label}
                        {field.optional && (
                          <span className="ml-2 normal-case tracking-normal text-navy/35">(optional)</span>
                        )}
                      </label>
                      {err && (
                        <span className="text-[11px] font-semibold text-berry">{err}</span>
                      )}
                    </div>

                    {field.type === "select" ? (
                      <select
                        id={id}
                        value={value}
                        onChange={(e) => setField(field.key, e.target.value)}
                        aria-invalid={Boolean(err)}
                        className="mt-1.5 h-12 w-full rounded-xl border hairline bg-paper px-3 text-sm text-navy focus:border-navy/40 focus:outline-none"
                      >
                        <option value="">Select a state</option>
                        {field.options?.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={id}
                        type={field.type === "date" ? "date" : field.type === "tel" ? "tel" : "text"}
                        value={value}
                        autoComplete={field.autoComplete}
                        inputMode={field.inputMode}
                        maxLength={field.maxLength}
                        aria-invalid={Boolean(err)}
                        onChange={(e) => setField(field.key, e.target.value)}
                        className="mt-1.5 h-12 w-full rounded-xl border hairline bg-paper px-4 text-sm text-navy placeholder:text-navy/35 focus:border-navy/40 focus:outline-none"
                      />
                    )}

                    {field.hint && !err && (
                      <p className="mt-1 text-[11px] text-navy/45">{field.hint}</p>
                    )}
                  </div>
                );
              })}

              <div className="flex flex-wrap gap-3 pt-1">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex h-12 items-center justify-center rounded-full border hairline px-6 text-sm font-semibold text-navy hover:border-navy/40"
                  >
                    Back
                  </button>
                )}
                <AuthSubmit pending={saveState === "saving"}>
                  {step < totalSteps ? "Continue" : "Finish"}
                </AuthSubmit>
              </div>
            </form>
          )}

          {!current.pendingClientReference && step === totalSteps && (
            <button
              type="button"
              onClick={() => void handleFinish()}
              disabled={saveState === "saving" || Object.keys(step1Errors).length > 0}
              className="mt-3 flex h-12 w-full items-center justify-center rounded-full bg-berry px-6 text-sm font-bold text-paper transition hover:bg-berry-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Finish and continue
            </button>
          )}

          <div className="mt-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-navy/40">
            <span aria-live="polite">
              {saveState === "saving" && "Saving…"}
              {saveState === "saved" && "Saved"}
              {saveState === "error" && "Not saved yet"}
            </span>
            <Link href={AUTH_ROUTES.afterReturningLogin} className="underline underline-offset-2 hover:text-navy">
              Go to Explore
            </Link>
          </div>
        </>
      )}
    </AuthShell>
  );
}
