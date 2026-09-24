import HomePage from './pages/home.svelte';
import WorkspacePage from './pages/workspace.svelte';
import ContentDetailPage from './pages/content-detail.svelte';
import CreatorDashboardPage from './pages/creator-dashboard.svelte';
import SuperadminPage from './pages/superadmin.svelte';

export const routes = [
  {
    path: '/',
    component: HomePage,
  },
  {
    path: '/workspace/:id',
    component: WorkspacePage,
  },
  {
    path: '/content/:id',
    component: ContentDetailPage,
  },
  {
    path: '/creator',
    component: CreatorDashboardPage,
  },
  {
    path: '/admin',
    component: SuperadminPage,
  },
];
