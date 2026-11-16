import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import { 
  Code2, 
  User, 
  Mail, 
  ShieldCheck, 
  Lock, 
  Bell, 
  Check, 
  Plus, 
  X, 
  Save, 
  KeyRound, 
  DollarSign, 
  Clock, 
  Briefcase, 
  Github,
  Sparkles
} from 'lucide-react';

export default function DeveloperSettingsPage() {
  const { user, updateProfileState } = useAuth();
  const { addToast } = useToast();

  const PREDEFINED_SKILLS = [
    'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Spring Boot', 'Java',
    'Python', 'Django', 'FastAPI', 'Go', 'Rust', 'C#', '.NET', 'Flutter',
    'React Native', 'Swift', 'Kotlin', 'PostgreSQL', 'MongoDB', 'Redis',
    'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'GraphQL', 'Tailwind CSS',
    'TypeScript', 'Next.js', 'Microservices', 'Machine Learning', 'TensorFlow', 'PyTorch'
  ];

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'preferences'
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Profile Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [skills, setSkills] = useState([]);
  const [selectedPredefinedSkill, setSelectedPredefinedSkill] = useState('');
  const [years, setYears] = useState(2);
  const [expectedRate, setExpectedRate] = useState(40);
  const [bio, setBio] = useState('');
  const [availability, setAvailability] = useState('AVAILABLE');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [profileImage, setProfileImage] = useState('');

  // Field validation touch states
  const [profileTouched, setProfileTouched] = useState({});

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Preferences toggles
  const [notifyMatches, setNotifyMatches] = useState(true);
  const [notifyProposals, setNotifyProposals] = useState(true);
  const [notifyEscrow, setNotifyEscrow] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setInitialLoading(true);
      const res = await api.get('/users/me');
      if (res.data?.data) {
        const d = res.data.data;
        setName(d.name || user?.name || '');
        setEmail(d.email || user?.email || '');
        setSkills(d.skills || []);
        setYears(d.yearsOfExperience !== undefined ? d.yearsOfExperience : 2);
        setExpectedRate(d.expectedRate || 40);
        setBio(d.bio || '');
        setAvailability(d.availability || 'AVAILABLE');
        setPortfolioLink((d.portfolioLinks || [])[0] || '');
        setProfileImage(d.profileImage || '');
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setInitialLoading(false);
    }
  };

  // --- Real-time Validation Errors ---
  const nameError = React.useMemo(() => {
    if (!name.trim()) return 'Name is required';
    if (name.length < 3 || name.length > 50) return 'Name must be 3–50 characters';
    if (!/^[A-Za-z]+( [A-Za-z]+)*$/.test(name)) return 'Name must contain letters and single spaces only';
    return '';
  }, [name]);

  const skillsError = React.useMemo(() => {
    if (skills.length === 0) return 'Please select at least 1 skill from the predefined list';
    if (skills.length > 20) return 'Maximum 20 skills allowed';
    return '';
  }, [skills]);

  const yearsError = React.useMemo(() => {
    const y = Number(years);
    if (isNaN(y) || y < 0 || y > 50 || !Number.isInteger(y)) return 'Experience must be a whole number between 0 and 50 years';
    return '';
  }, [years]);

  const rateError = React.useMemo(() => {
    const r = Number(expectedRate);
    if (isNaN(r) || r <= 0) return 'Hourly rate must be a positive number greater than 0';
    return '';
  }, [expectedRate]);

  const linkError = React.useMemo(() => {
    if (!portfolioLink) return '';
    if (!portfolioLink.trim().startsWith('https://')) return 'Portfolio/GitHub link must start with https://';
    return '';
  }, [portfolioLink]);

  const bioError = React.useMemo(() => {
    if (bio.length > 500) return `Bio exceeds maximum 500 characters (currently ${bio.length})`;
    return '';
  }, [bio]);

  const handleAddSkillFromDropdown = (skillToAdd) => {
    if (!skillToAdd) return;
    if (skills.includes(skillToAdd)) {
      addToast(`'${skillToAdd}' is already in your skills list`, 'info');
      return;
    }
    if (skills.length >= 20) {
      addToast('Maximum 20 skills allowed', 'error');
      return;
    }
    setSkills([...skills, skillToAdd]);
    setSelectedPredefinedSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|jpg)$/)) {
      addToast('Profile photo must be JPG or PNG format only', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      addToast('Profile photo exceeds 2 MB limit', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setProfileImage(ev.target.result);
      addToast('Photo loaded successfully! Remember to save profile.', 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileTouched({ name: true, skills: true, years: true, rate: true, link: true, bio: true });

    if (nameError || skillsError || yearsError || rateError || linkError || bioError) {
      addToast('Please correct validation errors before saving', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        skills,
        yearsOfExperience: parseInt(years, 10),
        expectedRate: Number(expectedRate),
        bio: bio.trim(),
        availability,
        portfolioLinks: portfolioLink ? [portfolioLink.trim()] : [],
        profileImage
      };

      const res = await api.put('/users/me', payload);
      if (res.data?.data) {
        updateProfileState(res.data.data);
        addToast('Developer profile & technical credentials updated!', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8 || newPassword.length > 64) {
      addToast('New password must be between 8 and 64 characters.', 'error');
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,64}$/.test(newPassword)) {
      addToast('Password must include uppercase, lowercase, number, and special character (@$!%*?&).', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword === currentPassword) {
      addToast('New password cannot be the same as your current password.', 'error');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.post('/users/change-password', {
        currentPassword,
        newPassword
      });

      addToast('Password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      addToast(err.response?.data?.message || 'Current password incorrect', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Developer Settings & Controls
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Developer Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your technical skills, hourly rate, account credentials, and platform preferences.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Role: <span className="text-blue-600 font-extrabold">{user?.role || 'DEVELOPER'}</span>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          Profile & Skills
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'security'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          Security & Password
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'preferences'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Notifications
        </button>
      </div>

      {initialLoading ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/4"></div>
          <div className="h-10 bg-slate-100 rounded"></div>
          <div className="h-10 bg-slate-100 rounded"></div>
        </div>
      ) : (
        <>
          {/* TAB 1: PROFILE & SKILLS */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Developer Profile & Technical Credentials</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  These details feed directly into the 100-point AI matchmaking engine when founders post new projects.
                </p>
              </div>

              {/* PROFILE PHOTO UPLOAD */}
              <div className="flex items-center gap-5 p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center overflow-hidden border-2 border-white shadow-md shrink-0">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    name ? name.charAt(0).toUpperCase() : 'D'
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Profile Photo (JPG / PNG, Max 2 MB)
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={handlePhotoUpload}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Only authentic developer portrait photos in JPG or PNG format up to 2 MB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* FULL NAME */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => setProfileTouched(prev => ({ ...prev, name: true }))}
                      placeholder="e.g. Raj Sharma"
                      className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none transition font-medium ${
                        nameError && profileTouched.name
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/30'
                          : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900'
                      }`}
                    />
                  </div>
                  {nameError && profileTouched.name && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{nameError}</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-0.5">3–50 characters, letters & spaces only</p>
                </div>

                {/* ACCOUNT EMAIL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Account Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-100/80 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Account identity verified</span>
                </div>

                {/* SKILLS INPUT WITH PREDEFINED PICKER */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Technical Skills & Frameworks <span className="text-rose-500">*</span>
                    </label>
                    <span className={`text-[11px] font-bold ${skills.length > 20 ? 'text-rose-600' : 'text-slate-500'}`}>
                      {skills.length} / 20 Selected (Min 1, Max 20)
                    </span>
                  </div>

                  <div className="flex gap-2 mb-3">
                    <select
                      value={selectedPredefinedSkill}
                      onChange={(e) => {
                        setSelectedPredefinedSkill(e.target.value);
                        handleAddSkillFromDropdown(e.target.value);
                      }}
                      className="flex-1 px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 font-medium"
                    >
                      <option value="">-- Choose skill from predefined catalog ({PREDEFINED_SKILLS.length} skills) --</option>
                      {PREDEFINED_SKILLS.map((sk) => (
                        <option key={sk} value={sk} disabled={skills.includes(sk)}>
                          {sk} {skills.includes(sk) ? '✓ (added)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-2 min-h-12 p-3 bg-slate-50/70 border border-slate-200 rounded-xl">
                    {skills.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">
                        No skills selected. Select from the predefined catalog above (minimum 1 required).
                      </span>
                    ) : (
                      skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 shadow-2xs text-slate-800"
                        >
                          <Code2 className="w-3.5 h-3.5 text-blue-600" />
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="text-slate-400 hover:text-rose-600 ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                  {skillsError && profileTouched.skills && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{skillsError}</p>
                  )}
                </div>

                {/* EXPERIENCE */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Years of Engineering Experience <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="1"
                      value={years}
                      onChange={(e) => setYears(e.target.value)}
                      onBlur={() => setProfileTouched(prev => ({ ...prev, years: true }))}
                      className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none transition font-medium ${
                        yearsError && profileTouched.years
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/30'
                          : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900'
                      }`}
                    />
                  </div>
                  {yearsError && profileTouched.years && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{yearsError}</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-0.5">Whole number between 0 and 50 years</p>
                </div>

                {/* HOURLY RATE */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Expected Rate ($ / Hour) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="1"
                      value={expectedRate}
                      onChange={(e) => setExpectedRate(e.target.value)}
                      onBlur={() => setProfileTouched(prev => ({ ...prev, rate: true }))}
                      className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none transition font-medium ${
                        rateError && profileTouched.rate
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/30'
                          : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900'
                      }`}
                    />
                  </div>
                  {rateError && profileTouched.rate && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{rateError}</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-0.5">Number greater than 0</p>
                </div>

                {/* AVAILABILITY STATUS */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Availability Status
                  </label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 font-medium"
                  >
                    <option value="AVAILABLE">Available for New Projects</option>
                    <option value="OPEN_TO_OFFERS">Open to Exceptional Offers</option>
                    <option value="BUSY">Currently Busy / Engaged</option>
                  </select>
                </div>

                {/* PORTFOLIO / GITHUB LINK */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    GitHub / LinkedIn / Portfolio URL
                  </label>
                  <div className="relative">
                    <Github className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={portfolioLink}
                      onChange={(e) => setPortfolioLink(e.target.value)}
                      onBlur={() => setProfileTouched(prev => ({ ...prev, link: true }))}
                      placeholder="https://github.com/username"
                      className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none transition font-medium ${
                        linkError && profileTouched.link
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/30'
                          : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900'
                      }`}
                    />
                  </div>
                  {linkError && profileTouched.link && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{linkError}</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-0.5">Must be a secure URL starting with https://</p>
                </div>

                {/* BIO */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Developer Bio & Background
                    </label>
                    <span className={`text-[11px] font-bold ${bio.length > 500 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {bio.length} / 500 characters
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    onBlur={() => setProfileTouched(prev => ({ ...prev, bio: true }))}
                    placeholder="Describe your architectural background, core stacks, and achievements..."
                    className={`w-full p-3.5 text-xs bg-slate-50 border rounded-xl focus:outline-none transition leading-relaxed font-medium ${
                      bioError && profileTouched.bio
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/30'
                        : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900'
                    }`}
                  />
                  {bioError && profileTouched.bio && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{bioError}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Change Account Password</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your account credentials to keep your developer payouts and contracts secure.
                </p>
              </div>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-start pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: NOTIFICATIONS & PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Developer Alerts & Notifications</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose which activity updates you receive regarding project matches, bid acceptances, and escrow releases.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">New High-Compatibility Project Matches</h4>
                    <p className="text-[11px] text-slate-500">
                      Receive alerts whenever a new project matches ≥ 70% of your technical skills.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyMatches}
                    onChange={(e) => {
                      setNotifyMatches(e.target.checked);
                      addToast('Notification preferences saved', 'info');
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Proposal Acceptance & Hire Notices</h4>
                    <p className="text-[11px] text-slate-500">
                      Instant alerts when a founder accepts your proposal and initiates the contract escrow.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyProposals}
                    onChange={(e) => {
                      setNotifyProposals(e.target.checked);
                      addToast('Notification preferences saved', 'info');
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Milestone Payouts & Escrow Releases</h4>
                    <p className="text-[11px] text-slate-500">
                      Get notified when a founder approves milestone work or auto-approval releases your payout.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyEscrow}
                    onChange={(e) => {
                      setNotifyEscrow(e.target.checked);
                      addToast('Notification preferences saved', 'info');
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}

