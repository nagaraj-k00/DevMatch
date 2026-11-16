import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { HERO_STATS } from '../constants/landingStats';
import { 
  Sparkles, 
  ArrowRight, 
  BrainCircuit, 
  Target, 
  ShieldCheck, 
  MessageSquare, 
  CreditCard, 
  CheckCircle2, 
  Users, 
  ChevronRight, 
  Code2, 
  Zap, 
  Star,
  Award,
  Lock,
  Search,
  Check,
  Cpu,
  Layers,
  ArrowUpRight,
  TrendingUp,
  FileCode2,
  Clock,
  Shield
} from 'lucide-react';

// Animated Counter Component with IntersectionObserver
function AnimatedStat({ value, prefix = '', suffix = '', isDecimal = false, duration = 1400 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const start = performance.now();
          const targetNum = typeof value === 'number' ? value : parseFloat(value) || 0;
          
          const step = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic curve
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = easeProgress * targetNum;
            
            setCount(isDecimal ? parseFloat(current.toFixed(1)) : Math.floor(current));
            
            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              setCount(targetNum);
            }
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, isDecimal, duration, hasAnimated]);

  return (
    <span ref={ref} className="font-extrabold tracking-tight">
      {prefix}
      {isDecimal ? count.toFixed(1) : count}
      {suffix}
    </span>
  );
}

// Circular SVG Match Score Ring Component
function CircularMatchRing({ score = 94, size = 52, stroke = 4 }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle
          cx="24"
          cy="24"
          r={radius}
          className="text-slate-100"
          strokeWidth={stroke}
          stroke="currentColor"
          fill="transparent"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          className="text-blue-600 transition-all duration-1000 ease-out"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[11px] font-black text-slate-800 leading-none">{score}%</span>
        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Match</span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Interactive Idea Analyzer State
  const [ideaText, setIdeaText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const sampleIdeas = [
    "Telehealth consultation app with real-time video and prescription escrow",
    "On-demand drone delivery marketplace with milestone payouts",
    "AI-powered financial audit SaaS for automated compliance"
  ];

  const handleAnalyzeIdea = async (e) => {
    if (e) e.preventDefault();
    if (!ideaText.trim()) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const res = await api.post('/projects/analyse-idea', { idea: ideaText.trim() });
      const brief = res.data?.data;
      if (brief) {
        setAnalysisResult({
          title: ideaText.length > 50 ? ideaText.slice(0, 48) + '...' : ideaText,
          summary: brief.summary,
          techStack: brief.suggestedStack && brief.suggestedStack.length > 0 
            ? brief.suggestedStack.slice(0, 5) 
            : ['React 18', 'Spring Boot 3', 'WebRTC', 'MongoDB', 'Razorpay Escrow'],
          skills: brief.requiredSkills && brief.requiredSkills.length > 0 
            ? brief.requiredSkills.slice(0, 4) 
            : ['Full-Stack Engineering', 'Real-Time WebSockets', 'Secure Payment Webhooks', 'RESTful API Design'],
          estimatedBudget: '₹35,000 – ₹55,000',
          estimatedTimeline: '3–4 Weeks',
          complexity: `${brief.complexity || 'Moderate'} Architecture`,
          milestones: brief.suggestedMilestones?.length || 3
        });
        setIsAnalyzing(false);
        return;
      }
    } catch (err) {
      console.warn('API idea analysis fallback to client simulation:', err);
    }

    // Fallback if backend is restarting
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisResult({
        title: ideaText.length > 50 ? ideaText.slice(0, 48) + '...' : ideaText,
        techStack: ['React 18', 'Spring Boot 3', 'WebRTC', 'MongoDB', 'Razorpay Escrow'],
        skills: ['Full-Stack Engineering', 'Real-Time WebSockets', 'Secure Payment Webhooks', 'RESTful API Design'],
        estimatedBudget: '₹35,000 – ₹55,000',
        estimatedTimeline: '3–4 Weeks',
        complexity: 'Moderate-High (82/100)',
        milestones: 3
      });
    }, 600);
  };

  const steps = [
    { num: '01', title: 'Registration & Roles', desc: 'Sign up as Founder or Developer. Role-based access secured via JWT.', icon: Users, color: 'from-blue-500 to-indigo-600' },
    { num: '02', title: 'Idea Submission', desc: 'Describe your software vision in plain language with budget and timeline.', icon: Sparkles, color: 'from-indigo-500 to-purple-600' },
    { num: '03', title: 'AI NLP Analysis', desc: 'AI converts raw concepts into structured briefs: features, stack & complexity.', icon: BrainCircuit, color: 'from-purple-500 to-pink-600' },
    { num: '04', title: '100-Pt Matching Engine', desc: 'Multi-factor scoring: skills (40%), experience (20%), budget (15%), timeline (15%), rating (10%).', icon: Target, color: 'from-pink-500 to-rose-600' },
    { num: '05', title: 'Real-Time Chat', desc: 'Instant collaboration over WebSocket / STOMP with file attachment sharing.', icon: MessageSquare, color: 'from-rose-500 to-orange-600' },
    { num: '06', title: 'Razorpay Escrow', desc: 'Milestone funds deposited safely into platform escrow until work is inspected.', icon: CreditCard, color: 'from-orange-500 to-amber-600' },
    { num: '07', title: 'Task & Progress Kanban', desc: 'Track To-Do, In-Progress, and Done tasks tied to milestones in real-time.', icon: Zap, color: 'from-amber-500 to-emerald-600' },
    { num: '08', title: 'Approval & Rating', desc: 'Founder releases payment on satisfaction. Both parties exchange ratings to build trust.', icon: Award, color: 'from-emerald-500 to-teal-600' },
  ];

  return (
    <div className="min-h-screen">
      
      {/* =========================================================================
          1. HERO SECTION WITH GRADIENT GLOWS, DOTTED GRID & INTERACTIVE IDEA INPUT
          ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
        
        {/* Subtle Dotted Grid Background */}
        <div className="absolute inset-0 bg-grid-dots opacity-60 pointer-events-none -z-20"></div>

        {/* Soft Radial Gradient Glows (Blue Top-Left, Violet Bottom-Right) */}
        <div 
          className="absolute -top-32 -left-32 w-96 sm:w-[500px] h-96 sm:h-[500px] rounded-full bg-blue-500/15 blur-3xl pointer-events-none -z-10"
          aria-hidden="true"
        />
        <div 
          className="absolute top-1/2 -right-32 w-96 sm:w-[550px] h-96 sm:h-[550px] rounded-full bg-violet-600/15 blur-3xl pointer-events-none -z-10"
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-8 shadow-xs">
            <Sparkles className="w-4 h-4 text-blue-600" />
            AI-Powered Founder-Developer Matching Platform
          </div>

          {/* Headline - Preserving Exact Brand & Copy */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.12]">
            Connecting Ideas with Developers — <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 bg-clip-text text-transparent">From Idea to Impact</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Describe your software idea in plain words. Our NLP engine architects the technical brief, ranks the best developers, and guards milestone payments via Razorpay escrow.
          </p>

          {/* CTAs: Primary, Secondary Outline, Tertiary Link */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link
                to={user.role === 'FOUNDER' ? '/founder' : user.role === 'DEVELOPER' ? '/developer' : '/admin'}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5"
              >
                Go to Dashboard <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                {/* Primary CTA */}
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5"
                >
                  Post a Project Idea <ArrowRight className="w-5 h-5" />
                </Link>

                {/* Secondary Outline CTA */}
                <Link
                  to="/register?role=DEVELOPER"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-blue-700 font-bold text-base border-2 border-blue-600 shadow-sm transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <Code2 className="w-5 h-5 text-blue-600" />
                  Join as a Developer
                </Link>
              </>
            )}
          </div>

          {/* Small Trust Line Under CTAs */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Payments secured by Razorpay · Escrow-style milestone protection · Verified developers</span>
          </div>

          {/* =========================================================================
              2. STATS STRIP UNDER CTAS (ANIMATED COUNT-UP ON VIEW)
              ========================================================================= */}
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/90 shadow-sm">
              {HERO_STATS.map((stat) => (
                <div key={stat.id} className="text-center px-2 py-1">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 bg-clip-text text-transparent">
                    <AnimatedStat
                      value={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                      isDecimal={stat.isDecimal}
                    />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-700 mt-1">
                    {stat.label}
                  </div>
                  <div className="text-[10px] text-slate-400 hidden sm:block mt-0.5">
                    {stat.helper}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* =========================================================================
              4. INTERACTIVE IDEA INPUT IN THE HERO
              ========================================================================= */}
          <div className="mt-12 max-w-3xl mx-auto">
            <form onSubmit={handleAnalyzeIdea} className="relative flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl bg-white shadow-xl shadow-blue-500/5 border border-slate-200/90 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
              <div className="flex items-center gap-2 flex-1 w-full pl-3 pr-2">
                <BrainCircuit className="w-5 h-5 text-blue-600 shrink-0" />
                <input
                  type="text"
                  value={ideaText}
                  onChange={(e) => setIdeaText(e.target.value)}
                  placeholder="Describe your idea in one line... (e.g. Telehealth app with video & escrow)"
                  className="w-full py-2.5 text-sm sm:text-base text-slate-900 placeholder-slate-400 bg-transparent outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isAnalyzing || !ideaText.trim()}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition shrink-0"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyse My Idea</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Inspiration Pills */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-400">Try an example:</span>
              {sampleIdeas.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setIdeaText(sample);
                    setTimeout(() => handleAnalyzeIdea(), 50);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-[11px] font-medium border border-slate-200/60 transition cursor-pointer"
                >
                  {sample.length > 36 ? sample.slice(0, 34) + '...' : sample}
                </button>
              ))}
            </div>

            {/* Sample Analysis Panel on Submit */}
            {analysisResult && (
              <div className="mt-6 text-left p-6 rounded-2xl bg-white border border-blue-200 shadow-xl shadow-blue-500/10 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">
                        AI NLP Brief Architected
                      </span>
                      <span className="text-xs text-slate-400">Confidence: 98%</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {analysisResult.title}
                    </h3>
                  </div>
                  <div className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
                    Est. Budget: <span className="text-blue-700 font-bold">{analysisResult.estimatedBudget}</span>
                  </div>
                </div>

                {/* Tech Stack Chips */}
                <div className="mt-4">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Suggested Tech Stack:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.techStack.map((tech) => (
                      <span key={tech} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200/60 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-blue-600" />
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Required Skills */}
                <div className="mt-4">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Key Competencies for Developers:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.skills.map((skill) => (
                      <span key={skill} className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-medium text-xs border border-indigo-200/60">
                        • {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Estimated Budget & Complexity Summary */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                  <div>
                    <span className="text-slate-400 block">Delivery Timeline:</span>
                    <span className="font-bold text-slate-800">{analysisResult.estimatedTimeline}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Milestones Planned:</span>
                    <span className="font-bold text-slate-800">{analysisResult.milestones} Escrow-Protected Stages</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">AI Architecture Complexity:</span>
                    <span className="font-bold text-slate-800">{analysisResult.complexity}</span>
                  </div>
                </div>

                {/* Account CTA Button */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Ready to see vetted developers with matching scores for this exact project?
                  </span>
                  <Link
                    to="/register"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Create free account to see real matches</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* =========================================================================
          3. PRODUCT VISUAL SECTION BELOW THE HERO (BROWSER MOCKUP + FLOATING CARDS)
          ========================================================================= */}
      <section className="relative -mt-4 pb-20 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="relative">
            
            {/* FLOATING CARD 1: TOP-LEFT / AI BRIEF GENERATED */}
            <div className="animate-hero-float absolute -top-6 -left-2 sm:-left-6 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xl shadow-slate-900/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">AI Brief Generated</div>
                <div className="text-[11px] text-slate-500 font-medium">NLP extracted 4 features & 3 milestones</div>
              </div>
            </div>

            {/* FLOATING CARD 2: BOTTOM-RIGHT / MILESTONE FUNDED */}
            <div className="animate-hero-float-alt absolute -bottom-6 -right-2 sm:-right-6 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xl shadow-slate-900/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/25 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Milestone Funded ₹15,000</div>
                <div className="text-[11px] text-emerald-600 font-bold">Secured in Razorpay Escrow</div>
              </div>
            </div>

            {/* BROWSER-FRAME MOCKUP SHELL */}
            <div className="rounded-3xl border border-slate-200/90 bg-white shadow-2xl shadow-indigo-900/10 overflow-hidden">
              
              {/* Browser Header Bar */}
              <div className="px-4 py-3 bg-slate-100/90 border-b border-slate-200/90 flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 max-w-sm mx-auto bg-white rounded-lg px-3 py-1 border border-slate-200/80 flex items-center gap-2 text-xs text-slate-500 font-mono justify-center shadow-2xs">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>devmatch.ai/founder/projects/workspace</span>
                </div>
              </div>

              {/* Founder Dashboard Inside Mockup */}
              <div className="p-4 sm:p-8 bg-slate-50/50">
                
                {/* Mockup Dashboard Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
                        Active Workspace
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Project ID: #DM-7842</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                      Real-Time Telehealth Video Consultation Hub
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Escrow Budget</div>
                      <div className="text-base font-black text-slate-900">₹45,000</div>
                    </div>
                    <div className="text-right pl-3 border-l border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Timeline</div>
                      <div className="text-base font-black text-blue-600">4 Weeks</div>
                    </div>
                  </div>
                </div>

                {/* AI Brief Summary Bar */}
                <div className="mt-5 p-4 rounded-2xl bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <BrainCircuit className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">AI Project Brief Finalized</div>
                      <div className="text-[11px] text-slate-500">Spec architecture: React 18, Spring Boot, WebRTC, Razorpay Escrow</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">React 18</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">Spring Boot</span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold">WebRTC</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold">Escrow Vault</span>
                  </div>
                </div>

                {/* 2 Developer Match Cards with Circular Match Score Rings */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span>Top Algorithmic Matches (100-Point Engine)</span>
                    </div>
                    <span className="text-xs text-blue-600 font-semibold">12 Candidate Profiles Evaluated</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Developer Card 1: Raj Sharma (96% Match) */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-blue-300 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden ring-2 ring-blue-500/30 shrink-0">
                            <img
                              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                              alt="Raj Sharma"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-bold text-slate-900">Raj Sharma</h4>
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            <p className="text-[11px] text-slate-500">Senior Full-Stack Engineer · 5.0 ★ (14 reviews)</p>
                            <p className="text-[11px] font-bold text-slate-700 mt-0.5">₹1,200/hr · 4 yrs experience</p>
                          </div>
                        </div>

                        {/* Circular Score Ring: 96% */}
                        <CircularMatchRing score={96} />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">Java</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">Spring Boot</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">React</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">WebRTC</span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-emerald-600 font-semibold">Perfect Skills & Budget Alignment</span>
                        <span className="font-bold text-blue-600">View Proposal →</span>
                      </div>
                    </div>

                    {/* Developer Card 2: Priya Patel (91% Match) */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-blue-300 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden ring-2 ring-indigo-500/30 shrink-0">
                            <img
                              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
                              alt="Priya Patel"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-bold text-slate-900">Priya Patel</h4>
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            <p className="text-[11px] text-slate-500">React & Cloud Architect · 4.9 ★ (19 reviews)</p>
                            <p className="text-[11px] font-bold text-slate-700 mt-0.5">₹1,400/hr · 5 yrs experience</p>
                          </div>
                        </div>

                        {/* Circular Score Ring: 91% */}
                        <CircularMatchRing score={91} />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">React</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">Node.js</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">WebSockets</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">Docker</span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-indigo-600 font-semibold">High Availability & Proven Delivery</span>
                        <span className="font-bold text-blue-600">View Proposal →</span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          5. "HOW IT WORKS" STRIP (3 STEPS WITH DASHED CONNECTING LINE)
          ========================================================================= */}
      <section className="py-16 bg-slate-50/80 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Simple & Transparent</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              How DevMatch AI Works
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              From natural language idea to verified production code in three guided phases.
            </p>
          </div>

          <div className="relative">
            {/* Connecting Dashed Line (Visible on Desktop / Tablets) */}
            <div 
              className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 border-t-2 border-dashed border-blue-200 z-0" 
              aria-hidden="true"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              
              {/* Step 1 */}
              <div className="text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4 group-hover:scale-105 transition-transform">
                  <BrainCircuit className="w-8 h-8" />
                </div>
                <div className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase mb-2">
                  Step 1
                </div>
                <h3 className="text-lg font-bold text-slate-900">Describe Your Idea</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-xs leading-relaxed">
                  Explain your vision in plain English. Our NLP converts it into a technical spec, required stack, and milestones.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4 group-hover:scale-105 transition-transform">
                  <Target className="w-8 h-8" />
                </div>
                <div className="inline-block px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase mb-2">
                  Step 2
                </div>
                <h3 className="text-lg font-bold text-slate-900">Get Matched by AI</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-xs leading-relaxed">
                  Our 100-point matching engine scores vetted developers on skills overlap, verified experience, rate fit, and availability.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 mb-4 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div className="inline-block px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold uppercase mb-2">
                  Step 3
                </div>
                <h3 className="text-lg font-bold text-slate-900">Pay Per Milestone</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-xs leading-relaxed">
                  Deposit funds safely in Razorpay escrow. Milestones are released only after you test, inspect, and approve the deliverables.
                </p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          8-STEP ROADMAP (PRD SECTION 5)
          ========================================================================= */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Methodology Roadmap</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
              The 8-Step End-to-End Delivery Flow
            </h2>
            <p className="mt-4 text-slate-600 text-base">
              Every project on DevMatch AI follows an engineered lifecycle ensuring clarity, trust, and secure escrow settlement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((st) => {
              const Icon = st.icon;
              return (
                <div 
                  key={st.num}
                  className="relative p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black text-slate-400 group-hover:text-blue-600 transition">
                      STEP {st.num}
                    </span>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${st.color} text-white flex items-center justify-center shadow-md`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition">
                    {st.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          100-POINT MATCHING ENGINE (PRD SECTION 7)
          ========================================================================= */}
      <section id="matching-algorithm" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Algorithmic Precision</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 leading-tight">
                Section 7: The 100-Point Developer Matching Engine
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed text-sm">
                No keyword spam or bidding wars. We score candidates with a multi-variable objective function designed for high-confidence pairing.
              </p>

              <div className="mt-8 space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    40%
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Skills Overlap Score</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Evaluates required skills extracted by NLP against developer's proven verified profile.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                    20%
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Experience & Portfolio</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Calculated by years of professional software delivery and completed DevMatch projects.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                    15%
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Budget Range Fit</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Developer hourly expectations aligned with founder budget boundaries.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                    15%
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Availability & Timeline</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Guarantees developers have dedicated bandwidth to hit agreed milestones.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                    10%
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Platform Reputation</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Historical reviews. New developers start with a neutral 5-point boost.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Worked Example Card */}
            <div className="lg:col-span-6">
              <div className="bg-slate-50/50 rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-bl-xl">
                  PRD Worked Example
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-white overflow-hidden ring-2 ring-blue-500/30">
                    <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" 
                      alt="Raj Sharma"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">Raj Sharma</h3>
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">Available</span>
                    </div>
                    <p className="text-xs text-slate-500">Full Stack Engineer (Java, Spring Boot, React, MongoDB)</p>
                  </div>
                </div>

                <div className="mb-6 p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700">Calculated Compatibility:</span>
                    <span className="text-2xl font-black text-blue-700">81% MATCH</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '81%' }}></div>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-600">Skills match (3 of 4 required)</span>
                    <span className="font-bold text-slate-800">30.0 / 40 pts</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-600">Experience (2 yrs + 4 projects)</span>
                    <span className="font-bold text-slate-800">12.0 / 20 pts</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-600">Budget fit (₹1,200/hr vs budget)</span>
                    <span className="font-bold text-slate-800">15.0 / 15 pts</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-600">Timeline Availability</span>
                    <span className="font-bold text-slate-800">15.0 / 15 pts</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-600">Reviews & Ratings (4.5 ★)</span>
                    <span className="font-bold text-slate-800">9.0 / 10 pts</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 text-sm font-bold text-blue-900">
                    <span>Total Score</span>
                    <span className="text-lg text-blue-700">81.0 / 100</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          ESCROW & RAZORPAY SECURITY
          ========================================================================= */}
      <section id="escrow-security" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Financial Safety</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold mt-2 leading-tight">
                  Escrow-Style Milestone Payments via Razorpay
                </h2>
                <p className="mt-4 text-slate-300 text-sm leading-relaxed">
                  Funds are secured before work starts and held in platform escrow. Payment is released to the developer only when the founder inspects and approves the milestone.
                </p>

                <div className="mt-6 space-y-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>No upfront full payment risks for non-technical founders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Guaranteed payouts for developers upon delivering approved code</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Razorpay test mode enabled out-of-the-box for instant verification</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-300 mb-4">Milestone Escrow State Machine</div>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span>1. PENDING</span>
                    <span className="text-slate-400">Milestone agreed</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-200">
                    <span>2. PAID_HELD (Escrow)</span>
                    <span className="text-blue-300 font-semibold">Deposit secured</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200">
                    <span>3. COMPLETED</span>
                    <span className="text-amber-300 font-semibold">Submitted for review</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200">
                    <span>4. APPROVED_RELEASED</span>
                    <span className="text-emerald-300 font-semibold">Payment released</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
