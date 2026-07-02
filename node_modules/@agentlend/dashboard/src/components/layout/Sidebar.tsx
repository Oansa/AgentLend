import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ChevronLeft, LayoutDashboard, FileText, Users, BarChart3, Settings, Globe, Shield, Wallet } from 'lucide-react';
import { useStore } from '../../store/useStore';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Loans', href: '/loans', icon: FileText },
  { name: 'Agents', href: '/agents', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { isSidebarOpen, toggleSidebar } = useStore();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 bg-card border-r ${
        isSidebarOpen ? 'w-64' : 'w-20'
      } lg:relative lg:translate-x-0`}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <span className={`font-bold text-xl transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
            AgentLend
          </span>
        </div>
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-md hover:bg-accent"
          aria-label="Toggle sidebar"
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`
              }
              title={isSidebarOpen ? undefined : item.name}
            >
              <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              {isSidebarOpen && <span className="font-medium whitespace-nowrap">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <span className={`font-medium transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
            Testnet
          </span>
        </div>
      </div>
    </aside>
  );
}