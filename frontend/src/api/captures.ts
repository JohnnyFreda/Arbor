import { apiClient } from './client';

export type CaptureSource = 'desktop' | 'mobile' | 'voice' | 'other';

export type ProcessingStatus =
  | 'pending'
  | 'processing'
  | 'interpreted'
  | 'failed'
  | 'skipped';

export type InterpretationType = 'thought' | 'task' | 'idea' | 'note' | 'blocker';

export type InterpretationStatus = 'proposed' | 'accepted' | 'edited' | 'dismissed';

export interface Interpretation {
  id: number;
  capture_id: number;
  type: InterpretationType;
  suggested_title?: string;
  suggested_project_id?: number;
  suggested_priority?: string;
  suggested_next_action?: string;
  confidence?: number;
  status: InterpretationStatus;
  model?: string;
  created_at: string;
}

export interface Capture {
  id: number;
  user_id: number;
  content: string;
  source: CaptureSource;
  processing_status: ProcessingStatus;
  created_at: string;
  updated_at: string;
  interpretation?: Interpretation;
}

export interface CaptureCreate {
  content: string;
  source?: CaptureSource;
  /**
   * Idempotency key. A retried submit -- flaky connection, double-tapped
   * button -- resolves to the existing capture instead of creating a second.
   */
  client_token?: string;
}

export interface CaptureFilters {
  processing_status?: ProcessingStatus;
  limit?: number;
  offset?: number;
}

/** The capture as the API sends it: nullable columns arrive as null, not absent. */
interface RawInterpretation {
  id: number;
  capture_id: number;
  type: InterpretationType;
  suggested_title?: string | null;
  suggested_project_id?: number | null;
  suggested_priority?: string | null;
  suggested_next_action?: string | null;
  confidence?: number | null;
  status: InterpretationStatus;
  model?: string | null;
  created_at: string;
}

interface RawCapture {
  id: number;
  user_id: number;
  content: string;
  source: CaptureSource;
  processing_status: ProcessingStatus;
  created_at: string;
  updated_at: string;
  interpretation?: RawInterpretation | null;
}

function normalizeInterpretation(raw: RawInterpretation): Interpretation {
  return {
    id: raw.id,
    capture_id: raw.capture_id,
    type: raw.type,
    suggested_title: raw.suggested_title ?? undefined,
    suggested_project_id: raw.suggested_project_id ?? undefined,
    suggested_priority: raw.suggested_priority ?? undefined,
    suggested_next_action: raw.suggested_next_action ?? undefined,
    confidence: raw.confidence ?? undefined,
    status: raw.status,
    model: raw.model ?? undefined,
    created_at: String(raw.created_at),
  };
}

function normalizeCapture(raw: RawCapture): Capture {
  return {
    id: raw.id,
    user_id: raw.user_id,
    content: raw.content,
    source: raw.source,
    processing_status: raw.processing_status,
    created_at: String(raw.created_at),
    updated_at: String(raw.updated_at),
    interpretation: raw.interpretation
      ? normalizeInterpretation(raw.interpretation)
      : undefined,
  };
}

/**
 * Where this capture came from. Coarse pointer means a touch device, which is
 * the distinction the backend actually cares about -- mobile captures are the
 * ones typed one-handed or dictated.
 */
export function detectSource(): CaptureSource {
  if (typeof window === 'undefined' || !window.matchMedia) return 'desktop';
  return window.matchMedia('(pointer: coarse)').matches ? 'mobile' : 'desktop';
}

/** A fresh idempotency key. Falls back where crypto.randomUUID is unavailable. */
export function newClientToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export const capturesApi = {
  getAll: async (filters?: CaptureFilters): Promise<Capture[]> => {
    const params: Record<string, string | number> = {};
    if (filters?.processing_status != null) {
      params.processing_status = filters.processing_status;
    }
    if (filters?.limit != null) params.limit = filters.limit;
    if (filters?.offset != null) params.offset = filters.offset;
    const { data } = await apiClient.get<RawCapture[]>('/captures', { params });
    return Array.isArray(data) ? data.map(normalizeCapture) : [];
  },

  getById: async (id: number): Promise<Capture> => {
    const { data } = await apiClient.get<RawCapture>(`/captures/${id}`);
    return normalizeCapture(data);
  },

  create: async (payload: CaptureCreate): Promise<Capture> => {
    const { data } = await apiClient.post<RawCapture>('/captures', {
      content: payload.content,
      source: payload.source ?? detectSource(),
      client_token: payload.client_token ?? null,
    });
    return normalizeCapture(data);
  },

  /** Re-run interpretation for a capture that failed or was skipped. */
  reinterpret: async (id: number): Promise<Capture> => {
    const { data } = await apiClient.post<RawCapture>(`/captures/${id}/interpret`, {});
    return normalizeCapture(data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/captures/${id}`);
  },
};
