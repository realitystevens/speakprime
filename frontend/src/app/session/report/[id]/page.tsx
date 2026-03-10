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
        <div style={{ color: "#F8FAFC", fontSize: "32px", fontWeight: 800, lineHeight: 1 }}>{score}</div>
        <div style={{ color: "#64748B", fontSize: "12px" }}>/ 100</div>
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
      <div className="px-3 py-2 rounded-lg" style={{ background: "#222222", border: "1px solid #333333" }}>
        <p style={{ color: "#3B82F6", fontSize: "14px", fontWeight: 700 }}>{payload[0].value}x</p>
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
        <Link href="/dashboard" className="flex items-center gap-1.5" style={{ color: "#64748B", fontSize: "14px", textDecoration: "none" }}>
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 style={{ color: "#F8FAFC", fontSize: "22px", fontWeight: 800 }}>
                {isPresentation ? "Q1 Strategy Deck Presentation" : "Google PM Interview Practice"}
              </h1>
              <span className="px-2.5 py-1 rounded-full flex items-center gap-1.5"
                style={{ background: isPresentation ? "rgba(139,92,246,0.12)" : "rgba(59,130,246,0.12)", color: isPresentation ? "#8B5CF6" : "#3B82F6", fontSize: "12px", fontWeight: 600 }}>
                {isPresentation ? <Monitor size={12} /> : <Mic size={12} />}
                {isPresentation ? "Presentation" : "Interview"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5" style={{ color: "#64748B", fontSize: "13px" }}>
                <Calendar size={13} /> {isPresentation ? "Mar 5, 2026" : "Mar 7, 2026"}
              </span>
              <span className="flex items-center gap-1.5" style={{ color: "#64748B", fontSize: "13px" }}>
                <Clock size={13} /> {isPresentation ? "18 min" : "32 min"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg"
              style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#94A3B8", fontSize: "14px" }}>
              <Share2 size={15} /> Share
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg"
              style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#94A3B8", fontSize: "14px" }}>
              <Download size={15} /> Download PDF
            </button>
          </div>
        </div>

        {/* Tabs (for presentation mode) */}
        {isPresentation && (
          <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "#1e1e1e" }}>
            {(["overview", "slides"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="px-5 py-2 rounded-lg capitalize transition-all"
                style={{
                  background: activeTab === tab ? "#2a2a2a" : "transparent",
                  color: activeTab === tab ? "#F8FAFC" : "#64748B",
                  fontSize: "14px",
                  fontWeight: activeTab === tab ? 600 : 400,
                }}>
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
              <div className="p-8 rounded-2xl flex flex-col items-center"
                style={{ background: "#1e1e1e", border: "1px solid #2a2a2a" }}>
                <p style={{ color: "#64748B", fontSize: "13px", marginBottom: "16px" }}>Overall Score</p>
                <CircularProgress score={isPresentation ? 74 : 82} />
                <p className="mt-4" style={{ color: "#64748B", fontSize: "13px" }}>
                  {isPresentation ? "Above average" : "Strong performance"}
                </p>
              </div>

              {/* Radar Chart */}
              <div className="md:col-span-2 p-6 rounded-2xl" style={{ background: "#1e1e1e", border: "1px solid #2a2a2a" }}>
                <p style={{ color: "#F8FAFC", fontSize: "15px", fontWeight: 700, marginBottom: "12px" }}>Score Breakdown</p>
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
                  <div key={m.label} className="p-5 rounded-2xl" style={{ background: "#1e1e1e", border: "1px solid #2a2a2a" }}>
                    <div className="flex items-center justify-between mb-3">
                      <span style={{ color: "#94A3B8", fontSize: "13px" }}>{m.label}</span>
                      <StatusIcon size={16} color={cfg.color} />
                    </div>
                    <div style={{ color: "#F8FAFC", fontSize: "28px", fontWeight: 800, lineHeight: 1 }}>{m.score}</div>
                    <div style={{ color: "#64748B", fontSize: "11px", marginTop: "2px" }}>/ 100</div>
                    {m.detail && <div style={{ color: cfg.color, fontSize: "12px", marginTop: "6px", fontWeight: 500 }}>{m.detail}</div>}
                    <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "#141414" }}>
                      <div className="h-full rounded-full"
                        style={{ width: `${m.score}%`, background: cfg.color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filler Word Breakdown */}
            <div className="p-6 rounded-2xl" style={{ background: "#1e1e1e", border: "1px solid #2a2a2a" }}>
              <h3 style={{ color: "#F8FAFC", fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>
                Filler Word Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {fillerData.map((f) => (
                    <div key={f.word} className="flex items-center gap-3 mb-3">
                      <span style={{ color: "#94A3B8", fontSize: "14px", width: "80px" }}>"{f.word}"</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#141414" }}>
                        <div className="h-full rounded-full"
                          style={{ width: `${(f.count / 6) * 100}%`, background: "#F59E0B" }} />
                      </div>
                      <span style={{ color: "#F59E0B", fontSize: "13px", fontWeight: 600, width: "60px" }}>{f.count}x</span>
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
            <div className="p-6 rounded-2xl" style={{ background: "#1e1e1e", border: "1px solid #2a2a2a" }}>
              <h3 style={{ color: "#F8FAFC", fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>Annotated Transcript</h3>
              <div className="flex items-center gap-4 mb-5">
                {[
                  { color: "#F59E0B", bg: "rgba(245,158,11,0.2)", label: "Filler words" },
                  { color: "#EF4444", bg: "rgba(239,68,68,0.15)", label: "Low confidence" },
                  { color: "#3B82F6", bg: "rgba(59,130,246,0.2)", label: "STAR structure" },
                ].map((legend) => (
                  <div key={legend.label} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: legend.bg, border: `1px solid ${legend.color}` }} />
                    <span style={{ color: "#64748B", fontSize: "12px" }}>{legend.label}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                {transcriptParagraphs.map((para, i) => (
                  <p key={i} style={{ color: "#94A3B8", fontSize: "14px", lineHeight: 1.8 }}>
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
              <h3 style={{ color: "#F8FAFC", fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>AI Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  "Replace 'um' with a 2-second pause. Practice the pause deliberately — it signals confidence.",
                  "Your answer to Q2 lacked the Result component of STAR. Always close with a measurable outcome.",
                  "Your speaking pace was 178 WPM — ideal is 130–150. Try recording yourself at a slower pace.",
                ].map((tip, i) => (
                  <div key={i} className="p-5 rounded-2xl"
                    style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.2)" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                      style={{ background: "rgba(59,130,246,0.15)" }}>
                      <Lightbulb size={16} color="#3B82F6" />
                    </div>
                    <p style={{ color: "#94A3B8", fontSize: "14px", lineHeight: 1.7 }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Replay Timeline */}
            <div className="p-6 rounded-2xl" style={{ background: "#1e1e1e", border: "1px solid #2a2a2a" }}>
              <h3 style={{ color: "#F8FAFC", fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Session Replay Timeline</h3>
              <div className="relative h-8">
                <div className="absolute inset-0 rounded-full" style={{ background: "#141414" }} />
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
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "#333333", color: "#F8FAFC", fontSize: "11px" }}>
                      {marker.pos * 19.2 / 100 < 1 ? `0:${Math.floor(marker.pos * 19.2 / 10)}` : `${Math.floor(marker.pos * 19.2 / 60)}:${String(Math.floor((marker.pos * 19.2) % 60)).padStart(2, "0")}`} — feedback
                    </div>
                  </div>
                ))}
                {/* Progress fill */}
                <div className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: "65%", background: "linear-gradient(90deg, rgba(59,130,246,0.3), rgba(139,92,246,0.3))" }} />
              </div>
              <div className="flex justify-between mt-2">
                <span style={{ color: "#64748B", fontSize: "11px" }}>0:00</span>
                <span style={{ color: "#64748B", fontSize: "11px" }}>{isPresentation ? "18:00" : "32:00"}</span>
              </div>
            </div>
          </>
        )}

        {/* Slide Feedback Tab */}
        {activeTab === "slides" && isPresentation && (
          <div>
            <h3 style={{ color: "#F8FAFC", fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Slide-by-Slide Feedback</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {slideThumb.map((slide, i) => {
                const cfg = statusConfig[slide.status as keyof typeof statusConfig];
                return (
                  <div key={i} className="p-4 rounded-2xl cursor-pointer transition-all hover:-translate-y-1"
                    style={{ background: "#1e1e1e", border: `1px solid ${cfg.color}30` }}>
                    {/* Slide preview */}
                    <div className="rounded-lg p-3 mb-3" style={{ background: "#141414", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div className="text-center">
                        <div style={{ color: "#334155", fontSize: "10px", marginBottom: "4px" }}>Slide {i + 1}</div>
                        <div style={{ color: "#64748B", fontSize: "11px", fontWeight: 600 }}>{slide.title}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <cfg.icon size={14} color={cfg.color} />
                      <span style={{ color: cfg.color, fontSize: "12px", fontWeight: 600 }}>
                        {slide.status === "green" ? "Good" : slide.status === "yellow" ? "Needs Work" : "Revise"}
                      </span>
                    </div>
                    <p style={{ color: "#64748B", fontSize: "12px", lineHeight: 1.5 }}>{slide.feedback}</p>
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
