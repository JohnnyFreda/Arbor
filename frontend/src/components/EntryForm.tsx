import { useState } from "react";
import { Entry, EntryCreate, EntryUpdate, Attachment } from "../api/entries";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "../api/projects";
import MoodSelector from "./MoodSelector";
import ProjectSelector from "./ProjectSelector";
import TagInput from "./TagInput";
import MarkdownEditor from "./MarkdownEditor";
import AttachmentsInput from "./AttachmentsInput";

interface EntryFormProps {
  entry?: Entry;
  onSubmit: (data: EntryCreate | EntryUpdate) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export default function EntryForm({
  entry,
  onSubmit,
  onCancel,
  isLoading,
}: EntryFormProps) {
  const [date, setDate] = useState(
    entry?.date || new Date().toISOString().split("T")[0]
  );
  const [title, setTitle] = useState(entry?.title || "");
  const [body, setBody] = useState(entry?.body || "");
  const [lookingAhead, setLookingAhead] = useState(entry?.looking_ahead || "");
  const [mood, setMood] = useState(entry?.mood || 3);
  const [projectId, setProjectId] = useState<number | undefined>(
    entry?.project_id
  );
  const [tags, setTags] = useState<string[]>(
    entry?.tags.map((t) => t.name) || []
  );
  const [attachments, setAttachments] = useState<Attachment[]>(
    entry?.attachments || []
  );

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.getAll,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      date,
      title: title || undefined,
      body: body || undefined,
      looking_ahead: lookingAhead || undefined,
      mood,
      project_id: projectId,
      tags,
      attachments: attachments.length > 0 ? attachments : undefined,
    };
    await onSubmit(data);
  };

  return (
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

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-moss-600 hover:bg-moss-700 dark:bg-moss-500 dark:hover:bg-moss-600 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 transition-colors duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          {isLoading ? "Saving..." : entry ? "Update Entry" : "Create Entry"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
