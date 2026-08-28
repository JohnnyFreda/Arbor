import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsApi, Tag, TagCreate } from '../api/tags';
import Skeleton from '../components/ui/Skeleton';

export default function TagsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const queryClient = useQueryClient();

  const { data: tags, isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: tagsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: TagCreate) => tagsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setIsCreating(false);
      setName('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tagsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ name });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">Tags</h1>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="bg-moss-600 hover:bg-moss-700 dark:bg-moss-500 dark:hover:bg-moss-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          {isCreating ? 'Cancel' : 'New Tag'}
        </button>
      </div>

      {isCreating && (
        <div className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 ring-1 ring-gray-200/50 dark:ring-white/5 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create Tag</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moss-500 focus:border-moss-500 dark:focus:ring-moss-500 dark:focus:border-moss-500"
              />
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-moss-600 hover:bg-moss-700 dark:bg-moss-500 dark:hover:bg-moss-600 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 transition-colors duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>
      ) : tags && tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag: Tag) => (
            <div
              key={tag.id}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow"
            >
              <span className="text-gray-900 dark:text-white">{tag.name}</span>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this tag?')) {
                    deleteMutation.mutate(tag.id);
                  }
                }}
                className="text-red-600 dark:text-red-400 hover:underline"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-2">No tags yet.</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">Tag entries for quick filtering.</p>
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center justify-center px-4 py-2 bg-moss-600 hover:bg-moss-700 dark:bg-moss-500 dark:hover:bg-moss-600 text-white font-medium rounded-lg transition-colors duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Create your first tag
          </button>
        </div>
      )}
    </div>
  );
}

