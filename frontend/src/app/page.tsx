"use client";

import Link from "next/link";
import {
  Zap,
  Mic,
  Eye,
  Monitor,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Real-Time Voice Coaching",
    desc: "Flags filler words, pacing issues, and confidence drops as you speak â€” instantly.",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  {
    icon: Eye,
    title: "Vision-Powered Feedback",
    desc: "Webcam analysis detects lost eye contact, poor posture, and slide-reading behavior live.",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-500",
  },
  {
    icon: Monitor,
    title: "Slide Intelligence",
    desc: "Share your screen and get instant feedback on slide quality, structure, and text density.",
    iconBg: "bg-green-500/10",
    iconColor: "text-green-500",
  },
];

const steps = [
  { number: "01", title: "Choose your mode", desc: "Interview or Presentation" },
  { number: "02", title: "Allow camera & mic", desc: "Speakprime observes you live" },
  { number: "03", title: "Start your session", desc: "Speak naturally, present freely" },
  { number: "04", title: "Get coached in real time", desc: "Instant AI feedback as you go" },
  { number: "05", title: "Review your debrief", desc: "Full report with scores & suggestions" },
];

export default function Home() {
  return (
    <div className="bg-[#111111] min-h-screen">
      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 h-16 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500">
            <Zap size={16} color="white" fill="white" />
          </div>
          <span className="text-[#F8FAFC] font-bold text-xl">Speakprime</span>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-blue-500 text-white text-sm font-semibold no-underline"
        >
          Open Demo <ChevronRight size={16} />
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 lg:px-12 pt-20 pb-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-[0.08] bg-[radial-gradient(circle,#3B82F6,transparent)] blur-[80px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-[0.06] bg-[radial-gradient(circle,#8B5CF6,transparent)] blur-[80px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 animate-fade-in-up bg-blue-500/10 border border-blue-500/30">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse-slow" />
            <span className="text-blue-500 text-[13px] font-medium">Powered by Gemini Live API</span>
          </div>

          <h1 className="animate-fade-in-up-delay text-[#F8FAFC] text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[1.1] tracking-[-0.02em] mb-6">
            Stop Practicing Alone.<br />
            <span className="bg-gradient-to-br from-blue-500 to-violet-500 bg-clip-text text-transparent">
              Get Coached Live.
            </span>
          </h1>

          <p className="animate-fade-in-up-delay2 max-w-2xl mx-auto text-[#94A3B8] text-lg leading-[1.7] mb-10">
            An AI coach that watches you, listens to you, and gives feedback in real time â€”
            for job interviews and presentations. Built on Google Gemini Live API.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up-delay2">
            <Link
              href="/session/setup"
              className="flex items-center gap-2 px-7 py-4 rounded-xl transition-all duration-200 hover:scale-105 bg-blue-500 text-white text-base font-bold no-underline shadow-[0_0_40px_rgba(59,130,246,0.3)]"
            >
              <Mic size={18} />
              Start Interview Session
            </Link>
            <Link
              href="/session/setup"
              className="flex items-center gap-2 px-7 py-4 rounded-xl transition-all duration-200 hover:scale-105 border border-white/20 text-[#F8FAFC] text-base font-semibold no-underline"
            >
              <Monitor size={18} />
              Start Presentation
            </Link>
          </div>

          {/* Hero mockup */}
          <div className="mt-16 relative mx-auto max-w-4xl">
            <div className="rounded-2xl overflow-hidden border border-[#2a2a2a] bg-[#1a1a1a] shadow-[0_0_60px_rgba(59,130,246,0.06),0_40px_80px_rgba(0,0,0,0.6)]">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#0d0d0d] border-b border-[#2a2a2a]">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div className="flex-1 mx-4 h-6 rounded bg-[#222222]">
                  <div className="text-center text-[#64748B] text-xs leading-6">app.speakprime.ai/session/live</div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 min-h-[300px]">
                <div className="p-6 border-b sm:border-b-0 sm:border-r border-[#2a2a2a]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-red-500 text-[11px] font-semibold">â— LIVE</span>
                    <span className="text-[#64748B] text-[11px]">12:34</span>
                  </div>
                  <div className="rounded-xl overflow-hidden mb-3 bg-[#0d0d0d] aspect-[4/3]">
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d]">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-500" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-green-500 text-[11px]">Strong Delivery</span>
                  </div>
                  <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 border-l-[3px] border-l-red-500">
                    <span className="text-[#F8FAFC] text-[11px]">ðŸ”´ You said &apos;um&apos; 3 times â€” pause instead</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="rounded-lg p-4 mb-3 bg-[#0d0d0d]">
                    <div className="text-center mb-2 text-[#F8FAFC] text-[13px] font-bold">Q1 2026 Product Roadmap</div>
                    {["Launch v2.0 Platform", "Expand to 10 markets", "Reach 100k users"].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 mt-1">
                        <div className="w-1 h-1 rounded-full bg-blue-500" />
                        <span className="text-[#94A3B8] text-[10px]">{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[#64748B] text-[11px]">Slide 3 of 12</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 text-[10px]">Too much text</span>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 border-l-[3px] border-l-blue-500">
                    <span className="text-[#F8FAFC] text-[11px]">ðŸŸ¢ Great energy on that transition!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-12 py-20 border-t border-[#2a2a2a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[#F8FAFC] text-[clamp(1.8rem,4vw,2.5rem)] font-extrabold mb-3">
              Three AI engines, one coach
            </h2>
            <p className="text-[#64748B] text-base">Working together in real time, every session</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="p-6 rounded-2xl transition-all duration-200 hover:-translate-y-1 bg-[#1e1e1e] border border-[#2a2a2a] shadow-[0_0_30px_rgba(0,0,0,0.2)]">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.iconBg}`}>
                  <feature.icon size={24} className={feature.iconColor} />
                </div>
                <h3 className="text-[#F8FAFC] text-[17px] font-bold mb-2.5">{feature.title}</h3>
                <p className="text-[#64748B] text-sm leading-[1.7]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Session Modes */}
      <section className="px-6 lg:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[#F8FAFC] text-[clamp(1.8rem,4vw,2.5rem)] font-extrabold mb-3">
              Two modes, one coach
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 rounded-2xl relative overflow-hidden bg-[linear-gradient(135deg,#0d1f3c_0%,#1a1a1a_100%)] border border-blue-500/25">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 bg-blue-500/20">
                <Mic size={28} className="text-blue-500" />
              </div>
              <h3 className="text-[#F8FAFC] text-[22px] font-bold mb-3">Interview Mode</h3>
              <p className="text-[#94A3B8] text-[15px] leading-[1.7]">
                Practice behavioral, technical, or case interviews. The AI asks questions, follows up, and scores your answers using the STAR framework.
              </p>
              <Link href="/session/setup"
                className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-lg transition-colors bg-blue-500 text-white text-sm font-semibold no-underline">
                Try Interview Mode <ArrowRight size={16} />
              </Link>
            </div>
            <div className="p-8 rounded-2xl relative overflow-hidden bg-[linear-gradient(135deg,#1a0d3c_0%,#1a1a1a_100%)] border border-violet-500/25">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 bg-violet-500/20">
                <Monitor size={28} className="text-violet-500" />
              </div>
              <h3 className="text-[#F8FAFC] text-[22px] font-bold mb-3">Presentation Mode</h3>
              <p className="text-[#94A3B8] text-[15px] leading-[1.7]">
                Present your slides live. Get real-time coaching on delivery, structure, pacing, and slide quality â€” all at once.
              </p>
              <Link href="/session/setup"
                className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-lg transition-colors bg-violet-500 text-white text-sm font-semibold no-underline">
                Try Presentation Mode <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 lg:px-12 py-20 bg-[#0d0d0d]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[#F8FAFC] text-[clamp(1.8rem,4vw,2.5rem)] font-extrabold mb-3">
              How it works
            </h2>
            <p className="text-[#64748B] text-base">From setup to coaching in under 2 minutes</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {steps.map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 z-10 relative bg-gradient-to-br from-blue-500 to-violet-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  <span className="text-white text-[13px] font-bold">{step.number}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[calc(50%+24px)] right-[calc(-50%+24px)] h-0.5 bg-gradient-to-r from-blue-500 to-transparent" />
                )}
                <p className="text-[#F8FAFC] text-[13px] font-semibold">{step.title}</p>
                <p className="text-[#64748B] text-xs mt-1">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 lg:px-12 py-10 border-t border-[#2a2a2a]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-500">
              <Zap size={14} color="white" fill="white" />
            </div>
            <span className="text-[#F8FAFC] font-bold">Speakprime</span>
          </div>
          <p className="text-[#444] text-[13px]">Built with Gemini Live API & Google Cloud Â· Hackathon 2026</p>
        </div>
      </footer>
    </div>
  );
}
