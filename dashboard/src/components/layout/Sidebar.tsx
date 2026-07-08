import { NavLink } from 'react-router-dom';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
  { name: 'Loans', href: '/loans', icon: '📋' },
  { name: 'Agents', href: '/agents', icon: '👥' },
  { name: 'Analytics', href: '/analytics', icon: '📊' },
];

export function Sidebar() {
  return (
    <aside className="w-20 bg-white border-r border-[#e2e8f0] flex flex-col items-center py-6 shrink-0">
      <div className="w-10 h-10 bg-[#1e52b3] rounded-xl flex items-center justify-center text-white font-bold text-lg mb-8">L</div>
      <nav className="flex-1 flex flex-col space-y-4 w-full">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center justify-center p-3 rounded-xl transition-colors ${
                isActive
                  ? 'bg-[#fcf851] text-black'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-[#1e52b3]'
              }`
            }
            title={item.name}
          >
            <span className="text-xl">{item.icon}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}