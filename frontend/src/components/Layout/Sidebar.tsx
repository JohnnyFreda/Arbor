import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  DocumentTextIcon,
  BoltIcon,
  InboxIcon,
  MoonIcon,
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
  { name: 'Review', href: '/review', icon: MoonIcon },
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
      className={`flex flex-col bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out overflow-hidden ${
        isCollapsed 
          ? 'w-16' 
          : 'w-[191px] sm:w-48 md:w-52 lg:w-56 xl:w-60 2xl:w-64'
      }`}
    >
      {/*
        The rail is 64px collapsed, and the mark (28px) plus the toggle (40px)
        need 68px side by side -- so both cannot stay. Stacking them fits, but
        flex-direction is not animatable: the layout snapped to a column
        instantly while the width took 300ms, which is what made collapsing
        feel jumpy.

        So the mark collapses with the wordmark instead, as one lockup, and
        nothing here changes direction. Only width, padding and opacity move,
        and all three animate.

        px-3 collapsed is deliberate: 64px less 24px leaves exactly the 40px
        toggle, so justify-between centres it on the same line as the nav
        icons without a justify change to jump.
      */}
      <div
        className={`flex flex-row items-center justify-between py-4 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'px-3' : 'px-4'
        }`}
      >
        <div className="flex items-center min-w-0">
          <ArborMark
            className={`h-7 flex-shrink-0 text-moss-600 dark:text-moss-400 transition-all duration-300 ease-in-out ${
              isCollapsed ? 'w-0 opacity-0' : 'w-7 opacity-100'
            }`}
          />
          <h1
          className={`text-2xl font-bold text-gray-900 dark:text-white transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
            isCollapsed
              // The margin collapses with the word. Left in, it shifts the mark
              // off the centre line the nav icons below it sit on.
              ? 'ml-0 max-w-0 opacity-0'
              : 'ml-2 max-w-[200px] opacity-100'
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

      {/*
        The brand anchor for the collapsed rail. It lives at the bottom rather
        than beside the toggle because 64px cannot hold both, and the header is
        what has to stay still for the collapse to feel smooth.

        Only shown collapsed -- expanded, the wordmark at the top is already
        doing this job. Sitting after `flex-1` on the nav it is pinned to the
        bottom, so growing and fading it moves nothing above it, and both
        properties animate on the same curve as the rail.
      */}
      <div
        className={`flex items-center justify-center overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? 'h-14 opacity-100' : 'h-0 opacity-0'
        }`}
        aria-hidden="true"
      >
        <ArborMark className="h-7 w-7 flex-shrink-0 text-moss-600/70 dark:text-moss-400/70" />
      </div>
    </div>
  );
}
