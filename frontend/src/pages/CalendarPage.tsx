import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { calendarApi, CalendarDay } from '../api/calendar';
import { entriesApi } from '../api/entries';
import { projectsApi } from '../api/projects';
import { tagsApi } from '../api/tags';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | undefined>();
  const [selectedTag, setSelectedTag] = useState<string | undefined>();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: calendarData } = useQuery({
    queryKey: ['calendar', year, month, selectedProject, selectedTag],
    queryFn: () => calendarApi.getMonth(year, month, {
      project_id: selectedProject,
      tag: selectedTag,
    }),
  });

  const { data: dayEntries } = useQuery({
    queryKey: ['entries', selectedDate],
    queryFn: () => {
      if (!selectedDate) return [];
      return entriesApi.getAll({
        date_from: selectedDate,
        date_to: selectedDate,
      });
    },
    enabled: !!selectedDate,
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  });

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: tagsApi.getAll,
  });

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get first day of month and number of days
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  // Create calendar grid
  const days: (CalendarDay | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const dayData = calendarData?.days?.find((d: CalendarDay) => d.date === dateStr);
    days.push(dayData || {
      date: dateStr,
      entry_count: 0,
      average_mood: undefined,
    });
  }

  const getMoodColor = (mood?: number) => {
    if (!mood) return 'bg-gray-100 dark:bg-gray-700';
    if (mood <= 2) return 'bg-red-100 dark:bg-red-900';
    if (mood <= 3) return 'bg-yellow-100 dark:bg-yellow-900';
    return 'bg-green-100 dark:bg-green-900';
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">Calendar</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <button
              onClick={goToPreviousMonth}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {monthNames[month - 1]} {year}
            </h2>
            <button
              onClick={goToNextMonth}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-moss-600 hover:bg-moss-700 dark:bg-moss-500 dark:hover:bg-moss-600 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              Today
            </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Project
            </label>
            <select
              value={selectedProject || ''}
              onChange={(e) => setSelectedProject(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All projects</option>
              {projects?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Tag
            </label>
            <select
              value={selectedTag || ''}
              onChange={(e) => setSelectedTag(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All tags</option>
              {tags?.map((tag) => (
                <option key={tag.id} value={tag.name}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center font-semibold text-gray-700 dark:text-gray-300 py-2"
            >
              {day}
            </div>
          ))}
          {days.map((day, index) => (
            <div
              key={index}
              className={`min-h-[80px] p-2 border border-gray-200 dark:border-gray-700 rounded ${
                day ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''
              } ${day && selectedDate === day.date ? 'ring-2 ring-blue-500' : ''} ${day ? getMoodColor(day.average_mood) : ''}`}
              onClick={() => day && setSelectedDate(day.date)}
            >
              {day && (
                <>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(day.date).getDate()}
                  </div>
                  {day.entry_count > 0 && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {day.entry_count} {day.entry_count === 1 ? 'entry' : 'entries'}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedDate && (
        <div className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 ring-1 ring-gray-200/50 dark:ring-white/5 p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Entries for {new Date(selectedDate).toLocaleDateString()}
          </h3>
          {dayEntries && dayEntries.length > 0 ? (
            <div className="space-y-2">
              {dayEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded"
                >
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {entry.title || 'Untitled Entry'}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Mood: {entry.mood}/5
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No entries for this date.</p>
              <Link
                to="/entries/new"
                className="inline-flex items-center justify-center px-4 py-2 bg-moss-600 hover:bg-moss-700 dark:bg-moss-500 dark:hover:bg-moss-600 text-white font-medium rounded-lg text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                Add entry
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

