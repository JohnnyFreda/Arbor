import { useState, KeyboardEvent } from 'react';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ value, onChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 min-h-[42px] focus-within:ring-2 focus-within:ring-moss-500 focus-within:border-moss-500 dark:focus-within:ring-moss-500 dark:focus-within:border-moss-500">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-1 bg-moss-100 dark:bg-moss-900/30 text-moss-800 dark:text-moss-200 rounded-lg text-sm"
        >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-moss-600 dark:hover:text-moss-300 focus:outline-none focus:ring-2 focus:ring-moss-500 rounded"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add tags (press Enter)"
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-gray-900 dark:text-white"
        />
      </div>
  );
}

