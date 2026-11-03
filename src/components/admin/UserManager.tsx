"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { grantEditorAction, revokeEditorAction } from "@/lib/admin/actions";
import type { AdminUserRow } from "@/lib/cms/users";

export function UserManager({
  users,
  isAdmin,
}: {
  users: AdminUserRow[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const handleGrant = (userId: string, email: string | null) => {
    if (!confirm(`Grant CMS Editor role to ${email ?? userId}?`)) return;
    startTransition(async () => {
      const res = await grantEditorAction(userId);
      if (!res.ok) {
        setFeedback({ tone: "err", text: `Grant failed: ${res.code}${res.message ? ` — ${res.message}` : ""}` });
      } else {
        setFeedback({ tone: "ok", text: `Editor role granted to ${email ?? userId}.` });
        router.refresh();
      }
    });
  };

  const handleRevoke = (userId: string, email: string | null) => {
    if (!confirm(`Revoke CMS Editor role from ${email ?? userId}?`)) return;
    startTransition(async () => {
      const res = await revokeEditorAction(userId);
      if (!res.ok) {
        setFeedback({ tone: "err", text: `Revoke failed: ${res.code}${res.message ? ` — ${res.message}` : ""}` });
      } else {
        setFeedback({ tone: "ok", text: `Editor role revoked from ${email ?? userId}.` });
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      {feedback ? (
        <p
          className={`border p-3 text-xs ${
            feedback.tone === "ok" ? "border-navy/20 bg-icy-100 text-navy" : "border-berry/30 bg-berry/5 text-berry"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}

      <div className="overflow-x-auto border hairline bg-paper">
        <table className="w-full text-left text-sm text-navy">
          <thead className="border-b hairline bg-icy-50 font-mono text-[10px] uppercase tracking-wider text-navy/60">
            <tr>
              <th className="px-4 py-3">User & Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Registered</th>
              <th className="px-4 py-3">Last Sign In</th>
              {isAdmin ? <th className="px-4 py-3 text-right">Role Management</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y hairline">
            {users.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="px-4 py-8 text-center text-xs text-navy/50">
                  No users found matching query.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const roleBadge =
                  u.role === "admin"
                    ? "bg-berry/10 text-berry font-bold"
                    : u.role === "editor"
                      ? "bg-navy/15 text-navy font-semibold"
                      : "bg-navy/5 text-navy/60";

                return (
                  <tr key={u.id} className="transition hover:bg-icy-50/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-navy">{u.fullName || "—"}</div>
                      <div className="font-mono text-xs text-navy/60">{u.email ?? u.id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${roleBadge}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-navy/60">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-navy/60">
                      {u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleString() : "Never"}
                    </td>
                    {isAdmin ? (
                      <td className="px-4 py-3 text-right">
                        {u.role === "admin" ? (
                          <span className="font-mono text-[10px] uppercase tracking-wider text-navy/40">
                            Allowlist Protected
                          </span>
                        ) : u.role === "editor" ? (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => handleRevoke(u.id, u.email)}
                            className="rounded border border-berry/30 px-3 py-1 text-xs font-medium text-berry hover:bg-berry/5 disabled:opacity-50"
                          >
                            Revoke Editor
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => handleGrant(u.id, u.email)}
                            className="rounded border hairline bg-paper px-3 py-1 text-xs font-medium text-navy hover:bg-icy-100 disabled:opacity-50"
                          >
                            Grant Editor
                          </button>
                        )}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

