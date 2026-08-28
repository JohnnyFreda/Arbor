import { apiClient } from './client';

export interface DailyReview {
  date: string;
  proposed_title?: string;
  proposed_body: string;
  proposed_looking_ahead: string;
  capture_count: number;
  completed_count: number;
  open_count: number;
  blocker_count: number;
  /** Set when an entry for this date already exists, so we offer to edit it. */
  existing_entry_id?: number;
  is_empty: boolean;
}

interface RawDailyReview {
  date: string;
  proposed_title?: string | null;
  proposed_body: string;
  proposed_looking_ahead: string;
  capture_count: number;
  completed_count: number;
  open_count: number;
  blocker_count: number;
  existing_entry_id?: number | null;
  is_empty: boolean;
}

/**
 * Minutes east of UTC, which is what the API wants.
 *
 * Timestamps are stored in UTC and a day is local, so without this the API
 * would attribute an evening capture to the wrong day for anyone west of UTC.
 * `getTimezoneOffset` returns minutes *behind* UTC, hence the negation.
 */
export function utcOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

/** Today in the browser's own calendar, not the server's. */
export function localToday(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export const reviewsApi = {
  getDaily: async (date?: string): Promise<DailyReview> => {
    const { data } = await apiClient.get<RawDailyReview>('/reviews/daily', {
      params: {
        date: date ?? localToday(),
        utc_offset_minutes: utcOffsetMinutes(),
      },
    });
    return {
      date: String(data.date),
      proposed_title: data.proposed_title ?? undefined,
      proposed_body: data.proposed_body,
      proposed_looking_ahead: data.proposed_looking_ahead,
      capture_count: data.capture_count,
      completed_count: data.completed_count,
      open_count: data.open_count,
      blocker_count: data.blocker_count,
      existing_entry_id: data.existing_entry_id ?? undefined,
      is_empty: data.is_empty,
    };
  },
};
