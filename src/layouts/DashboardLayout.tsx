import { ReactNode, useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, ListOrdered, Armchair, LogOut, Users, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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
  
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('theatreSidebarOpen');
    return saved !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('theatreSidebarOpen', String(isOpen));
  }, [isOpen]);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const navItems = user?.role === 'COUNTER_STAFF' ? COUNTER_STAFF_NAV : THEATRE_ADMIN_NAV;

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex">
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 z-20 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
          isOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="p-5 flex items-center justify-between border-b border-gray-50 h-16">
          <div className={`flex items-center gap-2 overflow-hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Popmart</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 uppercase tracking-widest">Theatre</span>
          </div>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              title={!isOpen ? item.name : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                } ${!isOpen ? 'justify-center' : ''}`
              }
            >
              <item.icon className={`h-5 w-5 shrink-0 ${!isOpen ? 'mx-auto' : ''}`} />
              {isOpen && <span className="truncate">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 mt-auto border-t border-gray-100 bg-gray-50/30">
          <div className={`flex items-center gap-3 px-2 py-2 mb-2 rounded-xl transition-all ${isOpen ? 'bg-white border border-gray-100 shadow-sm' : 'justify-center'}`}>
            <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 text-white flex items-center justify-center font-bold text-sm shadow-inner">
              {user?.name?.charAt(0) || 'U'}
            </div>
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{user?.role?.replace('_', ' ')}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            title={!isOpen ? "Logout" : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors ${!isOpen ? 'justify-center' : ''}`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-20'} min-w-0`}>
        <main className="w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
