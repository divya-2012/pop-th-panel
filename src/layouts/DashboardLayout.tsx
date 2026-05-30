import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, ListOrdered, Armchair, LogOut, Users } from 'lucide-react';
import { clearAuth, getUser } from '../store/authStore';

const THEATRE_ADMIN_NAV = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Menu Management', href: '/menu', icon: UtensilsCrossed },
  { name: 'Live Orders', href: '/orders', icon: ListOrdered },
  { name: 'Seats & QR', href: '/seats', icon: Armchair },
  { name: 'Counter Staff', href: '/staff', icon: Users },
];

const COUNTER_STAFF_NAV = [
  { name: 'Live Orders', href: '/orders', icon: ListOrdered },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const user = getUser();
  
  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const navItems = user?.role === 'COUNTER_STAFF' ? COUNTER_STAFF_NAV : THEATRE_ADMIN_NAV;

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 bg-white flex flex-col fixed inset-y-0 z-10">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Popmart</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 uppercase tracking-widest">Theatre</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-3 rounded-lg border border-gray-100 bg-gray-50/50 mb-3">
            <div className="h-8 w-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 min-w-0">
        <main className="p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
