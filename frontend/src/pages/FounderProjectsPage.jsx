import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';
import { 
  PlusCircle, 
  Layers, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  ArrowRight, 
  Trash2, 
  Sparkles,
  FolderKanban,
  Search,
  Filter,
  UserCheck,
  AlertCircle
} from 'lucide-react';

export default function FounderProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'DRAFT'
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadMyProjects();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    const filterParam = params.get('status');
    if (searchParam !== null) {
      setSearchQuery(searchParam);
    }
    if (filterParam) {
      setStatusFilter(filterParam.toUpperCase());
    }
  }, [location.search]);

  const handleSearchInput = (val) => {
    setSearchQuery(val);
    const params = new URLSearchParams(location.search);
    if (val) {
      params.set('search', val);
    } else {
      params.delete('search');
    }
    const queryString = params.toString();
    navigate(queryString ? `/founder/projects?${queryString}` : '/founder/projects', { replace: true });
  };

  const loadMyProjects = async () => {
    try {
      setLoading(true);
      setError('');
      // Strictly loads only this particular authenticated founder's created projects
      const res = await api.get('/projects/my');
      if (res.data?.data) {
        setProjects(res.data.data);
      }
    } catch (err) {
      setError('Failed to load your projects. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async (e, projectId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this draft project?')) return;
    try {
      await api.delete(`/projects/${projectId}`);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete project');
    }
  };

  // Status Counts
  const counts = useMemo(() => {
    return {
      all: projects.length,
      open: projects.filter((p) => p.status === 'OPEN').length,
      inProgress: projects.filter((p) => p.status === 'IN_PROGRESS').length,
      completed: projects.filter((p) => p.status === 'COMPLETED').length,
      draft: projects.filter((p) => p.status === 'DRAFT').length,
    };
  }, [projects]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(projects.map((p) => p.category).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [projects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Status filter
      if (statusFilter !== 'ALL' && project.status !== statusFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'ALL' && project.category !== categoryFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = project.title?.toLowerCase().includes(q);
        const descMatch = project.description?.toLowerCase().includes(q);
        const catMatch = project.category?.toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !catMatch) return false;
      }
      return true;
    });
  }, [projects, statusFilter, categoryFilter, searchQuery]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            DRAFT
          </span>
        );
      case 'OPEN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            OPEN FOR BIDS
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            IN PROGRESS
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            COMPLETED
          </span>
        );
      case 'DISPUTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
            DISPUTED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <FolderKanban className="w-3.5 h-3.5" /> Founder Projects Portfolio
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Projects
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track and manage all projects posted by your account, review incoming bids, and monitor progress.
          </p>
        </div>

        <Link
          to="/create-project"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Project
        </Link>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-4">
        {/* TOP STATUS TABS */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Projects ({counts.all})
          </button>
          <button
            onClick={() => setStatusFilter('OPEN')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'OPEN'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Open for Bids ({counts.open})
          </button>
          <button
            onClick={() => setStatusFilter('IN_PROGRESS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'IN_PROGRESS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            In Progress ({counts.inProgress})
          </button>
          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'COMPLETED'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Completed ({counts.completed})
          </button>
          {counts.draft > 0 && (
            <button
              onClick={() => setStatusFilter('DRAFT')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === 'DRAFT'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Drafts ({counts.draft})
            </button>
          )}
        </div>

        {/* SEARCH AND CATEGORY CONTROLS */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search your projects by title or keywords..."
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {categories.length > 2 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-medium"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'ALL' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SKELETON LOADING STATE */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 h-36"></div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        /* EMPTY STATE */
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/90 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {projects.length === 0
              ? 'No projects created yet'
              : 'No projects match your filter'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {projects.length === 0
              ? 'Describe your software vision in plain language. Our AI NLP engine will automatically generate the tech stack, milestones, and match scores.'
              : 'Try clearing your search or switching status tabs to find other projects.'}
          </p>

          {projects.length === 0 ? (
            <Link
              to="/create-project"
              className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md hover:opacity-95 transition"
            >
              <PlusCircle className="w-4 h-4" /> Start Your First Project
            </Link>
          ) : (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setCategoryFilter('ALL');
                setSearchQuery('');
              }}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        /* PROJECTS LIST */
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/project/${project.id}`)}
              className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:-translate-y-1 hover:shadow-md hover:border-blue-400 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 uppercase tracking-wide">
                      {project.category}
                    </span>
                    {getStatusBadge(project.status)}
                    {project.hiredDeveloperId && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <UserCheck className="w-3 h-3 text-indigo-600" />
                        Developer Hired
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {project.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 max-w-3xl leading-relaxed">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-6 pt-1 text-xs font-semibold text-slate-600">
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <DollarSign className="w-3.5 h-3.5" /> Budget: ${project.budgetMin} - ${project.budgetMax}
                    </span>
                    <span className="flex items-center gap-1.5 text-blue-600">
                      <Clock className="w-3.5 h-3.5" /> Timeline: {project.timeline}
                    </span>
                    <span className="text-slate-400 font-normal">
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {project.status === 'DRAFT' && (
                    <button
                      onClick={(e) => handleDeleteDraft(e, project.id)}
                      title="Delete Draft"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 group-hover:bg-blue-600 group-hover:text-white"
                  >
                    Open Workspace <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

