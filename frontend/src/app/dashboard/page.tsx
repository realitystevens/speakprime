"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "../components/layout/Sidebar";
import {
  BarChart3, TrendingUp, TrendingDown, Mic, Monitor,
  ExternalLink, Clock, Calendar, Award, MessageSquare
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { userApi, sessionApi, type UserStats, type Session, type UserProfile } from "@/lib/api";

const statsData = [
  { label: "Total Sessions", value: "24", icon: BarChart3, trend: "+3 this month", up: true, color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  { label: "Avg. Confidence Score", value: "78%", icon: Award, trend: "+6% this week", up: true, color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  { label: "Filler Words (Last Session)", value: "12", icon: MessageSquare, trend: "\u22125 vs last session", up: true, color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  { label: "Improvement Rate", value: "+18%", icon: TrendingUp, trend: "This month", up: true, color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
];

function ScoreBadge({ score }: { score: number }) {
  const colorClass = score >= 80 ? "text-green-500 bg-green-500/[12%]" : score >= 70 ? "text-amber-500 bg-amber-500/[12%]" : "text-red-500 bg-red-500/[12%]";
  return (
    <span className={`px-2 py-1 rounded-lg text-[13px] font-semibold ${colorClass}`}>
      {score}/100
    </span>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-2 rounded-lg bg-[#222222] border border-[#333333]">
        <p className="text-slate-400 text-xs">{label}</p>
        <p className="text-blue-500 text-sm font-bold">{payload[0].value}/100</p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([userApi.getProfile(), userApi.getStats(), sessionApi.list({ limit: 4 })])
      .then(([prof, st, sess]) => {
        setProfile(prof);
        setStats(st);
        setSessions(sess);
      })
      .catch((err) => console.error("Dashboard load error:", err))
      .finally(() => setLoading(false));
  }, []);

  const firstName = profile?.name?.split(" ")[0] ?? "there";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const chartData =
    stats?.confidence_over_time?.map((pt) => ({
      session: `S${pt.session_number}`,
      score: pt.score,
    })) ?? [];

  const liveStatsCards = stats
    ? [
      { label: "Total Sessions", value: String(stats.total_sessions), icon: BarChart3, trend: `${stats.sessions_this_month} this month`, up: stats.sessions_this_month > 0, color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
      { label: "Avg. Confidence Score", value: `${stats.avg_confidence_score}%`, icon: Award, trend: stats.improvement_rate >= 0 ? `+${stats.improvement_rate}% overall` : `${stats.improvement_rate}% overall`, up: stats.improvement_rate >= 0, color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
      { label: "Filler Words (Last Session)", value: String(stats.last_session_filler_words), icon: MessageSquare, trend: "From latest session", up: stats.last_session_filler_words < 10, color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
      { label: "Improvement Rate", value: `${stats.improvement_rate >= 0 ? "+" : ""}${stats.improvement_rate}%`, icon: TrendingUp, trend: "First vs latest session", up: stats.improvement_rate >= 0, color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
    ]
    : statsData;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-y-3">
          <div>
            <h1 className="text-slate-50 text-2xl font-extrabold">
              {greeting}{profile ? `, ${firstName}` : ""} 👋
            </h1>
            <p className="text-slate-500 text-sm mt-1">{today} — Ready to practice?</p>
          </div>
          <button
            onClick={() => router.push("/session/setup")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg transition-colors hover:opacity-90 bg-blue-500 text-white text-sm font-semibold"
          >
            + New Session
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(loading ? statsData : liveStatsCards).map((stat) => (
            <div key={stat.label} className={`p-5 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a] ${loading ? "animate-pulse" : ""}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: stat.bg }}>
                  <stat.icon size={18} color={stat.color} />
                </div>
                <div className={stat.up ? "text-green-500" : "text-red-500"}>
                  {stat.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                </div>
              </div>
              <div className="text-slate-50 text-[26px] font-extrabold leading-none">{stat.value}</div>
              <div className="text-slate-500 text-xs mt-1">{stat.label}</div>
              <div className={`text-[11px] mt-1 font-medium ${stat.up ? "text-green-500" : "text-red-500"}`}>{stat.trend}</div>
            </div>
          ))}
        </div>

        {/* Quick Start */}
        <div>
          <h2 className="text-slate-50 text-[17px] font-bold mb-4">Quick Start</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/session/setup"
              className="p-6 rounded-2xl transition-all duration-200 hover:-translate-y-1 hover:shadow-lg no-underline"
              style={{
                background: "linear-gradient(135deg, #0d1f3c 0%, #1a1a1a 100%)",
                border: "1px solid rgba(59,130,246,0.25)",
                boxShadow: "0 0 30px rgba(59,130,246,0.04)",
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-500/20">
                  <Mic size={24} color="#3B82F6" />
                </div>
                <div>
                  <div className="text-slate-50 text-base font-bold">Start Interview Session</div>
                  <div className="text-slate-500 text-[13px] mt-0.5">Practice your next interview with live AI coaching</div>
                </div>
              </div>
            </Link>
            <Link
              href="/session/setup"
              className="p-6 rounded-2xl transition-all duration-200 hover:-translate-y-1 no-underline"
              style={{
                background: "linear-gradient(135deg, #1a0d3c 0%, #1a1a1a 100%)",
                border: "1px solid rgba(139,92,246,0.25)",
                boxShadow: "0 0 30px rgba(139,92,246,0.04)",
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-violet-500/20">
                  <Monitor size={24} color="#8B5CF6" />
                </div>
                <div>
                  <div className="text-slate-50 text-base font-bold">Start Presentation Session</div>
                  <div className="text-slate-500 text-[13px] mt-0.5">Present your slides and get real-time delivery feedback</div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Chart + Table Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="xl:col-span-1 p-6 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a]">
            <h2 className="text-slate-50 text-base font-bold mb-1">Confidence Score</h2>
            <p className="text-slate-500 text-xs mb-5">Over time</p>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,42,42,0.8)" vertical={false} />
                  <XAxis dataKey="session" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2.5}
                    dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "#3B82F6", strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[180px]">
                <p className="text-slate-600 text-xs text-center">Chart will appear after completed sessions</p>
              </div>
            )}
          </div>

          {/* Recent Sessions Table */}
          <div className="xl:col-span-2 p-6 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-slate-50 text-base font-bold">Recent Sessions</h2>
              <Link href="/history" className="text-blue-500 text-[13px] no-underline">View all →</Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-10 rounded-lg bg-[#2a2a2a] animate-pulse" />)}
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Mic size={28} color="#334155" />
                <p className="text-slate-500 text-sm">No sessions yet — start your first one!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {["Session", "Mode", "Date", "Duration", "Score", ""].map((h) => (
                        <th key={h} className="text-left pb-3 text-slate-500 text-xs font-medium pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr key={session.id} className="border-t border-[#2a2a2a]/80">
                        <td className="py-3 pr-4">
                          <span className="text-slate-50 text-[13px] font-medium">{session.name}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md w-fit text-[11px] font-semibold ${session.mode === "interview" ? "bg-blue-500/10 text-blue-500" : "bg-violet-500/10 text-violet-500"
                            }`}>
                            {session.mode === "interview" ? <Mic size={10} /> : <Monitor size={10} />}
                            {session.mode === "interview" ? "Interview" : "Presentation"}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="flex items-center gap-1 text-slate-500 text-xs">
                            <Calendar size={11} />
                            {new Date(session.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="flex items-center gap-1 text-slate-500 text-xs">
                            <Clock size={11} />
                            {session.duration_seconds ? `${Math.floor(session.duration_seconds / 60)} min` : "—"}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          {session.overall_score != null
                            ? <ScoreBadge score={session.overall_score} />
                            : <span className="text-slate-500 text-xs">—</span>}
                        </td>
                        <td className="py-3">
                          {session.status === "completed" && (
                            <Link href={`/session/report/${session.id}`}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:opacity-80 bg-blue-500/10 text-blue-500 text-xs no-underline font-medium">
                              <ExternalLink size={12} /> Report
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
