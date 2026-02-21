import {
    BarChart3,
    Fuel,
    LayoutDashboard,
    LogOut,
    Menu,
    Route,
    Truck,
    Users,
    Wrench,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { getNavigationItems } from '../lib/permissions';
import { formatRole } from '../lib/roles';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import { Button } from './ui/button';

export function RootLayout() {
  const navigate = useNavigate();
  const { userRole, setUserRole } = useAuth();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Icon mapping
  const iconMap = {
    LayoutDashboard,
    Truck,
    Route,
    Users,
    Wrench,
    Fuel,
    BarChart3,
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // In export mode, skip auth check
    if (!supabase) {
      console.warn('Supabase client not configured - skipping auth check');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/');
      return;
    }

    setUser(session.user);
    setIsLoading(false);

    const role = session.user.user_metadata?.role;
    if (role) {
      setUserRole(role);
    }
  };

  const handleLogout = async () => {
    // In export mode, just navigate
    if (!supabase) {
      toast.info('Logging out...');
      navigate('/');
      return;
    }

    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const navItems = getNavigationItems(userRole);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">Fleet Manager</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.user_metadata?.name || user?.email}</p>
              <p className="text-xs text-gray-500 capitalize">{formatRole(user?.user_metadata?.role || 'User')}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className={`
          fixed top-[57px] left-0 h-[calc(100vh-57px)] bg-white border-r border-gray-200 
          transition-transform duration-200 z-40 w-64
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const IconComponent = iconMap[item.icon];
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/app'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  {IconComponent && <IconComponent className="w-5 h-5" />}
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:ml-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden top-[57px]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}