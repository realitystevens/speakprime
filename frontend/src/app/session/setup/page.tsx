"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/app/components/layout/Sidebar";
import {
  Mic, Monitor, ChevronRight, Upload, Camera, Volume2,
  CheckCircle, AlertCircle, ChevronLeft, Play, Loader2
} from "lucide-react";
import { sessionApi } from "@/lib/api";

const interviewTypes = ["Behavioral", "Technical", "Case Study", "Mixed"];
const durations = ["15 min", "30 min", "45 min", "60 min"];
const presentationDurations = ["5 min", "10 min", "20 min", "30 min+"];
const audienceTypes = ["Executives", "Investors", "Team", "Conference", "Mixed"];

const interviewFocusAreas = ["STAR Method", "Filler Words", "Pacing", "Eye Contact", "Confidence", "Technical Accuracy"];
const presentationFocusAreas = ["Slide Structure", "Eye Contact", "Pacing", "Voice Clarity", "Confidence", "Slide Transitions"];

type Mode = "interview" | "presentation" | null;

function parseDurationMinutes(dur: string): number {
  const n = parseInt(dur);
  return isNaN(n) ? 30 : n;
}

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
  const [slideFile, setSlideFile] = useState<File | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string>("");
  const [selectedOutputId, setSelectedOutputId] = useState<string>("");
  const [sinkSupported, setSinkSupported] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

  const loadAudioDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const inputs = devices.filter((d) => d.kind === "audioinput");
    const outputs = devices.filter((d) => d.kind === "audiooutput");
    setAudioInputs(inputs);
    setAudioOutputs(outputs);
    if (!selectedInputId && inputs.length > 0) {
      setSelectedInputId(inputs[0].deviceId);
    }
    if (!selectedOutputId && outputs.length > 0) {
      setSelectedOutputId(outputs[0].deviceId);
    }
  }, [selectedInputId, selectedOutputId]);

  useEffect(() => {
    if (step !== 3) return;
    loadAudioDevices();
    const handleChange = () => {
      loadAudioDevices();
    };
    navigator.mediaDevices?.addEventListener?.("devicechange", handleChange);
    return () => {
      navigator.mediaDevices?.removeEventListener?.("devicechange", handleChange);
    };
  }, [step, loadAudioDevices]);

  const toggleFocus = (area: string) => {
    setSelectedFocus((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const focusAreas = mode === "interview" ? interviewFocusAreas : presentationFocusAreas;
  const durationList = mode === "interview" ? durations : presentationDurations;

  const difficultyLabel = difficulty < 35 ? "Easy" : difficulty < 65 ? "Medium" : "Hard";
  const difficultyColor = difficulty < 35 ? "#22C55E" : difficulty < 65 ? "#F59E0B" : "#EF4444";

  const startSession = async () => {
    if (!mode) return;
    setStarting(true);
    setStartError(null);
    try {
      const sessionName = mode === "interview"
        ? `${interviewType} Interview${jobRole ? ` — ${jobRole}` : ""}`
        : `Presentation${presentationTopic ? ` — ${presentationTopic}` : ""}`;

      const session = await sessionApi.create({
        name: sessionName,
        config: {
          mode,
          ...(mode === "interview" && {
            interview_type: interviewType.toLowerCase().replace(" ", "_"),
            job_role: jobRole || undefined,
            difficulty: difficultyLabel.toLowerCase(),
          }),
          ...(mode === "presentation" && {
            presentation_topic: presentationTopic || undefined,
            audience_type: audience,
          }),
          duration_minutes: parseDurationMinutes(duration),
          focus_areas: selectedFocus,
        },
      });

      // Upload slides if provided
      if (mode === "presentation" && slideFile) {
        try {
          await sessionApi.uploadSlides(session.id, slideFile);
        } catch (err) {
          console.warn("Slide upload failed, continuing without slides:", err);
        }
      }

      navigate.push(
        mode === "interview"
          ? `/session/live/interview?session_id=${session.id}`
          : `/session/live/presentation?session_id=${session.id}`
      );
    } catch (err) {
      console.error("Start session error:", err);
      setStartError("Failed to start session. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  const stopAudioTest = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => { });
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setIsTestingAudio(false);
    setAudioLevel(0);
  }, []);

  const startAudioTestInternal = async (inputId?: string) => {
    setAudioError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setAudioError("Microphone access is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: inputId ? { deviceId: { exact: inputId } } : true,
      });
      const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextCtor) {
        stream.getTracks().forEach((t) => t.stop());
        setAudioError("Audio context is not available.");
        return;
      }

      const ctx = new AudioContextCtor();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      audioStreamRef.current = stream;
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      setIsTestingAudio(true);

      if (audioRef.current) {
        audioRef.current.srcObject = stream;
        const audioEl = audioRef.current as HTMLMediaElement & { setSinkId?: (id: string) => Promise<void> };
        if (selectedOutputId && typeof audioEl.setSinkId === "function") {
          setSinkSupported(true);
          audioEl.setSinkId(selectedOutputId).catch(() => {
            setAudioError("Unable to use the selected speaker.");
          });
        } else {
          setSinkSupported(false);
        }
        audioRef.current.play().catch(() => {
          setAudioError("Unable to play mic audio. Check autoplay settings.");
        });
      }

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        setAudioLevel(rms);
        rafRef.current = requestAnimationFrame(tick);
      };

      tick();
    } catch (err) {
      stopAudioTest();
      setAudioError("Microphone access was blocked.");
    }
  };

  const startAudioTest = async () => {
    if (isTestingAudio) {
      stopAudioTest();
      return;
    }
    await startAudioTestInternal(selectedInputId || undefined);
  };

  useEffect(() => () => stopAudioTest(), [stopAudioTest]);

  useEffect(() => {
    if (!audioRef.current) return;
    const audioEl = audioRef.current as HTMLMediaElement & { setSinkId?: (id: string) => Promise<void> };
    if (typeof audioEl.setSinkId === "function") {
      setSinkSupported(true);
    }
  }, []);

  const micBarCount = 20;
  const activeBars = Math.min(
    micBarCount,
    Math.max(0, Math.round(audioLevel * micBarCount * 1.4))
  );

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="flex items-center gap-1.5 mb-4 text-slate-500 text-sm no-underline">
            <ChevronLeft size={16} /> Back to dashboard
          </Link>
          <h1 className="text-[#F8FAFC] text-[26px] font-extrabold">Setup Your Session</h1>
          <p className="text-slate-500 text-sm mt-1.5">Configure your coaching session in 3 steps</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all text-[13px] font-semibold ${step >= s ? "bg-blue-500 text-white" : "bg-[#1e1e1e] border border-[#2a2a2a] text-slate-500"
                }`}>
                {step > s ? <CheckCircle size={16} /> : s}
              </div>
              <span className={`hidden sm:inline text-[13px] ${step === s ? "text-[#F8FAFC] font-semibold" : "text-slate-500"}`}>
                {s === 1 ? "Choose Mode" : s === 2 ? "Configure" : "Camera & Mic"}
              </span>
              {s < 3 && <div className={`w-8 h-px ${step > s ? "bg-blue-500" : "bg-[#2a2a2a]"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1 — Choose Mode */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-[#F8FAFC] text-lg font-bold mb-5">
              What would you like to practice?
            </h2>
            {[
              { id: "interview" as Mode, icon: Mic, title: "Interview Mode", desc: "I want to practice answering interview questions", color: "#3B82F6", bg: "rgba(59,130,246,0.1)", borderActive: "#3B82F6" },
              { id: "presentation" as Mode, icon: Monitor, title: "Presentation Mode", desc: "I want to practice delivering a presentation", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)", borderActive: "#8B5CF6" },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setMode(opt.id)}
                className={`w-full p-6 rounded-2xl text-left transition-all duration-200 hover:scale-[1.01] border-2 ${mode === opt.id
                  ? opt.id === "interview"
                    ? "bg-blue-500/[0.08] border-blue-500"
                    : "bg-violet-500/[0.08] border-violet-500"
                  : "bg-[#1e1e1e] border-[#2a2a2a]"
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${opt.id === "interview" ? "bg-blue-500/10" : "bg-violet-500/10"
                    }`}>
                    <opt.icon size={28} className={opt.id === "interview" ? "text-blue-500" : "text-violet-500"} />
                  </div>
                  <div>
                    <div className="text-[#F8FAFC] text-[17px] font-bold">{opt.title}</div>
                    <div className="text-slate-500 text-sm mt-1">{opt.desc}</div>
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
              className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2 mt-4 transition-opacity bg-blue-500 text-white text-[15px] font-semibold ${mode ? "opacity-100" : "opacity-40"
                }`}
            >
              Continue <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Step 2 — Configure */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-[#F8FAFC] text-lg font-bold">
              Configure your {mode === "interview" ? "Interview" : "Presentation"} session
            </h2>

            {mode === "interview" ? (
              <>
                <div>
                  <label className="text-slate-400 text-[13px] font-medium block mb-2">Interview Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {interviewTypes.map((t) => (
                      <button key={t} onClick={() => setInterviewType(t)}
                        className={`py-2.5 px-4 rounded-lg text-left transition-all text-sm border ${interviewType === t
                          ? "bg-blue-500/[0.12] border-blue-500 text-blue-500 font-semibold"
                          : "bg-[#141414] border-[#2a2a2a] text-slate-400"
                          }`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 text-[13px] font-medium block mb-2">Job Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Product Manager at Google"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg outline-none bg-[#0F172A] border border-[#334155] text-[#F8FAFC] text-sm"
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-[13px] font-medium block mb-2">
                    Difficulty: <span style={{ color: difficultyColor }} className="font-semibold">{difficultyLabel}</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between mt-1">
                    {["Easy", "Medium", "Hard"].map((l) => (
                      <span key={l} className="text-slate-500 text-[11px]">{l}</span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-slate-400 text-[13px] font-medium block mb-2">Upload Slides</label>
                  <div
                    className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-[#2a2a2a] bg-[#141414] cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.pptx"
                      className="hidden"
                      onChange={(e) => setSlideFile(e.target.files?.[0] ?? null)}
                    />
                    <Upload size={32} className="text-slate-500 mb-3" />
                    {slideFile ? (
                      <>
                        <p className="text-green-400 text-sm font-medium">{slideFile.name}</p>
                        <p className="text-slate-500 text-xs mt-1">Click to change file</p>
                      </>
                    ) : (
                      <>
                        <p className="text-slate-400 text-sm font-medium">Drop your .pptx or .pdf here</p>
                        <p className="text-slate-500 text-xs mt-1">or click to browse</p>
                      </>
                    )}
                    <button
                      type="button"
                      className="mt-4 px-4 py-2 rounded-lg bg-[#1e1e1e] border border-[#2a2a2a] text-slate-400 text-[13px]"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    >
                      Browse Files
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 text-[13px] font-medium block mb-2">Presentation Topic</label>
                  <input
                    type="text"
                    placeholder="e.g. Q1 2026 Product Roadmap"
                    value={presentationTopic}
                    onChange={(e) => setPresentationTopic(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg outline-none bg-[#141414] border border-[#2a2a2a] text-[#F8FAFC] text-sm"
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-[13px] font-medium block mb-2">Audience Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {audienceTypes.map((t) => (
                      <button key={t} onClick={() => setAudience(t)}
                        className={`py-2 px-3 rounded-lg transition-all text-[13px] border ${audience === t
                          ? "bg-violet-500/[0.12] border-violet-500 text-violet-500 font-semibold"
                          : "bg-[#141414] border-[#2a2a2a] text-slate-400"
                          }`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Duration */}
            <div>
              <label className="text-slate-400 text-[13px] font-medium block mb-2">Duration</label>
              <div className="flex gap-2 flex-wrap">
                {durationList.map((d) => (
                  <button key={d} onClick={() => setDuration(d)}
                    className={`py-2 px-4 rounded-lg transition-all text-[13px] border ${duration === d
                      ? "bg-blue-500/[0.12] border-blue-500 text-blue-500 font-semibold"
                      : "bg-[#141414] border-[#2a2a2a] text-slate-400"
                      }`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Focus Areas */}
            <div>
              <label className="text-slate-400 text-[13px] font-medium block mb-2">Focus Areas</label>
              <div className="flex flex-wrap gap-2">
                {focusAreas.map((area) => {
                  const active = selectedFocus.includes(area);
                  return (
                    <button
                      key={area}
                      onClick={() => toggleFocus(area)}
                      className={`py-1.5 px-3 rounded-full transition-all text-[13px] border ${active
                        ? "bg-blue-500/15 border-blue-500 text-blue-500 font-semibold"
                        : "bg-[#141414] border-[#2a2a2a] text-slate-500"
                        }`}>
                      {area}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 bg-[#1e1e1e] border border-[#2a2a2a] text-slate-400 text-[15px]">
                <ChevronLeft size={18} /> Back
              </button>
              <button onClick={() => setStep(3)}
                className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 bg-blue-500 text-white text-[15px] font-semibold">
                Continue <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Camera & Mic Check */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-[#F8FAFC] text-lg font-bold">Camera &amp; Mic Check</h2>

            {/* Webcam preview */}
            <div className="rounded-2xl overflow-hidden relative bg-[#141414] border border-[#2a2a2a] aspect-[4/3] max-w-[360px] mx-auto">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Camera size={40} className="text-[#334155]" />
                  <p className="text-slate-500 text-[13px]">Camera preview will appear here</p>
                </div>
              )}
              {cameraReady && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse-dot-fast" />
                  <span className="text-white text-[11px] font-semibold">LIVE PREVIEW</span>
                </div>
              )}
            </div>

            {/* Status indicators */}
            <div className="space-y-3">
              {[
                { label: "Camera", ok: cameraReady, icon: Camera },
                { label: "Microphone", ok: micReady, icon: Mic },
                {
                  label: mode === "presentation" ? "Screen Share Ready" : "Screen Share (Presentation Mode)",
                  ok: mode === "presentation",
                  icon: Monitor,
                  isInfo: mode !== "presentation",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-[#1e1e1e] border border-[#2a2a2a]">
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="text-slate-500" />
                    <span className="text-slate-400 text-sm">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.ok ? (
                      <>
                        <CheckCircle size={16} className="text-green-500" />
                        <span className="text-green-500 text-xs font-medium">Connected</span>
                      </>
                    ) : item.isInfo ? (
                      <>
                        <AlertCircle size={16} className="text-amber-400" />
                        <span className="text-amber-400 text-xs font-medium">Use Presentation Mode</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={16} className="text-red-500" />
                        <span className="text-red-500 text-xs font-medium">Not detected</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="grid gap-3">
              <div>
                <label className="text-slate-400 text-[13px] font-medium block mb-2">Microphone Source</label>
                <select
                  value={selectedInputId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedInputId(nextId);
                    if (isTestingAudio) {
                      stopAudioTest();
                      startAudioTestInternal(nextId);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg outline-none bg-[#141414] border border-[#2a2a2a] text-[#F8FAFC] text-sm"
                >
                  {audioInputs.length === 0 && (
                    <option value="">No microphones detected</option>
                  )}
                  {audioInputs.map((d, idx) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Microphone ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 text-[13px] font-medium block mb-2">Speaker Output</label>
                <select
                  value={selectedOutputId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedOutputId(nextId);
                    const audioEl = audioRef.current as HTMLMediaElement & { setSinkId?: (id: string) => Promise<void> };
                    if (isTestingAudio && audioEl?.setSinkId) {
                      audioEl.setSinkId(nextId).catch(() => {
                        setAudioError("Unable to use the selected speaker.");
                      });
                    }
                  }}
                  disabled={!sinkSupported}
                  className="w-full px-3 py-2 rounded-lg outline-none bg-[#141414] border border-[#2a2a2a] text-[#F8FAFC] text-sm disabled:opacity-60"
                >
                  {!sinkSupported && (
                    <option value="">Browser uses system default output</option>
                  )}
                  {sinkSupported && audioOutputs.length === 0 && (
                    <option value="">No speakers detected</option>
                  )}
                  {sinkSupported && audioOutputs.map((d, idx) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Speaker ${idx + 1}`}
                    </option>
                  ))}
                </select>
                {!sinkSupported && (
                  <p className="text-slate-500 text-xs mt-1">
                    Speaker selection is not supported in this browser.
                  </p>
                )}
              </div>
            </div>

            {/* Mic level */}
            <div className="p-4 rounded-xl bg-[#1e1e1e] border border-[#2a2a2a]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-[13px]">Microphone Level</span>
                <button
                  onClick={startAudioTest}
                  className="px-3 py-1 rounded-lg flex items-center gap-1 bg-blue-500/10 text-blue-500 text-xs border border-blue-500/20"
                >
                  <Volume2 size={12} /> {isTestingAudio ? "Stop Test" : "Test Audio"}
                </button>
              </div>
              <div className="flex gap-1 h-6">
                {Array.from({ length: micBarCount }, (_, i) => {
                  const wave = Math.sin((i / micBarCount) * Math.PI);
                  const height = 30 + audioLevel * 70 * wave;
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{
                        background: i < 12 ? "#3B82F6" : i < 16 ? "#F59E0B" : "#EF4444",
                        opacity: i < activeBars ? 0.9 : 0.25,
                        height: `${height}%`,
                        alignSelf: "center",
                      }}
                    />
                  );
                })}
              </div>
              <audio ref={audioRef} className="hidden" playsInline />
              {audioError && (
                <p className="text-red-400 text-xs mt-2">{audioError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 bg-[#1e1e1e] border border-[#2a2a2a] text-slate-400 text-[15px]">
                <ChevronLeft size={18} /> Back
              </button>
              <button
                onClick={startSession}
                disabled={starting}
                className="flex-1 py-3.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity bg-gradient-to-br from-blue-500 to-blue-600 text-white text-[15px] font-bold shadow-[0_0_30px_rgba(59,130,246,0.3)] disabled:opacity-60 disabled:cursor-not-allowed">
                {starting ? <><Loader2 size={18} className="animate-spin" /> Creating session...</> : <><Play size={18} fill="white" /> Start Session</>}
              </button>
            </div>
            {startError && <p className="text-red-400 text-xs text-center mt-1">{startError}</p>}
            <p className="text-center text-slate-500 text-xs">
              Speakprime uses your camera and microphone only during the session. Nothing is recorded without your consent.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
