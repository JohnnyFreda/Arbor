import { useNavigate } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

interface GuestNoticeModalProps {
  onDismiss: () => void;
}

const GUEST_EMAIL = 'guest@example.com';

export function isGuestUser(email: string | undefined): boolean {
  return email === GUEST_EMAIL;
}

export default function GuestNoticeModal({ onDismiss }: GuestNoticeModalProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogInOrSignUp = async () => {
    onDismiss();
    await logout();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="rounded-xl shadow-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 ring-1 ring-gray-200/50 dark:ring-white/5 max-w-md w-full">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              You're using a guest account
            </h2>
            <button
              onClick={onDismiss}
              className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded"
              aria-label="Dismiss"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Guest account data is shared across all guest users. Log in or create an account for private data.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={onDismiss}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              Got it
            </button>
            <button
              type="button"
              onClick={handleLogInOrSignUp}
              className="px-4 py-2 bg-moss-600 hover:bg-moss-700 dark:bg-moss-500 dark:hover:bg-moss-600 text-white font-medium rounded-lg text-center transition-colors duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              Log in or sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
