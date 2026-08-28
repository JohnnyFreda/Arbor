import { useQuery } from '@tanstack/react-query';
import ArborMark from './ArborMark';
import { Link } from 'react-router-dom';
import { entriesApi, Entry } from '../api/entries';
import Skeleton from './ui/Skeleton';

export default function RecentEntriesList() {
  const { data: entries, isLoading } = useQuery({
    queryKey: ['entries', { limit: 5 }],
    queryFn: () => entriesApi.getAll(),
  });

  if (isLoading) {
    return (
      <div className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 ring-1 ring-gray-200/50 dark:ring-white/5 p-6 space-y-3">
        <Skeleton className="h-5 w-32" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const recentEntries = entries?.slice(0, 5) || [];

  return (
    <div className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 ring-1 ring-gray-200/50 dark:ring-white/5 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Entries</h3>
      {recentEntries.length === 0 ? (
        <div className="text-center py-8">
          <ArborMark className="h-10 w-10 mx-auto mb-3 text-moss-600/25 dark:text-moss-400/25" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">No entries yet.</p>
          <Link
            to="/entries/new"
            className="inline-flex items-center justify-center px-4 py-2 bg-moss-600 hover:bg-moss-700 dark:bg-moss-500 dark:hover:bg-moss-600 text-white font-medium rounded-lg text-sm transition-colors duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Create your first entry
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {recentEntries.map((entry: Entry) => (
            <Link
              key={entry.id}
              to={`/entries/${entry.id}`}
              className="block p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {entry.title || 'Untitled Entry'}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {new Date(entry.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Mood: {entry.mood}/5
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

