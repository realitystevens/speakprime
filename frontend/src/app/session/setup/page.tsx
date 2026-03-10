"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/app/components/layout/Sidebar";
import {
  Mic, Monitor, ChevronRight, Upload, Camera, Volume2,
  CheckCircle, AlertCircle, ChevronLeft, Play
} from "lucide-react";

const interviewTypes = ["Behavioral", "Technical", "Case Study", "Mixed"];
const durations = ["15 min", "30 min", "45 min", "60 min"];
const presentationDurations = ["5 min", "10 min", "20 min", "30 min+"];
const audienceTypes = ["Executives", "Investors", "Team", "Conference", "Mixed"];

const interviewFocusAreas = ["STAR Method", "Filler Words", "Pacing", "Eye Contact", "Confidence", "Technical Accuracy"];
const presentationFocusAreas = ["Slide Structure", "Eye Contact", "Pacing", "Voice Clarity", "Confidence", "Slide Transitions"];

type Mode = "interview" | "presentation" | null;

export default function SessionSetupPage() {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<Mode>(null);
  const [interviewType, setInterviewType] = useState("Mixed");
  const [duration, setDuration] = useState("30 min");
  const [difficulty, setDifficulty] = useState(50);
  const [jobRole, setJobRole] = useState("");
  const [presentationTopic, setPresentationTopic] = useState("");
  const [audience, setAudience] = useState("Mixed");
  const [selectedFocus, setSelectedFocus] = useState<string[]>(["Eye Contact", "Confidence"]);
  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useRouter();

  useEffect(() => {
    if (step === 3) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setCameraReady(true);
          setMicReady(true);
        })
        .catch(() => {
          setCameraReady(false);
          setMicReady(false);
        });
    }
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
      }
    };
  }, [step]);

  const toggleFocus = (area: string) => {
    setSelectedFocus((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const focusAreas = mode === "interview" ? interviewFocusAreas : presentationFocusAreas;
  const durationList = mode === "interview" ? durations : presentationDurations;

  const difficultyLabel = difficulty < 35 ? "Easy" : difficulty < 65 ? "Medium" : "Hard";
  const difficultyColor = difficulty < 35 ? "#22C55E" : difficulty < 65 ? "#F59E0B" : "#EF4444";

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="flex items-center gap-1.5 mb-4" style={{ color: "#64748B", fontSize: "14px", textDecoration: "none" }}>
            <ChevronLeft size={16} /> Back to dashboard
          </Link>
          <h1 style={{ color: "#F8FAFC", fontSize: "26px", fontWeight: 800 }}>Setup Your Session</h1>
          <p style={{ color: "#64748B", fontSize: "14px", marginTop: "6px" }}>Configure your coaching session in 3 steps</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: step >= s ? "#3B82F6" : "#1e1e1e",
                  border: step >= s ? "none" : "1px solid #2a2a2a",
                  color: step >= s ? "white" : "#64748B",
                  fontSize: "13px",
                  fontWeight: 600,
                }}>
                {step > s ? <CheckCircle size={16} /> : s}
              </div>
              <span style={{ color: step === s ? "#F8FAFC" : "#64748B", fontSize: "13px", fontWeight: step === s ? 600 : 400 }}>
                {s === 1 ? "Choose Mode" : s === 2 ? "Configure" : "Camera & Mic"}
              </span>
              {s < 3 && <div className="w-8 h-px" style={{ background: step > s ? "#3B82F6" : "#2a2a2a" }} />}
            </div>
          ))}
        </div>

        {/* Step 1 — Choose Mode */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 style={{ color: "#F8FAFC", fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>
              What would you like to practice?
            </h2>
            {[
              { id: "interview" as Mode, icon: Mic, title: "Interview Mode", desc: "I want to practice answering interview questions", color: "#3B82F6", bg: "rgba(59,130,246,0.1)", borderActive: "#3B82F6" },
              { id: "presentation" as Mode, icon: Monitor, title: "Presentation Mode", desc: "I want to practice delivering a presentation", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)", borderActive: "#8B5CF6" },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setMode(opt.id)}
                className="w-full p-6 rounded-2xl text-left transition-all duration-200 hover:scale-[1.01]"
                style={{
                  background: mode === opt.id ? (opt.id === "interview" ? "rgba(59,130,246,0.08)" : "rgba(139,92,246,0.08)") : "#1e1e1e",
                  border: mode === opt.id ? `2px solid ${opt.borderActive}` : "2px solid #2a2a2a",
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: opt.bg }}>
                    <opt.icon size={28} color={opt.color} />
                  </div>
                  <div>
                    <div style={{ color: "#F8FAFC", fontSize: "17px", fontWeight: 700 }}>{opt.title}</div>
                    <div style={{ color: "#64748B", fontSize: "14px", marginTop: "4px" }}>{opt.desc}</div>
                  </div>
                  {mode === opt.id && (
                    <CheckCircle size={20} color={opt.color} className="ml-auto" />
                  )}
                </div>
              </button>
            ))}

            <button
              onClick={() => mode && setStep(2)}
              disabled={!mode}
              className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 mt-4 transition-opacity"
              style={{
                background: "#3B82F6",
                color: "white",
                fontSize: "15px",
                fontWeight: 600,
                opacity: mode ? 1 : 0.4,
              }}
            >
              Continue <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Step 2 — Configure */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 style={{ color: "#F8FAFC", fontSize: "18px", fontWeight: 700 }}>
              Configure your {mode === "interview" ? "Interview" : "Presentation"} session
            </h2>

            {mode === "interview" ? (
              <>
                <div>
                  <label style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 500, display: "block", marginBottom: "8px" }}>Interview Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {interviewTypes.map((t) => (
                      <button key={t} onClick={() => setInterviewType(t)}
                        className="py-2.5 px-4 rounded-lg text-left transition-all"
                        style={{
                          background: interviewType === t ? "rgba(59,130,246,0.12)" : "#141414",
                          border: interviewType === t ? "1px solid #3B82F6" : "1px solid #2a2a2a",
                          color: interviewType === t ? "#3B82F6" : "#94A3B8",
                          fontSize: "14px",
                          fontWeight: interviewType === t ? 600 : 400,
                        }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 500, display: "block", marginBottom: "8px" }}>Job Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Product Manager at Google"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg outline-none"
                    style={{ background: "#0F172A", border: "1px solid #334155", color: "#F8FAFC", fontSize: "14px" }}
                  />
                </div>

                <div>
                  <label style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 500, display: "block", marginBottom: "8px" }}>
                    Difficulty: <span style={{ color: difficultyColor, fontWeight: 600 }}>{difficultyLabel}</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: "#3B82F6" }}
                  />
                  <div className="flex justify-between mt-1">
                    {["Easy", "Medium", "Hard"].map((l) => (
                      <span key={l} style={{ color: "#64748B", fontSize: "11px" }}>{l}</span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 500, display: "block", marginBottom: "8px" }}>Upload Slides</label>
                  <div className="flex flex-col items-center justify-center p-8 rounded-xl"
                    style={{ border: "2px dashed #2a2a2a", background: "#141414" }}>
                    <Upload size={32} color="#64748B" className="mb-3" />
                    <p style={{ color: "#94A3B8", fontSize: "14px", fontWeight: 500 }}>Drop your .pptx or .pdf here</p>
                    <p style={{ color: "#64748B", fontSize: "12px", marginTop: "4px" }}>or click to browse</p>
                    <button className="mt-4 px-4 py-2 rounded-lg" style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#94A3B8", fontSize: "13px" }}>
                      Browse Files
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 500, display: "block", marginBottom: "8px" }}>Presentation Topic</label>
                  <input
                    type="text"
                    placeholder="e.g. Q1 2026 Product Roadmap"
                    value={presentationTopic}
                    onChange={(e) => setPresentationTopic(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg outline-none"
                    style={{ background: "#141414", border: "1px solid #2a2a2a", color: "#F8FAFC", fontSize: "14px" }}
                  />
                </div>

                <div>
                  <label style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 500, display: "block", marginBottom: "8px" }}>Audience Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {audienceTypes.map((t) => (
                      <button key={t} onClick={() => setAudience(t)}
                        className="py-2 px-3 rounded-lg transition-all"
                        style={{
                          background: audience === t ? "rgba(139,92,246,0.12)" : "#141414",
                          border: audience === t ? "1px solid #8B5CF6" : "1px solid #2a2a2a",
                          color: audience === t ? "#8B5CF6" : "#94A3B8",
                          fontSize: "13px",
                          fontWeight: audience === t ? 600 : 400,
                        }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Duration */}
            <div>
              <label style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 500, display: "block", marginBottom: "8px" }}>Duration</label>
              <div className="flex gap-2 flex-wrap">
                {durationList.map((d) => (
                  <button key={d} onClick={() => setDuration(d)}
                    className="py-2 px-4 rounded-lg transition-all"
                    style={{
                      background: duration === d ? "rgba(59,130,246,0.12)" : "#141414",
                      border: duration === d ? "1px solid #3B82F6" : "1px solid #2a2a2a",
                      color: duration === d ? "#3B82F6" : "#94A3B8",
                      fontSize: "13px",
                      fontWeight: duration === d ? 600 : 400,
                    }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Focus Areas */}
            <div>
              <label style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 500, display: "block", marginBottom: "8px" }}>Focus Areas</label>
              <div className="flex flex-wrap gap-2">
                {focusAreas.map((area) => {
                  const active = selectedFocus.includes(area);
                  return (
                    <button
                      key={area}
                      onClick={() => toggleFocus(area)}
                      className="py-1.5 px-3 rounded-full transition-all"
                      style={{
                        background: active ? "rgba(59,130,246,0.15)" : "#141414",
                        border: active ? "1px solid #3B82F6" : "1px solid #2a2a2a",
                        color: active ? "#3B82F6" : "#64748B",
                        fontSize: "13px",
                        fontWeight: active ? 600 : 400,
                      }}>
                      {area}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2"
                style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#94A3B8", fontSize: "15px" }}>
                <ChevronLeft size={18} /> Back
              </button>
              <button onClick={() => setStep(3)}
                className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2"
                style={{ background: "#3B82F6", color: "white", fontSize: "15px", fontWeight: 600 }}>
                Continue <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Camera & Mic Check */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 style={{ color: "#F8FAFC", fontSize: "18px", fontWeight: 700 }}>Camera & Mic Check</h2>

            {/* Webcam preview */}
            <div className="rounded-2xl overflow-hidden relative" style={{ background: "#141414", border: "1px solid #2a2a2a", aspectRatio: "4/3", maxWidth: "360px", margin: "0 auto" }}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Camera size={40} color="#334155" />
                  <p style={{ color: "#64748B", fontSize: "13px" }}>Camera preview will appear here</p>
                </div>
              )}
              {cameraReady && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full"
                  style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: "#EF4444", animation: "pulse 1.5s infinite" }} />
                  <span style={{ color: "white", fontSize: "11px", fontWeight: 600 }}>LIVE PREVIEW</span>
                </div>
              )}
            </div>

            {/* Status indicators */}
            <div className="space-y-3">
              {[
                { label: "Camera", ok: cameraReady, icon: Camera },
                { label: "Microphone", ok: micReady, icon: Mic },
                { label: "Screen Share Ready", ok: mode === "presentation", icon: Monitor },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: "#1e1e1e", border: "1px solid #2a2a2a" }}>
                  <div className="flex items-center gap-3">
                    <item.icon size={18} color="#64748B" />
                    <span style={{ color: "#94A3B8", fontSize: "14px" }}>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.ok ? (
                      <>
                        <CheckCircle size={16} color="#22C55E" />
                        <span style={{ color: "#22C55E", fontSize: "12px", fontWeight: 500 }}>Connected</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={16} color="#EF4444" />
                        <span style={{ color: "#EF4444", fontSize: "12px", fontWeight: 500 }}>Not detected</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Mic level (simulated) */}
            <div className="p-4 rounded-xl" style={{ background: "#1e1e1e", border: "1px solid #2a2a2a" }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: "#94A3B8", fontSize: "13px" }}>Microphone Level</span>
                <button className="px-3 py-1 rounded-lg flex items-center gap-1"
                  style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6", fontSize: "12px", border: "1px solid rgba(59,130,246,0.2)" }}>
                  <Volume2 size={12} /> Test Audio
                </button>
              </div>
              <div className="flex gap-1 h-6">
                {Array.from({ length: 20 }, (_, i) => (
                  <div key={i} className="flex-1 rounded-sm"
                    style={{
                      background: i < 12 ? "#3B82F6" : i < 16 ? "#F59E0B" : "#EF4444",
                      opacity: i < 14 ? 0.8 + Math.sin(i * 0.5) * 0.2 : 0.3,
                      height: `${40 + Math.sin(i * 0.8) * 40}%`,
                      alignSelf: "center",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2"
                style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#94A3B8", fontSize: "15px" }}>
                <ChevronLeft size={18} /> Back
              </button>
              <button
                onClick={() => navigate.push(mode === "interview" ? "/session/live/interview" : "/session/live/presentation")}
                className="flex-1 py-3.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg, #3B82F6, #2563EB)", color: "white", fontSize: "15px", fontWeight: 700, boxShadow: "0 0 30px rgba(59,130,246,0.3)" }}>
                <Play size={18} fill="white" /> Start Session
              </button>
            </div>
            <p className="text-center" style={{ color: "#64748B", fontSize: "12px" }}>
              Speakprime uses your camera and microphone only during the session. Nothing is recorded without your consent.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
