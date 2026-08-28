import { useState } from 'react';
import ArborMark from '../components/ArborMark';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { projectsApi, Project, ProjectCreate } from '../api/projects';
import { entriesApi, Entry } from '../api/entries';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import Skeleton from '../components/ui/Skeleton';

export default function ProjectsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: ProjectCreate) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsCreating(false);
      setName('');
      setDescription('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  // Fetch entries for the expanded project
  const { data: projectEntries } = useQuery({
    queryKey: ['entries', 'project', expandedProjectId],
    queryFn: () => entriesApi.getAll({ project_id: expandedProjectId! }),
    enabled: expandedProjectId !== null,
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ name, description: description || undefined });
  };

  const toggleProject = (projectId: number) => {
    setExpandedProjectId(expandedProjectId === projectId ? null : projectId);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">Projects</h1>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="bg-moss-600 hover:bg-moss-700 dark:bg-moss-500 dark:hover:bg-moss-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          {isCreating ? 'Cancel' : 'New Project'}
        </button>
      </div>

      {isCreating && (
        <div className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 ring-1 ring-gray-200/50 dark:ring-white/5 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create Project</h2>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 p-6 space-y-3">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project: Project) => {
            const isExpanded = expandedProjectId === project.id;
            const entries = isExpanded ? projectEntries : undefined;
            
            return (
              <div
                key={project.id}
                className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 ring-1 ring-gray-200/50 dark:ring-white/5 overflow-hidden"
              >
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => toggleProject(project.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex-1">
                      {project.name}
                    </h3>
                    {isExpanded ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2" />
                    )}
                  </div>
                  {project.description && (
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{project.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {isExpanded && entries ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}` : 'Click to view entries'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this project?')) {
                          deleteMutation.mutate(project.id);
                        }
                      }}
                      className="text-red-600 dark:text-red-400 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
                    {entries && entries.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {entries.map((entry: Entry) => (
                          <Link
                            key={entry.id}
                            to={`/entries/${entry.id}`}
                            className="block p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-moss-500 dark:hover:border-moss-400 transition-colors focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                {entry.title || 'Untitled Entry'}
                              </h4>
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                {new Date(entry.date).toLocaleDateString()}
                              </span>
                            </div>
                            {entry.body && (
                              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-1">
                                {entry.body.replace(/[#*`]/g, '').substring(0, 100)}
                                {entry.body.length > 100 ? '...' : ''}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              {entry.mood && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Mood: {entry.mood}/5
                                </span>
                              )}
                              {entry.tags && entry.tags.length > 0 && (
                                <div className="flex gap-1 flex-wrap">
                                  {entry.tags.slice(0, 2).map((tag) => (
                                    <span
                                      key={tag.id}
                                      className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs"
                                    >
                                      {tag.name}
                                    </span>
                                  ))}
                                  {entry.tags.length > 2 && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      +{entry.tags.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">No entries for this project yet.</p>
                        <Link
                          to="/entries/new"
                          className="inline-flex items-center justify-center px-3 py-1.5 bg-moss-600 hover:bg-moss-700 dark:bg-moss-500 dark:hover:bg-moss-600 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Add entry
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <ArborMark className="h-10 w-10 mx-auto mb-3 text-moss-600/25 dark:text-moss-400/25" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">No projects yet.</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">Group entries by project.</p>
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center justify-center px-4 py-2 bg-moss-600 hover:bg-moss-700 dark:bg-moss-500 dark:hover:bg-moss-600 text-white font-medium rounded-lg transition-colors duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Create your first project
          </button>
        </div>
      )}
    </div>
  );
}

