"use client";

import { useState } from "react";
import { DashboardLayout } from "../components/layout/Sidebar";
import {
  User, Bell, Lock, Trash2, Link2, AlertTriangle,
  ChevronRight, Camera, Check
} from "lucide-react";

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors duration-200 ${on ? "bg-blue-500" : "bg-[#2a2a2a]"}`}
    >
      <span
        className={`inline-block w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${on ? "translate-x-[22px]" : "translate-x-[2px]"}`}
      />
    </button>
  );
}

const coachStyles = [
  { id: "strict", label: "Strict Coach", emoji: "\ud83c\udfc0", desc: "Direct, no-nonsense feedback" },
  { id: "balanced", label: "Balanced Mentor", emoji: "\ud83c\udf93", desc: "Firm but encouraging" },
  { id: "gentle", label: "Gentle Guide", emoji: "\ud83c\udf31", desc: "Supportive and nurturing" },
];

export default function SettingsPage() {
  const [name, setName] = useState("David Kim");
  const [email, setEmail] = useState("david@email.com");
  const [industry, setIndustry] = useState("Technology");

  const [voiceFeedback, setVoiceFeedback] = useState(true);
  const [fillerAlerts, setFillerAlerts] = useState(true);
  const [eyeContact, setEyeContact] = useState(true);
  const [slideAnalysis, setSlideAnalysis] = useState(true);
  const [emailReport, setEmailReport] = useState(false);

  const [coachStyle, setCoachStyle] = useState("balanced");

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [sessionReminders, setSessionReminders] = useState(false);

  const [dataRetention, setDataRetention] = useState("12 months");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const sections = [
    { id: "profile", label: "Profile", icon: User },
    { id: "coaching", label: "Coaching Preferences", icon: Bell },
    { id: "ai", label: "AI Persona", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Lock },
    { id: "connected", label: "Connected Accounts", icon: Link2 },
    { id: "danger", label: "Danger Zone", icon: Trash2 },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-slate-50 text-2xl font-extrabold">Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your account and coaching preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-5xl">
          {/* Sidebar Nav */}
          <div className="lg:col-span-1">
            <nav className="space-y-1 sticky top-6">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-slate-400 text-[13px] no-underline hover:text-slate-50"
                >
                  <section.icon size={16} />
                  {section.label}
                  <ChevronRight size={14} className="ml-auto opacity-50" />
                </a>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile */}
            <section id="profile" className="p-6 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a]">
              <h2 className="text-slate-50 text-base font-bold mb-5">Profile</h2>
              <div className="flex items-start gap-5 mb-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-violet-500">
                    <span className="text-white text-xl font-bold">DK</span>
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-blue-500 border-2 border-[#1e1e1e]">
                    <Camera size={10} color="white" />
                  </button>
                </div>
                <div>
                  <p className="text-slate-50 text-[15px] font-semibold">{name}</p>
                  <p className="text-slate-500 text-[13px]">{email}</p>
                  <button className="text-blue-500 text-[13px] mt-1">Change avatar</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-xs block mb-1.5">Full Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg outline-none bg-[#141414] border border-[#2a2a2a] text-slate-50 text-sm" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1.5">Email Address</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg outline-none bg-[#141414] border border-[#2a2a2a] text-slate-50 text-sm" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1.5">Industry / Role</label>
                  <input value={industry} onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg outline-none bg-[#141414] border border-[#2a2a2a] text-slate-50 text-sm" />
                </div>
              </div>
            </section>

            {/* Coaching Preferences */}
            <section id="coaching" className="p-6 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a]">
              <h2 className="text-slate-50 text-base font-bold mb-5">Coaching Preferences</h2>
              <div className="space-y-4">
                {[
                  { label: "Real-time voice feedback", desc: "Hear AI coaching tips as you speak", value: voiceFeedback, onChange: setVoiceFeedback },
                  { label: "Filler word alerts", desc: "Get notified when filler words are detected", value: fillerAlerts, onChange: setFillerAlerts },
                  { label: "Eye contact monitoring", desc: "Track and alert for lost eye contact", value: eyeContact, onChange: setEyeContact },
                  { label: "Slide analysis", desc: "Real-time analysis of slide quality and structure", value: slideAnalysis, onChange: setSlideAnalysis },
                  { label: "Post-session email report", desc: "Receive a detailed report after each session", value: emailReport, onChange: setEmailReport },
                ].map((pref) => (
                  <div key={pref.label} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-slate-50 text-sm font-medium">{pref.label}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{pref.desc}</p>
                    </div>
                    <Toggle on={pref.value} onChange={pref.onChange} />
                  </div>
                ))}
              </div>
            </section>

            {/* AI Persona */}
            <section id="ai" className="p-6 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a]">
              <h2 className="text-slate-50 text-base font-bold mb-2">AI Coaching Style</h2>
              <p className="text-slate-500 text-[13px] mb-5">Choose how your AI coach communicates feedback</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {coachStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setCoachStyle(style.id)}
                    className={`p-4 rounded-xl text-left transition-all border-2 ${
                      coachStyle === style.id
                        ? "bg-blue-500/10 border-blue-500"
                        : "bg-[#141414] border-[#2a2a2a]"
                    }`}
                  >
                    <div className="text-2xl mb-2">{style.emoji}</div>
                    <div className="text-slate-50 text-sm font-semibold">{style.label}</div>
                    <div className="text-slate-500 text-xs mt-1">{style.desc}</div>
                    {coachStyle === style.id && (
                      <div className="mt-2 flex items-center gap-1 text-blue-500">
                        <Check size={14} /> <span className="text-xs">Selected</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Notifications */}
            <section id="notifications" className="p-6 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a]">
              <h2 className="text-slate-50 text-base font-bold mb-5">Notifications</h2>
              <div className="space-y-4">
                {[
                  { label: "Email notifications", desc: "Session reports and tips sent to your email", value: emailNotifs, onChange: setEmailNotifs },
                  { label: "Weekly progress digest", desc: "A summary of your progress every Monday", value: weeklyDigest, onChange: setWeeklyDigest },
                  { label: "Practice reminders", desc: "Reminders to schedule your next session", value: sessionReminders, onChange: setSessionReminders },
                ].map((notif) => (
                  <div key={notif.label} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-slate-50 text-sm font-medium">{notif.label}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{notif.desc}</p>
                    </div>
                    <Toggle on={notif.value} onChange={notif.onChange} />
                  </div>
                ))}
              </div>
            </section>

            {/* Privacy */}
            <section id="privacy" className="p-6 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a]">
              <h2 className="text-slate-50 text-base font-bold mb-5">Privacy &amp; Data</h2>
              <div className="mb-5">
                <label className="text-slate-400 text-xs block mb-2">Data Retention Period</label>
                <div className="flex gap-2 flex-wrap">
                  {["3 months", "6 months", "12 months", "Forever"].map((opt) => (
                    <button key={opt} onClick={() => setDataRetention(opt)}
                      className={`px-3 py-2 rounded-lg transition-all text-[13px] border ${
                        dataRetention === opt
                          ? "bg-blue-500/[12%] border-blue-500 text-blue-500"
                          : "bg-[#141414] border-[#2a2a2a] text-slate-500"
                      }`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                <Trash2 size={15} /> Delete All Session Data
              </button>
            </section>

            {/* Connected Accounts */}
            <section id="connected" className="p-6 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a]">
              <h2 className="text-slate-50 text-base font-bold mb-5">Connected Accounts</h2>
              <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#141414] border border-[#2a2a2a]">
                <div className="flex items-center gap-3">
                  <svg width="22" height="22" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <div>
                    <p className="text-slate-50 text-sm font-medium">Google Account</p>
                    <p className="text-slate-500 text-xs">david@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-green-500 text-xs font-medium">Connected</span>
                </div>
              </div>
            </section>

            {/* Danger Zone */}
            <section id="danger" className="p-6 rounded-2xl bg-red-500/[5%] border border-red-500/25">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} color="#EF4444" />
                <h2 className="text-red-500 text-base font-bold">Danger Zone</h2>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                These actions are irreversible. Please proceed with caution.
              </p>
              <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold">
                <Trash2 size={16} /> Delete Account Permanently
              </button>
            </section>

            {/* Save Button */}
            <div className="flex items-center gap-3 pb-8">
              <button onClick={handleSave}
                className="px-8 py-3 rounded-xl transition-all bg-blue-500 text-white text-[15px] font-semibold shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                Save Changes
              </button>
              {savedSuccess && (
                <div className="flex items-center gap-1.5 text-green-500">
                  <Check size={16} />
                  <span className="text-sm">Saved successfully</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
