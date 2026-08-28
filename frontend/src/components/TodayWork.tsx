import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Skeleton from './ui/Skeleton';
import { tasksApi, Task } from '../api/tasks';
import { projectsApi } from '../api/projects';

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

function TaskRow({
  task,
  projectName,
}: {
  task: Task;
  projectName?: string;
}) {
  const queryClient = useQueryClient();

  const completeMutation = useMutation({
    mutationFn: () => tasksApi.update(task.id, { status: 'done' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  return (
    <li className="flex items-start gap-3 py-2.5">
      <input
        type="checkbox"
        checked={false}
        disabled={completeMutation.isPending}
        onChange={() => completeMutation.mutate()}
        aria-label={`Mark "${task.title}" done`}
        className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-gray-300 dark:border-gray-600 text-moss-600 focus:ring-2 focus:ring-moss-500 disabled:opacity-50 cursor-pointer"
      />
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm text-gray-900 dark:text-gray-100 break-words ${
            completeMutation.isPending ? 'line-through opacity-50' : ''
          }`}
        >
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
          {projectName && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {projectName}
            </span>
          )}
          {task.priority && (
            <span
              className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
                PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.low
              }`}
            >
              {task.priority}
            </span>
          )}
          {task.notes && (
            <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
              {task.notes}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

export default function TodayWork() {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getAll({ status: 'open', limit: 100 }),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  });

  const nameFor = (id?: number) =>
    id != null ? projects?.find((p) => p.id === id)?.name : undefined;

  const blockers = tasks?.filter((t) => t.type === 'blocker') ?? [];
  const open = tasks?.filter((t) => t.type === 'task') ?? [];

  if (isLoading) {
    return (
      <div className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 ring-1 ring-gray-200/50 dark:ring-white/5 p-6 space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Blockers first. They are the reason work is not moving. */}
      {blockers.length > 0 && (
        <div data-testid="blocked" className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-red-200 dark:border-red-500/25 ring-1 ring-red-100/60 dark:ring-red-500/10 p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-300 mb-1">
            <ExclamationTriangleIcon className="h-4 w-4" />
            Blocked
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Work that isn't moving until something else does.
          </p>
          <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {blockers.map((task) => (
              <TaskRow key={task.id} task={task} projectName={nameFor(task.project_id)} />
            ))}
          </ul>
        </div>
      )}

      <div data-testid="open-work" className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 ring-1 ring-gray-200/50 dark:ring-white/5 p-6">
        <div className="flex items-baseline justify-between gap-4 mb-2">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Open work
          </h2>
          {open.length > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
              {open.length}
            </span>
          )}
        </div>

        {open.length === 0 ? (
          <p className="py-4 text-sm text-gray-500 dark:text-gray-400">
            Nothing open.{' '}
            <Link
              to="/inbox"
              className="text-moss-600 dark:text-moss-400 hover:underline focus:outline-none focus:ring-2 focus:ring-moss-500 rounded"
            >
              Sort the inbox
            </Link>{' '}
            to turn captures into work.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {open.map((task) => (
              <TaskRow key={task.id} task={task} projectName={nameFor(task.project_id)} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
