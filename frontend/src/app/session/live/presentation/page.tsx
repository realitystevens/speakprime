import { LivePresentationPage } from "@/app/pages/LivePresentationPage";

export default function Page() {
  return <LivePresentationPage />;
}
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  ChevronLeft, ChevronRight, X, LayoutGrid, Maximize2,
} from "lucide-react";

type FeedbackType = "red" | "yellow" | "green";

interface CoachFeed {
  id: number;
  time: string;
  type: FeedbackType;
  text: string;
}

const mockSlides = [
  {
    title: "Q1 2026 Product Roadmap",
    bullets: ["Launch Speakprime v2.0", "Expand to 10 new markets", "Reach 100,000 active users", "Integrate with Zoom & Teams", "Ship mobile app (iOS / Android)"],
    quality: "yellow" as FeedbackType,
    qualityText: "Slide has too much text",
  },
  {
    title: "Key Milestones",
    bullets: ["Jan: Beta launch", "Feb: 10k users", "Mar: Enterprise tier"],
    quality: "green" as FeedbackType,
    qualityText: "Clean and clear",
  },
  {
    title: "Market Opportunity",
    bullets: ["$4.2B TAM", "28% YoY growth", "Underserved SMB segment"],
    quality: "green" as FeedbackType,
    qualityText: "Strong slide",
  },
  {
    title: "Competitive Analysis",
    bullets: ["vs Yoodli: No slide analysis", "vs Speeko: No live feedback", "vs Poised: Limited interview prep", "Speakprime: All-in-one AI coach", "Unique: Vision + Voice + Slides"],
    quality: "yellow" as FeedbackType,
    qualityText: "Consider simplifying",
  },
  {
    title: "Revenue Model",
    bullets: ["Free: 3 sessions/month", "Pro: $29/mo — unlimited", "Team: $99/mo — 5 seats"],
    quality: "green" as FeedbackType,
    qualityText: "Concise and clear",
  },
];

const feedbackPool: { type: FeedbackType; text: string }[] = [
  { type: "red", text: "Slide has 7 bullet points — simplify to 3 key ideas" },
  { type: "yellow", text: "You've been on this slide 2+ min — consider moving on" },
  { type: "green", text: "Great energy on that transition!" },
  { type: "red", text: "Voice dropped at end of sentence — project through" },
  { type: "yellow", text: "Slow down slightly — you're at 168 WPM" },
  { type: "green", text: "Strong data point, well delivered" },
  { type: "red", text: "You're reading from the slide — look at the camera" },
];

const qualityColors: Record<FeedbackType, { color: string; bg: string; border: string }> = {
  red: { color: "#EF4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)" },
  yellow: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
  green: { color: "#22C55E", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)" },
};

const feedbackColors: Record<FeedbackType, { border: string; bg: string }> = {
  red: { border: "#EF4444", bg: "rgba(239,68,68,0.08)" },
  yellow: { border: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
  green: { border: "#22C55E", bg: "rgba(34,197,94,0.08)" },
};

const emoji: Record<FeedbackType, string> = { red: "🔴", yellow: "🟡", green: "🟢" };

export function LivePresentationPage() {
  const navigate = useRouter();
  const [timer, setTimer] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideTimer, setSlideTimer] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [feedbackFeed, setFeedbackFeed] = useState<CoachFeed[]>([]);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [eyeContact, setEyeContact] = useState<"good" | "bad">("good");
  const videoRef = useRef<HTMLVideoElement>(null);
  const feedId = useRef(0);

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
    const interval = setInterval(() => {
      setTimer((t) => t + 1);
      setSlideTimer((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const mock = feedbackPool[Math.floor(Math.random() * feedbackPool.length)];
      const id = ++feedId.current;
      const mins = Math.floor(timer / 60);
      const secs = timer % 60;
      setFeedbackFeed((prev) => [
        { id, time: `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`, type: mock.type, text: mock.text },
        ...prev.slice(0, 12),
      ]);
    }, 5000);
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    const interval = setInterval(() => {
      setEyeContact((e) => (e === "good" ? "bad" : "good"));
      setAiSpeaking(true);
      setTimeout(() => setAiSpeaking(false), 2800);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const currentSlide = mockSlides[slideIndex];

  const goSlide = (idx: number) => {
    setSlideIndex(idx);
    setSlideTimer(0);
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden relative select-none"
      style={{ background: "#1c1c1c" }}
    >
      <style>{`
        @keyframes waveform { 0%, 100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }
        @keyframes pulseDot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes panelSlide { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .feed-item { animation: fadeSlideUp 0.3s ease; }
        .coach-panel { animation: panelSlide 0.3s cubic-bezier(0.4,0,0.2,1); }
      `}</style>

      {/* ── MAIN STAGE: Slide ── */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{
          paddingRight: showPanel ? "380px" : "0",
          paddingBottom: "84px",
          paddingTop: "68px",
          transition: "padding 0.3s ease",
        }}
      >
        {/* Slide wrapper */}
        <div
          className="relative w-full h-full flex items-center justify-center px-8"
        >
          {/* Slide card */}
          <div
            className="relative rounded-2xl overflow-hidden flex flex-col justify-center"
            style={{
              width: "100%",
              maxWidth: "960px",
              aspectRatio: "16/9",
              maxHeight: "calc(100vh - 160px)",
              background: "linear-gradient(135deg, #111111 0%, #1a1a1a 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
            }}
          >
            {/* Slide quality badge */}
            <div
              className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                background: qualityColors[currentSlide.quality].bg,
                border: `1px solid ${qualityColors[currentSlide.quality].border}`,
                backdropFilter: "blur(8px)",
              }}
            >
              <span style={{ fontSize: "11px" }}>{emoji[currentSlide.quality]}</span>
              <span style={{ color: qualityColors[currentSlide.quality].color, fontSize: "11px", fontWeight: 600 }}>{currentSlide.qualityText}</span>
            </div>

            {/* Slide slide time */}
            <div
              className="absolute top-4 left-4 px-2.5 py-1 rounded-full"
              style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <span style={{ color: "#64748B", fontSize: "11px", fontFamily: "monospace" }}>{formatTime(slideTimer)} on slide</span>
            </div>

            {/* Slide content */}
            <div className="px-16 py-12">
              <div
                className="mb-3 text-xs uppercase tracking-widest"
                style={{ color: "#3B82F6", letterSpacing: "0.12em" }}
              >
                Q1 2026 · Speakprime
              </div>
              <h2
                style={{
                  color: "#F8FAFC",
                  fontSize: "clamp(22px, 3vw, 36px)",
                  fontWeight: 800,
                  marginBottom: "28px",
                  lineHeight: 1.2,
                }}
              >
                {currentSlide.title}
              </h2>
              <ul className="space-y-4">
                {currentSlide.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div
                      className="flex-shrink-0 mt-1.5"
                      style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#3B82F6" }}
                    />
                    <span style={{ color: "#94A3B8", fontSize: "clamp(13px, 1.5vw, 17px)", lineHeight: 1.5 }}>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bottom progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${((slideIndex + 1) / mockSlides.length) * 100}%`,
                  background: "linear-gradient(90deg, #3B82F6, #8B5CF6)",
                }}
              />
            </div>
          </div>

          {/* Slide nav arrows — overlaid on sides */}
          <button
            onClick={() => slideIndex > 0 && goSlide(slideIndex - 1)}
            disabled={slideIndex === 0}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{
              background: slideIndex === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: slideIndex === 0 ? "#1e293b" : "#94A3B8",
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => slideIndex < mockSlides.length - 1 && goSlide(slideIndex + 1)}
            disabled={slideIndex === mockSlides.length - 1}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{
              background: slideIndex === mockSlides.length - 1 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: slideIndex === mockSlides.length - 1 ? "#1e293b" : "#94A3B8",
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* ── USER WEBCAM PIP ── */}
      <div
        className="absolute z-20 rounded-2xl overflow-hidden"
        style={{
          top: "80px",
          right: showPanel ? "396px" : "16px",
          width: "188px",
          height: "140px",
          border: "2px solid rgba(255,255,255,0.12)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
          background: "#111827",
          transition: "right 0.3s ease",
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
          <div className="absolute inset-0 flex items-center justify-center">
            <VideoOff size={28} color="#334155" />
          </div>
        )}
        {/* Eye contact indicator */}
        <div
          className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)" }}
        >
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: eyeContact === "good" ? "#22C55E" : "#EF4444" }}
            />
            <span style={{ color: "white", fontSize: "10px", fontWeight: 600 }}>
              {eyeContact === "good" ? "Eye contact ✓" : "Look at camera"}
            </span>
          </div>
        </div>
        {muted && (
          <div className="absolute top-2 right-2 p-1 rounded-full" style={{ background: "rgba(239,68,68,0.9)" }}>
            <MicOff size={10} color="white" />
          </div>
        )}
      </div>

      {/* ── FLOATING TOP BAR ── */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 gap-3">
        {/* Left */}
        <div className="flex items-center gap-2">
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
            <span style={{ color: "#F8FAFC", fontSize: "13px", fontWeight: 600, fontFamily: "monospace" }}>{formatTime(timer)}</span>
          </div>
          {/* Slide dots */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <LayoutGrid size={12} color="#64748B" />
            <span style={{ color: "#94A3B8", fontSize: "12px" }}>
              Slide {slideIndex + 1} / {mockSlides.length}
            </span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* AI speaking */}
          {aiSpeaking && (
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(59,130,246,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(59,130,246,0.3)" }}
            >
              <div className="flex gap-0.5 items-end h-3">
                {[0, 0.1, 0.2, 0.15, 0.05].map((d, i) => (
                  <div key={i} className="w-0.5 rounded-sm" style={{ height: "100%", background: "#3B82F6", animation: `waveform 0.5s ease ${d}s infinite` }} />
                ))}
              </div>
              <span style={{ color: "#3B82F6", fontSize: "12px" }}>AI feedback…</span>
            </div>
          )}
          {/* Coach toggle */}
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
            <Maximize2 size={13} />
            <span style={{ fontSize: "12px", fontWeight: 500 }}>Coach</span>
          </button>
        </div>
      </div>

      {/* ── BOTTOM CONTROL BAR ── */}
      <div
        className="absolute bottom-5 left-0 right-0 flex items-center justify-center z-20"
        style={{ paddingRight: showPanel ? "380px" : "0", transition: "padding 0.3s ease" }}
      >
        <div
          className="flex items-center gap-3 px-5 py-3 rounded-full"
          style={{
            background: "rgba(10,14,26,0.88)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
          }}
        >
          {/* Slide dots */}
          <div className="hidden sm:flex items-center gap-1.5 pr-4" style={{ borderRight: "1px solid rgba(255,255,255,0.1)" }}>
            {mockSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => goSlide(i)}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === slideIndex ? "20px" : "6px",
                  height: "6px",
                  background: i === slideIndex ? "#3B82F6" : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>

          {/* Slide back */}
          <button
            onClick={() => slideIndex > 0 && goSlide(slideIndex - 1)}
            disabled={slideIndex === 0}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
            style={{ background: "rgba(255,255,255,0.08)", color: slideIndex === 0 ? "#1e293b" : "#94A3B8" }}
          >
            <ChevronLeft size={17} />
          </button>

          {/* Slide forward */}
          <button
            onClick={() => slideIndex < mockSlides.length - 1 && goSlide(slideIndex + 1)}
            disabled={slideIndex === mockSlides.length - 1}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
            style={{ background: "rgba(255,255,255,0.08)", color: slideIndex === mockSlides.length - 1 ? "#1e293b" : "#94A3B8" }}
          >
            <ChevronRight size={17} />
          </button>

          {/* Divider */}
          <div className="w-px h-6" style={{ background: "rgba(255,255,255,0.1)" }} />

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

          {/* End */}
          <button
            onClick={() => setShowEndConfirm(true)}
            className="flex items-center gap-2 px-5 h-12 rounded-full ml-2 transition-all hover:scale-105 hover:bg-red-600"
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
            background: "rgba(18,18,18,0.97)",
            backdropFilter: "blur(32px)",
            borderLeft: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div>
              <p style={{ color: "#F8FAFC", fontSize: "14px", fontWeight: 700 }}>Real-Time Coaching</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#22C55E", animation: "pulseDot 2s infinite" }} />
                <span style={{ color: "#22C55E", fontSize: "11px" }}>Live feedback active</span>
              </div>
            </div>
            <button onClick={() => setShowPanel(false)} className="p-1 rounded-md" style={{ color: "#475569" }}>
              <X size={16} />
            </button>
          </div>

          {/* Eye contact & posture */}
          <div className="px-5 py-4 space-y-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div
              className="flex items-center gap-2.5 p-3 rounded-xl"
              style={{
                background: eyeContact === "bad" ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
                border: eyeContact === "bad" ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(34,197,94,0.2)",
              }}
            >
              <span style={{ fontSize: "14px" }}>{eyeContact === "bad" ? "🔴" : "🟢"}</span>
              <span style={{ color: eyeContact === "bad" ? "#EF4444" : "#22C55E", fontSize: "12px" }}>
                {eyeContact === "bad" ? "Reading from slides — look at camera" : "Good eye contact — keep it up"}
              </span>
            </div>
            <div
              className="flex items-center gap-2.5 p-3 rounded-xl"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              <span style={{ fontSize: "14px" }}>🟢</span>
              <span style={{ color: "#22C55E", fontSize: "12px" }}>Good posture detected</span>
            </div>
          </div>

          {/* Slide overview */}
          <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <p style={{ color: "#475569", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Slides</p>
            <div className="space-y-1.5">
              {mockSlides.map((s, i) => (
                <button
                  key={i}
                  onClick={() => goSlide(i)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
                  style={{
                    background: i === slideIndex ? "rgba(59,130,246,0.12)" : "transparent",
                    border: i === slideIndex ? "1px solid rgba(59,130,246,0.25)" : "1px solid transparent",
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: qualityColors[s.quality].color }}
                  />
                  <span style={{ color: i === slideIndex ? "#F8FAFC" : "#64748B", fontSize: "12px", flex: 1 }} className="truncate">
                    {i + 1}. {s.title}
                  </span>
                  {i === slideIndex && (
                    <span style={{ color: "#3B82F6", fontSize: "10px", fontWeight: 600 }}>CURRENT</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback feed */}
          <div className="flex-1 overflow-auto px-5 py-4">
            <p style={{ color: "#475569", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
              Coaching Feed
            </p>
            {feedbackFeed.length === 0 && (
              <p style={{ color: "#334155", fontSize: "12px" }}>Coaching tips will appear as you present…</p>
            )}
            <div className="space-y-2">
              {feedbackFeed.map((f) => (
                <div
                  key={f.id}
                  className="feed-item p-3 rounded-xl"
                  style={{
                    background: feedbackColors[f.type].bg,
                    borderLeft: `3px solid ${feedbackColors[f.type].border}`,
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span style={{ color: "#475569", fontSize: "10px", fontFamily: "monospace", whiteSpace: "nowrap", marginTop: "1px" }}>
                      [{f.time}]
                    </span>
                    <p style={{ color: "#E2E8F0", fontSize: "12px", lineHeight: 1.55 }}>
                      {emoji[f.type]} {f.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI speaking indicator */}
          {aiSpeaking && (
            <div className="px-5 py-3 flex items-center gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex gap-0.5 items-end h-4">
                {[0, 0.1, 0.2, 0.15, 0.05].map((delay, i) => (
                  <div key={i} className="w-1 rounded-sm" style={{ height: "100%", background: "#3B82F6", animation: `waveform 0.6s ease ${delay}s infinite` }} />
                ))}
              </div>
              <span style={{ color: "#3B82F6", fontSize: "12px" }}>AI feedback playing…</span>
            </div>
          )}
        </div>
      )}

      {/* ── END CONFIRM MODAL ── */}
      {showEndConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="p-8 rounded-3xl w-full max-w-sm"
            style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}
            >
              <PhoneOff size={22} color="#EF4444" />
            </div>
            <h3 style={{ color: "#F8FAFC", fontSize: "18px", fontWeight: 700, textAlign: "center", marginBottom: "8px" }}>End Presentation?</h3>
            <p style={{ color: "#64748B", fontSize: "14px", textAlign: "center", marginBottom: "28px", lineHeight: 1.6 }}>
              Your presentation will be saved and a full performance report will be generated.
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
                onClick={() => navigate.push("/session/report/2")}
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
