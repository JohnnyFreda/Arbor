import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import InboxCard from '../components/InboxCard';
import CaptureBox from '../components/CaptureBox';
import Skeleton from '../components/ui/Skeleton';
import { capturesApi, Capture, ProcessingStatus } from '../api/captures';
import { projectsApi } from '../api/projects';

const IN_FLIGHT: ProcessingStatus[] = ['pending', 'processing'];

/**
 * A capture belongs in the inbox until it has been decided on.
 *
 * That means an undecided proposal, or no proposal at all -- a capture whose
 * interpretation failed or was never attempted still needs the user's eyes,
 * and hiding it would quietly lose the thought.
 */
function needsAttention(capture: Capture): boolean {
  if (IN_FLIGHT.includes(capture.processing_status)) return true;
  if (!capture.interpretation) return true;
  return capture.interpretation.status === 'proposed';
}

export default function InboxPage() {
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const announce = (message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  const { data: captures, isLoading } = useQuery({
    queryKey: ['captures'],
    // Filtering happens client-side: the API filters by processing status, and
    // the inbox needs "undecided", which spans several. Fine at this size.
    queryFn: () => capturesApi.getAll({ limit: 100 }),
    refetchInterval: (query) => {
      const rows = query.state.data as Capture[] | undefined;
      return rows?.some((c) => IN_FLIGHT.includes(c.processing_status)) ? 2000 : false;
    },
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  });

  const pending = captures?.filter(needsAttention) ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inbox</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Suggestions, not decisions. Accept, adjust, or throw away.
          </p>
        </div>
        {pending.length > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums flex-shrink-0">
            {pending.length} waiting
          </span>
        )}
      </div>

      <div className="min-h-[1.5rem]" aria-live="polite">
        {toast && (
          <div className="inline-flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
            <CheckCircleIcon className="h-4 w-4" />
            {toast}
          </div>
        )}
      </div>

      <div className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 ring-1 ring-gray-200/50 dark:ring-white/5">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        ) : pending.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Inbox clear
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Everything captured has been sorted.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {pending.map((capture) => (
              <InboxCard
                key={capture.id}
                capture={capture}
                projects={projects ?? []}
                onResolved={announce}
              />
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">
          Thought of something else?
        </p>
        <CaptureBox />
      </div>
    </div>
  );
}
