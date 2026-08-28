import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ArborMark from '../components/ArborMark';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import CaptureBox from '../components/CaptureBox';
import Skeleton from '../components/ui/Skeleton';
import { capturesApi, Capture, ProcessingStatus } from '../api/captures';
import { typeStyle } from '../lib/badgeStyles';

/** Statuses that are still moving, so the list should keep checking. */
const IN_FLIGHT: ProcessingStatus[] = ['pending', 'processing'];

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function StatusLine({ capture }: { capture: Capture }) {
  const queryClient = useQueryClient();

  const retryMutation = useMutation({
    mutationFn: () => capturesApi.reinterpret(capture.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['captures'] }),
  });

  const interpretation = capture.interpretation;

  if (interpretation) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`px-2 py-0.5 rounded-full font-medium ${
            typeStyle(interpretation.type)
          }`}
        >
          {interpretation.type}
        </span>
        {interpretation.suggested_title && (
          <span className="text-gray-600 dark:text-gray-300">
            {interpretation.suggested_title}
          </span>
        )}
        {interpretation.confidence != null && (
          <span className="text-gray-400 dark:text-gray-500">
            {Math.round(interpretation.confidence * 100)}% confident
          </span>
        )}
      </div>
    );
  }

  if (IN_FLIGHT.includes(capture.processing_status)) {
    return (
      <span className="text-xs text-gray-400 dark:text-gray-500">
        Reading it…
      </span>
    );
  }

  // Both remaining states are retryable: `failed` is an error worth flagging,
  // `skipped` just means no interpreter was configured when it arrived.
  const failed = capture.processing_status === 'failed';

  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={
          failed
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-gray-400 dark:text-gray-500'
        }
      >
        {failed ? "Couldn't interpret this one" : 'Saved, not interpreted'}
      </span>
      <button
        type="button"
        onClick={() => retryMutation.mutate()}
        disabled={retryMutation.isPending}
        className="inline-flex items-center gap-1 text-moss-600 dark:text-moss-400 hover:underline disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-moss-500 rounded"
      >
        <ArrowPathIcon className="h-3 w-3" />
        {retryMutation.isPending ? 'Retrying…' : 'Interpret'}
      </button>
    </div>
  );
}

export default function CapturePage() {
  const { data: captures, isLoading } = useQuery({
    queryKey: ['captures'],
    queryFn: () => capturesApi.getAll({ limit: 25 }),
    // Interpretation runs after the response, so poll while anything is moving.
    refetchInterval: (query) => {
      const rows = query.state.data as Capture[] | undefined;
      const moving = rows?.some((c) => IN_FLIGHT.includes(c.processing_status));
      return moving ? 2000 : false;
    },
  });

  const skippedCount =
    captures?.filter((c) => c.processing_status === 'skipped').length ?? 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Capture</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Get the thought down. Structure comes later.
        </p>
      </div>

      <CaptureBox autoFocus />

      <div className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 ring-1 ring-gray-200/50 dark:ring-white/5">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/50">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Recent captures
          </h2>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        ) : !captures?.length ? (
          <div className="px-6 py-10 text-center">
            <ArborMark className="h-10 w-10 mx-auto mb-3 text-moss-600/25 dark:text-moss-400/25" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nothing captured yet. The box above is the whole interface.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {captures.map((capture) => (
              <li key={capture.id} className="px-6 py-4 space-y-1.5">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                    {capture.content}
                  </p>
                  <time
                    dateTime={capture.created_at}
                    className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 tabular-nums"
                  >
                    {relativeTime(capture.created_at)}
                  </time>
                </div>
                <StatusLine capture={capture} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {skippedCount > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
          Captures are saving but not being interpreted. Set{' '}
          <code className="font-mono text-gray-600 dark:text-gray-300">
            ANTHROPIC_API_KEY
          </code>{' '}
          in the backend environment to turn interpretation on — nothing already
          captured is lost, and you can retry those afterwards.
        </p>
      )}
    </div>
  );
}
