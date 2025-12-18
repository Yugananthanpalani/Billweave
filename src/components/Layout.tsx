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

  // Swipe gesture state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Prevent pull-to-refresh
  useEffect(() => {
    const preventRefresh = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      
      // If we're at the top and trying to scroll up, prevent it
      if (scrollTop === 0 && e.touches[0].clientY > (touchStart || 0)) {
        e.preventDefault();
        return false;
      }
    };
    
    document.addEventListener('touchmove', preventRefresh, { passive: false });
    
    return () => {
      document.removeEventListener('touchmove', preventRefresh);
    };
  }, [touchStart]);

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

  // Add admin panel to nav items if user is admin
  const allNavItems = isAdminUser 
    ? [{ path: '/admin', label: 'Admin', icon: Shield }, ...navItems]
    : navItems;
  const currentPage = allNavItems.find(item => item.path === location.pathname);
  const currentIndex = allNavItems.findIndex(item => item.path === location.pathname);

  // Swipe gesture handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    
    // Prevent pull-to-refresh
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    if (scrollTop === 0) {
      e.preventDefault();
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    
    // Additional prevention for pull-to-refresh
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const currentY = e.targetTouches[0].clientY;
    const startY = touchStart || 0;
    
    if (scrollTop === 0 && currentY > startY) {
      e.preventDefault();
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < allNavItems.length - 1) {
      // Swipe left - go to next page
      navigate(allNavItems[currentIndex + 1].path);
    }
    
    if (isRightSwipe && currentIndex > 0) {
      // Swipe right - go to previous page
      navigate(allNavItems[currentIndex - 1].path);
    }
  };

  // Handle navigation click with proper event handling
  const handleNavClick = (path: string, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(path);
  };

  return (
    <div className="mobile-app-container prevent-refresh" style={{ pointerEvents: 'auto', overscrollBehavior: 'none' }}>
      {/* Desktop Header */}
      <nav className={`hidden md:block sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass-effect shadow-lg' : 'bg-white/80 backdrop-blur-sm border-b border-gray-200'
      }`}>
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
                <h1 className="text-2xl font-bold text-black">
                  BillWeave
                </h1>
              </div>
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
                        ? (item.path === '/admin' ? 'bg-red-600 text-white shadow-md' : 'bg-black text-white shadow-md')
                        : (item.path === '/admin' ? 'text-red-600 hover:bg-red-50 hover:text-red-700' : 'text-gray-700 hover:bg-gray-100 hover:text-black')
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
                    : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                }`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-black transition-all duration-200"
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
              <p className="text-xs text-gray-600">{currentPage?.label || 'Dashboard'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              className="touch-target p-2 rounded-xl hover:bg-gray-100 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate('/settings');
              }}
              type="button"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              className="touch-target p-2 rounded-xl hover:bg-gray-100 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMobileMenuOpen(true);
              }}
              type="button"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content with Swipe Support */}
      <main 
        className="mobile-main-content prevent-refresh" 
        style={{ pointerEvents: 'auto', overscrollBehavior: 'none' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 md:py-8">
          <div className="animate-fade-in">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden mobile-bottom-navigation prevent-refresh" style={{ pointerEvents: 'auto', overscrollBehavior: 'none' }}>
        <div className={`grid ${isAdminUser ? 'grid-cols-6' : 'grid-cols-5'} h-full`}>
          {allNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className={`mobile-nav-button ${isActive ? 'active' : ''} ${
                  item.path === '/admin' ? 'text-red-600' : ''
                }`}
                style={{ pointerEvents: 'auto' }}
                onClick={(e) => handleNavClick(item.path, e)}
                onTouchEnd={(e) => handleNavClick(item.path, e)}
                type="button"
              >
                <Icon className={`w-5 h-5 mb-1 ${
                  isActive 
                    ? (item.path === '/admin' ? 'text-red-600' : 'text-black')
                    : (item.path === '/admin' ? 'text-red-400' : 'text-gray-500')
                }`} />
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
          <div className="absolute inset-y-0 right-0 w-80 max-w-[85vw] bg-white shadow-xl animate-slide-in-right">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-black">Menu</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="touch-target p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {[...allNavItems, { path: '/settings', label: 'Settings', icon: Settings }].map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate(item.path);
                    }}
                    className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-colors touch-target ${
                      isActive
                        ? (item.path === '/admin' ? 'bg-red-600 text-white' : 'bg-black text-white')
                        : (item.path === '/admin' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100')
                    }`}
                    type="button"
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </button>
                );
              })}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 touch-target"
                type="button"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </button>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <div className="text-center text-sm text-gray-500">
                <p>Signed in as</p>
                <p className="font-medium text-gray-700 truncate">{user?.email}</p>
                {isAdminUser && (
                  <p className="text-xs text-red-600 font-medium mt-1">ADMIN ACCESS</p>
                )}
              </div>
              <div className="mt-4 text-center text-xs text-gray-400">
                <p>💡 Tip: Swipe left/right to navigate between pages</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}