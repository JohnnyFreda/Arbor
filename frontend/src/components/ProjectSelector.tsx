import { Project } from '../api/projects';

interface ProjectSelectorProps {
  projects: Project[];
  value?: number;
  onChange: (value: number | undefined) => void;
}

export default function ProjectSelector({ projects, value, onChange }: ProjectSelectorProps) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : undefined)}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-moss-500 focus:border-moss-500 dark:focus:ring-moss-500 dark:focus:border-moss-500"
    >
      <option value="">No project</option>
      {projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </select>
  );
}

