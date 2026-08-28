import { Link } from 'react-router-dom';
import { Entry } from '../api/entries';

interface EntryCardProps {
  entry: Entry;
}

export default function EntryCard({ entry }: EntryCardProps) {
  return (
    <Link
      to={`/entries/${entry.id}`}
      className="block rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 ring-1 ring-gray-200/50 dark:ring-white/5 p-6 hover:shadow-md hover:border-l-4 hover:border-l-moss-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {entry.title || 'Untitled Entry'}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(entry.date).toLocaleDateString()}
        </span>
      </div>
      
      {entry.body && (
        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
          {entry.body.replace(/[#*`]/g, '').substring(0, 150)}...
        </p>
      )}

      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          Mood: {entry.mood}/5
        </span>
        {entry.project && (
          <span className="text-moss-600 dark:text-moss-400">
            {entry.project.name}
          </span>
        )}
        {entry.tags.length > 0 && (
          <div className="flex gap-2">
            {entry.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

