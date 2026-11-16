import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Sparkles, DollarSign, Calendar, Tag, ArrowRight, Lightbulb, AlertCircle } from 'lucide-react';

export default function CreateProjectPage() {
  const navigate = useNavigate();

  const categories = [
    'Web Application',
    'Mobile App (iOS/Android)',
    'AI & Machine Learning',
    'FinTech & Payments',
    'Healthcare & BioTech',
    'E-Commerce & Retail',
    'SaaS & Cloud Services'
  ];

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Web Application');
  const [budgetMin, setBudgetMin] = useState(1000);
  const [budgetMax, setBudgetMax] = useState(3000);
  const [timelineWeeks, setTimelineWeeks] = useState(4);
  const [description, setDescription] = useState('');
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- Real-time Validation ---
  const titleError = useMemo(() => {
    if (!title.trim() && touched.title) return 'Project title is required';
    if (!title) return '';
    if (title.trim().length < 10) return `Title must be at least 10 characters (currently ${title.trim().length})`;
    if (title.trim().length > 100) return `Title cannot exceed 100 characters (currently ${title.trim().length})`;
    return '';
  }, [title, touched.title]);

  const descriptionError = useMemo(() => {
    const len = description.trim().length;
    if (len === 0 && touched.description) return 'Project description is required for AI technical brief analysis';
    if (len === 0) return '';
    if (len < 100) return `Description must be at least 100 characters so AI can understand your idea (currently ${len}/100)`;
    if (len > 5000) return `Description cannot exceed 5,000 characters (currently ${len}/5000)`;
    return '';
  }, [description, touched.description]);

  const budgetMinError = useMemo(() => {
    const minVal = Number(budgetMin);
    if (isNaN(minVal) || minVal < 500) return 'Minimum budget must be numbers only and at least ₹500';
    return '';
  }, [budgetMin]);

  const budgetMaxError = useMemo(() => {
    const minVal = Number(budgetMin);
    const maxVal = Number(budgetMax);
    if (isNaN(maxVal) || maxVal < 500) return 'Maximum budget must be at least ₹500';
    if (maxVal <= minVal) return `Maximum budget (₹${maxVal}) must be greater than minimum budget (₹${minVal})`;
    return '';
  }, [budgetMin, budgetMax]);

  const timelineError = useMemo(() => {
    const w = Number(timelineWeeks);
    if (isNaN(w) || w < 1 || w > 52 || !Number.isInteger(w)) {
      return 'Timeline must be a positive whole number of weeks (between 1 and 52)';
    }
    return '';
  }, [timelineWeeks]);

  const categoryError = useMemo(() => {
    if (!categories.includes(category)) return 'Please pick an approved category from the predefined list';
    return '';
  }, [category, categories]);

  const isFormValid = useMemo(() => {
    return (
      !titleError && title.trim().length >= 10 &&
      !descriptionError && description.trim().length >= 100 &&
      !budgetMinError && !budgetMaxError &&
      !timelineError && !categoryError
    );
  }, [titleError, title, descriptionError, description, budgetMinError, budgetMaxError, timelineError, categoryError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ title: true, description: true, budgetMin: true, budgetMax: true, timeline: true });

    if (!isFormValid) {
      setError('Please correct the validation errors before generating the project.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const weeks = parseInt(timelineWeeks, 10);
      const res = await api.post('/projects', {
        title: title.trim(),
        description: description.trim(),
        category,
        budgetMin: Number(budgetMin),
        budgetMax: Number(budgetMax),
        timeline: `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`,
        timelineWeeks: weeks
      });

      if (res.data?.data) {
        const projectId = res.data.data.id;
        navigate(`/project/${projectId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project. Please verify inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseSample = () => {
    setTitle('DevMatch B2B Milestone Escrow Platform');
    setCategory('Web Application');
    setBudgetMin(1500);
    setBudgetMax(3500);
    setTimelineWeeks(4);
    setDescription(
      'We require a high-throughput collaborative marketplace platform where non-technical founders can post detailed product specifications, receive 100-point AI developer match rankings, collaborate via WhatsApp-like instant messaging, and fund milestone contracts securely through Razorpay escrow. The system must support real-time WebSocket STOMP communications, delivery approval windows, and dispute tribunal resolution mechanisms.'
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Step 02: Project Requirement Input
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Post Your Software Vision</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tell us what you want to build in plain English. Our AI will transform it into a full technical specification.
          </p>
        </div>

        <button
          type="button"
          onClick={handleUseSample}
          className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
        >
          💡 Fill Example
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
        
        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Project Title <span className="text-rose-500">*</span>
            </label>
            <span className={`text-[11px] font-bold ${title.length > 100 ? 'text-rose-600' : 'text-slate-400'}`}>
              {title.length} / 100 characters (min 10)
            </span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, title: true }))}
            placeholder="e.g. AI-Powered Telemedicine Platform or Real-Time Logistics Tracker"
            className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition ${
              titleError && touched.title ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
            }`}
          />
          {titleError && touched.title && (
            <p className="mt-1 text-[11px] text-rose-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {titleError}
            </p>
          )}
        </div>

        {/* Category & Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              <Tag className="w-3.5 h-3.5 inline mr-1 text-blue-600" /> Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {categoryError && (
              <p className="mt-1 text-[11px] text-rose-600 font-medium">{categoryError}</p>
            )}
            <p className="text-[10px] text-slate-400 mt-1">Predefined categories ensure strict developer domain matching</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              <Calendar className="w-3.5 h-3.5 inline mr-1 text-blue-600" /> Target Timeline (Weeks) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="52"
              step="1"
              value={timelineWeeks}
              onChange={(e) => setTimelineWeeks(e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, timeline: true }))}
              placeholder="e.g. 4"
              className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition ${
                timelineError && touched.timeline ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
              }`}
            />
            {timelineError && touched.timeline && (
              <p className="mt-1 text-[11px] text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {timelineError}
              </p>
            )}
            <p className="text-[10px] text-slate-400 mt-1">Positive whole number of weeks (1–52 weeks)</p>
          </div>
        </div>

        {/* Budget Range */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            <DollarSign className="w-3.5 h-3.5 inline mr-1 text-blue-600" /> Project Budget Range (INR ₹) <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] text-slate-500 block mb-1">Minimum Budget (₹, Min 500)</span>
              <input
                type="number"
                min="500"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, budgetMin: true }))}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition ${
                  budgetMinError && touched.budgetMin ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
                }`}
              />
              {budgetMinError && touched.budgetMin && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{budgetMinError}</p>
              )}
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block mb-1">Maximum Budget (₹, Greater than Min)</span>
              <input
                type="number"
                min="500"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, budgetMax: true }))}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition ${
                  budgetMaxError && touched.budgetMax ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
                }`}
              />
              {budgetMaxError && touched.budgetMax && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{budgetMaxError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Idea Description in Plain English <span className="text-rose-500">*</span>
            </label>
            <span className={`text-[11px] font-bold ${
              description.length < 100 || description.length > 5000 ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {description.length} / 5,000 characters (min 100)
            </span>
          </div>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, description: true }))}
            placeholder="Describe the software you need in detail. For example: We need a web application where users can search for vetted developers, communicate through an encrypted WebSocket chat, approve deliverables across escrow milestones, and process payments safely via Razorpay..."
            className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none leading-relaxed transition ${
              descriptionError && touched.description ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
            }`}
          />
          {descriptionError && touched.description && (
            <p className="mt-1 text-[11px] text-rose-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {descriptionError}
            </p>
          )}
        </div>

        {/* Guidance notice */}
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/60 flex items-start gap-3 text-xs text-blue-900">
          <Lightbulb className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Automated AI Architecture:</span> The platform analyzes your inputs directly using NLP to structure a technical brief with tech stack, milestones, and match ranking. No duplicate forms required.
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/founder')}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-8 py-3 rounded-xl font-bold text-xs shadow-lg transition flex items-center gap-2 ${
              loading
                ? 'bg-slate-400 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25 active:scale-[0.99]'
            }`}
          >
            {loading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                Generate AI Brief & Find Developers
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
