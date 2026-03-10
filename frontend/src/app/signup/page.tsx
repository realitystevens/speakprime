"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Eye, EyeOff, Mail, Lock, User } from "lucide-react";

const goals = ["Job Interviews", "Presentations", "Both"];

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState("Both");
  const [agreed, setAgreed] = useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#111111]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 no-underline">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500">
              <Zap size={20} color="white" fill="white" />
            </div>
            <span className="text-slate-50 font-bold text-[22px]">Speakprime</span>
          </Link>
          <h1 className="text-slate-50 text-[28px] font-extrabold mb-2">Create your account</h1>
          <p className="text-slate-500 text-[15px]">Start getting coached in minutes</p>
        </div>

        <div className="p-8 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a] shadow-[0_0_60px_rgba(0,0,0,0.6)]">
          {/* Google Sign Up */}
          <button className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg transition-colors mb-6 hover:opacity-90 bg-white text-[#1a1a1a] font-semibold text-[15px]">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#2a2a2a]" />
            <span className="text-[#555] text-[13px]">or</span>
            <div className="flex-1 h-px bg-[#2a2a2a]" />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); router.push("/dashboard"); }} className="space-y-4">
            <div>
              <label className="text-slate-400 text-[13px] font-medium block mb-1.5">Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
                <input type="text" placeholder="David Kim" className="w-full pl-10 pr-4 py-3 rounded-lg outline-none bg-[#141414] border border-[#2a2a2a] text-slate-50 text-sm" />
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-[13px] font-medium block mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
                <input type="email" placeholder="david@email.com" className="w-full pl-10 pr-4 py-3 rounded-lg outline-none bg-[#141414] border border-[#2a2a2a] text-slate-50 text-sm" />
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-[13px] font-medium block mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-lg outline-none bg-[#141414] border border-[#2a2a2a] text-slate-50 text-sm"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555]">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-[13px] font-medium block mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
                <input type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-3 rounded-lg outline-none bg-[#141414] border border-[#2a2a2a] text-slate-50 text-sm" />
              </div>
            </div>

            {/* Goal selector */}
            <div>
              <label className="text-slate-400 text-[13px] font-medium block mb-2">
                I&apos;m practicing for:
              </label>
              <div className="flex gap-2">
                {goals.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setSelectedGoal(goal)}
                    className={`flex-1 py-2 px-3 rounded-lg transition-all text-xs border ${
                      selectedGoal === goal
                        ? "bg-blue-500/15 border-blue-500 text-blue-500 font-semibold"
                        : "bg-[#141414] border-[#2a2a2a] text-slate-500 font-normal"
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 rounded"
              />
              <label htmlFor="terms" className="text-slate-500 text-[13px] leading-normal">
                I agree to the{" "}
                <a href="#" className="text-blue-500 no-underline">Terms of Service</a>
                {" "}and{" "}
                <a href="#" className="text-blue-500 no-underline">Privacy Policy</a>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg transition-colors hover:opacity-90 bg-blue-500 text-white text-[15px] font-semibold shadow-[0_0_20px_rgba(59,130,246,0.25)]"
            >
              Create account
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-slate-500 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-500 no-underline font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
