"use client";

import { useState } from "react";
import type { AuditLogRow } from "@/lib/cms/types";

export function AuditLogViewer({ logs }: { logs: AuditLogRow[] }) {
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null);

  return (
    <div className="space-y-4">
      {/* Detail modal/drawer */}
      {selectedLog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-xs">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border hairline bg-paper p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-berry">
                  Audit Record #{selectedLog.id.slice(0, 8)}
                </span>
                <h3 className="mt-1 font-display text-lg font-semibold text-navy">
                  {selectedLog.action} {selectedLog.entity_type} {selectedLog.entity_label ? `"${selectedLog.entity_label}"` : ""}
                </h3>
                <p className="font-mono text-xs text-navy/50">
                  {new Date(selectedLog.created_at).toLocaleString()} by {selectedLog.actor_label ?? "System"}
                </p>
                {selectedLog.summary ? (
                  <p className="mt-2 text-xs text-navy/75">{selectedLog.summary}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded p-1 text-navy/60 hover:text-navy"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              {selectedLog.before_data ? (
                <div>
                  <h4 className="font-mono text-[11px] uppercase tracking-wider text-navy/60">Before Mutation</h4>
                  <pre className="mt-1 max-h-48 overflow-auto rounded bg-icy-50 p-3 font-mono text-xs text-navy">
                    {JSON.stringify(selectedLog.before_data, null, 2)}
                  </pre>
                </div>
              ) : null}

              {selectedLog.after_data ? (
                <div>
                  <h4 className="font-mono text-[11px] uppercase tracking-wider text-navy/60">After Mutation</h4>
                  <pre className="mt-1 max-h-48 overflow-auto rounded bg-icy-50 p-3 font-mono text-xs text-navy">
                    {JSON.stringify(selectedLog.after_data, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded bg-navy px-4 py-1.5 text-xs font-semibold text-paper hover:bg-navy-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto border hairline bg-paper">
        <table className="w-full text-left text-sm text-navy">
          <thead className="border-b hairline bg-icy-50 font-mono text-[10px] uppercase tracking-wider text-navy/60">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y hairline">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs text-navy/50">
                  No audit log entries recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="transition hover:bg-icy-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-navy/60">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-navy">{log.actor_label ?? "System"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-navy/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-navy font-semibold">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-navy/60">{log.entity_type}:</span>{" "}
                    <span className="font-medium text-navy">{log.entity_label || log.entity_id || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      className="rounded border hairline bg-paper px-2.5 py-1 text-xs font-medium text-navy hover:bg-icy-100"
                    >
                      View Diff
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
