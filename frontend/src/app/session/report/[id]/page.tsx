"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/app/components/layout/Sidebar";
import {
  Download, Share2, ChevronLeft, Mic, Calendar, Clock, Lightbulb,
  CheckCircle, AlertCircle, AlertTriangle, Monitor, Loader2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from "recharts";
import { reportApi, sessionApi, type Report, type Session } from "@/lib/api";

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
  good: { color: "#22C55E", bg: "rgba(34,197,94,0.1)", icon: CheckCircle },
  needs_work: { color: "#F59E0B", bg: "rgba(245,158,11,0.1)", icon: AlertTriangle },
  revise: { color: "#EF4444", bg: "rgba(239,68,68,0.1)", icon: AlertCircle },
};

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { value: number }[] }) => {
  if (active && payload?.length) {
    return (
      <div className="px-3 py-2 rounded-lg bg-[#222222] border border-[#333333]">
        <p className="text-blue-500 text-sm font-bold">{payload[0].value}x</p>
      </div>
    );
  }
  return null;
};

function scoreStatus(score: number): "green" | "yellow" | "red" {
  if (score >= 80) return "green";
  if (score >= 65) return "yellow";
  return "red";
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "â€”";
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Render annotated transcript text with highlighted spans. */
function AnnotatedText({ text, annotations }: {
  text: string;
  annotations: Report["annotated_transcript"];
}) {
  if (!annotations.length) return <span>{text}</span>;

  // Sort by start_index
  const sorted = [...annotations].sort((a, b) => a.start_index - b.start_index);
  const parts: { text: string; type: string | null }[] = [];
  let cursor = 0;

  for (const ann of sorted) {
    if (ann.start_index > cursor) {
      parts.push({ text: text.slice(cursor, ann.start_index), type: null });
    }
    parts.push({ text: ann.text, type: ann.annotation_type });
    cursor = ann.end_index;
  }
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), type: null });
  }

  return (
    <>
      {parts.map((p, i) => {
        if (p.type === "filler_word") {
          return <mark key={i} style={{ background: "rgba(245,158,11,0.25)", color: "#F59E0B", borderRadius: "3px", padding: "1px 3px" }}>{p.text}</mark>;
        }
        if (p.type === "low_confidence") {
          return <mark key={i} style={{ background: "rgba(239,68,68,0.15)", color: "#FCA5A5", borderRadius: "3px", padding: "1px 3px" }}>{p.text}</mark>;
        }
        if (p.type === "strong_star") {
          return <mark key={i} style={{ background: "rgba(59,130,246,0.15)", color: "#93C5FD", borderRadius: "3px", padding: "1px 3px" }}>{p.text}</mark>;
        }
        return <span key={i}>{p.text}</span>;
      })}
    </>
  );
}

export default function ReportPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [report, setReport] = useState<Report | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "slides">("overview");
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const missingReportPollsRef = useRef(0);

  const loadReport = useCallback(async (isPolling = false) => {
    try {
      // Try as report_id first, fall back to session_id lookup
      let r: Report;
      try {
        r = await reportApi.get(id);
      } catch {
        r = await reportApi.getBySession(id);
      }
      missingReportPollsRef.current = 0;
      setReport(r);

      // Check if still generating
      const stillGenerating = !r.scores || r.scores.overall === 0;
      if (stillGenerating && !isPolling) {
        setGenerating(true);
        pollRef.current = setTimeout(() => loadReport(true), 3000);
        return;
      }
      if (isPolling && stillGenerating) {
        pollRef.current = setTimeout(() => loadReport(true), 3000);
        return;
      }
      setGenerating(false);

      // Load session data if not already loaded
      if (!session && r.session_id) {
        try {
          const s = await sessionApi.get(r.session_id);
          setSession(s);
        } catch {
          // Non-critical â€” continue without session metadata
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Report not found.";
      const isNotFound = message.includes("API 404");

      // Report generation is async; allow polling for a while instead of failing immediately.
      if (isNotFound && missingReportPollsRef.current < 30) {
        missingReportPollsRef.current += 1;
        setError(null);
        setGenerating(true);
        if (!isPolling) setLoading(false);
        pollRef.current = setTimeout(() => loadReport(true), 3000);
        return;
      }

      setError(message);
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [id, session]);

  useEffect(() => {
    if (!id) return;
    loadReport();
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownloadPdf = async () => {
    if (!report) return;
    setDownloadingPdf(true);
    try {
      if (report.pdf_url) {
        window.open(report.pdf_url, "_blank");
        return;
      }
      const result = await reportApi.generatePdf(report.id);
      if (result.pdf_url) window.open(result.pdf_url, "_blank");
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // â”€â”€ Derived display data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const isPresentation = session?.mode === "presentation";

  const scoreMetrics = report
    ? [
      { label: "Clarity", score: report.scores.clarity },
      { label: "Confidence", score: report.scores.confidence },
      { label: "Pacing", score: report.scores.pacing },
      { label: "Eye Contact", score: report.scores.eye_contact },
      {
        label: "Filler Words", score: report.scores.filler_words,
        detail: report.filler_word_breakdown.length
          ? `${report.filler_word_breakdown.reduce((s, f) => s + f.count, 0)} detected`
          : undefined
      },
      { label: "Answer Structure", score: report.scores.answer_structure },
    ]
    : [];

  const radarData = report
    ? [
      { subject: "Clarity", score: report.scores.clarity },
      { subject: "Confidence", score: report.scores.confidence },
      { subject: "Pacing", score: report.scores.pacing },
      { subject: "Eye Contact", score: report.scores.eye_contact },
      { subject: "Filler Words", score: report.scores.filler_words },
      { subject: "Structure", score: report.scores.answer_structure },
    ]
    : [];

  const fillerData = report?.filler_word_breakdown ?? [];

  const fillerMax = fillerData.length ? Math.max(...fillerData.map((f) => f.count), 1) : 1;

  const sessionTitle = session?.name ?? "Session Report";
  const sessionDate = session?.created_at ? formatDate(session.created_at)
    : report?.generated_at ? formatDate(report.generated_at) : "â€”";
  const sessionDuration = formatDuration(session?.duration_seconds ?? null);

  // â”€â”€ Loading / Error states â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 size={36} className="text-blue-500 animate-spin" />
          <p className="text-slate-400 text-sm">Loading reportâ€¦</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertCircle size={36} className="text-red-500" />
          <p className="text-slate-400 text-sm">{error}</p>
          <Link href="/history" className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold no-underline">
            Back to History
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (generating || !report) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 size={36} className="text-blue-500 animate-spin" />
          <p className="text-slate-50 text-base font-semibold">Generating your reportâ€¦</p>
          <p className="text-slate-500 text-sm text-center max-w-xs">
            Our AI is analysing your session. This usually takes less than a minute.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // â”€â”€ Main render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
        {/* Back */}
        <Link href="/history" className="flex items-center gap-1.5 text-slate-500 text-sm no-underline">
          <ChevronLeft size={16} /> Back to History
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-[#F8FAFC] text-[22px] font-extrabold">{sessionTitle}</h1>
              <span className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-semibold ${isPresentation ? "bg-violet-500/[0.12] text-violet-500" : "bg-blue-500/[0.12] text-blue-500"
                }`}>
                {isPresentation ? <Monitor size={12} /> : <Mic size={12} />}
                {isPresentation ? "Presentation" : "Interview"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-500 text-[13px]">
                <Calendar size={13} /> {sessionDate}
              </span>
              <span className="flex items-center gap-1.5 text-slate-500 text-[13px]">
                <Clock size={13} /> {sessionDuration}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1e1e1e] border border-[#2a2a2a] text-slate-400 text-sm">
              <Share2 size={15} /> Share
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1e1e1e] border border-[#2a2a2a] text-slate-400 text-sm disabled:opacity-60"
            >
              {downloadingPdf ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              Download PDF
            </button>
          </div>
        </div>

        {/* Tabs (presentation only) */}
        {isPresentation && (
          <div className="flex gap-1 p-1 rounded-xl w-fit bg-[#1e1e1e]">
            {(["overview", "slides"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg capitalize transition-all text-sm ${activeTab === tab ? "bg-[#2a2a2a] text-[#F8FAFC] font-semibold" : "bg-transparent text-slate-500"
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
                <CircularProgress score={report.scores.overall} />
                <p className="mt-4 text-slate-500 text-[13px]">
                  {report.scores.overall >= 85 ? "Excellent performance"
                    : report.scores.overall >= 75 ? "Strong performance"
                      : report.scores.overall >= 65 ? "Above average"
                        : "Keep practising"}
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
                const statusKey = scoreStatus(m.score);
                const cfg = statusConfig[statusKey];
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
            {fillerData.length > 0 && (
              <div className="p-6 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a]">
                <h3 className="text-[#F8FAFC] text-base font-bold mb-4">Filler Word Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    {fillerData.map((f) => (
                      <div key={f.word} className="flex items-center gap-3 mb-3">
                        <span className="text-slate-400 text-sm w-20">&ldquo;{f.word}&rdquo;</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden bg-[#141414]">
                          <div className="h-full rounded-full bg-amber-500"
                            style={{ width: `${(f.count / fillerMax) * 100}%` }} />
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
            )}

            {/* Annotated Transcript */}
            {report.annotated_transcript.length > 0 && (
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
                  {/* Group annotations by reconstructing paragraphs from the full annotated text */}
                  {(() => {
                    // Reconstruct a single annotated text block
                    const fullText = report.annotated_transcript.map((a) => a.text).join(" ");
                    return (
                      <p className="text-slate-400 text-sm leading-[1.8]">
                        <AnnotatedText text={fullText} annotations={report.annotated_transcript} />
                      </p>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* AI Recommendations */}
            {report.recommendations.length > 0 && (
              <div>
                <h3 className="text-[#F8FAFC] text-base font-bold mb-4">AI Recommendations</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {report.recommendations.map((rec, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-blue-500/[0.05] border border-blue-500/20">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-blue-500/15">
                        <Lightbulb size={16} className="text-blue-500" />
                      </div>
                      <p className="text-blue-400 text-[11px] font-semibold uppercase tracking-wide mb-1.5">{rec.category}</p>
                      <p className="text-slate-400 text-sm leading-[1.7]">{rec.tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Session Replay Timeline */}
            {report.feedback_timeline.length > 0 && (
              <div className="p-6 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a]">
                <h3 className="text-[#F8FAFC] text-base font-bold mb-4">Session Replay Timeline</h3>
                <div className="relative h-8">
                  <div className="absolute inset-0 rounded-full bg-[#141414]" />
                  {(() => {
                    const duration = session?.duration_seconds ?? 1800;
                    return report.feedback_timeline.map((event, i) => {
                      const pos = Math.min((event.timestamp_seconds / duration) * 100, 98);
                      const color = event.severity === "critical" ? "#EF4444"
                        : event.severity === "warning" ? "#F59E0B" : "#22C55E";
                      const mins = Math.floor(event.timestamp_seconds / 60);
                      const secs = String(Math.floor(event.timestamp_seconds % 60)).padStart(2, "0");
                      return (
                        <div key={i} className="absolute top-1/2 -translate-y-1/2 group cursor-pointer"
                          style={{ left: `${pos}%` }}>
                          <div className="w-3 h-3 rounded-full border-2 border-white"
                            style={{ background: color }} />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-[#333333] text-[#F8FAFC] text-[11px] max-w-[200px] truncate">
                            {mins}:{secs} â€” {event.message}
                          </div>
                        </div>
                      );
                    });
                  })()}
                  <div className="absolute inset-y-0 left-0 rounded-full"
                    style={{ width: "65%", background: "linear-gradient(90deg, rgba(59,130,246,0.3), rgba(139,92,246,0.3))" }} />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-slate-500 text-[11px]">0:00</span>
                  <span className="text-slate-500 text-[11px]">{formatDuration(session?.duration_seconds ?? null)}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Slide Feedback Tab */}
        {activeTab === "slides" && isPresentation && report.slide_reports && (
          <div>
            <h3 className="text-[#F8FAFC] text-base font-bold mb-4">Slide-by-Slide Feedback</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {report.slide_reports.map((slide, i) => {
                const cfgKey = (slide.status in statusConfig ? slide.status : "yellow") as keyof typeof statusConfig;
                const cfg = statusConfig[cfgKey];
                return (
                  <div key={i} className="p-4 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 bg-[#1e1e1e]" style={{ border: `1px solid ${cfg.color}30` }}>
                    <div className="rounded-lg p-3 mb-3 bg-[#141414] aspect-video flex items-center justify-center overflow-hidden">
                      {slide.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={slide.thumbnail_url} alt={`Slide ${slide.slide_number}`} className="object-contain w-full h-full" />
                      ) : (
                        <div className="text-center">
                          <div className="text-[#334155] text-[10px] mb-1">Slide {slide.slide_number}</div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <cfg.icon size={14} color={cfg.color} />
                      <span className="text-[12px] font-semibold" style={{ color: cfg.color }}>
                        {slide.status === "good" || slide.status === "green" ? "Good"
                          : slide.status === "needs_work" || slide.status === "yellow" ? "Needs Work"
                            : "Revise"}
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
