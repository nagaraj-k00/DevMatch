import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { User, Code2, Plus, X, Check, ArrowRight, Github, Globe, AlertCircle, Clock, DollarSign } from 'lucide-react';

export default function DeveloperProfilePage() {
  const { user, updateProfileState } = useAuth();

  const PREDEFINED_SKILLS = [
    'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Spring Boot', 'Java',
    'Python', 'Django', 'FastAPI', 'Go', 'Rust', 'C#', '.NET', 'Flutter',
    'React Native', 'Swift', 'Kotlin', 'PostgreSQL', 'MongoDB', 'Redis',
    'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'GraphQL', 'Tailwind CSS',
    'TypeScript', 'Next.js', 'Microservices', 'Machine Learning', 'TensorFlow', 'PyTorch'
  ];

  const [skills, setSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [years, setYears] = useState(2);
  const [expectedRate, setExpectedRate] = useState(40);
  const [bio, setBio] = useState('');
  const [availability, setAvailability] = useState('AVAILABLE');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [touched, setTouched] = useState({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get('/users/me');
      if (res.data?.data) {
        const d = res.data.data;
        setSkills(d.skills || []);
        setYears(d.yearsOfExperience !== undefined ? d.yearsOfExperience : 2);
        setExpectedRate(d.expectedRate || 40);
        setBio(d.bio || '');
        setAvailability(d.availability || 'AVAILABLE');
        setPortfolioLink((d.portfolioLinks || [])[0] || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Instant Validation
  const skillsError = useMemo(() => {
    if (skills.length === 0) return 'Select at least 1 skill from the predefined list';
    if (skills.length > 20) return 'Maximum 20 skills allowed';
    return '';
  }, [skills]);

  const yearsError = useMemo(() => {
    const y = Number(years);
    if (isNaN(y) || y < 0 || y > 50 || !Number.isInteger(y)) return 'Experience must be a whole number between 0 and 50 years';
    return '';
  }, [years]);

  const rateError = useMemo(() => {
    const r = Number(expectedRate);
    if (isNaN(r) || r <= 0) return 'Hourly rate must be a positive number greater than 0';
    return '';
  }, [expectedRate]);

  const linkError = useMemo(() => {
    if (!portfolioLink) return '';
    if (!portfolioLink.trim().startsWith('https://')) return 'Portfolio/GitHub link must start with https://';
    return '';
  }, [portfolioLink]);

  const bioError = useMemo(() => {
    if (bio.length > 500) return `Bio cannot exceed 500 characters (currently ${bio.length})`;
    return '';
  }, [bio]);

  const handleAddSkill = (skillName) => {
    if (!skillName) return;
    if (skills.includes(skillName)) return;
    if (skills.length >= 20) return;
    setSkills([...skills, skillName]);
    setSelectedSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setTouched({ skills: true, years: true, rate: true, link: true, bio: true });

    if (skillsError || yearsError || rateError || linkError || bioError) {
      setErrorMessage('Please fix the validation errors before saving.');
      return;
    }

    setLoading(true);
    setSavedMessage('');
    setErrorMessage('');

    try {
      const payload = {
        skills,
        yearsOfExperience: parseInt(years, 10),
        expectedRate: Number(expectedRate),
        bio: bio.trim(),
        availability,
        portfolioLinks: portfolioLink ? [portfolioLink.trim()] : []
      };

      const res = await api.put('/users/me', payload);
      if (res.data?.data) {
        updateProfileState(res.data.data);
        setSavedMessage('Profile updated and 100-point match rankings recalculated!');
        setTimeout(() => setSavedMessage(''), 4000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      <div className="mb-8">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Profile Settings</span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">Developer Skills & Availability</h1>
        <p className="text-xs text-slate-500 mt-0.5">Your profile feeds the 100-point matching engine for founders</p>
      </div>

      {savedMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          {savedMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        
        {/* Skills Tag Input */}
        <div>
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
              value={selectedSkill}
              onChange={(e) => {
                setSelectedSkill(e.target.value);
                handleAddSkill(e.target.value);
              }}
              className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 font-medium"
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
              <span className="text-xs text-slate-400 italic">No skills selected. Select from the dropdown above.</span>
            ) : (
              skills.map((s) => (
                <span
                  key={s}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold flex items-center gap-1.5"
                >
                  <Code2 className="w-3.5 h-3.5 text-blue-600" />
                  {s}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(s)}
                    className="hover:text-red-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))
            )}
          </div>
          {skillsError && touched.skills && (
            <p className="mt-1 text-[11px] text-rose-600 font-medium">{skillsError}</p>
          )}
        </div>

        {/* Experience & Rate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Years of Experience (0–50) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              max="50"
              step="1"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, years: true }))}
              className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                yearsError && touched.years ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {yearsError && touched.years && (
              <p className="mt-1 text-[11px] text-rose-600 font-medium">{yearsError}</p>
            )}
            <p className="text-[10px] text-slate-400 mt-1">Whole number between 0 and 50 years</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Expected Hourly Rate ($ USD) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={expectedRate}
              onChange={(e) => setExpectedRate(e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, rate: true }))}
              className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                rateError && touched.rate ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {rateError && touched.rate && (
              <p className="mt-1 text-[11px] text-rose-600 font-medium">{rateError}</p>
            )}
            <p className="text-[10px] text-slate-400 mt-1">Must be greater than 0</p>
          </div>
        </div>

        {/* Availability */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Bandwidth & Availability
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { val: 'AVAILABLE', label: 'Full Time (15 pts)', color: 'border-emerald-500 text-emerald-800 bg-emerald-50' },
              { val: 'PART_TIME', label: 'Part Time (10 pts)', color: 'border-blue-500 text-blue-800 bg-blue-50' },
              { val: 'BUSY', label: 'Busy (5 pts)', color: 'border-slate-300 text-slate-700 bg-slate-50' }
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setAvailability(opt.val)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                  availability === opt.val ? opt.color + ' ring-2 ring-blue-500/20' : 'border-slate-200 text-slate-600 bg-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Portfolio Link */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            GitHub or Portfolio URL
          </label>
          <div className="relative">
            <Github className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="url"
              value={portfolioLink}
              onChange={(e) => setPortfolioLink(e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, link: true }))}
              placeholder="https://github.com/username or portfolio link"
              className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                linkError && touched.link ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
          </div>
          {linkError && touched.link && (
            <p className="mt-1 text-[11px] text-rose-600 font-medium">{linkError}</p>
          )}
          <p className="text-[10px] text-slate-400 mt-1">Must start with https://</p>
        </div>

        {/* Bio */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Bio & Pitch
            </label>
            <span className={`text-[11px] font-bold ${bio.length > 500 ? 'text-rose-600' : 'text-slate-400'}`}>
              {bio.length} / 500 characters
            </span>
          </div>
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, bio: true }))}
            placeholder="Introduce yourself to founders..."
            className={`w-full p-4 rounded-xl border text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none ${
              bioError && touched.bio ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
            }`}
          />
          {bioError && touched.bio && (
            <p className="mt-1 text-[11px] text-rose-600 font-medium">{bioError}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
        >
          {loading ? 'Saving Profile...' : 'Save & Refresh Matches'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
