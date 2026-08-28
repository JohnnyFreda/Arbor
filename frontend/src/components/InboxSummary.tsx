import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { InboxIcon } from '@heroicons/react/24/outline';
import { capturesApi, Capture, ProcessingStatus } from '../api/captures';

const IN_FLIGHT: ProcessingStatus[] = ['pending', 'processing'];

/** Matches the inbox's own rule: undecided, or never given a proposal at all. */
function needsAttention(capture: Capture): boolean {
  if (IN_FLIGHT.includes(capture.processing_status)) return true;
  if (!capture.interpretation) return true;
  return capture.interpretation.status === 'proposed';
}

export default function InboxSummary() {
  const { data: captures, isLoading } = useQuery({
    queryKey: ['captures'],
    queryFn: () => capturesApi.getAll({ limit: 100 }),
  });

  const waiting = captures?.filter(needsAttention).length ?? 0;

  return (
    <div data-testid="inbox-summary" className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 ring-1 ring-gray-200/50 dark:ring-white/5 p-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-3">
        <InboxIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        Inbox
      </h2>

      {isLoading ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">Checking…</p>
      ) : waiting === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Clear. Everything captured has been sorted.
        </p>
      ) : (
        <>
          <p className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums leading-none">
            {waiting}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {waiting === 1 ? 'capture waiting' : 'captures waiting'}
          </p>
          <Link
            to="/inbox"
            className="mt-3 inline-block text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline focus:outline-none focus:ring-2 focus:ring-violet-500 rounded"
          >
            Review →
          </Link>
        </>
      )}
    </div>
  );
}
