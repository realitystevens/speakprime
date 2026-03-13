/**
 * Centralised API client for the Speakprime backend.
 * All requests carry cookies (credentials: "include") so the
 * backend's demo_session_id cookie travels automatically.
 */

export const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text}`);
  }
  // 204 No Content
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

const jsonOpts = (method: string, body?: unknown): RequestInit => ({
  method,
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: body !== undefined ? JSON.stringify(body) : undefined,
});

export const api = {
  get<T>(path: string) {
    return fetch(`${BASE_URL}${path}`, { credentials: "include" }).then((r) =>
      handleResponse<T>(r)
    );
  },
  post<T>(path: string, body?: unknown) {
    return fetch(`${BASE_URL}${path}`, jsonOpts("POST", body)).then((r) =>
      handleResponse<T>(r)
    );
  },
  postForm<T>(path: string, formData: FormData) {
    return fetch(`${BASE_URL}${path}`, {
      method: "POST",
      credentials: "include",
      body: formData,
    }).then((r) => handleResponse<T>(r));
  },
  put<T>(path: string, body?: unknown) {
    return fetch(`${BASE_URL}${path}`, jsonOpts("PUT", body)).then((r) =>
      handleResponse<T>(r)
    );
  },
  delete<T>(path: string) {
    return fetch(`${BASE_URL}${path}`, {
      method: "DELETE",
      credentials: "include",
    }).then((r) => handleResponse<T>(r));
  },
};

// ── Typed API helpers ────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  industry: string | null;
  created_at: string;
  coaching_preferences: {
    real_time_voice_feedback: boolean;
    filler_word_alerts: boolean;
    eye_contact_monitoring: boolean;
    slide_analysis: boolean;
    post_session_email: boolean;
  };
  ai_persona: string;
}

export interface UserStats {
  total_sessions: number;
  avg_confidence_score: number;
  last_session_filler_words: number;
  improvement_rate: number;
  sessions_this_month: number;
  confidence_over_time: { session_number: number; score: number; date: string }[];
}

export interface Session {
  id: string;
  user_id: string;
  name: string;
  mode: "interview" | "presentation";
  config: Record<string, unknown>;
  status: string;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  overall_score: number | null;
  slide_file_url: string | null;
}

export interface CreateSessionBody {
  name: string;
  config: {
    mode: "interview" | "presentation";
    interview_type?: string;
    job_role?: string;
    difficulty?: string;
    interview_goal?: string;
    company_name?: string;
    company_link?: string;
    job_posting_link?: string;
    interview_context?: string;
    interviewer_persona?: string;
    resume_highlights?: string;
    must_cover_topics?: string[];
    duration_minutes?: number;
    focus_areas?: string[];
    presentation_topic?: string;
    audience_type?: string;
  };
}

export interface Report {
  id: string;
  session_id: string;
  user_id: string;
  generated_at: string;
  scores: {
    clarity: number;
    confidence: number;
    pacing: number;
    eye_contact: number;
    filler_words: number;
    answer_structure: number;
    overall: number;
  };
  filler_word_breakdown: { word: string; count: number }[];
  recommendations: { category: string; tip: string; priority: string }[];
  annotated_transcript: {
    text: string;
    annotation_type: string;
    start_index: number;
    end_index: number;
  }[];
  slide_reports:
  | {
    slide_number: number;
    thumbnail_url: string | null;
    status: string;
    feedback: string;
  }[]
  | null;
  feedback_timeline: {
    session_id: string;
    timestamp_seconds: number;
    type: string;
    severity: string;
    message: string;
    speaker: string;
  }[];
  pdf_url: string | null;
}

// Convenience wrappers
export const userApi = {
  getProfile: () => api.get<UserProfile>("/users/me"),
  updateProfile: (body: Partial<UserProfile>) =>
    api.put<UserProfile>("/users/me", body),
  getStats: () => api.get<UserStats>("/users/me/stats"),
  deleteAccount: () => api.delete<{ success: boolean }>("/users/me"),
};

export const sessionApi = {
  list: (params?: { mode?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.mode) qs.set("mode", params.mode);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    const q = qs.toString();
    return api.get<Session[]>(`/sessions${q ? `?${q}` : ""}`);
  },
  get: (id: string) => api.get<Session>(`/sessions/${id}`),
  create: (body: CreateSessionBody) => api.post<Session>("/sessions", body),
  end: (id: string) =>
    api.post<{ session_id: string; report_id: string }>(`/sessions/${id}/end`),
  delete: async (id: string) => {
    try {
      return await api.delete<{ success: boolean }>(`/sessions/${id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Treat "already deleted" as success to keep delete idempotent in the UI.
      if (message.includes("API 404")) {
        return { success: true };
      }
      throw err;
    }
  },
  uploadSlides: (sessionId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.postForm<{ file_url: string; slide_count: number }>(
      `/sessions/${sessionId}/upload-slides`,
      form
    );
  },
};

export const reportApi = {
  get: (id: string) => api.get<Report>(`/reports/${id}`),
  getBySession: (sessionId: string) =>
    api.get<Report>(`/reports/by-session/${sessionId}`),
  generatePdf: (id: string) =>
    api.post<{ pdf_url: string }>(`/reports/${id}/generate-pdf`),
};
