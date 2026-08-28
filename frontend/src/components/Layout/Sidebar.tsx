import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  DocumentTextIcon,
  BoltIcon,
  InboxIcon,
  FolderIcon,
  TagIcon,
  CalendarIcon,
  Bars3Icon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import ArborMark from '../ArborMark';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Capture', href: '/capture', icon: BoltIcon },
  { name: 'Inbox', href: '/inbox', icon: InboxIcon },
  { name: 'Entries', href: '/entries', icon: DocumentTextIcon },
  { name: 'Projects', href: '/projects', icon: FolderIcon },
  { name: 'Tags', href: '/tags', icon: TagIcon },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  return (
    <div
      className={`flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out overflow-hidden ${
        isCollapsed 
          ? 'w-16' 
          : 'w-[191px] sm:w-48 md:w-52 lg:w-56 xl:w-60 2xl:w-64'
      }`}
    >
      <div className="p-4 flex items-center justify-between">
        {/* The wordmark collapses away with the rail; the mark deliberately
            does not, so a collapsed sidebar still has a brand anchor. */}
        <div className="flex items-center min-w-0">
          <ArborMark className="h-7 w-7 flex-shrink-0 text-moss-600 dark:text-moss-400" />
          <h1
          className={`ml-2 text-2xl font-bold text-gray-900 dark:text-white transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
            isCollapsed
              ? 'max-w-0 opacity-0'
              : 'max-w-[200px] opacity-100'
          }`}
        >
            Arbor
          </h1>
        </div>
        <button
          onClick={onToggle}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          aria-label="Toggle sidebar"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      </div>
      <nav className="mt-4 flex-1">
        {navigation.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center ${
                isCollapsed ? 'justify-center px-2' : 'px-4'
              } py-3.5 text-sm font-medium transition-all duration-300 relative border-l-2 ${
                isActive
                  ? 'bg-moss-500/10 dark:bg-moss-500/10 text-moss-600 dark:text-moss-400 border-moss-600'
                  : 'border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon 
                className={`h-5 w-5 flex-shrink-0 transition-all duration-300 ease-in-out ${
                  !isCollapsed ? 'mr-3' : 'mr-0'
                }`} 
              />
              <span
                className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
                  isCollapsed
                    ? 'max-w-0 opacity-0'
                    : 'max-w-[200px] opacity-100'
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
