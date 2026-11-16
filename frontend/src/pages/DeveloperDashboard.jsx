import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import { 
  Code2, 
  Sparkles, 
  ArrowRight, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  Layers, 
  TrendingUp, 
  User, 
  AlertCircle,
  FileText,
  Send,
  Lock,
  Briefcase,
  Compass,
  Search,
  Filter,
  ShieldCheck,
  CheckSquare,
  MessageSquare,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export default function DeveloperDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Active Tab state: 'matches' | 'browse' | 'proposals' | 'active' | 'messages'
  const [activeTab, setActiveTab] = useState('matches');
  const [matches, setMatches] = useState([]);
  const [browseProjects, setBrowseProjects] = useState([]);
  const [myProposals, setMyProposals] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Proposal modal
  const [applyingProject, setApplyingProject] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [estimatedWeeks, setEstimatedWeeks] = useState(2);
  const [coverLetter, setCoverLetter] = useState('');
  const [proposalTouched, setProposalTouched] = useState({});
  const [submittingProposal, setSubmittingProposal] = useState(false);

  // Sync tab and search from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchFilter(searchParam);
    }
  }, [location.search]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [matchesRes, browseRes, propsRes, convRes] = await Promise.all([
        api.get('/developers/matches').catch(() => ({ data: { data: [] } })),
        api.get('/projects/browse').catch(() => ({ data: { data: [] } })),
        api.get('/proposals/my').catch(() => ({ data: { data: [] } })),
        api.get('/conversations').catch(() => ({ data: { data: [] } }))
      ]);

      if (matchesRes.data?.data) {
        const enriched = await Promise.all(
          matchesRes.data.data.map(async (m) => {
            try {
              const pRes = await api.get(`/projects/${m.projectId}`);
              return { ...m, project: pRes.data?.data };
            } catch {
              return m;
            }
          })
        );
        setMatches(enriched.filter((m) => m.project));
      }

      setBrowseProjects(browseRes.data?.data || []);

      if (propsRes.data?.data) {
        const enrichedProps = await Promise.all(
          propsRes.data.data.map(async (prop) => {
            try {
              const pRes = await api.get(`/projects/${prop.projectId}`);
              return { ...prop, project: pRes.data?.data };
            } catch {
              return prop;
            }
          })
        );
        setMyProposals(enrichedProps);
      }

      setConversations(convRes.data?.data || []);

    } catch (e) {
      console.error('Failed to load developer dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    navigate(`/developer?tab=${tabKey}`, { replace: true });
  };

  const handleOpenApplyModal = (e, project) => {
    e.stopPropagation();
    setApplyingProject(project);
    setBidAmount(project.budgetMin || 1000);
    setEstimatedWeeks(2);
    setCoverLetter('');
    setProposalTouched({});
  };

  const proposalBidError = React.useMemo(() => {
    const val = Number(bidAmount);
    if (isNaN(val) || val <= 0) return 'Quoted amount must be a number greater than 0';
    return '';
  }, [bidAmount]);

  const proposalWeeksError = React.useMemo(() => {
    const w = Number(estimatedWeeks);
    if (isNaN(w) || w < 1 || w > 52 || !Number.isInteger(w)) return 'Estimated timeline must be between 1 and 52 weeks';
    return '';
  }, [estimatedWeeks]);

  const proposalCoverError = React.useMemo(() => {
    const len = coverLetter.trim().length;
    if (len < 50) return `Proposal message must be at least 50 characters (currently ${len}/50)`;
    if (len > 1000) return `Proposal message cannot exceed 1,000 characters (currently ${len}/1000)`;
    return '';
  }, [coverLetter]);

  const isProposalOverBudget = React.useMemo(() => {
    if (!applyingProject?.budgetMax) return false;
    return Number(bidAmount) > Number(applyingProject.budgetMax);
  }, [bidAmount, applyingProject]);

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    if (!applyingProject) return;
    setProposalTouched({ bid: true, weeks: true, cover: true });

    if (proposalBidError || proposalWeeksError || proposalCoverError) {
      addToast('Please fix validation errors before submitting proposal', 'error');
      return;
    }

    try {
      setSubmittingProposal(true);
      const res = await api.post(`/projects/${applyingProject.id}/proposals`, {
        bidAmount: Number(bidAmount),
        estimatedWeeks: Number(estimatedWeeks),
        estimatedDays: Number(estimatedWeeks) * 7,
        coverLetter: coverLetter.trim()
      });

      if (res.data?.data) {
        addToast('Proposal submitted successfully! The founder will review your application.', 'success');
        setApplyingProject(null);
        loadAllData();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to submit proposal', 'error');
    } finally {
      setSubmittingProposal(false);
    }
  };

  const filteredBrowseProjects = browseProjects
    .filter((p) => {
      // If someone else was hired, do not show in open browse market
      const isHiredForThis = Boolean(user?.id && (p.hiredDeveloperId === user?.id || p.selectedDeveloperId === user?.id));
      const isSomeoneElseHired = Boolean(
        (p.hiredDeveloperId && p.hiredDeveloperId !== user?.id) ||
        (p.selectedDeveloperId && p.selectedDeveloperId !== user?.id) ||
        (p.status && p.status !== 'OPEN' && !isHiredForThis)
      );
      return !isSomeoneElseHired;
    })
    .filter((p) => {
      const matchesSearch = !searchFilter || 
        p.title?.toLowerCase().includes(searchFilter.toLowerCase()) || 
        p.description?.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

  const visibleMatches = matches.filter((m) => {
    const p = m.project;
    if (!p) return false;
    const isHiredForThis = Boolean(user?.id && (p.hiredDeveloperId === user?.id || p.selectedDeveloperId === user?.id));
    const isSomeoneElseHired = Boolean(
      (p.hiredDeveloperId && p.hiredDeveloperId !== user?.id) ||
      (p.selectedDeveloperId && p.selectedDeveloperId !== user?.id) ||
      (p.status && p.status !== 'OPEN' && !isHiredForThis)
    );
    return !isSomeoneElseHired;
  });

  // Active contracts: accepted proposals where developer is hired
  const activeContracts = myProposals.filter((p) => 
    p.status === 'ACCEPTED' || p.project?.status === 'IN_PROGRESS' || p.project?.hiredDeveloperId === user?.id
  );

  return (
    <div className="space-y-6">
      
      {/* KPI METRIC CARDS ROW WITH INTERACTIVE TAB SWITCHING */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: MATCHES */}
        <div 
          onClick={() => handleTabChange('matches')}
          className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all duration-200 group ${
            activeTab === 'matches' 
              ? 'bg-blue-50/40 border-blue-400 ring-2 ring-blue-500/10' 
              : 'bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-md'
          }`}
        >
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ranked Matches</div>
            <div className="text-2xl font-black text-blue-600 group-hover:scale-105 transition-transform">{visibleMatches.length}</div>
            <div className="text-[10px] text-blue-600 font-semibold mt-1 flex items-center gap-0.5">
              View matches <ChevronRight className="w-3 h-3" />
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        {/* CARD 2: BROWSE OPEN GIGS */}
        <div 
          onClick={() => handleTabChange('browse')}
          className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all duration-200 group ${
            activeTab === 'browse' 
              ? 'bg-emerald-50/40 border-emerald-400 ring-2 ring-emerald-500/10' 
              : 'bg-white border-slate-200/90 hover:border-emerald-300 hover:shadow-md'
          }`}
        >
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Open Projects</div>
            <div className="text-2xl font-black text-emerald-600 group-hover:scale-105 transition-transform">{browseProjects.length}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
              Browse market <ChevronRight className="w-3 h-3" />
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
        </div>

        {/* CARD 3: MY PROPOSALS */}
        <div 
          onClick={() => handleTabChange('proposals')}
          className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all duration-200 group ${
            activeTab === 'proposals' 
              ? 'bg-indigo-50/40 border-indigo-400 ring-2 ring-indigo-500/10' 
              : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-md'
          }`}
        >
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">My Proposals</div>
            <div className="text-2xl font-black text-indigo-600 group-hover:scale-105 transition-transform">{myProposals.length}</div>
            <div className="text-[10px] text-indigo-600 font-semibold mt-1 flex items-center gap-0.5">
              Track bids <ChevronRight className="w-3 h-3" />
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* CARD 4: ACTIVE CONTRACTS */}
        <div 
          onClick={() => handleTabChange('active')}
          className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all duration-200 group ${
            activeTab === 'active' 
              ? 'bg-purple-50/40 border-purple-400 ring-2 ring-purple-500/10' 
              : 'bg-white border-slate-200/90 hover:border-purple-300 hover:shadow-md'
          }`}
        >
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Projects</div>
            <div className="text-2xl font-black text-purple-700 group-hover:scale-105 transition-transform">{activeContracts.length}</div>
            <div className="text-[10px] text-purple-600 font-semibold mt-1 flex items-center gap-0.5">
              Open workspaces <ChevronRight className="w-3 h-3" />
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* DASHBOARD TAB CONTROLS & SEARCH */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => handleTabChange('matches')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'matches'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Recommended Matches ({matches.length})
          </button>

          <button
            onClick={() => handleTabChange('browse')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'browse'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Browse Open Gigs ({filteredBrowseProjects.length})
          </button>

          <button
            onClick={() => handleTabChange('proposals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'proposals'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            My Proposals ({myProposals.length})
          </button>

          <button
            onClick={() => handleTabChange('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'active'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Active Projects ({activeContracts.length})
          </button>

          <button
            onClick={() => handleTabChange('messages')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'messages'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Messages ({conversations.length})
          </button>
        </div>

        {activeTab === 'browse' && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter by title or stack..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none font-medium"
            >
              <option value="ALL">All Domains</option>
              <option value="Web Application">Web Apps</option>
              <option value="FinTech & Payments">FinTech</option>
              <option value="AI & Machine Learning">AI / ML</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: RECOMMENDED MATCHES */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          {visibleMatches.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No project matches found yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Make sure your verified skills and bio are up to date on your developer profile.
              </p>
              <Link
                to="/developer/profile"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                Update Profile Skills
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {visibleMatches.map((m, idx) => {
                const p = m.project;
                const isTop = idx === 0;
                const isHiredForThis = Boolean(user?.id && (p?.hiredDeveloperId === user?.id || p?.selectedDeveloperId === user?.id));
                const existingProp = myProposals.find((prop) => prop.projectId === p?.id);

                return (
                  <div
                    key={m.id}
                    onClick={() => navigate(`/project/${p?.id}`)}
                    className={`bg-white rounded-2xl p-6 border transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                      isHiredForThis ? 'border-emerald-500 ring-2 ring-emerald-500/20' :
                      isTop ? 'border-blue-400 ring-2 ring-blue-500/20' : 'border-slate-200'
                    }`}
                  >
                    {isHiredForThis ? (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-600 to-teal-600 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-2xs">
                        Hired Developer
                      </div>
                    ) : isTop && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-indigo-600 to-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-2xs">
                        Top Recommendation
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                            {p?.category}
                          </span>
                          {isHiredForThis && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              You are Hired
                            </span>
                          )}
                          {existingProp && !isHiredForThis && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                              Proposal Sent (${existingProp.bidAmount})
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-blue-600">{Math.round(m.totalScore)}%</span>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Match</span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                        {p?.title}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                        {p?.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 mb-4">
                        <span className="flex items-center gap-1 text-emerald-600">
                          <DollarSign className="w-3.5 h-3.5" /> ${p?.budgetMin} - ${p?.budgetMax}
                        </span>
                        <span className="flex items-center gap-1 text-blue-600">
                          <Clock className="w-3.5 h-3.5" /> {p?.timeline}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-[11px] text-slate-400">Escrow Protected</span>
                      {isHiredForThis ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/project/${p?.id}`); }}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Open Workspace
                        </button>
                      ) : existingProp ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleTabChange('proposals'); }}
                          className="px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold text-xs transition flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View Proposal
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleOpenApplyModal(e, p)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1"
                        >
                          Apply with Proposal <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BROWSE OPEN PROJECTS */}
      {activeTab === 'browse' && (
        <div className="space-y-4">
          {filteredBrowseProjects.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No open projects found</h4>
              <p className="text-xs text-slate-500 mt-1">Check back soon for newly posted founder requirements.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBrowseProjects.map((p) => {
                const isHiredForThis = Boolean(user?.id && (p.hiredDeveloperId === user?.id || p.selectedDeveloperId === user?.id));
                const existingProp = myProposals.find((prop) => prop.projectId === p.id);

                return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/project/${p.id}`)}
                  className="bg-white rounded-2xl p-6 border border-slate-200 hover:-translate-y-1 hover:shadow-md hover:border-blue-400 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 uppercase">
                        {p.category}
                      </span>
                      {isHiredForThis ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          HIRED
                        </span>
                      ) : existingProp ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          PROPOSAL SENT
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          OPEN
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-slate-900 mb-2">{p.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">{p.description}</p>

                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-4 pt-2 border-t border-slate-100">
                      <span className="text-emerald-600 font-bold">${p.budgetMin} - ${p.budgetMax}</span>
                      <span className="text-slate-400">{p.timeline}</span>
                    </div>
                  </div>

                  {isHiredForThis ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/project/${p.id}`); }}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Open Workspace
                    </button>
                  ) : existingProp ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleTabChange('proposals'); }}
                      className="w-full py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" /> View Proposal
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleOpenApplyModal(e, p)}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      Send Proposal <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MY PROPOSALS */}
      {activeTab === 'proposals' && (
        <div className="space-y-4">
          {myProposals.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No proposals submitted yet</h4>
              <p className="text-xs text-slate-500 mt-1">Browse open gigs and apply to land your next milestone contract.</p>
              <button
                onClick={() => handleTabChange('browse')}
                className="mt-4 px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm hover:bg-blue-700 transition"
              >
                Browse Open Gigs
              </button>
            </div>
          ) : (
            myProposals.map((p) => {
              const isAccepted = p.status === 'ACCEPTED';
              const isClosed = p.status === 'CLOSED_NOT_SELECTED';

              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl p-6 border transition-all duration-200 ${
                    isAccepted ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:-translate-y-1 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-base font-bold text-slate-900">{p.project?.title || p.projectTitle || 'Project Proposal'}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isAccepted ? 'bg-emerald-100 text-emerald-800' :
                          isClosed ? 'bg-slate-100 text-slate-600' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {p.status === 'CLOSED_NOT_SELECTED' ? 'CLOSED (ANOTHER DEV HIRED)' : p.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">Submitted {new Date(p.createdAt).toLocaleDateString()}</div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">My Bid</div>
                        <div className="text-base font-black text-emerald-600">${p.bidAmount}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Est. Delivery</div>
                        <div className="text-base font-black text-blue-600">{p.estimatedDays} days</div>
                      </div>
                    </div>
                  </div>

                  <p className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed mb-3">
                    {p.coverLetter}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">
                      {isClosed ? 'This project is in progress with another developer' : 'Under active founder review'}
                    </span>
                    {isAccepted && (
                      <Link
                        to={`/project/${p.projectId}`}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-xs hover:opacity-95 transition flex items-center gap-1.5"
                      >
                        Open Workspace & Escrow <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 4: ACTIVE PROJECTS */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h3 className="text-base font-bold text-slate-900">Active Hired Projects</h3>
              <p className="text-xs text-slate-500">
                Software projects where your proposal was accepted and development is in progress.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {activeContracts.length} Active Contracts
            </span>
          </div>

          {activeContracts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No active projects right now</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                When a founder accepts your proposal, the project moves to IN_PROGRESS and your shared workspace with escrow milestones unlocks here.
              </p>
              <button
                onClick={() => handleTabChange('browse')}
                className="mt-5 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow transition hover:bg-blue-700"
              >
                Browse Open Projects & Apply
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeContracts.map((c) => {
                const proj = c.project || {};
                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-2xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 uppercase">
                            {proj.category || 'Web Application'}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            IN PROGRESS
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            HIRED DEVELOPER
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900">
                          {proj.title || c.projectTitle || 'Software Project'}
                        </h3>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {proj.description || c.coverLetter}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Contract Value</div>
                        <div className="text-lg font-black text-emerald-600">${c.bidAmount || proj.budgetMax}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{c.estimatedDays} days delivery target</div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-semibold text-blue-600">
                          <ShieldCheck className="w-4 h-4" /> Fund-First Escrow Rule Active
                        </span>
                        <span>•</span>
                        <span>5-Day Review Window Protected</span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => navigate(`/project/${c.projectId}?tab=chat`)}
                          className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Founder Chat
                        </button>
                        <button
                          onClick={() => navigate(`/project/${c.projectId}`)}
                          className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
                        >
                          Open Workspace & Milestones <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: MESSAGES / CONVERSATIONS */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h3 className="text-base font-bold text-slate-900">Project Messages</h3>
              <p className="text-xs text-slate-500">
                WhatsApp-style real-time WebSocket communication channels with your project founders.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              STOMP WebSocket Active
            </span>
          </div>

          {conversations.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No conversations yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                Under DevMatch security rules, conversations unlock automatically between you and the founder once a project hire is confirmed.
              </p>
              <button
                onClick={() => handleTabChange('browse')}
                className="mt-5 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow transition hover:bg-blue-700"
              >
                Browse Projects & Get Hired
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => navigate(`/project/${conv.projectId}?tab=chat`)}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          Project #{conv.projectId?.substring(0, 8)} Communication Channel
                        </h4>
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {conv.lastMessage || 'Direct encrypted chat between founder and developer.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/project/${conv.projectId}?tab=chat`)}
                    className="px-4 py-2 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700 font-bold text-xs transition flex items-center gap-1.5 shrink-0"
                  >
                    Open Live Chat <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PROPOSAL SUBMISSION MODAL */}
      {applyingProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmitProposal} noValidate className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-base font-black text-slate-900">Submit Contract Proposal</h4>
                <p className="text-xs text-slate-500 truncate max-w-sm">{applyingProject.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setApplyingProject(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Over Budget Warning Banner */}
            {isProposalOverBudget && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Above Founder's Budget:</span> Your quote (${bidAmount}) is higher than the founder's maximum budget (${applyingProject.budgetMax}). You can still submit, but consider keeping bids competitive.
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* QUOTE AMOUNT */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Quoted Amount ($ USD) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  onBlur={() => setProposalTouched(prev => ({ ...prev, bid: true }))}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition ${
                    proposalBidError && proposalTouched.bid ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
                  }`}
                />
                {proposalBidError && proposalTouched.bid && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{proposalBidError}</p>
                )}
                <span className="text-[10px] text-slate-400 mt-0.5 block">Budget: ${applyingProject.budgetMin || 500} - ${applyingProject.budgetMax || 3000}</span>
              </div>

              {/* ESTIMATED TIMELINE IN WEEKS */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Timeline (1–52 Weeks) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="52"
                  step="1"
                  value={estimatedWeeks}
                  onChange={(e) => setEstimatedWeeks(e.target.value)}
                  onBlur={() => setProposalTouched(prev => ({ ...prev, weeks: true }))}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition ${
                    proposalWeeksError && proposalTouched.weeks ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
                  }`}
                />
                {proposalWeeksError && proposalTouched.weeks && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{proposalWeeksError}</p>
                )}
                <span className="text-[10px] text-slate-400 mt-0.5 block">{estimatedWeeks * 7} calendar days</span>
              </div>
            </div>

            {/* PROPOSAL MESSAGE */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Proposal Message & Strategy <span className="text-rose-500">*</span>
                </label>
                <span className={`text-[11px] font-bold ${coverLetter.length < 50 || coverLetter.length > 1000 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {coverLetter.length} / 1,000 characters (min 50)
                </span>
              </div>
              <textarea
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                onBlur={() => setProposalTouched(prev => ({ ...prev, cover: true }))}
                placeholder="Highlight relevant projects, architecture recommendations, and how you will tackle the key deliverables in this milestone..."
                className={`w-full p-3.5 rounded-xl border text-xs focus:outline-none transition leading-relaxed ${
                  proposalCoverError && proposalTouched.cover ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
                }`}
              />
              {proposalCoverError && proposalTouched.cover && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{proposalCoverError}</p>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setApplyingProject(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingProposal}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                {submittingProposal ? 'Submitting Proposal...' : 'Send Formal Proposal'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
