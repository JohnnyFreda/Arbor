import { apiClient } from './client';

export type TaskType = 'task' | 'blocker';
export type TaskStatus = 'open' | 'done' | 'dropped';

export interface Task {
  id: number;
  user_id: number;
  project_id?: number;
  type: TaskType;
  title: string;
  notes?: string;
  status: TaskStatus;
  priority?: string;
  due_date?: string;
  source_capture_id?: number;
  source_interpretation_id?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface TaskUpdate {
  title?: string;
  notes?: string;
  status?: TaskStatus;
  priority?: string;
  due_date?: string | null;
  /** 0 clears the association, matching how entries handle it. */
  project_id?: number;
}

export interface TaskFilters {
  status?: TaskStatus;
  type?: TaskType;
  project_id?: number;
  limit?: number;
  offset?: number;
}

interface RawTask {
  id: number;
  user_id: number;
  project_id?: number | null;
  type: TaskType;
  title: string;
  notes?: string | null;
  status: TaskStatus;
  priority?: string | null;
  due_date?: string | null;
  source_capture_id?: number | null;
  source_interpretation_id?: number | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

function normalizeTask(raw: RawTask): Task {
  return {
    id: raw.id,
    user_id: raw.user_id,
    project_id: raw.project_id ?? undefined,
    type: raw.type,
    title: raw.title,
    notes: raw.notes ?? undefined,
    status: raw.status,
    priority: raw.priority ?? undefined,
    due_date: raw.due_date ?? undefined,
    source_capture_id: raw.source_capture_id ?? undefined,
    source_interpretation_id: raw.source_interpretation_id ?? undefined,
    created_at: String(raw.created_at),
    updated_at: String(raw.updated_at),
    completed_at: raw.completed_at ?? undefined,
  };
}

export const tasksApi = {
  getAll: async (filters?: TaskFilters): Promise<Task[]> => {
    const params: Record<string, string | number> = {};
    if (filters?.status != null) params.status = filters.status;
    if (filters?.type != null) params.type = filters.type;
    if (filters?.project_id != null) params.project_id = filters.project_id;
    if (filters?.limit != null) params.limit = filters.limit;
    if (filters?.offset != null) params.offset = filters.offset;
    const { data } = await apiClient.get<RawTask[]>('/tasks', { params });
    return Array.isArray(data) ? data.map(normalizeTask) : [];
  },

  getById: async (id: number): Promise<Task> => {
    const { data } = await apiClient.get<RawTask>(`/tasks/${id}`);
    return normalizeTask(data);
  },

  update: async (id: number, payload: TaskUpdate): Promise<Task> => {
    const body: Record<string, unknown> = {};
    if (payload.title !== undefined) body.title = payload.title;
    if (payload.notes !== undefined) body.notes = payload.notes;
    if (payload.status !== undefined) body.status = payload.status;
    if (payload.priority !== undefined) body.priority = payload.priority;
    if (payload.due_date !== undefined) body.due_date = payload.due_date;
    if (payload.project_id !== undefined) body.project_id = payload.project_id;
    const { data } = await apiClient.patch<RawTask>(`/tasks/${id}`, body);
    return normalizeTask(data);
  },
};
