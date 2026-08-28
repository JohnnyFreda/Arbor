import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowPathIcon, SparklesIcon } from '@heroicons/react/24/outline';
import {
  capturesApi,
  Capture,
  InterpretationType,
} from '../api/captures';
import { interpretationsApi, InterpretationDecision } from '../api/interpretations';
import { Project } from '../api/projects';
import { TYPE_STYLES } from '../lib/badgeStyles';

const TYPES: InterpretationType[] = ['task', 'blocker', 'idea', 'note', 'thought'];

/** Types that become a Task when accepted. See ADR-006. */
const ACTIONABLE: InterpretationType[] = ['task', 'blocker'];

const inputClass =
  'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moss-500 focus:border-moss-500';

const fieldLabel =
  'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';

interface InboxCardProps {
  capture: Capture;
  projects: Project[];
  onResolved: (message: string) => void;
}

export default function InboxCard({ capture, projects, onResolved }: InboxCardProps) {
  const queryClient = useQueryClient();
  const interpretation = capture.interpretation;

  const [editing, setEditing] = useState(false);
  const [type, setType] = useState<InterpretationType>(interpretation?.type ?? 'note');
  const [title, setTitle] = useState(interpretation?.suggested_title ?? '');
  const [projectId, setProjectId] = useState<number | undefined>(
    interpretation?.suggested_project_id
  );
  const [priority, setPriority] = useState(interpretation?.suggested_priority ?? '');
  const [nextAction, setNextAction] = useState(
    interpretation?.suggested_next_action ?? ''
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['captures'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const decideMutation = useMutation({
    mutationFn: (decision: InterpretationDecision) =>
      interpretationsApi.decide(interpretation!.id, decision),
    onSuccess: (result) => {
      invalidate();
      setEditing(false);
      if (result.status === 'dismissed') {
        onResolved('Dismissed');
      } else if (ACTIONABLE.includes(result.type)) {
        onResolved(`Accepted — added to ${result.type === 'blocker' ? 'blockers' : 'tasks'}`);
      } else {
        onResolved(`Accepted as ${result.type}`);
      }
    },
  });

  const interpretMutation = useMutation({
    mutationFn: () => capturesApi.reinterpret(capture.id),
    onSuccess: () => invalidate(),
  });

  const busy = decideMutation.isPending || interpretMutation.isPending;

  const saveEdits = () => {
    decideMutation.mutate({
      status: 'edited',
      type,
      suggested_title: title.trim(),
      // 0 clears the association -- the API treats it the way entries do.
      suggested_project_id: projectId ?? 0,
      suggested_priority: priority,
      suggested_next_action: nextAction.trim(),
    });
  };

  return (
    <li className="px-6 py-5 space-y-4">
      {/* The raw capture is the record. The proposal below it is a suggestion. */}
      <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
        {capture.content}
      </p>

      {!interpretation ? (
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {capture.processing_status === 'failed'
              ? "Couldn't interpret this one."
              : 'Not interpreted yet.'}
          </span>
          <button
            type="button"
            onClick={() => interpretMutation.mutate()}
            disabled={busy}
            className="inline-flex items-center gap-1 text-xs text-moss-600 dark:text-moss-400 hover:underline disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-moss-500 rounded"
          >
            <ArrowPathIcon className="h-3 w-3" />
            {interpretMutation.isPending ? 'Interpreting…' : 'Interpret'}
          </button>
        </div>
      ) : editing ? (
        <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={fieldLabel} htmlFor={`type-${capture.id}`}>Type</label>
              <select
                id={`type-${capture.id}`}
                value={type}
                onChange={(e) => setType(e.target.value as InterpretationType)}
                className={inputClass}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={fieldLabel} htmlFor={`project-${capture.id}`}>Project</label>
              <select
                id={`project-${capture.id}`}
                value={projectId ?? ''}
                onChange={(e) =>
                  setProjectId(e.target.value ? Number(e.target.value) : undefined)
                }
                className={inputClass}
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={fieldLabel} htmlFor={`title-${capture.id}`}>Title</label>
            <input
              id={`title-${capture.id}`}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="In your own words"
              className={inputClass}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={fieldLabel} htmlFor={`priority-${capture.id}`}>Priority</label>
              <select
                id={`priority-${capture.id}`}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={inputClass}
              >
                <option value="">None</option>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </div>
            <div>
              <label className={fieldLabel} htmlFor={`next-${capture.id}`}>Next action</label>
              <input
                id={`next-${capture.id}`}
                type="text"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="Optional"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={saveEdits}
              disabled={busy}
              className="bg-moss-600 hover:bg-moss-700 dark:bg-moss-500 dark:hover:bg-moss-600 text-white text-sm font-medium py-1.5 px-4 rounded-lg disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              {decideMutation.isPending ? 'Saving…' : 'Save & accept'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={busy}
              className="text-sm text-gray-600 dark:text-gray-400 hover:underline py-1.5 px-2 rounded focus:outline-none focus:ring-2 focus:ring-moss-500"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <SparklesIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_STYLES[interpretation.type]}`}>
              {interpretation.type}
            </span>
            {interpretation.suggested_title && (
              <span className="text-sm text-gray-700 dark:text-gray-200">
                {interpretation.suggested_title}
              </span>
            )}
            {interpretation.suggested_project_id != null && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                · {projects.find((p) => p.id === interpretation.suggested_project_id)?.name ?? 'Unknown project'}
              </span>
            )}
            {interpretation.suggested_priority && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                · {interpretation.suggested_priority}
              </span>
            )}
            {interpretation.confidence != null && (
              <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                · {Math.round(interpretation.confidence * 100)}%
              </span>
            )}
          </div>

          {interpretation.suggested_next_action && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Next: {interpretation.suggested_next_action}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => decideMutation.mutate({ status: 'accepted' })}
              disabled={busy}
              className="bg-moss-600 hover:bg-moss-700 dark:bg-moss-500 dark:hover:bg-moss-600 text-white text-sm font-medium py-1.5 px-4 rounded-lg disabled:opacity-50 transition-colors active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              {decideMutation.isPending ? 'Saving…' : 'Accept'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={busy}
              className="text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 py-1.5 px-4 rounded-lg disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-moss-500"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => decideMutation.mutate({ status: 'dismissed' })}
              disabled={busy}
              className="text-sm text-gray-500 dark:text-gray-400 hover:underline py-1.5 px-2 rounded disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-moss-500"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {decideMutation.isError && (
        <p className="text-xs text-red-600 dark:text-red-400">
          Couldn't save that — nothing changed. Try again.
        </p>
      )}
    </li>
  );
}
