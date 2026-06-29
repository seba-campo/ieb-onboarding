import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserOnboarding } from './pages/UserOnboarding/UserOnboarding';
import { AdminDashboard } from './pages/AdminDashboard/AdminDashboard';

const queryClient = new QueryClient();

const tabs = [
  { id: 'onboarding', label: 'Simulador de Onboarding' },
  { id: 'dashboard', label: 'Centro de Control' },
] as const;

type TabId = (typeof tabs)[number]['id'];

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('onboarding');

  return (
    <QueryClientProvider client={queryClient}>
      <nav
        style={{
          display: 'flex',
          gap: '0',
          borderBottom: '2px solid #e5e7eb',
          padding: '0 2rem',
          backgroundColor: '#fff',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.85rem 1.5rem',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #0070f3' : '2px solid transparent',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: activeTab === tab.id ? 700 : 400,
              color: activeTab === tab.id ? '#0070f3' : '#6b7280',
              marginBottom: '-2px',
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div style={{ display: activeTab === 'onboarding' ? 'block' : 'none' }}>
        <UserOnboarding />
      </div>
      <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}>
        <AdminDashboard />
      </div>
    </QueryClientProvider>
  );
}

export default App;
