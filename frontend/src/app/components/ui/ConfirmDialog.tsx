"use client";

import type { ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
  icon?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  icon,
  onConfirm,
  onClose,
  isLoading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmClass =
    variant === "danger"
      ? "bg-red-500 hover:bg-red-600 text-white"
      : "bg-blue-500 hover:bg-blue-600 text-white";

  const iconWrapClass =
    variant === "danger"
      ? "border-red-500/25 bg-red-500/[0.12]"
      : "border-blue-500/25 bg-blue-500/[0.12]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#111111] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
        {icon && (
          <div className={`mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border ${iconWrapClass}`}>
            {icon}
          </div>
        )}
        <h3 className="mb-2 text-center text-[18px] font-bold text-[#F8FAFC]">{title}</h3>
        <p className="mb-7 text-center text-sm leading-[1.6] text-slate-500">{description}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-2xl border border-white/10 bg-[#2a2a2a] py-3 text-sm text-slate-400 transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 rounded-2xl py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 ${confirmClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
