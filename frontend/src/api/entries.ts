import { apiClient } from './client';

// Attachment interface (client-only; backend does not support yet)
export interface Attachment {
  type: 'link' | 'document' | 'reference';
  title: string;
  url: string;
  description?: string;
}

// Entry interface for components (tags as objects)
export interface Entry {
  id: number;
  user_id: number;
  project_id?: number;
  date: string;
  title?: string;
  body?: string;
  looking_ahead?: string;
  mood: number | null;
  focus_score?: number;
  created_at: string;
  updated_at: string;
  tags: Array<{ id: number; name: string }>;
  project?: { id: number; name: string; description?: string };
  attachments?: Attachment[];
}

export interface EntryCreate {
  date: string;
  title?: string;
  body?: string;
  looking_ahead?: string;
  mood?: number | null;
  focus_score?: number | null;
  project_id?: number | null;
  tags?: string[];
  attachments?: Attachment[];
}

export interface EntryUpdate {
  date?: string;
  title?: string;
  body?: string;
  looking_ahead?: string;
  mood?: number | null;
  focus_score?: number | null;
  project_id?: number | null;
  tags?: string[];
  attachments?: Attachment[];
}

export interface EntryFilters {
  project_id?: number;
  tag?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

/**
 * The entry as the API actually sends it: nullable columns come back as null,
 * not absent. Entry is the normalized shape the app works with, so the two are
 * deliberately separate -- typing a response as Entry and then normalizing it
 * claims the conversion has already happened.
 */
export interface RawEntry {
  id: number;
  user_id: number;
  project_id?: number | null;
  date: string;
  title?: string | null;
  body?: string | null;
  looking_ahead?: string | null;
  mood: number;
  focus_score?: number | null;
  created_at: string;
  updated_at: string;
  tags?: Array<{ id: number; name: string }>;
  project?: { id: number; name: string; description?: string | null } | null;
}

function normalizeEntry(raw: RawEntry): Entry {
  return {
    id: raw.id,
    user_id: raw.user_id,
    project_id: raw.project_id ?? undefined,
    date: String(raw.date),
    title: raw.title ?? undefined,
    body: raw.body ?? undefined,
    looking_ahead: raw.looking_ahead ?? undefined,
    mood: raw.mood,
    focus_score: raw.focus_score ?? undefined,
    created_at: String(raw.created_at),
    updated_at: String(raw.updated_at),
    tags: raw.tags ?? [],
    project: raw.project ? { id: raw.project.id, name: raw.project.name, description: raw.project.description ?? undefined } : undefined,
  };
}

export const entriesApi = {
  getAll: async (filters?: EntryFilters): Promise<Entry[]> => {
    const params: Record<string, string | number> = {};
    if (filters?.project_id != null) params.project_id = filters.project_id;
    if (filters?.tag != null) params.tag = filters.tag;
    if (filters?.search != null) params.search = filters.search;
    if (filters?.date_from != null) params.date_from = filters.date_from;
    if (filters?.date_to != null) params.date_to = filters.date_to;
    const { data } = await apiClient.get<RawEntry[]>('/entries', { params });
    return Array.isArray(data) ? data.map(normalizeEntry) : [];
  },

  getById: async (id: number): Promise<Entry> => {
    const { data } = await apiClient.get<RawEntry>(`/entries/${id}`);
    return normalizeEntry(data);
  },

  create: async (data: EntryCreate): Promise<Entry> => {
    const body = {
      date: data.date,
      title: data.title ?? null,
      body: data.body ?? null,
      looking_ahead: data.looking_ahead ?? null,
      mood: data.mood != null && data.mood !== null ? Number(data.mood) : 1,
      focus_score: data.focus_score ?? null,
      project_id: data.project_id ?? null,
      tags: data.tags ?? [],
    };
    const { data: created } = await apiClient.post<RawEntry>('/entries', body);
    return normalizeEntry(created);
  },

  update: async (id: number, data: EntryUpdate): Promise<Entry> => {
    const body: Record<string, unknown> = {};
    if (data.date !== undefined) body.date = data.date;
    if (data.title !== undefined) body.title = data.title;
    if (data.body !== undefined) body.body = data.body;
    if (data.looking_ahead !== undefined) body.looking_ahead = data.looking_ahead;
    if (data.mood !== undefined) body.mood = data.mood;
    if (data.focus_score !== undefined) body.focus_score = data.focus_score;
    if (data.project_id !== undefined) body.project_id = data.project_id;
    if (data.tags !== undefined) body.tags = data.tags;
    const { data: updated } = await apiClient.put<RawEntry>(`/entries/${id}`, body);
    return normalizeEntry(updated);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/entries/${id}`);
  },
};
