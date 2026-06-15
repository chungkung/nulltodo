import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import TasksPage from '@/pages/TasksPage';
import SchedulePage from '@/pages/SchedulePage';
import ReviewPage from '@/pages/ReviewPage';
import SettingsPage from '@/pages/SettingsPage';
import UserAgreementPage from '@/pages/UserAgreementPage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import SmartScheduler from '@/components/SmartScheduler';
import EnhancedAnalyticsComponent from '@/components/EnhancedAnalytics';
import BackupSync from '@/components/BackupSync';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useTaskStore } from '@/stores/taskStore';

function KeyboardShortcuts() {
  const navigate = useNavigate();
  const fetchTasks = useTaskStore(state => state.fetchTasks);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === '1') navigate('/');
      else if (event.key === '2') navigate('/tasks');
      else if (event.key === '3') navigate('/schedule');
      else if (event.key === '4') navigate('/review');
      else if (event.key === '5') navigate('/settings');
      else if (event.ctrlKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        const input = document.querySelector('input[placeholder*="输入任务"]') as HTMLInputElement;
        if (input) input.focus();
      }
      else if (event.ctrlKey && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        fetchTasks();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, fetchTasks]);

  return null;
}

function AppContent() {
  return (
    <Layout>
      <KeyboardShortcuts />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/agreement/user" element={<UserAgreementPage />} />
        <Route path="/agreement/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/smart-scheduler" element={<SmartScheduler />} />
        <Route path="/enhanced-analytics" element={<EnhancedAnalyticsComponent />} />
        <Route path="/backup-sync" element={<BackupSync />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </ThemeProvider>
  );
}
