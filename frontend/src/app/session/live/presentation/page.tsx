"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  ChevronLeft, ChevronRight, X, LayoutGrid, Maximize2,
} from "lucide-react";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

type FeedbackType = "red" | "yellow" | "green";

interface CoachFeed {
  id: number;
  time: string;
  type: FeedbackType;
  text: string;
}

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

const emoji: Record<FeedbackType, string> = { red: "[RED]", yellow: "[YELLOW]", green: "[GREEN]" };

function LivePresentationInner() {
  const navigate = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") ?? "";

  const [timer, setTimer] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideCount, setSlideCount] = useState(1);
  const [slideTimer, setSlideTimer] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [feedbackFeed, setFeedbackFeed] = useState<CoachFeed[]>([]);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [eyeContact, setEyeContact] = useState<"good" | "bad">("good");
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "error">("connecting");

  const videoRef = useRef<HTMLVideoElement>(null);
  const feedId = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const aiSpeakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reportIdRef = useRef<string | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mutedRef = useRef(muted);
  const slideIndexRef = useRef(slideIndex);
  const slideTimerRef = useRef(slideTimer);
  const timerRef = useRef(timer);
  const micStreamRef = useRef<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { slideIndexRef.current = slideIndex; }, [slideIndex]);
  useEffect(() => { slideTimerRef.current = slideTimer; }, [slideTimer]);
  useEffect(() => { timerRef.current = timer; }, [timer]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const playNext = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }
    const buffer = audioQueueRef.current.shift()!;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = playNext;
    source.start();
    isPlayingRef.current = true;
  }, []);

  const stopLocalMedia = useCallback(() => {
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;

    webcamStreamRef.current?.getTracks().forEach((t) => t.stop());
    webcamStreamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const enqueueAudioBase64 = useCallback((b64: string) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;
      const buf = ctx.createBuffer(1, float32.length, 24000);
      buf.copyToChannel(float32, 0);
      audioQueueRef.current.push(buf);
      if (!isPlayingRef.current) playNext();
      setAiSpeaking(true);
      if (aiSpeakingTimerRef.current) clearTimeout(aiSpeakingTimerRef.current);
      aiSpeakingTimerRef.current = setTimeout(() => setAiSpeaking(false), 700);
    } catch (err) {
      console.warn("Audio decode error:", err);
    }
  }, [playNext]);

  const setupMic = useCallback(async (ctx: AudioContext) => {
    try {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
        video: false,
      });
      micStreamRef.current = stream;
      await ctx.audioWorklet.addModule("/audio-processor.worklet.js");
      const source = ctx.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(ctx, "audio-capture-processor");
      worklet.port.onmessage = (e: MessageEvent) => {
        const ws = wsRef.current;
        if (ws?.readyState !== WebSocket.OPEN || mutedRef.current) return;
        const pcm = e.data.pcm as Int16Array;
        // Convert to base64 and send as JSON
        const bytes = new Uint8Array(pcm.buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        const b64 = btoa(binary);
        ws.send(JSON.stringify({ type: "audio", data: b64 }));
      };
      source.connect(worklet);
    } catch (err) {
      console.warn("Mic setup failed:", err);
    }
  }, []);

  // Main WebSocket
  useEffect(() => {
    if (!sessionId) return;

    const ws = new WebSocket(`${WS_BASE}/ws/presentation/${sessionId}`);
    wsRef.current = ws;

    ws.onopen = async () => {
      setWsStatus("connected");
      const ctx = new AudioContext({ sampleRate: 24000 });
      audioCtxRef.current = ctx;
      await setupMic(ctx);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        switch (msg.type) {
          case "session_started":
            timerIntervalRef.current = setInterval(() => {
              setTimer((t) => t + 1);
              setSlideTimer((t) => t + 1);
            }, 1000);
            break;
          case "audio":
            enqueueAudioBase64(msg.data);
            break;
          case "feedback": {
            const sev: string = msg.severity ?? "low";
            const type: FeedbackType = sev === "high" ? "red" : sev === "medium" ? "yellow" : "green";
            const id = ++feedId.current;
            const t = timerRef.current;
            const timeStr = formatTime(t);
            setFeedbackFeed((prev) => [
              { id, time: timeStr, type, text: msg.message ?? "" },
              ...prev.slice(0, 12),
            ]);
            break;
          }
          case "eye_contact_alert":
            setEyeContact("bad");
            const id = ++feedId.current;
            const t = timerRef.current;
            setFeedbackFeed((prev) => [
              { id, time: formatTime(t), type: "red", text: msg.message ?? "Look at the camera" },
              ...prev.slice(0, 12),
            ]);
            setTimeout(() => setEyeContact("good"), 5000);
            break;
          case "slide_analysis": {
            const analysisId = ++feedId.current;
            const at = timerRef.current;
            setFeedbackFeed((prev) => [
              { id: analysisId, time: formatTime(at), type: "yellow", text: msg.feedback ?? "" },
              ...prev.slice(0, 12),
            ]);
            break;
          }
          case "session_ended":
            reportIdRef.current = msg.report_id;
            stopLocalMedia();
            navigate.push(`/session/report/${msg.report_id}`);
            break;
          case "error":
            setWsStatus("error");
            break;
        }
      } catch { /* non-JSON */ }
    };

    ws.onerror = () => setWsStatus("error");

    return () => {
      ws.close();
      wsRef.current = null;
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      stopLocalMedia();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, stopLocalMedia]);

  // Camera PIP
  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((s) => {
        stream = s;
        webcamStreamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => { });
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      if (webcamStreamRef.current === stream) webcamStreamRef.current = null;
    };
  }, []);

  const handleMuteToggle = () => {
    setMuted((m) => {
      const next = !m;
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: next ? "mute" : "unmute" }));
      }
      return next;
    });
  };

  const handleEndSession = () => {
    stopLocalMedia();
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "end_session" }));
    }
    setShowEndConfirm(false);
  };

  const goSlide = (idx: number) => {
    // Notify backend of slide change
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "slide_screenshot",
        data: "",
        slide_number: idx + 1,
        time_on_slide_seconds: slideTimerRef.current,
      }));
    }
    setSlideIndex(idx);
    setSlideTimer(0);
  };

  const totalSlides = Math.max(slideCount, slideIndex + 1);

  return (
    <div className="h-screen w-screen overflow-hidden relative select-none bg-[#1c1c1c]">

      {/* Main stage: slide */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center pt-[68px] pb-[84px] transition-[padding] duration-300 ${showPanel ? "sm:pr-[380px]" : ""}`}>
        <div className="relative w-full h-full flex items-center justify-center px-8">
          {/* Slide card */}
          <div className="relative rounded-2xl overflow-hidden flex flex-col justify-center w-full max-w-[960px] aspect-video max-h-[calc(100vh-160px)] bg-gradient-to-br from-[#111111] to-[#1a1a1a] border border-white/[0.08] shadow-[0_24px_80px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)]">
            {/* Slide time badge */}
            <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/[0.07]">
              <span className="text-slate-500 text-[11px] font-mono">{formatTime(slideTimer)} on slide</span>
            </div>

            {/* Slide number */}
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20">
                <span className="text-blue-400 text-2xl font-bold">{slideIndex + 1}</span>
              </div>
              <p className="text-slate-500 text-lg font-medium">Slide {slideIndex + 1}</p>
              {wsStatus === "connecting" && (
                <p className="text-slate-600 text-sm">Connecting to AI coach...</p>
              )}
              {wsStatus === "error" && (
                <p className="text-red-400 text-sm">Connection error - check backend</p>
              )}
            </div>

            {/* Bottom progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/[0.05]">
              <div className="h-full transition-all duration-500"
                style={{ width: `${((slideIndex + 1) / totalSlides) * 100}%`, background: "linear-gradient(90deg, #3B82F6, #8B5CF6)" }} />
            </div>
          </div>

          {/* Slide nav arrows */}
          <button onClick={() => slideIndex > 0 && goSlide(slideIndex - 1)} disabled={slideIndex === 0}
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 backdrop-blur-sm border border-white/10 ${slideIndex === 0 ? "bg-white/[0.03] text-[#1e293b]" : "bg-white/10 text-slate-400"}`}>
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => goSlide(slideIndex + 1)} className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 backdrop-blur-sm border border-white/10 bg-white/10 text-slate-400">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* User webcam PIP */}
      <div className={`absolute z-20 rounded-2xl overflow-hidden top-20 w-[188px] h-[140px] border-2 border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.7)] bg-[#111827] transition-[right] duration-300 ease-out right-4 ${showPanel ? "sm:right-[396px]" : ""}`}>
        <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${cameraOff ? "opacity-0" : "opacity-100"}`} />
        {cameraOff && (
          <div className="absolute inset-0 flex items-center justify-center">
            <VideoOff size={28} color="#334155" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/85 to-transparent">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: eyeContact === "good" ? "#22C55E" : "#EF4444" }} />
            <span className="text-white text-[10px] font-semibold">
              {eyeContact === "good" ? "Eye contact OK" : "Look at camera"}
            </span>
          </div>
        </div>
        {muted && (
          <div className="absolute top-2 right-2 p-1 rounded-full bg-[rgba(239,68,68,0.9)]">
            <MicOff size={10} color="white" />
          </div>
        )}
      </div>

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(239,68,68,0.92)] backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-dot-fast" />
            <span className="text-white text-[11px] font-bold tracking-[0.06em]">LIVE</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-xl border border-white/10">
            <span className="text-[#F8FAFC] text-[13px] font-semibold font-mono">{formatTime(timer)}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-xl border border-white/[0.08]">
            <LayoutGrid size={12} color="#64748B" />
            <span className="text-slate-400 text-xs">Slide {slideIndex + 1}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {aiSpeaking && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 backdrop-blur-sm border border-blue-500/30">
              <div className="flex gap-0.5 items-end h-3">
                {[0, 0.1, 0.2, 0.15, 0.05].map((d, i) => (
                  <div key={i} className="w-0.5 rounded-sm" style={{ height: "100%", background: "#3B82F6", animation: `waveform 0.5s ease ${d}s infinite` }} />
                ))}
              </div>
              <span className="text-blue-500 text-xs">AI feedback...</span>
            </div>
          )}
          <button onClick={() => setShowPanel(!showPanel)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-xl transition-all ${showPanel ? "bg-blue-500/35 border border-blue-500/50 text-blue-300" : "bg-black/55 border border-white/10 text-slate-400"}`}>
            <Maximize2 size={13} />
            <span className="text-[12px] font-medium">Coach</span>
          </button>
        </div>
      </div>

      {/* Bottom controls */}
      <div className={`absolute bottom-5 left-0 right-0 flex items-center justify-center z-20 transition-[padding] duration-300 ${showPanel ? "sm:pr-[380px]" : ""}`}>
        <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-[rgba(10,14,26,0.88)] backdrop-blur-2xl border border-white/[0.09] shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
          {/* Slide prev */}
          <button onClick={() => slideIndex > 0 && goSlide(slideIndex - 1)} disabled={slideIndex === 0}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 bg-white/[0.08] ${slideIndex === 0 ? "text-[#1e293b]" : "text-slate-400"}`}>
            <ChevronLeft size={17} />
          </button>
          {/* Slide counter */}
          <span className="text-slate-500 text-xs font-mono min-w-[4rem] text-center">{slideIndex + 1} / {totalSlides}</span>
          {/* Slide next */}
          <button onClick={() => goSlide(slideIndex + 1)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 bg-white/[0.08] text-slate-400">
            <ChevronRight size={17} />
          </button>
          <div className="w-px h-6 bg-white/10" />
          {/* Mic */}
          <button onClick={handleMuteToggle}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 ${muted ? "bg-red-500" : "bg-white/[0.12]"}`}>
            {muted ? <MicOff size={19} color="white" /> : <Mic size={19} color="white" />}
          </button>
          {/* Camera */}
          <button onClick={() => setCameraOff(!cameraOff)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 ${cameraOff ? "bg-red-500" : "bg-white/[0.12]"}`}>
            {cameraOff ? <VideoOff size={19} color="white" /> : <Video size={19} color="white" />}
          </button>
          {/* End */}
          <button onClick={() => setShowEndConfirm(true)}
            className="flex items-center gap-2 px-5 h-12 rounded-full ml-2 transition-all hover:scale-105 hover:bg-red-600 bg-red-500 text-white text-[13px] font-semibold">
            <PhoneOff size={17} color="white" />
            <span className="hidden sm:inline">End Session</span>
          </button>
        </div>
      </div>

      {/* Right coach panel */}
      {showPanel && (
        <div className="coach-panel fixed inset-0 sm:absolute sm:inset-auto sm:top-0 sm:right-0 sm:bottom-0 z-30 flex flex-col w-full sm:w-[380px] bg-[rgba(18,18,18,0.97)] backdrop-blur-[32px] border-l border-white/[0.07]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
            <div>
              <p className="text-[#F8FAFC] text-sm font-bold">Real-Time Coaching</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-dot" />
                <span className="text-green-500 text-[11px]">Live feedback active</span>
              </div>
            </div>
            <button onClick={() => setShowPanel(false)} className="p-1 rounded-md text-slate-600"><X size={16} /></button>
          </div>
          {/* Eye contact */}
          <div className="px-5 py-4 space-y-2 border-b border-white/[0.07]">
            <div className={`flex items-center gap-2.5 p-3 rounded-xl ${eyeContact === "bad" ? "bg-red-500/[0.08] border border-red-500/20" : "bg-green-500/[0.08] border border-green-500/20"}`}>
              <span className="text-[14px]">{eyeContact === "bad" ? "[RED]" : "[GREEN]"}</span>
              <span className={`text-xs ${eyeContact === "bad" ? "text-red-500" : "text-green-500"}`}>
                {eyeContact === "bad" ? "Reading from slides - look at camera" : "Good eye contact - keep it up"}
              </span>
            </div>
          </div>
          {/* Slide info */}
          <div className="px-5 py-4 border-b border-white/[0.07]">
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.08em] mb-2.5">Current Slide</p>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-500/[0.12] border border-blue-500/25">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: qualityColors.green.color }} />
              <span className="text-[#F8FAFC] text-xs flex-1">Slide {slideIndex + 1}</span>
              <span className="text-blue-500 text-[10px] font-semibold">CURRENT</span>
            </div>
            <p className="text-slate-600 text-xs mt-2">Time on slide: <span className="text-slate-400">{formatTime(slideTimer)}</span></p>
          </div>
          {/* Feedback feed */}
          <div className="flex-1 overflow-auto px-5 py-4">
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.08em] mb-3">Coaching Feed</p>
            {feedbackFeed.length === 0 ? (
              <p className="text-[#334155] text-xs">Coaching tips will appear as you present...</p>
            ) : (
              <div className="space-y-2">
                {feedbackFeed.map((f) => (
                  <div key={f.id} className="feed-item p-3 rounded-xl"
                    style={{ background: feedbackColors[f.type].bg, borderLeft: `3px solid ${feedbackColors[f.type].border}` }}>
                    <div className="flex items-start gap-2">
                      <span className="text-slate-600 text-[10px] font-mono whitespace-nowrap mt-px">[{f.time}]</span>
                      <p className="text-slate-200 text-xs leading-[1.55]">{emoji[f.type]} {f.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {aiSpeaking && (
            <div className="px-5 py-3 flex items-center gap-2 border-t border-white/[0.07]">
              <div className="flex gap-0.5 items-end h-4">
                {[0, 0.1, 0.2, 0.15, 0.05].map((delay, i) => (
                  <div key={i} className="w-1 rounded-sm" style={{ height: "100%", background: "#3B82F6", animation: `waveform 0.6s ease ${delay}s infinite` }} />
                ))}
              </div>
              <span className="text-blue-500 text-xs">AI feedback playing...</span>
            </div>
          )}
        </div>
      )}

      {/* End confirm modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md">
          <div className="p-8 rounded-3xl w-full max-w-sm bg-[#0F172A] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-red-500/[0.12] border border-red-500/25">
              <PhoneOff size={22} color="#EF4444" />
            </div>
            <h3 className="text-[#F8FAFC] text-[18px] font-bold text-center mb-2">End Presentation?</h3>
            <p className="text-slate-500 text-sm text-center mb-7 leading-[1.6]">
              Your presentation will be saved and a full performance report will be generated.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowEndConfirm(false)}
                className="flex-1 py-3 rounded-2xl transition-opacity hover:opacity-80 bg-[#2a2a2a] border border-white/10 text-slate-400 text-sm">
                Cancel
              </button>
              <button onClick={handleEndSession}
                className="flex-1 py-3 rounded-2xl transition-opacity hover:opacity-90 bg-red-500 text-white text-sm font-semibold">
                End & Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LivePresentationPage() {
  return (
    <Suspense>
      <LivePresentationInner />
    </Suspense>
  );
}
