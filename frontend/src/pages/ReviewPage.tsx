import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import MarkdownEditor from '../components/MarkdownEditor';
import MoodSelector from '../components/MoodSelector';
import Skeleton from '../components/ui/Skeleton';
import { reviewsApi, localToday } from '../api/reviews';
import { entriesApi } from '../api/entries';

const inputClass =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-moss-500 focus:border-moss-500';

const label = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

function Stat({ value, caption }: { value: number; caption: string }) {
  return (
    <div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums leading-none">
        {value}
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{caption}</p>
    </div>
  );
}

export default function ReviewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = localToday();

  const { data: review, isLoading } = useQuery({
    queryKey: ['review', today],
    queryFn: () => reviewsApi.getDaily(today),
  });

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [lookingAhead, setLookingAhead] = useState('');
  const [mood, setMood] = useState(3);
  const [edited, setEdited] = useState(false);

  // Seed the form from the proposal once. After that the user's text is the
  // source of truth -- a refetch must never overwrite what they have written.
  useEffect(() => {
    if (!review || edited) return;
    setTitle(review.proposed_title ?? '');
    setBody(review.proposed_body);
    setLookingAhead(review.proposed_looking_ahead);
  }, [review, edited]);

  const touch = <T,>(setter: (v: T) => void) => (value: T) => {
    setEdited(true);
    setter(value);
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      entriesApi.create({
        date: today,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
        looking_ahead: lookingAhead.trim() || undefined,
        mood,
      }),
    onSuccess: (entry) => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['review', today] });
      navigate(`/entries/${entry.id}`);
    },
  });

  const heading = (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        End of day
      </h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        A draft from what actually happened. Edit anything before you save it.
      </p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {heading}
        <div className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      </div>
    );
  }

  // An entry already exists for today. Offer to edit it rather than quietly
  // creating a second one for the same date.
  if (review?.existing_entry_id) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {heading}
        <div className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 p-6">
          <p className="text-sm text-gray-900 dark:text-white font-medium">
            You already wrote today's entry.
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Saving another would leave two entries on the same date.
          </p>
          <Link
            to={`/entries/${review.existing_entry_id}/edit`}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-moss-600 dark:text-moss-400 hover:underline focus:outline-none focus:ring-2 focus:ring-moss-500 rounded"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Edit today's entry
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {heading}

      {review && (
        <div className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 ring-1 ring-gray-200/50 dark:ring-white/5 p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Built from
          </h2>
          <div className="flex flex-wrap gap-x-10 gap-y-4">
            <Stat value={review.capture_count} caption="captured" />
            <Stat value={review.completed_count} caption="finished" />
            <Stat value={review.open_count} caption="still open" />
            <Stat value={review.blocker_count} caption="blocked" />
          </div>
          {review.is_empty && (
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Nothing was captured or finished today. You can still write an
              entry — a quiet day is worth recording too.
            </p>
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
        className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 ring-1 ring-gray-200/50 dark:ring-white/5 p-6 space-y-5"
      >
        <div>
          <label className={label} htmlFor="review-title">Title</label>
          <input
            id="review-title"
            type="text"
            value={title}
            onChange={(e) => touch(setTitle)(e.target.value)}
            placeholder="How would you sum up the day?"
            className={inputClass}
          />
        </div>

        <div>
          <label className={label} htmlFor="review-mood">Mood</label>
          {/* Not proposed. The day's rows say what happened, not how it felt. */}
          <MoodSelector value={mood} onChange={touch(setMood)} />
        </div>

        <div>
          <label className={label}>Entry</label>
          <MarkdownEditor value={body} onChange={touch(setBody)} />
        </div>

        <div>
          <label className={label} htmlFor="review-ahead">Looking ahead</label>
          <input
            id="review-ahead"
            type="text"
            value={lookingAhead}
            onChange={(e) => touch(setLookingAhead)(e.target.value)}
            placeholder="Where to pick up tomorrow"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full sm:w-auto bg-moss-600 hover:bg-moss-700 dark:bg-moss-500 dark:hover:bg-moss-600 text-white font-semibold py-2.5 px-7 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save entry'}
          </button>
          {saveMutation.isError && (
            <span className="text-sm text-red-600 dark:text-red-400">
              Couldn't save — your text is still here. Try again.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
