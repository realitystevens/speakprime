"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "../components/layout/Sidebar";
import { Mic, Monitor, Calendar, Clock, ExternalLink, Trash2, Search } from "lucide-react";

const allSessions = [
  { id: "1", name: "Google PM Interview Practice", mode: "Interview", date: "Mar 7, 2026", duration: "32 min", score: 82, fillerWords: 12, eyeContact: 90 },
  { id: "2", name: "Q1 Strategy Deck Presentation", mode: "Presentation", date: "Mar 5, 2026", duration: "18 min", score: 74, fillerWords: 8, eyeContact: 78 },
  { id: "3", name: "Behavioral Round \u2014 Amazon", mode: "Interview", date: "Mar 2, 2026", duration: "45 min", score: 88, fillerWords: 7, eyeContact: 92 },
  { id: "4", name: "Product Demo \u2014 Seed Pitch", mode: "Presentation", date: "Feb 28, 2026", duration: "22 min", score: 69, fillerWords: 18, eyeContact: 65 },
  { id: "5", name: "Technical Round \u2014 Meta", mode: "Interview", date: "Feb 25, 2026", duration: "38 min", score: 75, fillerWords: 10, eyeContact: 83 },
  { id: "6", name: "Board Update Q4 2025", mode: "Presentation", date: "Feb 20, 2026", duration: "28 min", score: 79, fillerWords: 9, eyeContact: 87 },
  { id: "7", name: "Case Study Interview \u2014 McKinsey", mode: "Interview", date: "Feb 15, 2026", duration: "50 min", score: 71, fillerWords: 15, eyeContact: 76 },
];

type Filter = "all" | "Interview" | "Presentation";

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
  const [sessions, setSessions] = useState(allSessions);

  const filtered = sessions.filter((s) => {
    const matchesFilter = filter === "all" || s.mode === filter;
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-slate-50 text-2xl font-extrabold">Session History</h1>
          <p className="text-slate-500 text-sm mt-1">{sessions.length} sessions completed</p>
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
            {(["all", "Interview", "Presentation"] as Filter[]).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg capitalize transition-all text-[13px] ${
                  filter === f ? "bg-[#2a2a2a] text-slate-50 font-semibold" : "text-slate-500 font-normal"
                }`}>
                {f === "all" ? "All Sessions" : f}
              </button>
            ))}
          </div>
        </div>

        {/* Session Cards */}
        {filtered.length === 0 ? (
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
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  session.mode === "Interview" ? "bg-blue-500/[12%]" : "bg-violet-500/[12%]"
                }`}>
                  {session.mode === "Interview"
                    ? <Mic size={22} color="#3B82F6" />
                    : <Monitor size={22} color="#8B5CF6" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-slate-50 text-[15px] font-semibold">{session.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      session.mode === "Interview" ? "bg-blue-500/10 text-blue-500" : "bg-violet-500/10 text-violet-500"
                    }`}>
                      {session.mode}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1 text-slate-500 text-xs">
                      <Calendar size={11} /> {session.date}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500 text-xs">
                      <Clock size={11} /> {session.duration}
                    </span>
                    <span className="text-slate-500 text-xs">
                      Fillers: <span className="text-amber-500">{session.fillerWords}</span>
                    </span>
                    <span className="text-slate-500 text-xs">
                      Eye contact: <span className={session.eyeContact >= 80 ? "text-green-500" : "text-amber-500"}>{session.eyeContact}%</span>
                    </span>
                  </div>
                </div>

                {/* Score + Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <ScoreBadge score={session.score} />
                  <Link href={`/session/report/${session.id}`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-500 text-[13px] font-medium no-underline border border-blue-500/20">
                    <ExternalLink size={13} /> Report
                  </Link>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="p-2 rounded-lg transition-colors hover:text-red-400 text-slate-500 border border-[#2a2a2a]">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
