import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FolderKanban, 
  PlusCircle, 
  Sparkles, 
  MessageSquare, 
  CreditCard, 
  Star, 
  Settings, 
  Compass, 
  FileText, 
  Layers, 
  DollarSign, 
  User, 
  BarChart3, 
  Users, 
  ShieldAlert, 
  Receipt, 
  Sliders, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X, 
  Search, 
  Bell, 
  LogOut, 
  CheckCircle2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import api from '../api/client';

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const notificationRef = useRef(null);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  // Click outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotificationMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications and unread count safely
  const loadNotifications = useCallback(() => {
    if (!user) return;
    api.get('/notifications').then((res) => {
      if (res.data?.data) {
        const raw = res.data.data;
        const list = Array.isArray(raw.notifications)
          ? raw.notifications
          : Array.isArray(raw)
          ? raw
          : [];
        setNotifications(list);
        const count = typeof raw.unreadCount === 'number'
          ? raw.unreadCount
          : list.filter((n) => !n.read).length;
        setUnreadNotifications(count);
      }
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [loadNotifications, location.pathname]);

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setUnreadNotifications(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.warn('Failed to mark all as read', e);
    }
  };

  // Redirect to role-appropriate profile / settings page
  const handleProfileClick = () => {
    if (user?.role === 'FOUNDER') {
      navigate('/founder/settings');
    } else if (user?.role === 'DEVELOPER') {
      navigate('/developer/settings');
    } else if (user?.role === 'ADMIN') {
      navigate('/admin?tab=settings');
    }
  };

  // Sync search input with URL search param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search');
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [location.search]);

  // Real-time letter-by-letter live filtering
  const handleSearchChange = (val) => {
    setSearchQuery(val);
    if (user?.role === 'FOUNDER') {
      const targetPath = location.pathname.startsWith('/founder/projects')
        ? location.pathname
        : '/founder/projects';
      const params = new URLSearchParams(location.search);
      if (val) {
        params.set('search', val);
      } else {
        params.delete('search');
      }
      const qs = params.toString();
      navigate(qs ? `${targetPath}?${qs}` : targetPath, { replace: true });
    } else if (user?.role === 'DEVELOPER') {
      const targetPath = location.pathname.startsWith('/developer')
        ? location.pathname
        : '/developer';
      const params = new URLSearchParams(location.search);
      params.set('tab', 'browse');
      if (val) {
        params.set('search', val);
      } else {
        params.delete('search');
      }
      navigate(`${targetPath}?${params.toString()}`, { replace: true });
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleSearchChange(searchQuery);
  };

  // Role-based menu definitions
  const founderNav = [
    { label: 'Dashboard', path: '/founder', icon: LayoutDashboard },
    { label: 'My Projects', path: '/founder/projects', icon: FolderKanban },
    { label: 'New Project', path: '/create-project', icon: PlusCircle },
    { label: 'Matches', path: '/founder/matches', icon: Sparkles },
    { label: 'Payments & Escrow', path: '/payments', icon: CreditCard },
    { label: 'Settings', path: '/founder/settings', icon: Settings },
  ];

  const developerNav = [
    { label: 'Dashboard', path: '/developer', icon: LayoutDashboard },
    { label: 'Browse Projects', path: '/developer?tab=browse', icon: Compass },
    { label: 'My Proposals', path: '/developer?tab=proposals', icon: FileText },
    { label: 'Active Projects', path: '/developer?tab=active', icon: Layers },
    { label: 'Messages', path: '/developer?tab=messages', icon: MessageSquare },
    { label: 'Earnings', path: '/payments', icon: DollarSign },
    { label: 'Settings', path: '/developer/settings', icon: Settings },
  ];

  const adminNav = [
    { label: 'Overview', path: '/admin', icon: BarChart3 },
    { label: 'Users', path: '/admin?tab=users', icon: Users },
    { label: 'Projects', path: '/admin?tab=projects', icon: FolderKanban },
    { label: 'Disputes', path: '/admin?tab=disputes', icon: ShieldAlert },
    { label: 'Payments', path: '/admin?tab=payments', icon: Receipt },
    { label: 'Settings', path: '/admin?tab=settings', icon: Sliders },
  ];

  const navItems = user?.role === 'ADMIN' 
    ? adminNav 
    : user?.role === 'DEVELOPER' 
    ? developerNav 
    : founderNav;

  // Determine active item
  const isItemActive = (path) => {
    // Special handling for Founder routes
    if (path === '/founder') {
      return location.pathname === '/founder' && (!location.search || location.search === '?tab=overview');
    }
    if (path === '/founder/projects') {
      return location.pathname === '/founder/projects' || (location.pathname === '/founder' && location.search.includes('tab=projects'));
    }
    if (path === '/founder/matches') {
      return location.pathname === '/founder/matches' || (location.pathname === '/founder' && location.search.includes('tab=matches'));
    }
    if (path === '/founder/settings') {
      return location.pathname === '/founder/settings' || (location.pathname === '/founder' && location.search.includes('tab=settings'));
    }

    // Special handling for Developer routes
    if (path === '/developer') {
      return location.pathname === '/developer' && (!location.search || location.search === '?tab=overview' || location.search === '?tab=matches');
    }
    if (path === '/developer?tab=browse') {
      return location.pathname === '/developer' && location.search.includes('tab=browse');
    }
    if (path === '/developer?tab=proposals') {
      return location.pathname === '/developer' && location.search.includes('tab=proposals');
    }
    if (path === '/developer?tab=active') {
      return location.pathname === '/developer' && location.search.includes('tab=active');
    }
    if (path === '/developer?tab=messages') {
      return location.pathname === '/developer' && location.search.includes('tab=messages');
    }
    if (path === '/developer/settings') {
      return location.pathname === '/developer/settings' || (location.pathname === '/developer' && location.search.includes('tab=settings'));
    }

    const [itemPath, itemQuery] = path.split('?');
    if (location.pathname !== itemPath) return false;
    if (!itemQuery) return !location.search || location.search === '?tab=overview';
    return location.search.includes(itemQuery);
  };

  // Generate page title and breadcrumbs
  const getPageInfo = () => {
    const path = location.pathname;
    if (path.startsWith('/project/')) return { title: 'Project Workspace', crumb: 'Projects / Workspace' };
    if (path === '/create-project') return { title: 'Create New Project', crumb: 'Projects / Post Vision' };
    if (path === '/founder/projects' || (path === '/founder' && location.search.includes('tab=projects'))) {
      return { title: 'My Projects', crumb: 'Founder / Projects Portfolio' };
    }
    if (path === '/founder/matches' || (path === '/founder' && location.search.includes('tab=matches'))) {
      return { title: 'AI Developer Matches', crumb: 'Founder / 100-Point Match Engine' };
    }
    if (path === '/founder/settings' || (path === '/founder' && location.search.includes('tab=settings'))) {
      return { title: 'Account Settings', crumb: 'Founder / Profile & Security' };
    }
    if (path === '/developer/settings' || (path === '/developer' && location.search.includes('tab=settings'))) {
      return { title: 'Developer Settings', crumb: 'Developer / Profile & Security' };
    }
    if (path === '/developer/profile') return { title: 'Developer Profile', crumb: 'Account / Skills & Rates' };
    if (path === '/payments') return { title: 'Escrow & Payments Vault', crumb: 'Finance / Escrow Ledger' };
    if (path === '/admin') return { title: 'Platform Administration', crumb: 'Admin Console / Oversight' };
    if (user?.role === 'DEVELOPER') {
      if (location.search.includes('tab=browse')) return { title: 'Browse Open Gigs', crumb: 'Developer / Browse Market' };
      if (location.search.includes('tab=proposals')) return { title: 'My Proposals', crumb: 'Developer / Submitted Bids' };
      if (location.search.includes('tab=active')) return { title: 'Active Projects', crumb: 'Developer / Hired Workspaces' };
      if (location.search.includes('tab=messages')) return { title: 'Project Messages', crumb: 'Developer / Communications' };
      return { title: 'Developer Dashboard', crumb: 'Developer / Recommended Matches' };
    }
    return { title: 'Founder Dashboard', crumb: 'Founder / Executive Overview' };
  };

  const { title, crumb } = getPageInfo();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-800 antialiased font-sans">
      
      {/* MOBILE BACKDROP OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR SHELL */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200/90 flex flex-col transition-all duration-200 ease-in-out ${
          collapsed ? 'w-[72px]' : 'w-[260px]'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* SIDEBAR TOP: BRAND LOGO */}
        <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 overflow-hidden group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            {!collapsed && (
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent truncate">
                DevMatch<span className="text-slate-900">.ai</span>
              </span>
            )}
          </Link>

          {/* DESKTOP COLLAPSE BUTTON */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* MOBILE CLOSE BUTTON */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SIDEBAR NAVIGATION ITEMS */}
        <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const active = isItemActive(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-150 ${
                  active
                    ? 'bg-blue-50/90 text-blue-700 font-bold border-l-[3px] border-l-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-blue-50/50 font-medium'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
                    active ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5'
                  }`}
                />
                {!collapsed && (
                  <span className="truncate flex-1 tracking-tight">
                    {item.label}
                  </span>
                )}
                {!collapsed && item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* SIDEBAR BOTTOM: USER PROFILE & LOGOUT */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between gap-2">
            <div 
              onClick={handleProfileClick}
              title="Click to view Account Settings"
              className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-200 overflow-hidden ring-1 ring-slate-200 group-hover:ring-2 group-hover:ring-blue-500 transition shrink-0">
                <img
                  src={user?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}`}
                  alt={user?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate transition-colors">{user?.name}</div>
                  <span className="inline-block px-1.5 py-0.2 rounded-md text-[9px] font-black tracking-widest uppercase bg-blue-100 text-blue-800">
                    {user?.role}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </aside>

      {/* MAIN CONTAINER (OFFSET BY SIDEBAR) */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
        collapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'
      }`}>
        
        {/* SLIM TOPBAR WITH GLASS BLUR */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4">
          
          {/* LEFT: HAMBURGER (MOBILE) + TITLE & BREADCRUMBS */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {crumb}
              </div>
              <h2 className="text-base font-black text-slate-900 tracking-tight truncate leading-tight">
                {title}
              </h2>
            </div>
          </div>

          {/* RIGHT: SEARCH + NOTIFICATIONS + PROFILE */}
          <div className="flex items-center gap-3">
            
            {/* SEARCH BOX WITH LETTER-BY-LETTER LIVE FILTERING */}
            <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search projects, skills... (⌘K)"
                className="pl-9 pr-12 py-1.5 w-60 lg:w-72 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
              />
              <kbd className="absolute right-2.5 top-2 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-white border border-slate-200 shadow-2xs pointer-events-none">
                ⌘K
              </kbd>
            </form>

            {/* NOTIFICATION BELL & INTERACTIVE DROPDOWN */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setShowNotificationMenu((prev) => !prev)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 relative transition cursor-pointer"
                title="View Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border border-white"></span>
                  </span>
                )}
              </button>

              {/* NOTIFICATION DROPDOWN */}
              {showNotificationMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Notifications</span>
                      {unreadNotifications > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                          {unreadNotifications} new
                        </span>
                      )}
                    </div>
                    {unreadNotifications > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] font-semibold text-blue-600 cursor-pointer hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 py-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No notifications right now
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => setShowNotificationMenu(false)}
                          className={`py-2.5 px-2 text-xs rounded-xl transition ${
                            !n.read ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-slate-800 leading-snug">{n.message}</span>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1"></span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* QUICK AVATAR PILL WITH PROFILE REDIRECTION */}
            <div 
              onClick={handleProfileClick}
              title="Click to view Account Settings"
              className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 overflow-hidden ring-1 ring-blue-500/20 group-hover:ring-2 group-hover:ring-blue-600 transition">
                <img
                  src={user?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}`}
                  alt={user?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 leading-tight transition-colors">
                  {user?.name || 'Profile'}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {user?.role || 'FOUNDER'}
                </div>
              </div>
            </div>

          </div>

        </header>

        {/* MAIN APPLICATION CONTENT */}
        <main className="flex-1 p-6 sm:p-8 animate-in fade-in duration-200">
          {children}
        </main>

      </div>

    </div>
  );
}

