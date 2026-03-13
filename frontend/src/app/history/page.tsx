"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "../components/layout/Sidebar";
import { Mic, Monitor, Calendar, Clock, ExternalLink, Trash2, Search } from "lucide-react";
import { sessionApi, type Session } from "@/lib/api";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";

type Filter = "all" | "interview" | "presentation";

function ScoreBadge({ score }: { score: number }) {
  const colorClass = score >= 80 ? "text-green-500 bg-green-500/[12%]" : score >= 70 ? "text-amber-500 bg-amber-500/[12%]" : "text-red-500 bg-red-500/[12%]";
  return (
    <span className={`px-3 py-1 rounded-full text-[13px] font-bold ${colorClass}`}>
      {score}/100
    </span>
  );
}

export default function HistoryPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  useEffect(() => {
    sessionApi.list({ limit: 100, mode: filter !== "all" ? filter : undefined })
      .then((data) => {
        setSessions(data);
        setTotal(data.length);
      })
      .catch((err) => console.error("History load error:", err))
      .finally(() => setLoading(false));
  }, [filter]);

  const filtered = sessions.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    // Keep selection in sync with visible data after refresh/filtering.
    setSelectedIds((prev) => {
      const validIds = new Set(sessions.map((s) => s.id));
      const next = new Set<string>();
      for (const id of prev) {
        if (validIds.has(id)) next.add(id);
      }
      return next;
    });
  }, [sessions]);

  const deleteSession = async (id: string) => {
    try {
      await sessionApi.delete(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setTotal((t) => t - 1);
    } catch (err) {
      console.error("Delete session error:", err);
    }
  };

  const confirmDeleteSession = async () => {
    if (!pendingDeleteId) return;
    await deleteSession(pendingDeleteId);
    setPendingDeleteId(null);
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleIds = filtered.map((s) => s.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const deleteSelectedSessions = async () => {
    const idsToDelete = Array.from(selectedIds);
    if (idsToDelete.length === 0) {
      setShowBulkDeleteConfirm(false);
      return;
    }

    const results = await Promise.allSettled(idsToDelete.map((id) => sessionApi.delete(id)));
    const succeededIds = idsToDelete.filter((_, i) => results[i].status === "fulfilled");

    if (succeededIds.length > 0) {
      const succeededSet = new Set(succeededIds);
      setSessions((prev) => prev.filter((s) => !succeededSet.has(s.id)));
      setTotal((t) => Math.max(0, t - succeededIds.length));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        succeededIds.forEach((id) => next.delete(id));
        return next;
      });
    }

    const failedCount = results.length - succeededIds.length;
    if (failedCount > 0) {
      console.error(`Failed to delete ${failedCount} session(s).`);
    }

    setShowBulkDeleteConfirm(false);
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-slate-50 text-2xl font-extrabold">Session History</h1>
          <p className="text-slate-500 text-sm mt-1">{total} sessions completed</p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg outline-none bg-[#1E293B] border border-[#334155] text-slate-50 text-sm"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-[#1e1e1e]">
            {(["all", "interview", "presentation"] as Filter[]).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg capitalize transition-all text-[13px] ${filter === f ? "bg-[#2a2a2a] text-slate-50 font-semibold" : "text-slate-500 font-normal"
                  }`}>
                {f === "all" ? "All Sessions" : f === "interview" ? "Interview" : "Presentation"}
              </button>
            ))}
          </div>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-[#1e1e1e] border border-[#2a2a2a]">
            <label className="inline-flex items-center gap-2 text-slate-400 text-sm">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAllVisible}
                className="h-4 w-4 rounded border-[#334155] bg-[#111111] text-blue-500"
              />
              Select all visible
            </label>
            <span className="text-slate-500 text-sm sm:ml-auto">
              {selectedIds.size} selected
            </span>
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              disabled={selectedIds.size === 0}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={14} /> Delete Selected
            </button>
          </div>
        )}

        {/* Session Cards */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-[#1e1e1e]">
              <Mic size={32} color="#334155" />
            </div>
            <p className="text-slate-500 text-base font-medium">No sessions found</p>
            <p className="text-[#334155] text-sm">Try adjusting your filters or start a new session</p>
            <Link href="/session/setup"
              className="px-5 py-2.5 rounded-lg bg-blue-500 text-white text-sm font-semibold no-underline">
              Start New Session
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((session) => (
              <div key={session.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a]">
                {/* Icon */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(session.id)}
                    onChange={() => toggleSelected(session.id)}
                    className="h-4 w-4 rounded border-[#334155] bg-[#111111] text-blue-500"
                    aria-label={`Select ${session.name}`}
                  />
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${session.mode === "interview" ? "bg-blue-500/[12%]" : "bg-violet-500/[12%]"
                    }`}>
                    {session.mode === "interview"
                      ? <Mic size={22} color="#3B82F6" />
                      : <Monitor size={22} color="#8B5CF6" />}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-slate-50 text-[15px] font-semibold">{session.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${session.mode === "interview" ? "bg-blue-500/10 text-blue-500" : "bg-violet-500/10 text-violet-500"
                      }`}>
                      {session.mode === "interview" ? "Interview" : "Presentation"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1 text-slate-500 text-xs">
                      <Calendar size={11} />
                      {new Date(session.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500 text-xs">
                      <Clock size={11} />
                      {session.duration_seconds ? `${Math.floor(session.duration_seconds / 60)} min` : "—"}
                    </span>
                    <span className="text-slate-500 text-xs capitalize">
                      Status: <span className={session.status === "completed" ? "text-green-500" : "text-amber-500"}>{session.status}</span>
                    </span>
                  </div>
                </div>

                {/* Score + Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {session.overall_score != null ? (
                    <ScoreBadge score={session.overall_score} />
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[13px] font-bold text-slate-500 bg-[#2a2a2a]">—/100</span>
                  )}
                  {session.status === "completed" && (
                    <Link href={`/session/report/${session.id}`}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-500 text-[13px] font-medium no-underline border border-blue-500/20">
                      <ExternalLink size={13} /> Report
                    </Link>
                  )}
                  <button
                    onClick={() => setPendingDeleteId(session.id)}
                    className="p-2 rounded-lg transition-colors hover:text-red-400 text-slate-500 border border-[#2a2a2a]">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete session?"
        description="This will permanently remove the session and its associated data."
        confirmText="Delete"
        onClose={() => setPendingDeleteId(null)}
        onConfirm={confirmDeleteSession}
        icon={<Trash2 size={22} color="#EF4444" />}
      />

      <ConfirmDialog
        open={showBulkDeleteConfirm}
        title={`Delete ${selectedIds.size} selected session${selectedIds.size === 1 ? "" : "s"}?`}
        description="This will permanently remove the selected sessions and their associated data."
        confirmText="Delete Selected"
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={deleteSelectedSessions}
        icon={<Trash2 size={22} color="#EF4444" />}
      />
    </DashboardLayout>
  );
}
