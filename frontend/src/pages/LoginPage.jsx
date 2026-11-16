import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { 
  Sparkles, 
  Lock, 
  Mail, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import './AuthSplitCard.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const emailError = useMemo(() => {
    if (!email.trim() && touched.email) return 'Email address is required';
    if (!email) return '';
    if (!emailRegex.test(email.trim())) return 'Please enter a valid email address';
    return '';
  }, [email, touched.email]);

  const passwordError = useMemo(() => {
    if (!password && touched.password) return 'Password is required';
    return '';
  }, [password, touched.password]);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    if (!email.trim() || !emailRegex.test(email.trim()) || !password) {
      setServerError('Please enter a valid email and password.');
      return;
    }

    setServerError('');
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      const data = response?.data?.data;
      if (!data?.token) {
        throw new Error('Invalid login response from server.');
      }

      login(data);

      const role = data.role;
      if (role === 'FOUNDER') {
        navigate('/founder', { replace: true });
      } else if (role === 'DEVELOPER') {
        navigate('/developer', { replace: true });
      } else if (role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to sign in. Please check your credentials.';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setTouched({ email: true, password: true });
    setServerError('');
  };

  return (
    <div className="auth-split-page">
      <div className="auth-dual-card">
        
        {/* LEFT BANNER CARD (EXACT SANCHIKA DESIGN) */}
        <div className="auth-banner-card">
          <div className="auth-banner-content">
            <div className="auth-banner-badge">
              <Sparkles size={14} /> AI-Powered Match & Escrow
            </div>

            <h1 className="auth-banner-title">
              Simplify collaboration with our{' '}
              <span className="auth-banner-title-underline">platform.</span>
            </h1>

            <p className="auth-banner-desc">
              Connect directly with verified developers, manage milestone escrow with Razorpay protection, and track deliverables in real time.
            </p>
          </div>

          <div className="auth-banner-graphic">
            <div className="auth-banner-avatar-group">
              <div className="auth-avatar-badge">
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="auth-avatar-text">DevMatch Escrow Guard</div>
                <div className="auth-avatar-subtext">
                  Fund-first rule & mutual milestone sign-off
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT FORM CONTAINER (EXACT SANCHIKA DESIGN) */}
        <div className="auth-form-container">
          <div className="auth-form-header">
            <div className="auth-form-brand">
              <div className="auth-form-brand-icon">
                <Sparkles size={22} />
              </div>
              <span className="auth-form-brand-name">
                DevMatch<span className="text-blue-600">.ai</span>
              </span>
            </div>

            <h2 className="auth-form-title">Welcome Back</h2>
            <p className="auth-form-subtitle">Please sign in to your platform account</p>
          </div>

          {/* QUICK DEMO SELECTOR */}
          <div className="mb-4 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              ⚡ Quick Demo 1-Click Login
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('founder@devmatch.ai', 'Password@123')}
                className="px-2 py-1.5 rounded-xl bg-blue-100/70 hover:bg-blue-200 text-blue-900 text-[11px] font-bold transition text-center"
              >
                Founder
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('dev.raj@devmatch.ai', 'Password@123')}
                className="px-2 py-1.5 rounded-xl bg-emerald-100/70 hover:bg-emerald-200 text-emerald-900 text-[11px] font-bold transition text-center"
              >
                Developer
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@devmatch.ai', 'Admin@123')}
                className="px-2 py-1.5 rounded-xl bg-purple-100/70 hover:bg-purple-200 text-purple-900 text-[11px] font-bold transition text-center"
              >
                Admin
              </button>
            </div>
          </div>

          {serverError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2 mb-3">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} noValidate className="space-y-3.5">
            {/* EMAIL INPUT */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@startup.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={`auth-pill-input ${emailError && touched.email ? 'is-invalid' : ''}`}
                />
              </div>
              {emailError && touched.email && (
                <div className="text-[11px] text-rose-600 font-medium mt-1 ps-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {emailError}
                </div>
              )}
            </div>

            {/* PASSWORD INPUT */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={`auth-pill-input pe-10 ${passwordError && touched.password ? 'is-invalid' : ''}`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordError && touched.password && (
                <div className="text-[11px] text-rose-600 font-medium mt-1 ps-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {passwordError}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-0.5">
              <span className="text-slate-400 text-xs hover:text-blue-600 cursor-pointer">
                Forgot password?
              </span>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="auth-pill-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* FOOTER */}
            <div className="auth-login-footer">
              <span className="text-slate-500">Don't have an account?</span>{' '}
              <Link to="/register">Sign up for free</Link>
            </div>

            <div className="auth-powered-by">
              Powered by <strong className="text-slate-700">DevMatch AI Platform</strong>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
