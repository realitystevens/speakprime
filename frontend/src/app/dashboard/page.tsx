"use client";
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

const statsData = [
  { label: "Total Sessions", value: "24", icon: BarChart3, trend: "+3 this month", up: true, color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  { label: "Avg. Confidence Score", value: "78%", icon: Award, trend: "+6% this week", up: true, color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  { label: "Filler Words (Last Session)", value: "12", icon: MessageSquare, trend: "\u22125 vs last session", up: true, color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  { label: "Improvement Rate", value: "+18%", icon: TrendingUp, trend: "This month", up: true, color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
];

const chartData = [
  { session: "S1", score: 58 }, { session: "S2", score: 61 }, { session: "S3", score: 64 },
  { session: "S4", score: 67 }, { session: "S5", score: 70 }, { session: "S6", score: 74 },
  { session: "S7", score: 79 }, { session: "S8", score: 82 },
];

const recentSessions = [
  { name: "Google PM Interview Practice", mode: "Interview", date: "Mar 7, 2026", duration: "32 min", score: 82, id: "1" },
  { name: "Q1 Strategy Deck Presentation", mode: "Presentation", date: "Mar 5, 2026", duration: "18 min", score: 74, id: "2" },
  { name: "Behavioral Round \u2014 Amazon", mode: "Interview", date: "Mar 2, 2026", duration: "45 min", score: 88, id: "3" },
  { name: "Product Demo \u2014 Seed Pitch", mode: "Presentation", date: "Feb 28, 2026", duration: "22 min", score: 69, id: "4" },
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

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-slate-50 text-2xl font-extrabold">Good morning, David \ud83d\udc4b</h1>
            <p className="text-slate-500 text-sm mt-1">Monday, March 9, 2026 \u2014 Ready to practice?</p>
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
          {statsData.map((stat) => (
            <div key={stat.label} className="p-5 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a]">
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
            <p className="text-slate-500 text-xs mb-5">Over time \u2014 trending up \ud83d\udcc8</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,42,42,0.8)" vertical={false} />
                <XAxis dataKey="session" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[50, 100]} tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "#3B82F6", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Sessions Table */}
          <div className="xl:col-span-2 p-6 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-slate-50 text-base font-bold">Recent Sessions</h2>
              <Link href="/history" className="text-blue-500 text-[13px] no-underline">View all \u2192</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {["Session", "Mode", "Date", "Duration", "Score", "Action"].map((h) => (
                      <th key={h} className="text-left pb-3 text-slate-500 text-xs font-medium pr-4">{h !== "Action" ? h : ""}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map((session) => (
                    <tr key={session.id} className="border-t border-[#2a2a2a]/80">
                      <td className="py-3 pr-4">
                        <span className="text-slate-50 text-[13px] font-medium">{session.name}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md w-fit text-[11px] font-semibold ${
                          session.mode === "Interview" ? "bg-blue-500/10 text-blue-500" : "bg-violet-500/10 text-violet-500"
                        }`}>
                          {session.mode === "Interview" ? <Mic size={10} /> : <Monitor size={10} />}
                          {session.mode}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-1 text-slate-500 text-xs">
                          <Calendar size={11} /> {session.date}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-1 text-slate-500 text-xs">
                          <Clock size={11} /> {session.duration}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <ScoreBadge score={session.score} />
                      </td>
                      <td className="py-3">
                        <Link href={`/session/report/${session.id}`}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors hover:opacity-80 bg-blue-500/10 text-blue-500 text-xs no-underline font-medium">
                          <ExternalLink size={12} /> Report
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
