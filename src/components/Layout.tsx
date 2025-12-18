import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  ShoppingBag,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user, isAdminUser } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/customers', label: 'Customers', icon: Users },
    { path: '/bills', label: 'Bills', icon: FileText },
    { path: '/orders', label: 'Orders', icon: ShoppingBag },
    { path: '/inventory', label: 'Inventory', icon: Package },
  ];

  const allNavItems = isAdminUser
    ? [{ path: '/admin', label: 'Admin', icon: Shield }, ...navItems]
    : navItems;

  const currentPage = allNavItems.find(
    (item) => item.path === location.pathname
  );

  const handleNavClick = (
    path: string,
    e: React.MouseEvent | React.TouchEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(path);
  };

  return (
    <div
      className="mobile-app-container prevent-refresh"
      style={{ pointerEvents: 'auto', overscrollBehavior: 'none' }}
    >
      {/* Desktop Header */}
      <nav
        className={`hidden md:block sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'glass-effect shadow-lg'
            : 'bg-white/80 backdrop-blur-sm border-b border-gray-200'
        }`}
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <h1 className="text-2xl font-bold text-black">BillWeave</h1>
            </div>

            <div className="flex items-center space-x-1">
              {allNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? item.path === '/admin'
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-black text-white shadow-md'
                        : item.path === '/admin'
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
              <Link
                to="/settings"
                className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  location.pathname === '/settings'
                    ? 'bg-black text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Header */}
      <header className="md:hidden mobile-header-fixed">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-black">BillWeave</h1>
              <p className="text-xs text-gray-600">
                {currentPage?.label || 'Dashboard'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="touch-target p-2 rounded-xl hover:bg-gray-100"
              onClick={() => navigate('/settings')}
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <button
              className="touch-target p-2 rounded-xl hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content (NO SWIPE) */}
      <main
        className="mobile-main-content prevent-refresh"
        style={{ pointerEvents: 'auto', overscrollBehavior: 'none' }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 md:py-8">
          <div className="animate-fade-in">{children}</div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden mobile-bottom-navigation prevent-refresh">
        <div
          className={`grid ${
            isAdminUser ? 'grid-cols-6' : 'grid-cols-5'
          } h-full`}
        >
          {allNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className={`mobile-nav-button ${isActive ? 'active' : ''}`}
                onClick={(e) => handleNavClick(item.path, e)}
                type="button"
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 animate-fade-in">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-80 bg-white shadow-xl animate-slide-in-right">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="touch-target p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              {[...allNavItems, { path: '/settings', label: 'Settings', icon: Settings }].map(
                (item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate(item.path);
                      }}
                      className="w-full flex items-center px-4 py-3 rounded-xl hover:bg-gray-100"
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </button>
                  );
                }
              )}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-4 py-3 rounded-xl text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
