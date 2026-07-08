import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { Loans } from './pages/Loans';
import { Agents } from './pages/Agents';
import { Settings } from './pages/Settings';
import { useStore } from './store/useStore';
import { Toaster } from 'sonner';

function Layout() {
  const { isSidebarOpen, toggleSidebar } = useStore();

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:pl-64' : 'lg:pl-20'} flex flex-col`}>
        <Header onMenuClick={toggleSidebar} />
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'bg-card border-border text-card-foreground',
          duration: 4000,
        }}
      />
    </div>
  );
}

export default function App() {
  return <Layout />;
}