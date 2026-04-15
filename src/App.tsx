import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthGuard } from '@/components/AuthGuard';
import { AdminGuard } from '@/components/AdminGuard';
import { FeatureGate } from '@/components/FeatureGate';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { EditorPage } from '@/pages/EditorPage';
import { BlueprintWizardPage } from '@/pages/BlueprintWizardPage';
import { VersionHistoryPage } from '@/pages/VersionHistoryPage';
import { LearnHubPage } from '@/pages/LearnHubPage';
import { BlogPostDetailPage } from '@/pages/BlogPostDetailPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { CreditsPage } from '@/pages/CreditsPage';
import { ShotListPage } from '@/pages/ShotListPage';
import { AgreementListPage } from '@/pages/AgreementListPage';
import { AgreementEditorPage } from '@/pages/AgreementEditorPage';
import { LightingDiagramPage } from '@/pages/LightingDiagramPage';
import { MoodBoardPage } from '@/pages/MoodBoardPage';
import { MoodBoardDetailPage } from '@/pages/MoodBoardDetailPage';
import { PaywallModal } from '@/components/PaywallModal';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminFlagsPage } from '@/pages/admin/AdminFlagsPage';
import { AdminBlogListPage } from '@/pages/admin/AdminBlogListPage';
import { AdminBlogEditorPage } from '@/pages/admin/AdminBlogEditorPage';
import { FeatureGateService } from '@/services/FeatureGateService';
import { useFeatureFlagStore } from '@/stores/featureFlagStore';

const featureGateService = new FeatureGateService();

function App() {
  const flagsLoaded = useFeatureFlagStore((s) => s.loaded);
  const initStarted = useRef(false);

  useEffect(() => {
    if (!initStarted.current) {
      initStarted.current = true;
      featureGateService.initialize();
    }
  }, []);

  if (!flagsLoaded) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <PaywallModal />
      <Routes>
        <Route path="/welcome" element={<LandingPage />} />
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
          <Route path="credits" element={<CreditsPage />} />
          {/* Production tool routes — gated by feature flags */}
          <Route path="shots/:scriptId" element={<FeatureGate feature="shot_lists"><ShotListPage /></FeatureGate>} />
          <Route path="agreements" element={<FeatureGate feature="agreements"><AgreementListPage /></FeatureGate>} />
          <Route path="agreements/:instanceId" element={<FeatureGate feature="agreements"><AgreementEditorPage /></FeatureGate>} />
          <Route path="lighting/:scriptId/:sceneIndex" element={<FeatureGate feature="lighting_diagrams"><LightingDiagramPage /></FeatureGate>} />
          <Route path="moodboard" element={<FeatureGate feature="mood_boards"><MoodBoardPage /></FeatureGate>} />
          <Route path="moodboard/:boardId" element={<FeatureGate feature="mood_boards"><MoodBoardDetailPage /></FeatureGate>} />
          {/* Admin routes — protected by AdminGuard */}
          <Route path="admin" element={<AdminGuard />}>
            <Route element={<AdminSidebar />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="flags" element={<AdminFlagsPage />} />
              <Route path="blog" element={<AdminBlogListPage />} />
              <Route path="blog/new" element={<AdminBlogEditorPage />} />
              <Route path="blog/:postId" element={<AdminBlogEditorPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
