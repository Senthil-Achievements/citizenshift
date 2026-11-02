"use client";

/**
 * SignOutButton — triggers the server-side sign-out action.
 *
 * The actual revocation happens in a Server Action (lib/auth/sign-out.ts) so
 * the session is invalidated at the Auth server, not just in this browser.
 */

import { useState, useTransition } from "react";
import { signOutAction } from "@/lib/auth/sign-out";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      {error && (
        <span role="alert" className="font-mono text-[10px] uppercase tracking-[0.14em] text-berry">
          {error}
        </span>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await signOutAction();
            } catch (err) {
              // redirect() throws internally in Next; treat navigation as success.
              if (err && typeof err === "object" && "digest" in err) return;
              console.error("[signout]", err);
              setError("Sign-out failed — try again.");
            }
          });
        }}
        className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/55 underline underline-offset-4 transition hover:text-berry disabled:opacity-50"
      >
        {pending ? "Signing out…" : "Sign Out"}
      </button>
    </div>
  );
}
