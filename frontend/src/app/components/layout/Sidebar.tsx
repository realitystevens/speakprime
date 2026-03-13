"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Plus, History, BarChart3, Settings,
  LogOut, ChevronLeft, ChevronRight, Zap, Menu,
} from "lucide-react";
import { userApi, type UserProfile } from "@/lib/api";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Plus, label: "New Session", path: "/session/setup" },
  { icon: History, label: "Session History", path: "/history" },
  { icon: BarChart3, label: "Reports", path: "/session/report/1" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    userApi.getProfile().then(setProfile).catch(() => { });
  }, []);

  const initials = profile?.name
    ? profile.name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  const displayName = profile?.name ?? "User";
  const displayEmail = profile?.email ?? "";

  return (
    <aside
      className={`flex flex-col h-screen sticky top-0 transition-all duration-300 bg-[#111111] border-r border-[#2a2a2a] ${collapsed ? "w-[72px]" : "w-60"
        }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 h-16 border-b border-[#2a2a2a]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500">
              <Zap size={16} color="white" fill="white" />
            </div>
            <span className="text-slate-50 font-bold text-lg">Speakprime</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto bg-blue-500">
            <Zap size={16} color="white" fill="white" />
          </div>
        )}
        {!collapsed && (
          <button onClick={onToggle} className="p-1 rounded-md transition-colors text-slate-500">
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const active =
            pathname === item.path ||
            (item.path === "/session/report/1" && pathname.startsWith("/session/report"));
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 no-underline ${active ? "bg-blue-500/15 text-blue-500" : "text-slate-400"
                }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={20} />
              {!collapsed && (
                <span className={`text-sm ${active ? "font-semibold" : "font-normal"}`}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-[#2a2a2a]">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500 to-violet-500">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-50 text-[13px] font-semibold truncate">{displayName}</p>
              <p className="text-slate-500 text-[11px] truncate">{displayEmail}</p>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-1 rounded-md transition-colors text-slate-500 hover:text-red-400"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center p-2 rounded-lg transition-colors text-slate-500"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Log out?"
        description="You will be returned to the home page."
        confirmText="Log Out"
        variant="default"
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          router.push("/");
        }}
        icon={<LogOut size={22} color="#3B82F6" />}
      />
    </aside>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#111111]">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed left-0 top-0 z-50 h-full lg:hidden transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 border-b border-[#2a2a2a]">
          <button onClick={() => setMobileOpen(true)} className="text-slate-400">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center bg-blue-500">
              <Zap size={12} color="white" fill="white" />
            </div>
            <span className="text-slate-50 font-bold text-base">Speakprime</span>
          </div>
        </div>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
