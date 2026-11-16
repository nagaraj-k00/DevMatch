import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import FounderProjectsPage from './FounderProjectsPage';
import FounderMatchesPage from './FounderMatchesPage';
import FounderSettingsPage from './FounderSettingsPage';
import { 
  PlusCircle, 
  Layers, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  FolderKanban,
  MessageSquare,
  CreditCard,
  UserCheck,
  ChevronRight
} from 'lucide-react';

export default function FounderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If URL has tab=projects or tab=settings, render the corresponding dedicated page
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab');
  if (currentTab === 'projects') {
    return <FounderProjectsPage />;
  }
  if (currentTab === 'matches') {
    return <FounderMatchesPage />;
  }
  if (currentTab === 'settings') {
    return <FounderSettingsPage />;
  }

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects/my');
      if (res.data?.data) {
        setProjects(res.data.data);
      }
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const inProgressProjects = projects.filter((p) => p.status === 'IN_PROGRESS');
  const openProjects = projects.filter((p) => p.status === 'OPEN');
  const completedProjects = projects.filter((p) => p.status === 'COMPLETED');
  const recentProjects = projects.slice(0, 3);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">DRAFT</span>;
      case 'OPEN':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">OPEN FOR BIDS</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">IN PROGRESS</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">COMPLETED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      
      {/* WELCOME BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-7 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" /> Founder Command Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Welcome back, {user?.name || 'Founder'}!
          </h1>
          <p className="text-xs text-blue-100/90 leading-relaxed">
            Manage your project portfolio, review incoming developer proposals, and release milestone escrow payments safely.
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <Link
              to="/create-project"
              className="px-4 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-xs shadow hover:bg-blue-50 transition flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> Post New Project
            </Link>
            <Link
              to="/founder/projects"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md transition flex items-center gap-2"
            >
              <FolderKanban className="w-4 h-4" /> View My Projects ({projects.length})
            </Link>
          </div>
        </div>

        {/* Decorative circle glow */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div 
          onClick={() => navigate('/founder/projects')}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-400 hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Total Projects
            </div>
            <div className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
              {projects.length}
            </div>
            <div className="text-[10px] text-blue-600 font-semibold mt-1 flex items-center gap-1">
              View all projects <ChevronRight className="w-3 h-3" />
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FolderKanban className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => navigate('/founder/projects?status=in_progress')}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-400 hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              In Progress
            </div>
            <div className="text-2xl font-black text-blue-600">
              {inProgressProjects.length}
            </div>
            <div className="text-[10px] text-blue-600 font-semibold mt-1">
              Active developer hire
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => navigate('/founder/projects?status=open')}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-400 hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Open for Bids
            </div>
            <div className="text-2xl font-black text-emerald-600">
              {openProjects.length}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-1">
              Accepting proposals
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => navigate('/payments')}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-400 hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Escrow Vault
            </div>
            <div className="text-2xl font-black text-purple-700">
              ${projects.reduce((acc, p) => acc + (p.budgetMax || 0), 0)}
            </div>
            <div className="text-[10px] text-purple-600 font-semibold mt-1 flex items-center gap-1">
              Manage escrow <ChevronRight className="w-3 h-3" />
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* RECENT PROJECTS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Recent Projects Overview
            </h2>
            <p className="text-xs text-slate-500">
              Your latest posted projects and ongoing collaboration workspaces
            </p>
          </div>

          <Link
            to="/founder/projects"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
          >
            Open "My Projects" page ({projects.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 h-28"></div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200/90 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <FolderKanban className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No projects yet</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Create your first project to let AI generate feature breakdowns and match verified developers.
            </p>
            <Link
              to="/create-project"
              className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow transition"
            >
              <PlusCircle className="w-4 h-4" /> Post Your First Project
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:-translate-y-0.5 hover:shadow-md hover:border-blue-400 transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 uppercase">
                      {project.category}
                    </span>
                    {getStatusBadge(project.status)}
                    {project.hiredDeveloperId && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                        <UserCheck className="w-3 h-3" /> Hired
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {project.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                    <span className="text-emerald-600 font-bold">
                      ${project.budgetMin} - ${project.budgetMax}
                    </span>
                    <span>Timeline: {project.timeline}</span>
                    <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-bold text-xs transition flex items-center gap-1.5 shrink-0"
                >
                  Workspace <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {projects.length > 3 && (
              <div className="text-center pt-2">
                <Link
                  to="/founder/projects"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 font-bold text-xs shadow-xs transition"
                >
                  <FolderKanban className="w-4 h-4 text-blue-600" />
                  View All {projects.length} Projects on "My Projects" Page
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* QUICK WORKFLOW & ESCROW ASSURANCE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Need another feature or app built?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Describe your software idea in simple words. Our AI NLP engine automatically creates technical briefs, milestones, and matches skilled developers.
            </p>
          </div>
          <div className="pt-4">
            <Link
              to="/create-project"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition"
            >
              Post New Project <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Escrow Protection (Fund-First Rule)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Milestone payments are securely held in platform escrow until work is delivered and approved. You have a 5-day review window to test code before funds are released.
            </p>
          </div>
          <div className="pt-4">
            <Link
              to="/payments"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition"
            >
              Open Escrow Ledger <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
