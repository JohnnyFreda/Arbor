import { useState } from 'react';
import { Attachment } from '../api/entries';
import { LinkIcon, DocumentIcon, BookOpenIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface AttachmentsInputProps {
  value: Attachment[];
  onChange: (attachments: Attachment[]) => void;
}

export default function AttachmentsInput({ value, onChange }: AttachmentsInputProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAttachment, setNewAttachment] = useState({
    type: 'link' as Attachment['type'],
    title: '',
    url: '',
    description: '',
  });

  const getTypeIcon = (type: Attachment['type']) => {
    switch (type) {
      case 'link':
        return <LinkIcon className="h-4 w-4" />;
      case 'document':
        return <DocumentIcon className="h-4 w-4" />;
      case 'reference':
        return <BookOpenIcon className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: Attachment['type']) => {
    switch (type) {
      case 'link':
        return 'Link';
      case 'document':
        return 'Document';
      case 'reference':
        return 'Reference';
    }
  };

  const handleAdd = () => {
    if (!newAttachment.url.trim()) return;
    
    const attachment: Attachment = {
      type: newAttachment.type,
      title: newAttachment.title.trim() || newAttachment.url,
      url: newAttachment.url.trim(),
      description: newAttachment.description.trim() || undefined,
    };
    
    onChange([...value, attachment]);
    setNewAttachment({ type: 'link', title: '', url: '', description: '' });
    setShowAddForm(false);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Resources
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Paste images, videos, documents, or links for future reference
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 text-sm text-moss-600 dark:text-moss-400 hover:text-moss-700 dark:hover:text-moss-300 focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded"
        >
          <PlusIcon className="h-4 w-4" />
          Add
        </button>
      </div>

      {showAddForm && (
        <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              value={newAttachment.type}
              onChange={(e) => setNewAttachment({ ...newAttachment, type: e.target.value as Attachment['type'] })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moss-500 focus:border-moss-500"
            >
              <option value="link">Link</option>
              <option value="document">Document</option>
              <option value="reference">Reference</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={newAttachment.url}
              onChange={(e) => setNewAttachment({ ...newAttachment, url: e.target.value })}
              placeholder="https://example.com"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moss-500 focus:border-moss-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title (optional)
            </label>
            <input
              type="text"
              value={newAttachment.title}
              onChange={(e) => setNewAttachment({ ...newAttachment, title: e.target.value })}
              placeholder="Display name"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moss-500 focus:border-moss-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              value={newAttachment.description}
              onChange={(e) => setNewAttachment({ ...newAttachment, description: e.target.value })}
              placeholder="Brief description"
              rows={2}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moss-500 focus:border-moss-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newAttachment.url.trim()}
              className="flex-1 px-3 py-1.5 text-sm bg-moss-600 hover:bg-moss-700 dark:bg-moss-500 dark:hover:bg-moss-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              Add Resource
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewAttachment({ type: 'link', title: '', url: '', description: '' });
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((attachment, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            >
              <div className="flex-shrink-0 mt-0.5 text-gray-500 dark:text-gray-400">
                {getTypeIcon(attachment.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                        {getTypeLabel(attachment.type)}
                      </span>
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-moss-600 dark:text-moss-400 hover:underline truncate"
                      >
                        {attachment.title}
                      </a>
                    </div>
                    {attachment.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {attachment.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">
                      {attachment.url}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



