"use client";

/**
 * PersonalInfoForm — the editable Personal Information form.
 *
 * Field labels and the ZIP / street-address explanation follow the reference
 * screenshot. Each control maps to a real `profiles` column (see the field
 * `name` attributes), and submission calls updateOwnProfile(), which scopes
 * the write to the session user's row.
 *
 * Email is rendered read-only with an explanatory note — it is an Auth-server
 * identity, not a profile column.
 *
 * ⚠️ UNVERIFIED BUILD — see docs/supabase-configuration-report.md.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProfileUpdate } from "@/lib/supabase/profiles";
import { saveProfileAction } from "@/lib/auth/profile-actions";
import { STATE_OPTIONS } from "@/lib/auth/onboarding";
import { ADDRESS_EXPLANATION } from "@/lib/auth/onboarding";

type FormState = Record<keyof ProfileUpdate, string>;

interface Props {
  email: string;
  provider: string;
  initial: FormState;
  /** True when the profiles table could not be read (migration pending). */
  notConfigured: boolean;
}

const LABEL =
  "font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50";
const INPUT =
  "mt-1.5 h-12 w-full rounded-xl border hairline bg-paper px-4 text-sm text-navy placeholder:text-navy/35 focus:border-navy/40 focus:outline-none";

export function PersonalInfoForm({ email, provider, initial, notConfigured }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  function set(key: keyof FormState, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setStatus("idle");
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!values.first_name.trim()) e.first_name = "Required.";
    if (!values.last_name.trim()) e.last_name = "Required.";
    const u = values.username.trim();
    if (!u) e.username = "Required.";
    else if (!/^[A-Za-z0-9_]{3,30}$/.test(u)) e.username = "3–30 letters, numbers or underscores.";
    if (!values.state) e.state = "Required.";
    const zip = values.zip_code.trim();
    if (!zip) e.zip_code = "Required.";
    else if (!/^\d{5}$/.test(zip)) e.zip_code = "Five digits.";
    if (values.phone_number.trim() && !/^[\d\s()+.-]{7,20}$/.test(values.phone_number.trim())) {
      e.phone_number = "Invalid number.";
    }
    if (values.date_of_birth) {
      const d = new Date(values.date_of_birth);
      if (Number.isNaN(d.getTime()) || d > new Date()) e.date_of_birth = "Invalid date.";
    }
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const found = validate();
    if (Object.keys(found).length) {
      setErrors(found);
      setStatus("error");
      setMessage("Please correct the highlighted fields.");
      return;
    }

    setStatus("saving");
    try {
      const patch: ProfileUpdate = {
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        username: values.username.trim(),
        phone_number: values.phone_number.trim() || null,
        date_of_birth: values.date_of_birth || null,
        state: values.state,
        zip_code: values.zip_code.trim(),
        street_address: values.street_address.trim() || null,
      };
      const res = await saveProfileAction(patch);
      if (!res.ok) {
        // Surface the typed server error so the existing message mapping runs.
        throw new Error(res.message ?? "Could not save your details.");
      }
      setStatus("saved");
      setMessage("Saved.");
      router.refresh();
    } catch (err) {
      console.error("[settings] save:", err);
      setStatus("error");
      const text = err instanceof Error ? err.message : "Could not save.";
      setMessage(
        /username is already taken/i.test(text)
          ? "That username is already taken."
          : /not configured/i.test(text)
            ? "Profiles aren't configured yet — nothing was saved."
            : text,
      );
    }
  }

  const field = (
    key: keyof FormState,
    label: string,
    opts: {
      type?: string;
      optional?: boolean;
      autoComplete?: string;
      inputMode?: "text" | "numeric";
      maxLength?: number;
      hint?: string;
    } = {},
  ) => {
    const id = `pi-${key}`;
    const err = errors[key];
    return (
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <label htmlFor={id} className={LABEL}>
            {label}
            {opts.optional && <span className="ml-2 normal-case tracking-normal text-navy/35">(optional)</span>}
          </label>
          {err && <span className="text-[11px] font-semibold text-berry">{err}</span>}
        </div>
        <input
          id={id}
          name={key}
          type={opts.type ?? "text"}
          value={values[key]}
          autoComplete={opts.autoComplete}
          inputMode={opts.inputMode}
          maxLength={opts.maxLength}
          aria-invalid={Boolean(err)}
          onChange={(e) => set(key, e.target.value)}
          className={INPUT}
        />
        {opts.hint && !err && <p className="mt-1 text-[11px] text-navy/45">{opts.hint}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {notConfigured && (
        <div className="border border-navy/15 bg-icy-100 px-5 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/60">
            Profiles not configured
          </p>
          <p className="mt-1 text-sm text-navy/75">
            The profiles table isn't reachable yet, so nothing can be saved. Fields below are
            editable but submissions will report a configuration error.
          </p>
        </div>
      )}

      {message && (
        <div
          role={status === "error" ? "alert" : "status"}
          className={`border px-4 py-3 text-sm ${
            status === "error"
              ? "border-berry/30 bg-berry-100 text-berry-700"
              : "border-navy/15 bg-icy-100 text-navy/80"
          }`}
        >
          {message}
        </div>
      )}

      {/* --- identity --- */}
      <section className="border hairline bg-paper">
        <h2 className="border-b hairline px-5 py-4 font-display text-lg font-semibold text-navy">
          Identity
        </h2>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {field("first_name", "First name", { autoComplete: "given-name" })}
          {field("last_name", "Last name", { autoComplete: "family-name" })}
          {field("username", "Username", {
            autoComplete: "username",
            hint: "How you appear in the community.",
          })}

          <div>
            <label htmlFor="pi-email" className={LABEL}>
              Email
            </label>
            <input
              id="pi-email"
              type="email"
              value={email}
              readOnly
              disabled
              aria-describedby="pi-email-note"
              className={`${INPUT} cursor-not-allowed bg-navy/5 text-navy/60`}
            />
            <p id="pi-email-note" className="mt-1 text-[11px] text-navy/45">
              Read-only — managed by your {provider === "google" ? "Google" : "email"} sign-in.
              Changing it requires the account email flow.
            </p>
          </div>
        </div>
      </section>

      {/* --- contact --- */}
      <section className="border hairline bg-paper">
        <h2 className="border-b hairline px-5 py-4 font-display text-lg font-semibold text-navy">
          Contact &amp; location
        </h2>
        <div className="space-y-4 p-5">
          <p className="border-l-2 border-icy pl-4 text-[13px] leading-relaxed text-navy/70">
            {ADDRESS_EXPLANATION}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {field("phone_number", "Phone number", {
              type: "tel",
              optional: true,
              autoComplete: "tel",
              inputMode: "numeric",
            })}
            {field("date_of_birth", "Date of birth", { type: "date" })}
          </div>

          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <label htmlFor="pi-state" className={LABEL}>
                State
              </label>
              {errors.state && <span className="text-[11px] font-semibold text-berry">{errors.state}</span>}
            </div>
            <select
              id="pi-state"
              name="state"
              value={values.state}
              aria-invalid={Boolean(errors.state)}
              onChange={(e) => set("state", e.target.value)}
              className={`${INPUT} px-3`}
            >
              <option value="">Select a state</option>
              {STATE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {field("zip_code", "ZIP code", {
              autoComplete: "postal-code",
              inputMode: "numeric",
              maxLength: 5,
              hint: "Five digits.",
            })}
            {field("street_address", "Street address", {
              optional: true,
              autoComplete: "street-address",
            })}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === "saving"}
          className="flex h-12 items-center justify-center rounded-full bg-berry px-8 text-sm font-bold text-paper transition hover:bg-berry-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : "Save changes"}
        </button>
        <span aria-live="polite" className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/45">
          {status === "saved" && "All changes saved"}
          {status === "error" && "Not saved"}
        </span>
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/40">
        Race/ethnicity and political-leaning information are not collected.
      </p>
    </form>
  );
}
