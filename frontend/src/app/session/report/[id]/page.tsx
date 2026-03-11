"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/app/components/layout/Sidebar";
import {
  Download, Share2, ChevronLeft, Mic, Calendar, Clock, Lightbulb,
  CheckCircle, AlertCircle, AlertTriangle, Monitor
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from "recharts";

const scoreMetrics = [
  { label: "Clarity", score: 85, status: "green" },
  { label: "Confidence", score: 78, status: "yellow" },
  { label: "Pacing", score: 72, status: "yellow" },
  { label: "Eye Contact", score: 90, status: "green" },
  { label: "Filler Words", score: 65, status: "red", detail: "12 detected" },
  { label: "STAR Structure", score: 88, status: "green" },
];

const fillerData = [
  { word: "um", count: 6 },
  { word: "like", count: 4 },
  { word: "you know", count: 2 },
];

const transcriptParagraphs = [
  {
    text: "So, ",
    fillerHighlight: false,
    parts: [
      { text: "um", type: "filler" },
      { text: ", in my previous role at Acme Corp, I was leading a cross-functional team of about eight people and the challenge was really about aligning everyone on the same goal without having direct authority over them.", type: "normal" },
    ],
  },
  {
    parts: [
      { text: "What I did was schedule individual one-on-ones with each stakeholder to understand their concerns, and then I created a shared roadmap that clearly showed how each team's work contributed to the overall outcome.", type: "star" },
    ],
  },
  {
    parts: [
      { text: "And, ", type: "normal" },
      { text: "like", type: "filler" },
      { text: ", the result was that we shipped the project two weeks ahead of schedule.", type: "normal" },
      { text: " The team's engagement scores also improved by 23% in the next survey.", type: "normal" },
    ],
  },
  {
    parts: [
      { text: "I think the key takeaway was that ", type: "normal" },
      { text: "you know", type: "filler" },
      { text: ", influence without authority is really about ", type: "normal" },
      { text: "building trust and showing people how the work connects to what they care about.", type: "normal" },
    ],
  },
];

const slideThumb = [
  { title: "Q1 2026 Roadmap", status: "yellow", feedback: "Too much text. Reduce to headline + 3 bullets max." },
  { title: "Key Milestones", status: "green", feedback: "Clean and concise." },
  { title: "Market Opportunity", status: "green", feedback: "Strong data visualization." },
  { title: "Competitive Analysis", status: "yellow", feedback: "Simplify to top 3 differentiators." },
  { title: "Revenue Model", status: "green", feedback: "Clear pricing structure." },
  { title: "Team", status: "red", feedback: "Missing key advisor profiles." },
];

const radarData = [
  { subject: "Clarity", score: 85 },
  { subject: "Confidence", score: 78 },
  { subject: "Pacing", score: 72 },
  { subject: "Eye Contact", score: 90 },
  { subject: "Filler Words", score: 65 },
  { subject: "STAR", score: 88 },
];

function CircularProgress({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#222222" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ filter: "drop-shadow(0 0 8px rgba(59,130,246,0.6))" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-[#F8FAFC] text-[32px] font-extrabold leading-none">{score}</div>
        <div className="text-slate-500 text-xs">/ 100</div>
      </div>
    </div>
  );
}

const statusConfig = {
  green: { color: "#22C55E", bg: "rgba(34,197,94,0.1)", icon: CheckCircle },
  yellow: { color: "#F59E0B", bg: "rgba(245,158,11,0.1)", icon: AlertTriangle },
  red: { color: "#EF4444", bg: "rgba(239,68,68,0.1)", icon: AlertCircle },
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="px-3 py-2 rounded-lg bg-[#222222] border border-[#333333]">
        <p className="text-blue-500 text-sm font-bold">{payload[0].value}x</p>
      </div>
    );
  }
  return null;
};

export default function ReportPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [activeTab, setActiveTab] = useState<"overview" | "slides">("overview");
  const isPresentation = id === "2";

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
        {/* Back */}
        <Link href="/dashboard" className="flex items-center gap-1.5 text-slate-500 text-sm no-underline">
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-[#F8FAFC] text-[22px] font-extrabold">
                {isPresentation ? "Q1 Strategy Deck Presentation" : "Google PM Interview Practice"}
              </h1>
              <span className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-semibold ${
                isPresentation ? "bg-violet-500/[0.12] text-violet-500" : "bg-blue-500/[0.12] text-blue-500"
              }`}>
                {isPresentation ? <Monitor size={12} /> : <Mic size={12} />}
                {isPresentation ? "Presentation" : "Interview"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-500 text-[13px]">
                <Calendar size={13} /> {isPresentation ? "Mar 5, 2026" : "Mar 7, 2026"}
              </span>
              <span className="flex items-center gap-1.5 text-slate-500 text-[13px]">
                <Clock size={13} /> {isPresentation ? "18 min" : "32 min"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1e1e1e] border border-[#2a2a2a] text-slate-400 text-sm">
              <Share2 size={15} /> Share
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1e1e1e] border border-[#2a2a2a] text-slate-400 text-sm">
              <Download size={15} /> Download PDF
            </button>
          </div>
        </div>

        {/* Tabs (for presentation mode) */}
        {isPresentation && (
          <div className="flex gap-1 p-1 rounded-xl w-fit bg-[#1e1e1e]">
            {(["overview", "slides"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg capitalize transition-all text-sm ${
                  activeTab === tab ? "bg-[#2a2a2a] text-[#F8FAFC] font-semibold" : "bg-transparent text-slate-500"
                }`}>
                {tab === "slides" ? "Slide Feedback" : "Overview"}
              </button>
            ))}
          </div>
        )}

        {activeTab === "overview" && (
          <>
            {/* Score + Radar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Overall Score */}
              <div className="p-8 rounded-2xl flex flex-col items-center bg-[#1e1e1e] border border-[#2a2a2a]">
                <p className="text-slate-500 text-[13px] mb-4">Overall Score</p>
                <CircularProgress score={isPresentation ? 74 : 82} />
                <p className="mt-4 text-slate-500 text-[13px]">
                  {isPresentation ? "Above average" : "Strong performance"}
                </p>
              </div>

              {/* Radar Chart */}
              <div className="md:col-span-2 p-6 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a]">
                <p className="text-[#F8FAFC] text-[15px] font-bold mb-3">Score Breakdown</p>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#2a2a2a" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748B", fontSize: 11 }} />
                    <Radar name="Score" dataKey="score" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 6 Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {scoreMetrics.map((m) => {
                const cfg = statusConfig[m.status as keyof typeof statusConfig];
                const StatusIcon = cfg.icon;
                return (
                  <div key={m.label} className="p-5 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-slate-400 text-[13px]">{m.label}</span>
                      <StatusIcon size={16} color={cfg.color} />
                    </div>
                    <div className="text-[#F8FAFC] text-[28px] font-extrabold leading-none">{m.score}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">/ 100</div>
                    {m.detail && <div className="text-[12px] mt-1.5 font-medium" style={{ color: cfg.color }}>{m.detail}</div>}
                    <div className="mt-3 h-1.5 rounded-full overflow-hidden bg-[#141414]">
                      <div className="h-full rounded-full" style={{ width: `${m.score}%`, background: cfg.color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filler Word Breakdown */}
            <div className="p-6 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a]">
              <h3 className="text-[#F8FAFC] text-base font-bold mb-4">
                Filler Word Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {fillerData.map((f) => (
                    <div key={f.word} className="flex items-center gap-3 mb-3">
                      <span className="text-slate-400 text-sm w-20">"{f.word}"</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden bg-[#141414]">
                        <div className="h-full rounded-full bg-amber-500"
                          style={{ width: `${(f.count / 6) * 100}%` }} />
                      </div>
                      <span className="text-amber-500 text-[13px] font-semibold w-[60px]">{f.count}x</span>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={fillerData} barSize={28}>
                    <XAxis dataKey="word" tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {fillerData.map((entry, i) => (
                        <Cell key={`filler-cell-${entry.word}`} fill={i === 0 ? "#EF4444" : i === 1 ? "#F59E0B" : "#3B82F6"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Transcript */}
            <div className="p-6 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a]">
              <h3 className="text-[#F8FAFC] text-base font-bold mb-1.5">Annotated Transcript</h3>
              <div className="flex items-center gap-4 mb-5">
                {[
                  { color: "#F59E0B", bg: "rgba(245,158,11,0.2)", label: "Filler words" },
                  { color: "#EF4444", bg: "rgba(239,68,68,0.15)", label: "Low confidence" },
                  { color: "#3B82F6", bg: "rgba(59,130,246,0.2)", label: "STAR structure" },
                ].map((legend) => (
                    <div key={legend.label} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ background: legend.bg, border: `1px solid ${legend.color}` }} />
                      <span className="text-slate-500 text-xs">{legend.label}</span>
                    </div>
                ))}
              </div>
              <div className="space-y-4">
                {transcriptParagraphs.map((para, i) => (
                  <p key={i} className="text-slate-400 text-sm leading-[1.8]">
                    {para.parts.map((part, j) => {
                      if (part.type === "filler") {
                        return <mark key={j} style={{ background: "rgba(245,158,11,0.25)", color: "#F59E0B", borderRadius: "3px", padding: "1px 3px" }}>{part.text}</mark>;
                      }
                      if (part.type === "star") {
                        return <mark key={j} style={{ background: "rgba(59,130,246,0.15)", color: "#93C5FD", borderRadius: "3px", padding: "1px 3px" }}>{part.text}</mark>;
                      }
                      return <span key={j}>{part.text}</span>;
                    })}
                  </p>
                ))}
              </div>
            </div>

            {/* AI Recommendations */}
            <div>
              <h3 className="text-[#F8FAFC] text-base font-bold mb-4">AI Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  "Replace 'um' with a 2-second pause. Practice the pause deliberately — it signals confidence.",
                  "Your answer to Q2 lacked the Result component of STAR. Always close with a measurable outcome.",
                  "Your speaking pace was 178 WPM — ideal is 130–150. Try recording yourself at a slower pace.",
                ].map((tip, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-blue-500/[0.05] border border-blue-500/20">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-blue-500/15">
                      <Lightbulb size={16} className="text-blue-500" />
                    </div>
                    <p className="text-slate-400 text-sm leading-[1.7]">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Replay Timeline */}
            <div className="p-6 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a]">
              <h3 className="text-[#F8FAFC] text-base font-bold mb-4">Session Replay Timeline</h3>
              <div className="relative h-8">
                <div className="absolute inset-0 rounded-full bg-[#141414]" />
                {/* Markers */}
                {[
                  { pos: 15, type: "red" },
                  { pos: 28, type: "yellow" },
                  { pos: 42, type: "green" },
                  { pos: 55, type: "red" },
                  { pos: 68, type: "green" },
                  { pos: 80, type: "yellow" },
                ].map((marker, i) => (
                  <div key={i} className="absolute top-1/2 -translate-y-1/2 group cursor-pointer"
                    style={{ left: `${marker.pos}%` }}>
                    <div className="w-3 h-3 rounded-full border-2 border-white"
                      style={{ background: marker.type === "red" ? "#EF4444" : marker.type === "yellow" ? "#F59E0B" : "#22C55E" }} />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-[#333333] text-[#F8FAFC] text-[11px]">
                      {marker.pos * 19.2 / 100 < 1 ? `0:${Math.floor(marker.pos * 19.2 / 10)}` : `${Math.floor(marker.pos * 19.2 / 60)}:${String(Math.floor((marker.pos * 19.2) % 60)).padStart(2, "0")}`} — feedback
                    </div>
                  </div>
                ))}
                {/* Progress fill */}
                <div className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: "65%", background: "linear-gradient(90deg, rgba(59,130,246,0.3), rgba(139,92,246,0.3))" }} />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-slate-500 text-[11px]">0:00</span>
                <span className="text-slate-500 text-[11px]">{isPresentation ? "18:00" : "32:00"}</span>
              </div>
            </div>
          </>
        )}

        {/* Slide Feedback Tab */}
        {activeTab === "slides" && isPresentation && (
          <div>
            <h3 className="text-[#F8FAFC] text-base font-bold mb-4">Slide-by-Slide Feedback</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {slideThumb.map((slide, i) => {
                const cfg = statusConfig[slide.status as keyof typeof statusConfig];
                return (
                  <div key={i} className="p-4 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 bg-[#1e1e1e]" style={{ border: `1px solid ${cfg.color}30` }}>
                    <div className="rounded-lg p-3 mb-3 bg-[#141414] aspect-video flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-[#334155] text-[10px] mb-1">Slide {i + 1}</div>
                        <div className="text-slate-500 text-[11px] font-semibold">{slide.title}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <cfg.icon size={14} color={cfg.color} />
                      <span className="text-[12px] font-semibold" style={{ color: cfg.color }}>
                        {slide.status === "green" ? "Good" : slide.status === "yellow" ? "Needs Work" : "Revise"}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs leading-[1.5]">{slide.feedback}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
