"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "../components/layout/Sidebar";
import {
  User, Bell, Lock, Trash2, AlertTriangle,
  ChevronRight, Check, Loader2
} from "lucide-react";
import { userApi, type UserProfile } from "@/lib/api";

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

function getInitials(name: string): string {
  return name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

export default function SettingsPage() {
  const [profileLoading, setProfileLoading] = useState(true);

  const [name, setName] = useState("");

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
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    userApi.getProfile()
      .then((profile: UserProfile) => {
        setName(profile.name ?? "");
        setCoachStyle(profile.ai_persona ?? "balanced");
        const prefs = profile.coaching_preferences;
        if (prefs) {
          setVoiceFeedback(prefs.real_time_voice_feedback ?? true);
          setFillerAlerts(prefs.filler_word_alerts ?? true);
          setEyeContact(prefs.eye_contact_monitoring ?? true);
          setSlideAnalysis(prefs.slide_analysis ?? true);
          setEmailReport(prefs.post_session_email ?? false);
        }
      })
      .catch((err) => console.error("Settings load error:", err))
      .finally(() => setProfileLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await userApi.updateProfile({
        ai_persona: coachStyle,
        coaching_preferences: {
          real_time_voice_feedback: voiceFeedback,
          filler_word_alerts: fillerAlerts,
          eye_contact_monitoring: eyeContact,
          slide_analysis: slideAnalysis,
          post_session_email: emailReport,
        },
      } as Partial<UserProfile>);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure? This permanently deletes your account and all session data.")) return;
    try {
      await userApi.deleteAccount();
      window.location.href = "/";
    } catch (err) {
      console.error("Delete account error:", err);
    }
  };

  const sections = [
    { id: "profile", label: "Profile", icon: User },
    { id: "coaching", label: "Coaching Preferences", icon: Bell },
    { id: "ai", label: "AI Persona", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Lock },
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
            <nav className="space-y-1 lg:sticky lg:top-6">
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
              {profileLoading ? (
                <div className="flex items-center gap-3 text-slate-500 text-sm py-4">
                  <Loader2 size={18} className="animate-spin" /> Loading profile...
                </div>
              ) : (
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-violet-500">
                    <span className="text-white text-xl font-bold">{getInitials(name)}</span>
                  </div>
                  <div className="flex-1">
                    <label className="text-slate-400 text-xs block mb-1.5">Name</label>
                    <div className="w-full px-3 py-2.5 rounded-lg bg-[#141414] border border-[#2a2a2a] text-slate-50 text-sm">
                      {name || "-"}
                    </div>
                  </div>
                </div>
              )}
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
                    className={`p-4 rounded-xl text-left transition-all border-2 ${coachStyle === style.id
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
                      className={`px-3 py-2 rounded-lg transition-all text-[13px] border ${dataRetention === opt
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

            {/* Danger Zone */}
            <section id="danger" className="p-6 rounded-2xl bg-red-500/[5%] border border-red-500/25">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} color="#EF4444" />
                <h2 className="text-red-500 text-base font-bold">Danger Zone</h2>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                These actions are irreversible. Please proceed with caution.
              </p>
              <button
                onClick={handleDeleteAccount}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold"
              >
                <Trash2 size={16} /> Delete Account Permanently
              </button>
            </section>

            {/* Save Button */}
            <div className="flex items-center gap-3 pb-8">
              <button
                onClick={handleSave}
                disabled={saving || profileLoading}
                className="flex items-center gap-2 px-8 py-3 rounded-xl transition-all bg-blue-500 text-white text-[15px] font-semibold shadow-[0_0_20px_rgba(59,130,246,0.2)] disabled:opacity-60"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Save Changes
              </button>
              {savedSuccess && (
                <div className="flex items-center gap-1.5 text-green-500">
                  <Check size={16} />
                  <span className="text-sm">Saved successfully</span>
                </div>
              )}
              {saveError && (
                <p className="text-red-400 text-sm">{saveError}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


