import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthGuard } from '@/components/AuthGuard';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { EditorPage } from '@/pages/EditorPage';
import { BlueprintWizardPage } from '@/pages/BlueprintWizardPage';
import { VersionHistoryPage } from '@/pages/VersionHistoryPage';
import { LearnHubPage } from '@/pages/LearnHubPage';
import { BlogPostDetailPage } from '@/pages/BlogPostDetailPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { PaywallModal } from '@/components/PaywallModal';

function App() {
  return (
    <BrowserRouter>
      <PaywallModal />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/" element={<AuthGuard />}>
          <Route index element={<DashboardPage />} />
          <Route path="editor/:scriptId" element={<EditorPage />} />
          <Route path="blueprint/new" element={<BlueprintWizardPage />} />
          <Route path="blueprint/:sessionId" element={<BlueprintWizardPage />} />
          <Route path="history/:scriptId" element={<VersionHistoryPage />} />
          <Route path="learn" element={<LearnHubPage />} />
          <Route path="learn/:postId" element={<BlogPostDetailPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
