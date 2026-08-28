import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { insightsApi } from '../api/insights';
import { useTheme } from '../context/ThemeContext';

// Recharts styles SVG via props, so these cannot be Tailwind classes.
// Keep them in step with the moss scale in tailwind.config.js.
// moss-600 reads on a white card (3.05:1 -- above the 3:1 a graphic needs);
// on the gray-800 dark card it only just clears, so dark mode uses moss-400
// instead, which measures 5.51:1.
const LINE_LIGHT = '#4d7c5f'; // moss-600
const LINE_DARK = '#7fa88c';  // moss-400

export default function MoodChart() {
  const { theme } = useTheme();
  const { data, isLoading } = useQuery({
    queryKey: ['insights', 'mood-trend', 30],
    queryFn: () => insightsApi.getMoodTrend(30),
  });

  if (isLoading) {
    return (
      <div className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 ring-1 ring-gray-200/50 dark:ring-white/5 p-6 space-y-4">
        <div className="h-6 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="h-[300px] w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 ring-1 ring-gray-200/50 dark:ring-white/5 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Mood Trend (30 days)</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">No data available yet. Add entries with mood to see your trend.</p>
        <Link
          to="/entries/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-moss-600 hover:bg-moss-700 dark:bg-moss-500 dark:hover:bg-moss-600 text-white font-medium rounded-lg text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          Create entry
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 ring-1 ring-gray-200/50 dark:ring-white/5 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Mood Trend (30 days)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis domain={[1, 5]} />
          <Tooltip
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
            formatter={(value: number) => [value?.toFixed(1), 'Mood']}
          />
          <Line
            type="monotone"
            dataKey="average_mood"
            stroke={theme === 'dark' ? LINE_DARK : LINE_LIGHT}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

