"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Mic, MicOff, Video, VideoOff, Pause, Play,
  PhoneOff, Wifi, MessageSquare, X, ChevronRight,
} from "lucide-react";

type FeedbackType = "red" | "yellow" | "green";

interface FeedbackBubble {
  id: number;
  type: FeedbackType;
  text: string;
}

const mockFeedback: { type: FeedbackType; text: string }[] = [
  { type: "red", text: "You said 'um' three times — try pausing instead" },
  { type: "yellow", text: "Speaking a bit fast — slow down to ~130 WPM" },
  { type: "green", text: "Great structure — strong opening to your answer" },
  { type: "red", text: "Eye contact dropped — look directly at the camera" },
  { type: "yellow", text: "Good energy, but project more confidence in tone" },
  { type: "green", text: "Excellent STAR usage — clear situation and task" },
  { type: "red", text: "Filler detected: 'like' — replace with a brief pause" },
  { type: "yellow", text: "Answer running long — aim to close in 30 seconds" },
];

const transcriptLines = [
  "So, um, in my previous role at Acme Corp, I was leading a cross-functional team of about eight people...",
  "And, like, the challenge was really about aligning everyone on the same goal without having direct authority...",
  "What I did was, I scheduled individual one-on-ones with each stakeholder to understand their concerns...",
  "Then I created a shared roadmap that clearly showed how each team's work contributed to the overall outcome...",
  "The result was that we shipped the project two weeks ahead of schedule with full team buy-in...",
];

const fillerWords = ["um", "like", "you know", "basically", "so"];

function highlightFiller(text: string) {
  const parts = text.split(/\b(um|like|you know|basically|so)\b/gi);
  return parts.map((part, i) =>
    fillerWords.some((fw) => fw.toLowerCase() === part.toLowerCase()) ? (
      <mark
        key={i}
        className="bg-amber-500/25 text-amber-500 rounded-[2px] px-0.5"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function LiveInterviewPage() {
  const navigate = useRouter();
  const [timer, setTimer] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [paused, setPaused] = useState(false);
  const [feedbacks, setFeedbacks] = useState<FeedbackBubble[]>([]);
  const [fillerCount, setFillerCount] = useState(7);
  const [confidence, setConfidence] = useState<"strong" | "moderate" | "low">("moderate");
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const feedbackId = useRef(0);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {});
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [paused]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (paused) return;
      const mock = mockFeedback[Math.floor(Math.random() * mockFeedback.length)];
      const id = ++feedbackId.current;
      setFeedbacks((prev) => [...prev.slice(-3), { id, type: mock.type, text: mock.text }]);
      setFillerCount((c) => c + (mock.type === "red" ? 1 : 0));
      setTimeout(() => {
        setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      }, 8000);
    }, 4500);
    return () => clearInterval(interval);
  }, [paused]);

  useEffect(() => {
    const levels: ("strong" | "moderate" | "low")[] = ["strong", "moderate", "low", "moderate", "strong"];
    let i = 0;
    const interval = setInterval(() => {
      setConfidence(levels[i % levels.length]);
      i++;
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAiSpeaking(true);
      setTimeout(() => setAiSpeaking(false), 3200);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const confidenceConfig = {
    strong: { label: "Strong Delivery", color: "#22C55E", bg: "rgba(34,197,94,0.15)", dot: "#22C55E" },
    moderate: { label: "Moderate Confidence", color: "#F59E0B", bg: "rgba(245,158,11,0.15)", dot: "#F59E0B" },
    low: { label: "Low Confidence", color: "#EF4444", bg: "rgba(239,68,68,0.15)", dot: "#EF4444" },
  }[confidence];

  const feedbackColors: Record<FeedbackType, { border: string; bg: string }> = {
    red: { border: "#EF4444", bg: "rgba(239,68,68,0.08)" },
    yellow: { border: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
    green: { border: "#22C55E", bg: "rgba(34,197,94,0.08)" },
  };

  const emoji: Record<FeedbackType, string> = { red: "🔴", yellow: "🟡", green: "🟢" };

  return (
    <div
      className="h-screen w-screen overflow-hidden relative select-none bg-[#1c1c1c]"
    >

      {/* ── MAIN STAGE: AI Interviewer ── */}
      <div className={`absolute inset-0 flex items-center justify-center transition-[padding] duration-300 ${showPanel ? "sm:pr-[380px]" : ""}`}>
        {/* Ambient background radial */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_45%,rgba(59,130,246,0.03)_0%,transparent_70%)]" />

        {/* AI Interviewer tile */}
        <div
          className={`relative flex flex-col items-center justify-center rounded-3xl w-[min(580px,88vw)] px-12 py-[52px] bg-[rgba(40,40,40,0.85)] backdrop-blur-xl transition-[border,box-shadow] duration-[400ms] ${
            aiSpeaking
              ? "border border-blue-500/40 shadow-[0_0_60px_rgba(59,130,246,0.15)]"
              : "border border-white/[0.07] shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
          }`}
        >
          {/* Avatar */}
          <div className="relative mb-6">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-700 to-violet-700"
            >
              <span className="text-white text-[32px] font-extrabold">AI</span>
            </div>
            {aiSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-blue-500 animate-speak-ring" />
                <div className="absolute -inset-3 rounded-full border border-blue-500/30 animate-speak-ring-delayed" />
              </>
            )}
          </div>

          {/* Name + status */}
          <p className="text-[#F8FAFC] text-xl font-bold mb-1.5">
            Speakprime AI Interviewer
          </p>
          <div className="flex items-center gap-2 mb-8">
            {aiSpeaking ? (
              <>
                <div className="flex gap-0.5 items-end h-4">
                  {[0, 0.1, 0.2, 0.15, 0.08].map((d, i) => (
                    <div key={i} className="w-1 rounded-sm" style={{ height: "100%", background: "#3B82F6", animation: `waveform 0.5s ease ${d}s infinite` }} />
                  ))}
                </div>
                <span className="text-blue-500 text-[13px] font-medium">Speaking…</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />
                <span className="text-slate-500 text-[13px]">Listening…</span>
              </>
            )}
          </div>

          {/* Current Question card */}
          <div
            className="w-full rounded-2xl p-5 bg-blue-500/[0.08] border border-blue-500/20"
          >
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.08em] mb-2">
              Current Question
            </p>
            <p className="text-[#F8FAFC] text-[15px] leading-[1.65] font-medium">
              "Tell me about a time you had to influence a team without authority."
            </p>
          </div>
        </div>
      </div>

      {/* ── USER WEBCAM PIP ── */}
      <div
        className={`absolute z-20 rounded-2xl overflow-hidden bottom-[90px] w-[200px] h-[148px] border-2 border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.7)] bg-[#111827] transition-[right] duration-300 ease-out right-4 ${showPanel ? "sm:right-[396px]" : ""}`}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover ${cameraOff ? "opacity-0" : "opacity-100"}`}
        />
        {cameraOff && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#111827]">
            <VideoOff size={28} color="#334155" />
          </div>
        )}
        {/* Name bar */}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/85 to-transparent">
          <div className="flex items-center gap-1.5">
            <span className="text-white text-[11px] font-semibold">You</span>
            {muted && <MicOff size={10} color="#EF4444" />}
          </div>
        </div>
      </div>

      {/* ── FLOATING TOP BAR ── */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-20 gap-3">
        {/* Left cluster */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(239,68,68,0.92)] backdrop-blur-sm"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-dot-fast" />
            <span className="text-white text-[11px] font-bold tracking-[0.06em]">LIVE</span>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-xl border border-white/10"
          >
            <Wifi size={12} color="#22C55E" />
            <span className="text-[#F8FAFC] text-[13px] font-semibold font-mono">{formatTime(timer)}</span>
          </div>
          <div
            className="hidden sm:flex px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-xl border border-white/[0.07]"
          >
            <span className="text-slate-400 text-xs">Behavioral · Senior PM</span>
          </div>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm"
            style={{ background: confidenceConfig.bg, border: `1px solid ${confidenceConfig.color}35` }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: confidenceConfig.dot }} />
            <span className="text-[12px] font-semibold" style={{ color: confidenceConfig.color }}>{confidenceConfig.label}</span>
          </div>
          <div
            className="hidden sm:flex px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-xl border border-white/10"
          >
            <span className="text-slate-400 text-xs">
              Filler words: <span className="text-amber-500 font-semibold">{fillerCount}</span>
            </span>
          </div>
          {/* Coach panel toggle */}
          <button
            onClick={() => setShowPanel(!showPanel)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-xl transition-all ${
              showPanel
                ? "bg-blue-500/35 border border-blue-500/50 text-blue-300"
                : "bg-black/55 border border-white/10 text-slate-400"
            }`}
          >
            <MessageSquare size={13} />
            <span className="text-[12px] font-medium">Coach</span>
            <ChevronRight size={12} className={`transition-transform duration-200 ${showPanel ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── FEEDBACK TOASTS (bottom-left) ── */}
      <div className="absolute z-20 space-y-2 bottom-[90px] left-4 max-w-[340px]">
        {feedbacks.map((f) => (
          <div
            key={f.id}
            className="feedback-toast px-4 py-3 rounded-2xl bg-[rgba(18,18,18,0.92)] backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
            style={{
              borderLeft: `3px solid ${feedbackColors[f.type].border}`,
              border: `1px solid ${feedbackColors[f.type].border}25`,
              borderLeftWidth: "3px",
            }}
          >
            <span className="text-slate-100 text-[13px] leading-[1.5]">
              {emoji[f.type]} {f.text}
            </span>
          </div>
        ))}
      </div>

      {/* ── BOTTOM CONTROL BAR ── */}
      <div className={`absolute bottom-5 left-0 right-0 flex items-center justify-center z-20 transition-[padding] duration-300 ${showPanel ? "sm:pr-[380px]" : ""}`}>
        <div
          className="flex items-center gap-3 px-5 py-3 rounded-full bg-[rgba(10,14,26,0.88)] backdrop-blur-2xl border border-white/[0.09] shadow-[0_8px_40px_rgba(0,0,0,0.7)]">
          {/* Progress */}
          <div className="hidden md:flex items-center gap-2 pr-4 border-r border-white/10">
            <div className="w-28 h-1 rounded-full overflow-hidden bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((timer / (30 * 60)) * 100, 100)}%`, background: "linear-gradient(90deg, #3B82F6, #8B5CF6)" }}
              />
            </div>
            <span className="text-slate-500 text-[11px] font-mono">{formatTime(timer)}/30:00</span>
          </div>

          {/* Mic */}
          <button
            onClick={() => setMuted(!muted)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 ${muted ? "bg-red-500" : "bg-white/[0.12]"}`}
            title={muted ? "Unmute" : "Mute"}>
            {muted ? <MicOff size={19} color="white" /> : <Mic size={19} color="white" />}
          </button>

          {/* Camera */}
          <button
            onClick={() => setCameraOff(!cameraOff)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 ${cameraOff ? "bg-red-500" : "bg-white/[0.12]"}`}
            title={cameraOff ? "Turn camera on" : "Turn camera off"}>
            {cameraOff ? <VideoOff size={19} color="white" /> : <Video size={19} color="white" />}
          </button>

          {/* Pause */}
          <button
            onClick={() => setPaused(!paused)}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 bg-white/[0.12]"
            title={paused ? "Resume" : "Pause"}
          >
            {paused ? <Play size={19} color="white" /> : <Pause size={19} color="white" />}
          </button>

          {/* End Session */}
          <button
            onClick={() => setShowEndConfirm(true)}
            className="flex items-center gap-2 px-5 h-12 rounded-full transition-all duration-200 hover:scale-105 hover:bg-red-600 ml-2 bg-red-500 text-white text-[13px] font-semibold">
            <PhoneOff size={17} color="white" />
            <span className="hidden sm:inline">End Session</span>
          </button>
        </div>
      </div>

      {/* ── RIGHT COACH PANEL ── */}
      {showPanel && (
        <div
          className="coach-panel fixed inset-0 sm:absolute sm:inset-auto sm:top-0 sm:right-0 sm:bottom-0 z-30 flex flex-col w-full sm:w-[380px] bg-[rgba(22,22,22,0.97)] backdrop-blur-[32px] border-l border-white/[0.07]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-violet-500">
                <span className="text-white text-[10px] font-extrabold">AI</span>
              </div>
              <div>
                <p className="text-[#F8FAFC] text-sm font-bold">Speakprime AI</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-dot" />
                <span className="text-green-500 text-[11px]">Active</span>
              </div>
              <button onClick={() => setShowPanel(false)} className="p-1 rounded-md text-slate-600">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Question */}
          <div className="px-5 py-4 border-b border-white/[0.07]">
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.08em] mb-2">Current Question</p>
            <div className="p-4 rounded-xl bg-blue-500/[0.08] border border-blue-500/[0.18]">
              <p className="text-[#F8FAFC] text-[13px] leading-[1.65] font-medium">
                "Tell me about a time you had to influence a team without authority."
              </p>
            </div>
          </div>

          {/* Live Transcript */}
          <div className="flex-1 overflow-auto px-5 py-4">
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.08em] mb-3">Live Transcript</p>
            <div className="space-y-3">
              {transcriptLines
                .slice(0, Math.min(Math.ceil(timer / 15) + 1, transcriptLines.length))
                .map((line, i) => (
                  <p key={i} className="text-slate-400 text-[13px] leading-[1.75]">
                    {highlightFiller(line)}
                  </p>
                ))}
              {timer > 0 && (
                <span
                  className="inline-block w-1.5 h-4 rounded-sm ml-1 bg-blue-500 animate-waveform"
                />
              )}
            </div>
          </div>

          {/* Feedback feed */}
          <div className="px-5 py-4 border-t border-white/[0.07]">
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.08em] mb-2.5">Real-Time Coaching</p>
            <div className="space-y-2 max-h-[200px] overflow-hidden">
              {feedbacks.length === 0 && (
                <p className="text-[#334155] text-xs">Coaching tips will appear here…</p>
              )}
              {feedbacks.map((f) => (
                <div
                  key={f.id}
                  className="feedback-toast p-3 rounded-xl"
                  style={{
                    background: feedbackColors[f.type].bg,
                    borderLeft: `3px solid ${feedbackColors[f.type].border}`,
                  }}
                >
                  <span className="text-slate-200 text-xs leading-[1.5]">
                    {emoji[f.type]} {f.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI speaking indicator */}
          {aiSpeaking && (
            <div className="px-5 py-3 flex items-center gap-2 border-t border-white/[0.07]">
              <div className="flex gap-0.5 items-end h-4">
                {[0, 0.1, 0.2, 0.15, 0.05, 0.1, 0.2].map((delay, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-sm"
                    style={{ height: "100%", background: "#3B82F6", animation: `waveform 0.6s ease ${delay}s infinite` }}
                  />
                ))}
              </div>
              <span className="text-blue-500 text-xs font-medium">Speakprime is speaking…</span>
            </div>
          )}
        </div>
      )}

      {/* ── END SESSION MODAL ── */}
      {showEndConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md"
        >
          <div
            className="p-8 rounded-3xl w-full max-w-sm bg-[#111111] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.8)]"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-red-500/[0.12] border border-red-500/25">
              <PhoneOff size={22} color="#EF4444" />
            </div>
            <h3 className="text-[#F8FAFC] text-[18px] font-bold text-center mb-2">End Session?</h3>
            <p className="text-slate-500 text-sm text-center mb-7 leading-[1.6]">
              Your session will be saved and a full performance report will be generated.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 py-3 rounded-2xl transition-opacity hover:opacity-80 bg-[#2a2a2a] border border-white/10 text-slate-400 text-sm">
                Cancel
              </button>
              <button
                onClick={() => navigate.push("/session/report/1")}
                className="flex-1 py-3 rounded-2xl transition-opacity hover:opacity-90 bg-red-500 text-white text-sm font-semibold">
                End & View Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
