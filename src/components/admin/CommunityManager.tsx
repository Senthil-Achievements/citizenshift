"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  upsertCommunityAction,
  deleteCommunityAction,
  listChannelsAction,
  upsertChannelAction,
} from "@/lib/admin/actions";
import type { ChannelRow, CommunityRow } from "@/lib/cms/types";

const INPUT =
  "w-full rounded border hairline bg-paper px-3 py-1.5 text-xs text-navy focus:border-navy focus:outline-none";

export function CommunityManager({
  communities,
  isAdmin,
}: {
  communities: CommunityRow[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  // Community creation/editing modal state
  const [editingCommunity, setEditingCommunity] = useState<Partial<CommunityRow> | null>(null);

  // Channels drawer for selected community
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityRow | null>(null);
  const [channels, setChannels] = useState<ChannelRow[] | null>(null);
  const [newChannelName, setNewChannelName] = useState("");

  const handleOpenChannels = (c: CommunityRow) => {
    setSelectedCommunity(c);
    startTransition(async () => {
      const res = await listChannelsAction(c.id);
      if (res.ok) setChannels(res.data.rows);
      else setFeedback({ tone: "err", text: `Failed to load channels: ${res.code}` });
    });
  };

  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommunity || !newChannelName.trim()) return;
    startTransition(async () => {
      const res = await upsertChannelAction(null, {
        community_id: selectedCommunity.id,
        name: newChannelName.trim(),
        is_active: true,
      });
      if (!res.ok) {
        setFeedback({ tone: "err", text: `Add channel failed: ${res.code}` });
      } else {
        setNewChannelName("");
        const refreshed = await listChannelsAction(selectedCommunity.id);
        if (refreshed.ok) setChannels(refreshed.data.rows);
      }
    });
  };

  const handleDeleteCommunity = (id: string, name: string) => {
    if (!confirm(`Delete community "${name}" and its channels?`)) return;
    startTransition(async () => {
      const res = await deleteCommunityAction(id);
      if (!res.ok) {
        setFeedback({ tone: "err", text: `Delete failed: ${res.code}` });
      } else {
        setFeedback({ tone: "ok", text: "Community deleted." });
        if (selectedCommunity?.id === id) setSelectedCommunity(null);
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

      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-navy">Communities</h2>
        <button
          type="button"
          onClick={() => setEditingCommunity({ publish_state: "published" })}
          className="rounded-full bg-navy px-4 py-1.5 text-xs font-semibold text-paper hover:bg-navy-600"
        >
          + New Community
        </button>
      </div>

      {editingCommunity ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const name = String(fd.get("name") ?? "").trim();
            const slug = String(fd.get("slug") ?? "").trim();
            const description = String(fd.get("description") ?? "").trim();
            const publish_state = String(fd.get("publish_state") ?? "published") as "published" | "draft" | "archived";

            if (!name) return;

            startTransition(async () => {
              const res = await upsertCommunityAction(editingCommunity.id ?? null, {
                name,
                slug: slug || undefined,
                description: description || undefined,
                publish_state,
              });
              if (!res.ok) {
                setFeedback({ tone: "err", text: `Save failed: ${res.code}` });
              } else {
                setFeedback({ tone: "ok", text: "Community saved successfully." });
                setEditingCommunity(null);
                router.refresh();
              }
            });
          }}
          className="grid gap-3 rounded border hairline bg-paper p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-navy">
              {editingCommunity.id ? "Edit Community" : "Create Community"}
            </h3>
            <button
              type="button"
              onClick={() => setEditingCommunity(null)}
              className="text-xs text-navy/50 hover:text-navy"
            >
              Cancel
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-xs sm:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-navy/50">Name</span>
              <input name="name" defaultValue={editingCommunity.name ?? ""} required className={INPUT} />
            </label>
            <label className="grid gap-1 text-xs">
              <span className="font-mono text-[10px] uppercase tracking-wider text-navy/50">Slug (optional)</span>
              <input name="slug" defaultValue={editingCommunity.slug ?? ""} className={INPUT} />
            </label>
          </div>

          <label className="grid gap-1 text-xs">
            <span className="font-mono text-[10px] uppercase tracking-wider text-navy/50">Description</span>
            <textarea name="description" rows={2} defaultValue={editingCommunity.description ?? ""} className={INPUT} />
          </label>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs">
              <span className="font-mono text-[10px] uppercase tracking-wider text-navy/50">State</span>
              <select name="publish_state" defaultValue={editingCommunity.publish_state ?? "published"} className="rounded border hairline bg-paper px-2 py-1 text-xs text-navy">
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-navy px-4 py-1.5 text-xs font-semibold text-paper hover:bg-navy-600 disabled:opacity-50"
            >
              {pending ? "Saving..." : "Save Community"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="overflow-x-auto border hairline bg-paper lg:col-span-2">
          <table className="w-full text-left text-sm text-navy">
            <thead className="border-b hairline bg-icy-50 font-mono text-[10px] uppercase tracking-wider text-navy/60">
              <tr>
                <th className="px-4 py-3">Community</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y hairline">
              {communities.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-xs text-navy/50">
                    No communities found. Click "+ New Community" above to create one.
                  </td>
                </tr>
              ) : (
                communities.map((c) => (
                  <tr key={c.id} className={`transition hover:bg-icy-50/50 ${selectedCommunity?.id === c.id ? "bg-icy-100" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-navy">{c.name}</div>
                      <div className="font-mono text-xs text-navy/50">/{c.slug}</div>
                      {c.description ? <p className="mt-0.5 line-clamp-1 text-xs text-navy/70">{c.description}</p> : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-navy/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-navy">
                        {c.publish_state}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenChannels(c)}
                        className="rounded border hairline bg-paper px-2.5 py-1 text-xs font-medium text-navy hover:bg-icy-100"
                      >
                        Channels
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCommunity(c)}
                        className="rounded border hairline bg-paper px-2.5 py-1 text-xs font-medium text-navy hover:bg-icy-100"
                      >
                        Edit
                      </button>
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteCommunity(c.id, c.name)}
                          className="rounded border border-berry/30 px-2.5 py-1 text-xs font-medium text-berry hover:bg-berry/5"
                        >
                          Delete
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Channels panel */}
        <div className="border hairline bg-paper p-4">
          <h3 className="font-display text-base font-semibold text-navy">
            {selectedCommunity ? `Channels in ${selectedCommunity.name}` : "Select a community"}
          </h3>
          <p className="mt-0.5 text-xs text-navy/50">
            {selectedCommunity ? "Manage discussion rooms for this civic topic" : "Click 'Channels' on any community to manage its rooms"}
          </p>

          {selectedCommunity ? (
            <div className="mt-4 space-y-4">
              <form onSubmit={handleAddChannel} className="flex gap-2">
                <input
                  placeholder="New channel name..."
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className={INPUT}
                />
                <button
                  type="submit"
                  disabled={pending || !newChannelName.trim()}
                  className="rounded bg-navy px-3 py-1 text-xs font-semibold text-paper hover:bg-navy-600 disabled:opacity-50"
                >
                  Add
                </button>
              </form>

              <div className="space-y-1">
                {channels === null ? (
                  <p className="text-xs text-navy/40">Loading channels...</p>
                ) : channels.length === 0 ? (
                  <p className="text-xs text-navy/40">No channels yet.</p>
                ) : (
                  channels.map((ch) => (
                    <div
                      key={ch.id}
                      className="flex items-center justify-between rounded border hairline bg-paper p-2 text-xs"
                    >
                      <div>
                        <span className="font-medium text-navy">#{ch.name}</span>
                        <span className="ml-2 font-mono text-[10px] text-navy/40">/{ch.slug}</span>
                      </div>
                      <span className={`text-[10px] font-mono uppercase ${ch.is_active ? "text-navy/60" : "text-berry"}`}>
                        {ch.is_active ? "Active" : "Archived"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
