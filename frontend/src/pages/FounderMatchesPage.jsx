import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';
import { 
  Sparkles, 
  Target, 
  Award, 
  ArrowRight, 
  Code2, 
  Clock, 
  DollarSign, 
  Star, 
  CheckCircle2, 
  User, 
  Layers, 
  FolderKanban, 
  PlusCircle, 
  RotateCcw,
  Zap,
  Check
} from 'lucide-react';

export default function FounderMatchesPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [matches, setMatches] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    loadFounderProjects();
  }, []);

  const loadFounderProjects = async () => {
    try {
      setLoadingProjects(true);
      const res = await api.get('/projects/my');
      if (res.data?.data) {
        const myProjects = res.data.data;
        setProjects(myProjects);
        
        // Auto-select first open project or first project
        const openProj = myProjects.find((p) => p.status === 'OPEN') || myProjects[0];
        if (openProj) {
          setSelectedProjectId(openProj.id);
          loadMatchesForProject(openProj.id);
        }
      }
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadMatchesForProject = async (projectId) => {
    if (!projectId) return;
    try {
      setLoadingMatches(true);
      const res = await api.get(`/projects/${projectId}/matches`);
      if (res.data?.data) {
        const enriched = await Promise.all(
          res.data.data.map(async (m) => {
            try {
              const uRes = await api.get(`/users/${m.developerId}`);
              return { ...m, developer: uRes.data?.data };
            } catch {
              return m;
            }
          })
        );
        // Sort highest match score first
        enriched.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
        setMatches(enriched);
      } else {
        setMatches([]);
      }
    } catch (err) {
      console.warn('Failed to load matches for project', err);
      setMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
    loadMatchesForProject(projectId);
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> 100-Point AI Matching Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            AI Developer Matches
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Algorithmically ranked developers scored across skills (40%), experience (20%), budget (15%), timeline (15%), and rating (10%).
          </p>
        </div>

        <Link
          to="/create-project"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" /> Post New Project
        </Link>
      </div>

      {loadingProjects ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/4"></div>
          <div className="h-20 bg-slate-100 rounded"></div>
        </div>
      ) : projects.length === 0 ? (
        /* NO PROJECTS EMPTY STATE */
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/90 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Target className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No active projects to match
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Create your first project. Our AI NLP engine will automatically generate the required skills and calculate top developer matches instantly.
          </p>
          <Link
            to="/create-project"
            className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md transition"
          >
            <PlusCircle className="w-4 h-4" /> Create Your First Project
          </Link>
        </div>
      ) : (
        <>
          {/* PROJECT SELECTOR BAR */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Target Project for Developer Ranking
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedProjectId}
                  onChange={(e) => handleSelectProject(e.target.value)}
                  className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 font-bold max-w-md w-full"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.status.replace('_', ' ')})
                    </option>
                  ))}
                </select>

                {selectedProject && (
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 uppercase">
                      {selectedProject.category}
                    </span>
                    <span className="text-emerald-600">
                      Budget: ${selectedProject.budgetMin} - ${selectedProject.budgetMax}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-blue-600">
                      Timeline: {selectedProject.timeline}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => loadMatchesForProject(selectedProjectId)}
                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                title="Recalculate AI Match Scores"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loadingMatches ? 'animate-spin' : ''}`} />
                Re-score Matches
              </button>
              {selectedProject && (
                <button
                  onClick={() => navigate(`/project/${selectedProject.id}`)}
                  className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition flex items-center gap-1.5"
                >
                  Open Workspace <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* MATCHES LIST */}
          {loadingMatches ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 h-44"></div>
              ))}
            </div>
          ) : matches.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200/90 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                No developer matches found (Score ≥ 40)
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Developers matching your required technical skills and budget will appear here automatically as candidates register or update their profiles.
              </p>
              {selectedProject && (
                <button
                  onClick={() => navigate(`/project/${selectedProject.id}`)}
                  className="mt-4 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition inline-flex items-center gap-1.5"
                >
                  View Project Workspace <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <span>Top Ranked Developers ({matches.length})</span>
                <span className="text-[10px] lowercase text-slate-400 font-normal">
                  — sorted by total algorithmic compatibility score
                </span>
              </div>

              {matches.map((m, idx) => {
                const dev = m.developer || {};
                const isTopMatch = idx === 0;
                const isHired = selectedProject?.hiredDeveloperId === m.developerId;

                return (
                  <div
                    key={m.id || idx}
                    className={`bg-white rounded-2xl p-6 border transition-all duration-200 shadow-xs hover:shadow-md ${
                      isTopMatch
                        ? 'border-blue-400 ring-2 ring-blue-500/10'
                        : isHired
                        ? 'border-emerald-400 bg-emerald-50/20'
                        : 'border-slate-200/90'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                      
                      {/* LEFT: DEV PROFILE & BADGES */}
                      <div className="flex items-start gap-4 flex-1">
                        {/* Circular SVG Match Ring */}
                        <div className="relative flex items-center justify-center shrink-0">
                          <svg className="w-16 h-16 transform -rotate-90">
                            <circle
                              cx="32"
                              cy="32"
                              r="26"
                              stroke="currentColor"
                              strokeWidth="5"
                              className="text-slate-100"
                              fill="transparent"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="26"
                              stroke="currentColor"
                              strokeWidth="5"
                              strokeDasharray={163.36}
                              strokeDashoffset={163.36 - (163.36 * (m.totalScore || 0)) / 100}
                              strokeLinecap="round"
                              className={
                                m.totalScore >= 80
                                  ? 'text-emerald-500'
                                  : m.totalScore >= 60
                                  ? 'text-blue-600'
                                  : 'text-amber-500'
                              }
                              fill="transparent"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-sm font-black text-slate-900 leading-none">
                              {Math.round(m.totalScore || 0)}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                              PTS
                            </span>
                          </div>
                        </div>

                        {/* DEV INFO */}
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">
                              {dev.name || 'Verified Developer'}
                            </h3>

                            {isTopMatch && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs">
                                <Award className="w-3 h-3" /> #1 Best Match
                              </span>
                            )}

                            {isHired && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3" /> Hired Developer
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-500 line-clamp-2 max-w-2xl leading-relaxed">
                            {dev.bio || 'Experienced software engineer ready to build production-grade features.'}
                          </p>

                          {/* SKILLS CHIPS */}
                          {dev.skills && dev.skills.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              {dev.skills.map((skill, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-700"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* METADATA CHIPS */}
                          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-600 font-medium">
                            <span className="flex items-center gap-1 text-blue-700 font-bold">
                              <Code2 className="w-3.5 h-3.5" />
                              {dev.yearsOfExperience || 2}+ Years Exp
                            </span>
                            <span className="flex items-center gap-1 text-emerald-700 font-bold">
                              <DollarSign className="w-3.5 h-3.5" />
                              ${dev.expectedRate || 40}/hr
                            </span>
                            <span className="flex items-center gap-1 text-amber-600 font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              {(dev.averageRating || 5.0).toFixed(1)} / 5.0
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* RIGHT: 5-FACTOR SCORING BREAKDOWN & ACTION */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full lg:w-auto shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0">
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] space-y-1.5 min-w-[200px]">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Algorithm Breakdown
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span className="text-slate-600">Tech Skills (40):</span>
                            <span className="text-blue-600 font-mono font-bold">
                              {m.skillScore || 0} / 40
                            </span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span className="text-slate-600">Experience (20):</span>
                            <span className="text-indigo-600 font-mono font-bold">
                              {m.experienceScore || 0} / 20
                            </span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span className="text-slate-600">Budget Fit (15):</span>
                            <span className="text-emerald-600 font-mono font-bold">
                              {m.budgetScore || 0} / 15
                            </span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span className="text-slate-600">Timeline Fit (15):</span>
                            <span className="text-purple-600 font-mono font-bold">
                              {m.timelineScore || 0} / 15
                            </span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span className="text-slate-600">Rating (10):</span>
                            <span className="text-amber-600 font-mono font-bold">
                              {m.ratingScore || 0} / 10
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => navigate(`/project/${selectedProject.id}`)}
                            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                          >
                            Open Workspace & Hire <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

    </div>
  );
}

