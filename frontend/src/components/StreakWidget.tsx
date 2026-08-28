import { useQuery } from '@tanstack/react-query';
import { insightsApi } from '../api/insights';
import Skeleton from './ui/Skeleton';

export default function StreakWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['insights', 'summary'],
    queryFn: insightsApi.getSummary,
  });

  if (isLoading) {
    return (
      <div className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 ring-1 ring-gray-200/50 dark:ring-white/5 p-6 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  return (
    <div className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 ring-1 ring-gray-200/50 dark:ring-white/5 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Streak</h3>
      <div className="text-4xl font-bold text-moss-600 dark:text-moss-400">
        {data?.streak || 0}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">days in a row</p>
    </div>
  );
}

