import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entriesApi } from '../api/entries';
import Markdown from 'react-markdown';

export default function EntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: entry, isLoading } = useQuery({
    queryKey: ['entries', id],
    queryFn: () => entriesApi.getById(parseInt(id!)),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => entriesApi.delete(parseInt(id!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      navigate('/entries');
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 p-8 space-y-4">
          <div className="h-8 w-2/3 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-1/2 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  if (!entry) {
    return <div className="text-center py-8">Entry not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Link
          to="/entries"
          className="text-moss-600 dark:text-moss-400 hover:text-moss-700 dark:hover:text-moss-300 focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded"
        >
          ← Back to entries
        </Link>
        <div className="flex gap-4">
          <Link
            to={`/entries/${id}/edit`}
            className="px-4 py-2 bg-moss-600 hover:bg-moss-700 dark:bg-moss-500 dark:hover:bg-moss-600 text-white rounded-lg transition-colors duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Edit
          </Link>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this entry?')) {
                deleteMutation.mutate();
              }
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 ring-1 ring-gray-200/50 dark:ring-white/5 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
            {entry.title || 'Untitled Entry'}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>{new Date(entry.date).toLocaleDateString()}</span>
            <span>Mood: {entry.mood}/5</span>
            {entry.project && (
              <span className="text-moss-600 dark:text-moss-400">
                {entry.project.name}
              </span>
            )}
          </div>
          {entry.tags.length > 0 && (
            <div className="flex gap-2 mt-2">
              {entry.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {entry.body && (
          <div className="prose dark:prose-invert max-w-none mb-6">
            <Markdown>{entry.body}</Markdown>
          </div>
        )}

        {entry.looking_ahead && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Looking Ahead
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <Markdown>{entry.looking_ahead}</Markdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

