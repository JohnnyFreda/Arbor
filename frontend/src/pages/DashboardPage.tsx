import { useState } from 'react';
import QuickEntryForm from '../components/QuickEntryForm';
import StreakWidget from '../components/StreakWidget';
import RecentEntriesList from '../components/RecentEntriesList';
import MoodChart from '../components/MoodChart';
import SmallCalendar from '../components/SmallCalendar';
import CaptureBox from '../components/CaptureBox';
import TodayWork from '../components/TodayWork';
import InboxSummary from '../components/InboxSummary';

const TODAY_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
};

export default function DashboardPage() {
  const [isEntryFormExpanded, setIsEntryFormExpanded] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">
            Today
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {new Date().toLocaleDateString(undefined, TODAY_FORMAT)}
          </p>
        </div>
        {!isEntryFormExpanded && (
          <button
            onClick={() => setIsEntryFormExpanded(true)}
            className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            New Entry
          </button>
        )}
      </div>

      {/*
        Left column starts work, right column reflects on it. Capture sits at
        the very top because a thought that arrives while you are reading the
        dashboard should cost nothing to record.
      */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <CaptureBox />
          {isEntryFormExpanded && (
            <QuickEntryForm onClose={() => setIsEntryFormExpanded(false)} />
          )}
          <TodayWork />
          <MoodChart />
        </div>
        <div className="space-y-6">
          <InboxSummary />
          <StreakWidget />
          <SmallCalendar />
          <RecentEntriesList />
        </div>
      </div>
    </div>
  );
}
