import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { entriesApi, Entry, EntryFilters } from '../api/entries';
import { projectsApi } from '../api/projects';
import { tagsApi } from '../api/tags';
import EntryCard from '../components/EntryCard';
import { EntryCardSkeleton } from '../components/ui/Skeleton';

export default function EntriesPage() {
  const [filters, setFilters] = useState<EntryFilters>({});
  const [search, setSearch] = useState('');

  const { data: entries, isLoading } = useQuery({
    queryKey: ['entries', filters],
    queryFn: () => entriesApi.getAll(filters),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  });

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: tagsApi.getAll,
  });

  const handleSearch = () => {
    setFilters({ ...filters, search });
  };

  const handleProjectFilter = (projectId: number | undefined) => {
    setFilters({ ...filters, project_id: projectId });
  };

  const handleTagFilter = (tag: string | undefined) => {
    setFilters({ ...filters, tag });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">Entries</h1>
        <Link
          to="/entries/new"
          className="bg-moss-600 hover:bg-moss-700 dark:bg-moss-500 dark:hover:bg-moss-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          New Entry
        </Link>
      </div>

      <div className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 ring-1 ring-gray-200/50 dark:ring-white/5 p-6 space-y-4">
        <div className="flex gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search entries..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moss-500 focus:border-moss-500 dark:focus:ring-moss-500 dark:focus:border-moss-500"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-moss-600 hover:bg-moss-700 dark:bg-moss-500 dark:hover:bg-moss-600 text-white rounded-lg transition-colors duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Search
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Project
            </label>
            <select
              value={filters.project_id || ''}
              onChange={(e) => handleProjectFilter(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moss-500 focus:border-moss-500 dark:focus:ring-moss-500 dark:focus:border-moss-500"
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
              value={filters.tag || ''}
              onChange={(e) => handleTagFilter(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moss-500 focus:border-moss-500 dark:focus:ring-moss-500 dark:focus:border-moss-500"
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
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <EntryCardSkeleton key={i} />
          ))}
        </div>
      ) : entries && entries.length > 0 ? (
        <div className="space-y-4">
          {entries.map((entry: Entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-2">No entries found.</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">Start logging your progress.</p>
          <Link
            to="/entries/new"
            className="inline-flex items-center justify-center px-4 py-2 bg-moss-600 hover:bg-moss-700 dark:bg-moss-500 dark:hover:bg-moss-600 text-white font-medium rounded-lg transition-colors duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Create your first entry
          </Link>
        </div>
      )}
    </div>
  );
}

