import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { entriesApi, EntryCreate, Attachment } from '../api/entries';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projects';
import MoodSelector from './MoodSelector';
import ProjectSelector from './ProjectSelector';
import TagInput from './TagInput';
import MarkdownEditor from './MarkdownEditor';
import AttachmentsInput from './AttachmentsInput';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface QuickEntryFormProps {
  onClose?: () => void;
}

export default function QuickEntryForm({ onClose }: QuickEntryFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [lookingAhead, setLookingAhead] = useState('');
  const [mood, setMood] = useState(3);
  const [projectId, setProjectId] = useState<number | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const queryClient = useQueryClient();

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: EntryCreate) => entriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      setTitle('');
      setBody('');
      setLookingAhead('');
      setMood(3);
      setProjectId(undefined);
      setTags([]);
      setAttachments([]);
      if (onClose) {
        onClose();
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      date,
      title: title || undefined,
      body: body || undefined,
      looking_ahead: lookingAhead || undefined,
      mood,
      project_id: projectId,
      tags,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
  };

  return (
    <div className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 ring-1 ring-gray-200/50 dark:ring-white/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Entry</h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moss-500 focus:border-moss-500 dark:focus:ring-moss-500 dark:focus:border-moss-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Entry title"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moss-500 focus:border-moss-500 dark:focus:ring-moss-500 dark:focus:border-moss-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Mood
        </label>
        <MoodSelector value={mood} onChange={setMood} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Body (Markdown)
        </label>
        <MarkdownEditor value={body} onChange={setBody} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Looking Ahead
        </label>
        <input
          type="text"
          value={lookingAhead}
          onChange={(e) => setLookingAhead(e.target.value)}
          placeholder="let's tackle this tomorrow"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moss-500 focus:border-moss-500 dark:focus:ring-moss-500 dark:focus:border-moss-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Project
        </label>
        <ProjectSelector
          projects={projects || []}
          value={projectId}
          onChange={setProjectId}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tags
        </label>
        <TagInput value={tags} onChange={setTags} />
      </div>

      <div>
        <AttachmentsInput value={attachments} onChange={setAttachments} />
      </div>

      <button
        type="submit"
        disabled={createMutation.isPending}
        className="w-full bg-moss-600 hover:bg-moss-700 dark:bg-moss-500 dark:hover:bg-moss-600 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 transition-colors duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        {createMutation.isPending ? 'Saving...' : 'Save Entry'}
      </button>
      </form>
    </div>
  );
}

