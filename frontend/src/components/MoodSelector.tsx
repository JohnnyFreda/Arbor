interface MoodSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export default function MoodSelector({ value, onChange }: MoodSelectorProps) {
  const moods = [
    { value: 1, label: '😞', description: 'Poor' },
    { value: 2, label: '😐', description: 'Fair' },
    { value: 3, label: '🙂', description: 'Good' },
    { value: 4, label: '😊', description: 'Great' },
    { value: 5, label: '🤩', description: 'Excellent' },
  ];

  return (
    <div className="flex gap-2">
      {moods.map((mood) => (
        <button
          key={mood.value}
          type="button"
          onClick={() => onChange(mood.value)}
          className={`flex-1 py-2 px-3 rounded-lg border-2 transition duration-200 focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
            value === mood.value
              ? 'border-moss-600 dark:border-moss-400 bg-moss-50 dark:bg-moss-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          title={mood.description}
        >
          <span className="text-2xl">{mood.label}</span>
        </button>
      ))}
    </div>
  );
}

