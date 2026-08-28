import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CapturePage from './pages/CapturePage';
import InboxPage from './pages/InboxPage';
import EntriesPage from './pages/EntriesPage';
import EntryDetailPage from './pages/EntryDetailPage';
import EntryEditPage from './pages/EntryEditPage';
import EntryCreatePage from './pages/EntryCreatePage';
import ProjectsPage from './pages/ProjectsPage';
import TagsPage from './pages/TagsPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';
import Layout from './components/Layout/Layout';
import LookingAheadReminder from './components/LookingAheadReminder';
import GuestNoticeModal, { isGuestUser } from './components/GuestNoticeModal';
import Skeleton from './components/ui/Skeleton';

const GUEST_NOTICE_SESSION_KEY = 'guestNoticeDismissed';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const [showReminder, setShowReminder] = useState(false);
  const [showGuestNotice, setShowGuestNotice] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Check if reminder was already dismissed today
    const today = new Date().toISOString().split('T')[0];
    const dismissedDate = localStorage.getItem('lookingAheadReminderDismissed');

    // Show reminder if it hasn't been dismissed today
    if (dismissedDate !== today) {
      setShowReminder(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }
    if (!isGuestUser(user.email)) {
      return;
    }
    const dismissed = sessionStorage.getItem(GUEST_NOTICE_SESSION_KEY);
    if (!dismissed) {
      setShowGuestNotice(true);
    }
  }, [isAuthenticated, user]);

  const handleDismissReminder = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('lookingAheadReminderDismissed', today);
    setShowReminder(false);
  };

  const handleDismissGuestNotice = () => {
    sessionStorage.setItem(GUEST_NOTICE_SESSION_KEY, '1');
    setShowGuestNotice(false);
  };

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/capture" element={<CapturePage />} />
                  <Route path="/inbox" element={<InboxPage />} />
                  <Route path="/entries" element={<EntriesPage />} />
                  <Route path="/entries/new" element={<EntryCreatePage />} />
                  <Route path="/entries/:id" element={<EntryDetailPage />} />
                  <Route path="/entries/:id/edit" element={<EntryEditPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/tags" element={<TagsPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
      {/*
        At most one modal at a time. Both used to mount together, stacking two
        full-screen overlays -- the top one swallowed pointer events for the
        whole page, so the first screen a visitor saw could not be clicked
        through until both were dismissed.

        The guest notice goes first: it explains that the account is shared,
        which matters before anything else a visitor does. Dismissing it hands
        the screen to the reminder, so both are still seen -- in sequence
        rather than piled up.
      */}
      {showGuestNotice ? (
        <GuestNoticeModal onDismiss={handleDismissGuestNotice} />
      ) : (
        showReminder && isAuthenticated && (
          <LookingAheadReminder onDismiss={handleDismissReminder} />
        )
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

