import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { 
  Sparkles, 
  Lock, 
  Mail, 
  User, 
  Briefcase, 
  Code2, 
  Phone, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import './AuthSplitCard.css';

export default function RegisterPage() {
  const [role, setRole] = useState(null); // Mandatory selection, NO default!
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [touched, setTouched] = useState({
    role: false,
    name: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
  });

  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // --- Strict Real-Time Validation ---
  const nameError = useMemo(() => {
    if (!name.trim() && touched.name) return 'Full name is required';
    if (!name) return '';
    if (name.length < 3 || name.length > 50) return 'Name must be 3–50 characters';
    if (!/^[A-Za-z]+( [A-Za-z]+)*$/.test(name)) {
      if (/^\s|\s$/.test(name)) return 'Name must not have leading or trailing spaces';
      return 'Letters and single spaces only (no numbers or symbols)';
    }
    return '';
  }, [name, touched.name]);

  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const emailError = useMemo(() => {
    if (!email.trim() && touched.email) return 'Email address is required';
    if (!email) return '';
    if (!emailRegex.test(email.trim())) return 'Enter a valid email (e.g. user@domain.com)';
    return '';
  }, [email, touched.email]);

  const phoneError = useMemo(() => {
    if (!phone) return '';
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      return '10-digit Indian number starting with 6–9';
    }
    return '';
  }, [phone]);

  const passwordCriteria = useMemo(() => {
    return {
      hasMinLen: password.length >= 8 && password.length <= 64,
      hasLower: /[a-z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasDigit: /\d/.test(password),
      hasSpecial: /[@$!%*?&]/.test(password),
      notSameAsNameOrEmail: (() => {
        if (!password) return true;
        const lowPass = password.toLowerCase();
        const lowName = name.toLowerCase().trim();
        const lowEmail = email.toLowerCase().trim();
        if (lowName && (lowPass === lowName || lowPass.includes(lowName))) return false;
        if (lowEmail && (lowPass === lowEmail || lowPass.includes(lowEmail))) return false;
        return true;
      })(),
    };
  }, [password, name, email]);

  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: 'Empty', color: 'bg-slate-200' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 10) score += 1;
    if (passwordCriteria.hasLower && passwordCriteria.hasUpper) score += 1;
    if (passwordCriteria.hasDigit && passwordCriteria.hasSpecial) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600', percent: '25%' };
    if (score <= 3) return { score: 2, label: 'Medium', color: 'bg-amber-500', text: 'text-amber-600', percent: '65%' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600', percent: '100%' };
  }, [password, passwordCriteria]);

  const passwordError = useMemo(() => {
    if (!password && touched.password) return 'Password is required';
    if (!password) return '';
    if (password.length < 8) return 'Password must be at least 8 characters (10+ recommended)';
    if (password.length > 64) return 'Password cannot exceed 64 characters';
    if (!passwordCriteria.hasUpper) return 'Must include at least 1 uppercase letter';
    if (!passwordCriteria.hasLower) return 'Must include at least 1 lowercase letter';
    if (!passwordCriteria.hasDigit) return 'Must include at least 1 number';
    if (!passwordCriteria.hasSpecial) return 'Must include at least 1 special symbol (@$!%*?&)';
    if (!passwordCriteria.notSameAsNameOrEmail) return 'Cannot equal or contain your name or email';
    return '';
  }, [password, passwordCriteria, touched.password]);

  const confirmPasswordError = useMemo(() => {
    if (!confirmPassword && touched.confirmPassword) return 'Please confirm password';
    if (!confirmPassword) return '';
    if (password !== confirmPassword) return 'Passwords do not match exactly';
    return '';
  }, [confirmPassword, password, touched.confirmPassword]);

  const roleError = useMemo(() => {
    if (touched.role && !role) return 'Please select whether you are a Founder or Developer';
    return '';
  }, [role, touched.role]);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const isFormValid = useMemo(() => {
    return (
      !!role &&
      !nameError && name.trim().length >= 3 &&
      !emailError && emailRegex.test(email.trim()) &&
      !passwordError && password.length >= 8 &&
      !confirmPasswordError && confirmPassword === password &&
      !phoneError
    );
  }, [role, nameError, name, emailError, email, passwordError, password, confirmPasswordError, confirmPassword, phoneError]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setTouched({
      role: true,
      name: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    });

    if (!role) {
      setServerError('Please select whether you are a Founder or a Developer to proceed.');
      return;
    }

    if (!isFormValid) {
      setServerError('Please correct the highlighted validation errors before continuing.');
      return;
    }

    setServerError('');
    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        role,
        phone: phone.trim() || null,
      };

      const response = await api.post('/auth/register', payload);
      const data = response?.data?.data;

      if (!data?.token) {
        throw new Error('Registration did not return an authentication token.');
      }

      login(data);

      if (role === 'FOUNDER') {
        navigate('/founder', { replace: true });
      } else {
        navigate('/developer', { replace: true });
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Registration failed. Please verify your inputs.';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-split-page">
      <div className="auth-dual-card">

        {/* LEFT BANNER CARD (SANCHIKA DUAL-CARD DESIGN) */}
        <div className="auth-banner-card">
          <div className="auth-banner-content">
            <div className="auth-banner-badge">
              <Sparkles size={14} /> DevMatch Verified Talent
            </div>

            <h1 className="auth-banner-title">
              Build software faster with our{' '}
              <span className="auth-banner-title-underline">network.</span>
            </h1>

            <p className="auth-banner-desc">
              Join thousands of founders and developers building real products with 100-point AI matchmaking, automated project briefs, and Razorpay escrow safety.
            </p>
          </div>

          <div className="auth-banner-graphic">
            <div className="auth-banner-avatar-group">
              <div className="auth-avatar-badge">
                <Code2 size={24} />
              </div>
              <div>
                <div className="auth-avatar-text">AI Match & Escrow Network</div>
                <div className="auth-avatar-subtext">
                  Direct WhatsApp chat & milestone payouts
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT FORM CONTAINER */}
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

            <h2 className="auth-form-title">Create an account</h2>
            <p className="auth-form-subtitle">Sign up for DevMatch AI platform</p>
          </div>

          {serverError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2 mb-3">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* ROLE SELECTOR CARDS (NO DEFAULT - EXPLICIT USER SELECTION) */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Your Role <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Choose one to continue</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setRole('FOUNDER');
                  handleBlur('role');
                }}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                  role === 'FOUNDER'
                    ? 'border-blue-600 bg-blue-50/90 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Briefcase size={16} />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    Founder
                    {role === 'FOUNDER' && <CheckCircle2 size={13} className="text-blue-600" />}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">I have an idea to build</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('DEVELOPER');
                  handleBlur('role');
                }}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                  role === 'DEVELOPER'
                    ? 'border-emerald-600 bg-emerald-50/90 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Code2 size={16} />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    Developer
                    {role === 'DEVELOPER' && <CheckCircle2 size={13} className="text-emerald-600" />}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">I build milestone code</div>
                </div>
              </button>
            </div>
            {roleError && (
              <div className="text-[11px] text-rose-600 font-medium mt-1 ps-1 flex items-center gap-1">
                <AlertCircle size={12} /> {roleError}
              </div>
            )}
          </div>

          <form onSubmit={handleRegister} noValidate className="space-y-3">
            {/* FULL NAME */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Sarah Chen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => handleBlur('name')}
                className={`auth-pill-input ${nameError && touched.name ? 'is-invalid' : ''}`}
              />
              {nameError && touched.name && (
                <div className="text-[11px] text-rose-600 font-medium mt-1 ps-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {nameError}
                </div>
              )}
            </div>

            {/* EMAIL ADDRESS */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="sarah@startup.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                className={`auth-pill-input ${emailError && touched.email ? 'is-invalid' : ''}`}
              />
              {emailError && touched.email && (
                <div className="text-[11px] text-rose-600 font-medium mt-1 ps-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {emailError}
                </div>
              )}
            </div>

            {/* PHONE NUMBER (OPTIONAL) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="9876543210"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => handleBlur('phone')}
                className={`auth-pill-input ${phoneError ? 'is-invalid' : ''}`}
              />
              {phoneError && (
                <div className="text-[11px] text-rose-600 font-medium mt-1 ps-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {phoneError}
                </div>
              )}
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min 8 chars with uppercase, number & symbol"
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

              {/* STRENGTH PROGRESS BAR */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Strength:</span>
                    <span className={`font-bold ${passwordStrength.text}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${passwordStrength.color}`}
                      style={{ width: passwordStrength.percent }}
                    />
                  </div>
                </div>
              )}

              {passwordError && touched.password && (
                <div className="text-[11px] text-rose-600 font-medium mt-1 ps-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {passwordError}
                </div>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  className={`auth-pill-input pe-10 ${confirmPasswordError && touched.confirmPassword ? 'is-invalid' : ''}`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPasswordError && touched.confirmPassword && (
                <div className="text-[11px] text-rose-600 font-medium mt-1 ps-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {confirmPasswordError}
                </div>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="auth-pill-btn mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* FOOTER */}
            <div className="auth-login-footer">
              <span className="text-slate-500">Already have an account?</span>{' '}
              <Link to="/login">Sign in</Link>
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
