import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { 
  Sparkles, 
  Layers, 
  PlusCircle, 
  MessageSquare, 
  CreditCard, 
  ShieldCheck, 
  User, 
  LogOut, 
  Bell, 
  CheckCheck,
  Code2
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data?.data) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch (e) {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      // ignore
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/90' 
        : 'bg-white/80 backdrop-blur-xs border-b border-slate-200/50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-700 bg-clip-text text-transparent">
                DevMatch<span className="text-blue-600">.ai</span>
              </span>
              <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase -mt-1">
                From Idea to Impact
              </span>
            </div>
          </Link>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                {user.role === 'FOUNDER' && (
                  <>
                    <Link
                      to="/founder"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive('/founder') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                      }`}
                    >
                      <Layers className="w-4 h-4 inline mr-1.5" />
                      My Projects
                    </Link>
                    <Link
                      to="/create-project"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive('/create-project') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                      }`}
                    >
                      <PlusCircle className="w-4 h-4 inline mr-1.5" />
                      New Project
                    </Link>
                  </>
                )}

                {user.role === 'DEVELOPER' && (
                  <>
                    <Link
                      to="/developer"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive('/developer') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                      }`}
                    >
                      <Code2 className="w-4 h-4 inline mr-1.5" />
                      Matched Projects
                    </Link>
                    <Link
                      to="/developer/profile"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive('/developer/profile') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                      }`}
                    >
                      <User className="w-4 h-4 inline mr-1.5" />
                      My Profile & Skills
                    </Link>
                  </>
                )}

                <Link
                  to="/payments"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/payments') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4 inline mr-1.5" />
                  Payments & Escrow
                </Link>

                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive('/admin') ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:text-purple-600 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 inline mr-1.5" />
                    Admin Console
                  </Link>
                )}
              </>
            ) : (
              <>
                <a href="#how-it-works" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600">
                  How It Works
                </a>
                <a href="#matching-algorithm" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600">
                  Matching Engine
                </a>
                <a href="#escrow-security" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600">
                  Escrow & Razorpay
                </a>
              </>
            )}
          </nav>

          {/* Right Action Menu */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Notification Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      if (!showNotifications && unreadCount > 0) markAllRead();
                    }}
                    className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                        <span className="text-sm font-bold text-slate-800">Notifications</span>
                        <button
                          onClick={markAllRead}
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                        >
                          <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                        </button>
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                setShowNotifications(false);
                                if (n.link) navigate(n.link);
                              }}
                              className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition ${
                                !n.read ? 'bg-blue-50/50 font-medium' : 'text-slate-600'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                                <span className="font-semibold text-blue-600">{n.type}</span>
                                <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-slate-700 leading-snug">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Pill */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden ring-2 ring-blue-500/20">
                    <img
                      src={user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="text-xs font-bold text-slate-800 leading-tight">{user.name}</div>
                    <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">{user.role}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Log out"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg transition transform hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

