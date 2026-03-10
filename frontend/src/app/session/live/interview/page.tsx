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
        style={{
          background: "rgba(245,158,11,0.25)",
          color: "#F59E0B",
          borderRadius: "2px",
          padding: "0 2px",
        }}
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
      className="h-screen w-screen overflow-hidden relative select-none"
      style={{ background: "#1c1c1c" }}
    >
      <style>{`
        @keyframes waveform { 0%, 100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }
        @keyframes pulseDot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes speakRing { 0% { opacity: 0.8; transform: scale(1); } 100% { opacity: 0; transform: scale(1.3); } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes panelSlide { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .feedback-toast { animation: fadeSlideUp 0.3s ease; }
        .coach-panel { animation: panelSlide 0.3s cubic-bezier(0.4,0,0.2,1); }
      `}</style>

      {/* ── MAIN STAGE: AI Interviewer ── */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ paddingRight: showPanel ? "380px" : "0", transition: "padding 0.3s ease" }}>
        {/* Ambient background radial */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(59,130,246,0.03) 0%, transparent 70%)" }} />

        {/* AI Interviewer tile */}
        <div
          className="relative flex flex-col items-center justify-center rounded-3xl"
          style={{
            width: "min(580px, 88vw)",
            padding: "52px 48px",
            background: "rgba(40,40,40,0.85)",
            backdropFilter: "blur(20px)",
            border: aiSpeaking ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.07)",
            boxShadow: aiSpeaking ? "0 0 60px rgba(59,130,246,0.15)" : "0 24px 80px rgba(0,0,0,0.7)",
            transition: "border 0.4s, box-shadow 0.4s",
          }}
        >
          {/* Avatar */}
          <div className="relative mb-6">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)" }}
            >
              <span style={{ color: "white", fontSize: "32px", fontWeight: 800 }}>AI</span>
            </div>
            {aiSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full" style={{ border: "2px solid #3B82F6", animation: "speakRing 1.2s ease infinite" }} />
                <div className="absolute -inset-3 rounded-full" style={{ border: "1px solid rgba(59,130,246,0.3)", animation: "speakRing 1.2s ease 0.4s infinite" }} />
              </>
            )}
          </div>

          {/* Name + status */}
          <p style={{ color: "#F8FAFC", fontSize: "20px", fontWeight: 700, marginBottom: "6px" }}>
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
                <span style={{ color: "#3B82F6", fontSize: "13px", fontWeight: 500 }}>Speaking…</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full" style={{ background: "#22C55E", animation: "pulseDot 2s infinite" }} />
                <span style={{ color: "#64748B", fontSize: "13px" }}>Listening…</span>
              </>
            )}
          </div>

          {/* Current Question card */}
          <div
            className="w-full rounded-2xl p-5"
            style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}
          >
            <p style={{ color: "#64748B", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
              Current Question
            </p>
            <p style={{ color: "#F8FAFC", fontSize: "15px", lineHeight: 1.65, fontWeight: 500 }}>
              "Tell me about a time you had to influence a team without authority."
            </p>
          </div>
        </div>
      </div>

      {/* ── USER WEBCAM PIP ── */}
      <div
        className="absolute z-20 rounded-2xl overflow-hidden"
        style={{
          bottom: "90px",
          right: showPanel ? "396px" : "16px",
          width: "200px",
          height: "148px",
          border: "2px solid rgba(255,255,255,0.12)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
          transition: "right 0.3s ease",
          background: "#111827",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ opacity: cameraOff ? 0 : 1 }}
        />
        {cameraOff && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "#111827" }}>
            <VideoOff size={28} color="#334155" />
          </div>
        )}
        {/* Name bar */}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)" }}>
          <div className="flex items-center gap-1.5">
            <span style={{ color: "white", fontSize: "11px", fontWeight: 600 }}>You</span>
            {muted && <MicOff size={10} color="#EF4444" />}
          </div>
        </div>
      </div>

      {/* ── FLOATING TOP BAR ── */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-20 gap-3">
        {/* Left cluster */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(239,68,68,0.92)", backdropFilter: "blur(8px)" }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white" style={{ animation: "pulseDot 1.5s infinite" }} />
            <span style={{ color: "white", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em" }}>LIVE</span>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <Wifi size={12} color="#22C55E" />
            <span style={{ color: "#F8FAFC", fontSize: "13px", fontWeight: 600, fontFamily: "monospace" }}>{formatTime(timer)}</span>
          </div>
          <div
            className="hidden sm:flex px-3 py-1.5 rounded-full"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <span style={{ color: "#94A3B8", fontSize: "12px" }}>Behavioral · Senior PM</span>
          </div>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: confidenceConfig.bg, border: `1px solid ${confidenceConfig.color}35`, backdropFilter: "blur(8px)" }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: confidenceConfig.dot }} />
            <span style={{ color: confidenceConfig.color, fontSize: "12px", fontWeight: 600 }}>{confidenceConfig.label}</span>
          </div>
          <div
            className="hidden sm:flex px-3 py-1.5 rounded-full"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <span style={{ color: "#94A3B8", fontSize: "12px" }}>
              Filler words: <span style={{ color: "#F59E0B", fontWeight: 600 }}>{fillerCount}</span>
            </span>
          </div>
          {/* Coach panel toggle */}
          <button
            onClick={() => setShowPanel(!showPanel)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
            style={{
              background: showPanel ? "rgba(59,130,246,0.35)" : "rgba(0,0,0,0.55)",
              backdropFilter: "blur(16px)",
              border: showPanel ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.1)",
              color: showPanel ? "#93C5FD" : "#94A3B8",
            }}
          >
            <MessageSquare size={13} />
            <span style={{ fontSize: "12px", fontWeight: 500 }}>Coach</span>
            <ChevronRight size={12} style={{ transform: showPanel ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>
        </div>
      </div>

      {/* ── FEEDBACK TOASTS (bottom-left) ── */}
      <div
        className="absolute z-20 space-y-2"
        style={{ bottom: "90px", left: "16px", maxWidth: "340px" }}
      >
        {feedbacks.map((f) => (
          <div
            key={f.id}
            className="feedback-toast px-4 py-3 rounded-2xl"
            style={{
              background: "rgba(18,18,18,0.92)",
              backdropFilter: "blur(20px)",
              borderLeft: `3px solid ${feedbackColors[f.type].border}`,
              border: `1px solid ${feedbackColors[f.type].border}25`,
              borderLeftWidth: "3px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}
          >
            <span style={{ color: "#F1F5F9", fontSize: "13px", lineHeight: 1.5 }}>
              {emoji[f.type]} {f.text}
            </span>
          </div>
        ))}
      </div>

      {/* ── BOTTOM CONTROL BAR ── */}
      <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center z-20" style={{ paddingRight: showPanel ? "380px" : "0", transition: "padding 0.3s ease" }}>
        <div
          className="flex items-center gap-3 px-5 py-3 rounded-full"
          style={{
            background: "rgba(10,14,26,0.88)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.7)",
          }}
        >
          {/* Progress */}
          <div className="hidden md:flex items-center gap-2 pr-4" style={{ borderRight: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="w-28 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((timer / (30 * 60)) * 100, 100)}%`, background: "linear-gradient(90deg, #3B82F6, #8B5CF6)" }}
              />
            </div>
            <span style={{ color: "#64748B", fontSize: "11px", fontFamily: "monospace" }}>{formatTime(timer)}/30:00</span>
          </div>

          {/* Mic */}
          <button
            onClick={() => setMuted(!muted)}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
            style={{ background: muted ? "#EF4444" : "rgba(255,255,255,0.12)" }}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? <MicOff size={19} color="white" /> : <Mic size={19} color="white" />}
          </button>

          {/* Camera */}
          <button
            onClick={() => setCameraOff(!cameraOff)}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
            style={{ background: cameraOff ? "#EF4444" : "rgba(255,255,255,0.12)" }}
            title={cameraOff ? "Turn camera on" : "Turn camera off"}
          >
            {cameraOff ? <VideoOff size={19} color="white" /> : <Video size={19} color="white" />}
          </button>

          {/* Pause */}
          <button
            onClick={() => setPaused(!paused)}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
            style={{ background: "rgba(255,255,255,0.12)" }}
            title={paused ? "Resume" : "Pause"}
          >
            {paused ? <Play size={19} color="white" /> : <Pause size={19} color="white" />}
          </button>

          {/* End Session */}
          <button
            onClick={() => setShowEndConfirm(true)}
            className="flex items-center gap-2 px-5 h-12 rounded-full transition-all duration-200 hover:scale-105 hover:bg-red-600 ml-2"
            style={{ background: "#EF4444", color: "white", fontSize: "13px", fontWeight: 600 }}
          >
            <PhoneOff size={17} color="white" />
            <span className="hidden sm:inline">End Session</span>
          </button>
        </div>
      </div>

      {/* ── RIGHT COACH PANEL ── */}
      {showPanel && (
        <div
          className="coach-panel absolute top-0 right-0 bottom-0 z-30 flex flex-col"
          style={{
            width: "380px",
            background: "rgba(22,22,22,0.97)",
            backdropFilter: "blur(32px)",
            borderLeft: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}>
                <span style={{ color: "white", fontSize: "10px", fontWeight: 800 }}>AI</span>
              </div>
              <div>
                <p style={{ color: "#F8FAFC", fontSize: "14px", fontWeight: 700 }}>Speakprime AI</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#22C55E", animation: "pulseDot 2s infinite" }} />
                <span style={{ color: "#22C55E", fontSize: "11px" }}>Active</span>
              </div>
              <button onClick={() => setShowPanel(false)} className="p-1 rounded-md" style={{ color: "#475569" }}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Question */}
          <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <p style={{ color: "#475569", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Current Question</p>
            <div className="p-4 rounded-xl" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.18)" }}>
              <p style={{ color: "#F8FAFC", fontSize: "13px", lineHeight: 1.65, fontWeight: 500 }}>
                "Tell me about a time you had to influence a team without authority."
              </p>
            </div>
          </div>

          {/* Live Transcript */}
          <div className="flex-1 overflow-auto px-5 py-4">
            <p style={{ color: "#475569", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Live Transcript</p>
            <div className="space-y-3">
              {transcriptLines
                .slice(0, Math.min(Math.ceil(timer / 15) + 1, transcriptLines.length))
                .map((line, i) => (
                  <p key={i} style={{ color: "#94A3B8", fontSize: "13px", lineHeight: 1.75 }}>
                    {highlightFiller(line)}
                  </p>
                ))}
              {timer > 0 && (
                <span
                  className="inline-block w-1.5 h-4 rounded-sm ml-1"
                  style={{ background: "#3B82F6", animation: "waveform 0.8s ease infinite" }}
                />
              )}
            </div>
          </div>

          {/* Feedback feed */}
          <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <p style={{ color: "#475569", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Real-Time Coaching</p>
            <div className="space-y-2" style={{ maxHeight: "200px", overflow: "hidden" }}>
              {feedbacks.length === 0 && (
                <p style={{ color: "#334155", fontSize: "12px" }}>Coaching tips will appear here…</p>
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
                  <span style={{ color: "#E2E8F0", fontSize: "12px", lineHeight: 1.5 }}>
                    {emoji[f.type]} {f.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI speaking indicator */}
          {aiSpeaking && (
            <div className="px-5 py-3 flex items-center gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex gap-0.5 items-end h-4">
                {[0, 0.1, 0.2, 0.15, 0.05, 0.1, 0.2].map((delay, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-sm"
                    style={{ height: "100%", background: "#3B82F6", animation: `waveform 0.6s ease ${delay}s infinite` }}
                  />
                ))}
              </div>
              <span style={{ color: "#3B82F6", fontSize: "12px", fontWeight: 500 }}>Speakprime is speaking…</span>
            </div>
          )}
        </div>
      )}

      {/* ── END SESSION MODAL ── */}
      {showEndConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="p-8 rounded-3xl w-full max-w-sm"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <PhoneOff size={22} color="#EF4444" />
            </div>
            <h3 style={{ color: "#F8FAFC", fontSize: "18px", fontWeight: 700, textAlign: "center", marginBottom: "8px" }}>End Session?</h3>
            <p style={{ color: "#64748B", fontSize: "14px", textAlign: "center", marginBottom: "28px", lineHeight: 1.6 }}>
              Your session will be saved and a full performance report will be generated.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 py-3 rounded-2xl transition-opacity hover:opacity-80"
                style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8", fontSize: "14px" }}
              >
                Cancel
              </button>
              <button
                onClick={() => navigate.push("/session/report/1")}
                className="flex-1 py-3 rounded-2xl transition-opacity hover:opacity-90"
                style={{ background: "#EF4444", color: "white", fontSize: "14px", fontWeight: 600 }}
              >
                End & View Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
