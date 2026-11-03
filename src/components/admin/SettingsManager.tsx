"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertSettingAction, deleteSettingAction } from "@/lib/admin/actions";
import type { SiteSettingRow } from "@/lib/cms/types";

const INPUT =
  "w-full rounded border hairline bg-paper px-3 py-1.5 text-xs text-navy focus:border-navy focus:outline-none";

export function SettingsManager({
  settings,
  isAdmin,
}: {
  settings: SiteSettingRow[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");
  const [newKind, setNewKind] = useState<"string" | "number" | "boolean" | "json">("string");
  const [newDesc, setNewDesc] = useState("");

  const handleSave = (
    e: React.FormEvent,
    key: string,
    value_kind: "string" | "number" | "boolean" | "json",
    rawVal: string,
    desc?: string,
  ) => {
    e.preventDefault();
    let parsed: unknown = rawVal;
    if (value_kind === "number") {
      parsed = Number(rawVal);
      if (Number.isNaN(parsed)) {
        setFeedback({ tone: "err", text: "Value must be a valid number." });
        return;
      }
    } else if (value_kind === "boolean") {
      parsed = rawVal === "true" || rawVal === "1";
    } else if (value_kind === "json") {
      try {
        parsed = JSON.parse(rawVal);
      } catch {
        setFeedback({ tone: "err", text: "Value must be valid JSON." });
        return;
      }
    }

    startTransition(async () => {
      const res = await upsertSettingAction({
        key,
        value: parsed,
        value_kind,
        description: desc ?? null,
      });
      if (!res.ok) {
        setFeedback({ tone: "err", text: `Save failed: ${res.code}${res.message ? ` — ${res.message}` : ""}` });
      } else {
        setFeedback({ tone: "ok", text: `Setting '${key}' saved.` });
        setEditingKey(null);
        setNewKey("");
        setNewVal("");
        setNewDesc("");
        router.refresh();
      }
    });
  };

  const handleDelete = (key: string) => {
    if (!confirm(`Delete setting '${key}'?`)) return;
    startTransition(async () => {
      const res = await deleteSettingAction(key);
      if (!res.ok) {
        setFeedback({ tone: "err", text: `Delete failed: ${res.code}` });
      } else {
        setFeedback({ tone: "ok", text: `Setting '${key}' deleted.` });
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {feedback ? (
        <p
          className={`border p-3 text-xs ${
            feedback.tone === "ok" ? "border-navy/20 bg-icy-100 text-navy" : "border-berry/30 bg-berry/5 text-berry"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}

      {/* Add new setting */}
      <form
        onSubmit={(e) => handleSave(e, newKey, newKind, newVal, newDesc)}
        className="grid gap-3 rounded border hairline bg-paper p-4"
      >
        <h3 className="font-display text-sm font-semibold text-navy">Add or Override Setting</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="grid gap-1 text-xs">
            <span className="font-mono text-[10px] uppercase tracking-wider text-navy/50">Key</span>
            <input
              required
              placeholder="e.g. site.announcement_banner"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className={INPUT}
            />
          </label>
          <label className="grid gap-1 text-xs">
            <span className="font-mono text-[10px] uppercase tracking-wider text-navy/50">Kind</span>
            <select
              value={newKind}
              onChange={(e) => setNewKind(e.target.value as "string" | "number" | "boolean" | "json")}
              className="rounded border hairline bg-paper px-2 py-1.5 text-xs text-navy"
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="json">JSON</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs sm:col-span-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-navy/50">Value</span>
            <input
              required
              placeholder="Value..."
              value={newVal}
              onChange={(e) => setNewVal(e.target.value)}
              className={INPUT}
            />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <input
            placeholder="Description / Purpose..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className={`${INPUT} flex-1`}
          />
          <button
            type="submit"
            disabled={pending || !newKey.trim()}
            className="rounded-full bg-navy px-4 py-1.5 text-xs font-semibold text-paper hover:bg-navy-600 disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save Setting"}
          </button>
        </div>
      </form>

      {/* Settings list */}
      <div className="overflow-x-auto border hairline bg-paper">
        <table className="w-full text-left text-sm text-navy">
          <thead className="border-b hairline bg-icy-50 font-mono text-[10px] uppercase tracking-wider text-navy/60">
            <tr>
              <th className="px-4 py-3">Key & Description</th>
              <th className="px-4 py-3">Kind</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Updated</th>
              {isAdmin ? <th className="px-4 py-3 text-right">Actions</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y hairline">
            {settings.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="px-4 py-8 text-center text-xs text-navy/50">
                  No configured site settings. Add one above.
                </td>
              </tr>
            ) : (
              settings.map((s) => {
                const isEditing = editingKey === s.key;
                return (
                  <tr key={s.key} className="transition hover:bg-icy-50/50">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs font-semibold text-navy">{s.key}</div>
                      {s.description ? (
                        <div className="text-xs text-navy/60">{s.description}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-navy/60">
                      {s.value_kind}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">
                      {isEditing ? (
                        <input
                          id={`edit-${s.key}`}
                          defaultValue={
                            typeof s.value === "object" ? JSON.stringify(s.value) : String(s.value ?? "")
                          }
                          className={INPUT}
                        />
                      ) : (
                        <code className="font-mono text-xs text-navy/80">
                          {typeof s.value === "object" ? JSON.stringify(s.value) : String(s.value ?? "")}
                        </code>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-navy/60">
                      {s.updated_at ? new Date(s.updated_at).toLocaleDateString() : "—"}
                    </td>
                    {isAdmin ? (
                      <td className="px-4 py-3 text-right space-x-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                const input = document.getElementById(`edit-${s.key}`) as HTMLInputElement;
                                if (input) handleSave(e, s.key, s.value_kind, input.value, s.description ?? undefined);
                              }}
                              className="rounded bg-navy px-2.5 py-1 text-xs font-medium text-paper hover:bg-navy-600"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingKey(null)}
                              className="rounded border hairline px-2.5 py-1 text-xs font-medium text-navy/70 hover:bg-icy-100"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setEditingKey(s.key)}
                              className="rounded border hairline bg-paper px-2.5 py-1 text-xs font-medium text-navy hover:bg-icy-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(s.key)}
                              className="rounded border border-berry/30 px-2.5 py-1 text-xs font-medium text-berry hover:bg-berry/5"
                            >
                              Delete
                            </button>
                          </>
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
