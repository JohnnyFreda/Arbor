import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { calendarApi, CalendarDay } from '../api/calendar';

export default function SmallCalendar() {
  const [currentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: calendarData } = useQuery({
    queryKey: ['calendar', year, month],
    queryFn: () => calendarApi.getMonth(year, month),
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  return (
    <div className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 ring-1 ring-gray-200/50 dark:ring-white/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {monthNames[month - 1]} {year}
        </h3>
        <Link
          to="/calendar"
          className="text-sm text-moss-600 dark:text-moss-400 hover:text-moss-700 dark:hover:text-moss-300 transition-colors focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded"
        >
          View Full
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-1"
          >
            {day}
          </div>
        ))}
        {days.map((day, index) => (
          <div
            key={index}
            className={`aspect-square p-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg ${
              day ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''
            } ${day && isToday(day.date) ? 'ring-2 ring-moss-500' : ''} ${day ? getMoodColor(day.average_mood) : ''}`}
            title={day ? `${day.date}: ${day.entry_count} ${day.entry_count === 1 ? 'entry' : 'entries'}` : ''}
          >
            {day && (
              <div className="flex flex-col items-center justify-center h-full">
                <div className={`text-xs font-medium ${
                  isToday(day.date) 
                    ? 'text-moss-600 dark:text-moss-400 font-bold' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {new Date(day.date).getDate()}
                </div>
                {day.entry_count > 0 && (
                  <div className="w-1 h-1 rounded-full bg-moss-500 mt-0.5" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


