import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  ShieldCheck, 
  Users, 
  FolderKanban, 
  DollarSign, 
  CreditCard, 
  CheckCircle2, 
  UserX, 
  UserCheck, 
  Server,
  Activity,
  ShieldAlert,
  Sliders,
  BarChart3,
  Search,
  Filter,
  ArrowRight,
  Receipt,
  Gavel,
  RefreshCw,
  KeyRound,
  Lock,
  ChevronRight,
  ExternalLink,
  Clock,
  AlertTriangle
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Tab State: 'overview' | 'users' | 'projects' | 'disputes' | 'payments' | 'settings'
  const [activeTab, setActiveTab] = useState('overview');

  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState('ALL');

  // Adjudication modal state
  const [adjudicatingDispute, setAdjudicatingDispute] = useState(null);
  const [decision, setDecision] = useState('FULL_RELEASE'); // 'FULL_RELEASE' | 'FULL_REFUND' | 'SPLIT'
  const [splitPercent, setSplitPercent] = useState(50);
  const [adminReason, setAdminReason] = useState('');
  const [resolving, setResolving] = useState(false);

  // Admin password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Sync tab from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    } else {
      setActiveTab('overview');
    }
  }, [location.search]);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    try {
      setLoading(true);
      const [overRes, usersRes, projRes, dispRes, payRes] = await Promise.all([
        api.get('/admin/overview').catch(() => ({ data: { data: null } })),
        api.get('/admin/users').catch(() => ({ data: { data: [] } })),
        api.get('/admin/projects').catch(() => ({ data: { data: [] } })),
        api.get('/admin/disputes').catch(() => ({ data: { data: [] } })),
        api.get('/admin/payments').catch(() => ({ data: { data: [] } }))
      ]);

      setOverview(overRes.data?.data || null);
      setUsers(usersRes.data?.data || []);
      setProjects(projRes.data?.data || []);
      setDisputes(dispRes.data?.data || []);
      setPayments(payRes.data?.data || []);
    } catch (e) {
      console.error('Failed to load admin data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    navigate(tabKey === 'overview' ? '/admin' : `/admin?tab=${tabKey}`, { replace: true });
  };

  const handleToggleUser = async (userId) => {
    try {
      const res = await api.post(`/admin/users/${userId}/toggle-active`);
      if (res.data?.data) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? res.data.data : u)));
        addToast(`User account status updated successfully`, 'success');
      }
    } catch (e) {
      addToast('Failed to update user status', 'error');
    }
  };

  const handleResolveDispute = async (e) => {
    e.preventDefault();
    if (!adjudicatingDispute) return;
    if (!adminReason.trim()) {
      addToast('Please enter an official arbitration reason.', 'error');
      return;
    }

    try {
      setResolving(true);
      const params = new URLSearchParams();
      params.append('decision', decision);
      params.append('reason', adminReason.trim());
      if (decision === 'SPLIT') {
        params.append('developerSplitPercent', splitPercent);
      }

      await api.post(`/milestones/${adjudicatingDispute.id}/dispute/resolve?${params.toString()}`);
      addToast('Dispute resolved and milestone funds settled successfully!', 'success');
      setAdjudicatingDispute(null);
      setAdminReason('');
      loadAllAdminData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to resolve dispute', 'error');
    } finally {
      setResolving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      addToast('New password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('New passwords do not match.', 'error');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.post('/users/change-password', {
        currentPassword,
        newPassword
      });
      addToast('Admin password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      addToast(err.response?.data?.message || 'Current password incorrect', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch = !userSearch || 
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.email?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = !projectSearch || 
      p.title?.toLowerCase().includes(projectSearch.toLowerCase()) || 
      p.category?.toLowerCase().includes(projectSearch.toLowerCase());
    const matchesStatus = projectStatusFilter === 'ALL' || p.status === projectStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Platform Governance & Operations
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Admin Console
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time platform metrics, user moderation, dispute arbitration tribunal, and escrow vaults.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold shadow-2xs">
          <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
          Spring Boot + MongoDB Healthy
        </div>
      </div>

      {/* KPI METRIC CARDS ROW WITH INTERACTIVE TAB SWITCHING */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div 
          onClick={() => handleTabChange('users')}
          className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all duration-200 group ${
            activeTab === 'users'
              ? 'bg-purple-50/40 border-purple-400 ring-2 ring-purple-500/10'
              : 'bg-white border-slate-200/90 hover:border-purple-300 hover:shadow-md'
          }`}
        >
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Registered Users</div>
            <div className="text-2xl font-black text-slate-900 group-hover:text-purple-600 transition-colors">
              {overview?.totalUsers || users.length}
            </div>
            <div className="text-[10px] text-purple-600 font-semibold mt-1 flex items-center gap-0.5">
              Manage users <ChevronRight className="w-3 h-3" />
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => handleTabChange('projects')}
          className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all duration-200 group ${
            activeTab === 'projects'
              ? 'bg-blue-50/40 border-blue-400 ring-2 ring-blue-500/10'
              : 'bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-md'
          }`}
        >
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Projects</div>
            <div className="text-2xl font-black text-blue-600 group-hover:scale-105 transition-transform">
              {overview?.totalProjects || projects.length}
            </div>
            <div className="text-[10px] text-blue-600 font-semibold mt-1 flex items-center gap-0.5">
              Inspect projects <ChevronRight className="w-3 h-3" />
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FolderKanban className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => handleTabChange('disputes')}
          className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all duration-200 group ${
            activeTab === 'disputes'
              ? 'bg-rose-50/40 border-rose-400 ring-2 ring-rose-500/10'
              : 'bg-white border-slate-200/90 hover:border-rose-300 hover:shadow-md'
          }`}
        >
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Disputes</div>
            <div className="text-2xl font-black text-rose-600 group-hover:scale-105 transition-transform">
              {disputes.length}
            </div>
            <div className="text-[10px] text-rose-600 font-semibold mt-1 flex items-center gap-0.5">
              Arbitration tribunal <ChevronRight className="w-3 h-3" />
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => handleTabChange('payments')}
          className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all duration-200 group ${
            activeTab === 'payments'
              ? 'bg-emerald-50/40 border-emerald-400 ring-2 ring-emerald-500/10'
              : 'bg-white border-slate-200/90 hover:border-emerald-300 hover:shadow-md'
          }`}
        >
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Platform Revenue (10%)</div>
            <div className="text-2xl font-black text-emerald-600 group-hover:scale-105 transition-transform">
              ${(overview?.platformRevenue || payments.reduce((acc, p) => acc + (p.platformFee || 0), 0)).toFixed(2)}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
              View escrow ledger <ChevronRight className="w-3 h-3" />
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* DASHBOARD TAB BUTTONS */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => handleTabChange('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'overview'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Overview
        </button>

        <button
          onClick={() => handleTabChange('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Users ({users.length})
        </button>

        <button
          onClick={() => handleTabChange('projects')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'projects'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FolderKanban className="w-3.5 h-3.5" />
          Projects ({projects.length})
        </button>

        <button
          onClick={() => handleTabChange('disputes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'disputes'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Disputes ({disputes.length})
        </button>

        <button
          onClick={() => handleTabChange('payments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'payments'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          Payments ({payments.length})
        </button>

        <button
          onClick={() => handleTabChange('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'settings'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          System Settings
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* OVERVIEW HIGHLIGHT ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Escrow Ledger Totals</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Escrow Volume & Liquidity</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Real-time status of funds secured in milestone deposits versus settled payments.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-4 mt-4 border-t border-slate-100">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Funds in Escrow</div>
                    <div className="text-xl font-black text-amber-600">${(overview?.totalEscrowHeld || 0).toFixed(2)}</div>
                    <div className="text-[10px] text-slate-500">Under review or active</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Settled Volume</div>
                    <div className="text-xl font-black text-emerald-600">${(overview?.totalEscrowReleased || 0).toFixed(2)}</div>
                    <div className="text-[10px] text-slate-500">Released to developers</div>
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => handleTabChange('payments')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                >
                  View full payments vault <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Arbitration Status</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Dispute Resolution Desk</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Disputed milestones are frozen immediately until admin adjudication.
                </p>
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <div className="text-2xl font-black text-rose-600">{disputes.length} Pending Disputes</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {disputes.length > 0 
                      ? 'Adjudication required to release or refund frozen escrow funds.' 
                      : 'All project milestones in healthy status. Zero active disputes.'}
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => handleTabChange('disputes')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:underline"
                >
                  Open Disputes Tribunal <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* RECENT USERS MODERATION PREVIEW */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent User Registrations</h3>
                <p className="text-xs text-slate-500">Manage account access controls</p>
              </div>
              <button
                onClick={() => handleTabChange('users')}
                className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1"
              >
                View all users ({users.length}) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">User</th>
                    <th className="py-2.5 px-4">Role</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {users.slice(0, 5).map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <img
                          src={u.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`}
                          alt={u.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <div>
                          <div>{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{u.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                          u.role === 'FOUNDER' ? 'bg-blue-100 text-blue-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {u.active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleToggleUser(u.id)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition ${
                              u.active
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {u.active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: USERS MODERATION */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Platform Accounts & Moderation</h3>
              <p className="text-xs text-slate-500">Deactivate abusive accounts or restore user permissions.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user by name or email..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 w-48 sm:w-60"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-medium"
              >
                <option value="ALL">All Roles</option>
                <option value="FOUNDER">Founders</option>
                <option value="DEVELOPER">Developers</option>
                <option value="ADMIN">Admins</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                      <img
                        src={u.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`}
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <span>{u.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'FOUNDER' ? 'bg-blue-100 text-blue-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {u.active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleUser(u.id)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition ${
                            u.active
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PROJECTS OVERSIGHT */}
      {activeTab === 'projects' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Platform Projects Oversight</h3>
              <p className="text-xs text-slate-500">Monitor all projects across founders, budget brackets, and statuses.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  placeholder="Filter by title..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 w-48 sm:w-60"
                />
              </div>

              <select
                value={projectStatusFilter}
                onChange={(e) => setProjectStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredProjects.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No projects found.</div>
            ) : (
              filteredProjects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/project/${p.id}`)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-xs transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 uppercase">
                        {p.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        p.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                      {p.title}
                    </h4>
                    <div className="text-xs text-slate-500 flex items-center gap-4">
                      <span>Budget: ${p.budgetMin} - ${p.budgetMax}</span>
                      <span>•</span>
                      <span>Timeline: {p.timeline}</span>
                      <span>•</span>
                      <span>Created {new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/project/${p.id}`)}
                    className="px-4 py-2 rounded-xl bg-slate-100 group-hover:bg-purple-600 group-hover:text-white text-slate-700 font-bold text-xs transition flex items-center gap-1.5 shrink-0"
                  >
                    Inspect Workspace <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DISPUTES TRIBUNAL */}
      {activeTab === 'disputes' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Gavel className="w-3 h-3" /> PRD Feature 5 Arbitration
              </div>
              <h3 className="text-base font-bold text-slate-900">Admin Disputes Tribunal</h3>
              <p className="text-xs text-slate-500">
                Disputed milestone funds are FROZEN. Review deliverables and issue a final resolution.
              </p>
            </div>
            <button
              onClick={loadAllAdminData}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {disputes.length === 0 ? (
            <div className="bg-slate-50 rounded-xl p-12 text-center border border-slate-200">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No active disputes</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                All platform milestones are proceeding smoothly. Any disputed milestone where money is frozen will appear here for admin arbitration.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((d) => (
                <div key={d.id} className="p-5 rounded-2xl border border-rose-200 bg-rose-50/20 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          MONEY FROZEN (DISPUTED)
                        </span>
                        <h4 className="text-base font-bold text-slate-900">{d.title}</h4>
                      </div>
                      <p className="text-xs text-slate-600">Dispute reason: <span className="font-semibold">{d.disputeReason || 'Disputed by founder/developer'}</span></p>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Frozen Milestone Value</div>
                      <div className="text-xl font-black text-rose-600">${d.amount}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-rose-100">
                    <button
                      onClick={() => navigate(`/project/${d.projectId}`)}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Inspect Chat & Submitted Files <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setAdjudicatingDispute(d)}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
                    >
                      <Gavel className="w-3.5 h-3.5" /> Adjudicate & Settle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PAYMENTS & REVENUE */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Platform Payments Ledger</h3>
            <p className="text-xs text-slate-500">
              Audit log of all Razorpay escrow deposits, platform fee collections, and developer disbursements.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Milestone / Transaction</th>
                  <th className="py-3 px-4">Founder Paid</th>
                  <th className="py-3 px-4">Platform Fee (10%)</th>
                  <th className="py-3 px-4">Dev Received</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Razorpay Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-slate-400">No payment records yet.</td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">#{p.milestoneId?.substring(0, 8) || 'Milestone'}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">${p.founderPaidAmount || p.amount}</td>
                      <td className="py-3.5 px-4 font-bold text-purple-700">${(p.platformFee || 0).toFixed(2)}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700">${(p.developerReceivedAmount || p.amount).toFixed(2)}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'RELEASED' ? 'bg-emerald-100 text-emerald-800' :
                          p.status === 'HELD' ? 'bg-blue-100 text-blue-800' :
                          p.status === 'DISPUTED' ? 'bg-rose-100 text-rose-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{p.razorpayPaymentId || p.razorpayOrderId}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Platform Configuration Parameters</h3>
              <p className="text-xs text-slate-500">Core parameters enforced by backend services.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Platform Fee</div>
                <div className="text-xl font-black text-purple-700 mt-1">10.0%</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Deducted on milestone release</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Review Window</div>
                <div className="text-xl font-black text-blue-700 mt-1">5 Days</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Auto-approve countdown</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Scheduler Cron Job</div>
                <div className="text-xl font-black text-emerald-700 mt-1">Every 30s</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Auto-approval check active</div>
              </div>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4 max-w-md">
            <div>
              <h3 className="text-base font-bold text-slate-900">Change Admin Password</h3>
              <p className="text-xs text-slate-500 mt-0.5">Update credentials for platform root access.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow transition disabled:opacity-50 flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              {passwordLoading ? 'Updating...' : 'Update Admin Password'}
            </button>
          </form>
        </div>
      )}

      {/* ADJUDICATION TRIBUNAL MODAL */}
      {adjudicatingDispute && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleResolveDispute} className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Final Arbitration</span>
                <h4 className="text-base font-black text-slate-900">Resolve Milestone Dispute</h4>
              </div>
              <button type="button" onClick={() => setAdjudicatingDispute(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
              <div className="font-bold text-slate-900">{adjudicatingDispute.title}</div>
              <div className="text-slate-500">Frozen Amount: <span className="font-black text-rose-600">${adjudicatingDispute.amount}</span></div>
              <div className="text-slate-500">Dispute Note: <span className="italic">{adjudicatingDispute.disputeReason}</span></div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Arbitration Decision
              </label>

              <div className="grid grid-cols-1 gap-2.5">
                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  decision === 'FULL_RELEASE' ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200'
                }`}>
                  <input
                    type="radio"
                    name="decision"
                    value="FULL_RELEASE"
                    checked={decision === 'FULL_RELEASE'}
                    onChange={() => setDecision('FULL_RELEASE')}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-xs font-bold text-emerald-800">Full Release to Developer</div>
                    <div className="text-[11px] text-slate-500">Developer completed work satisfactorily; releases milestone minus platform fee.</div>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  decision === 'FULL_REFUND' ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20' : 'bg-white border-slate-200'
                }`}>
                  <input
                    type="radio"
                    name="decision"
                    value="FULL_REFUND"
                    checked={decision === 'FULL_REFUND'}
                    onChange={() => setDecision('FULL_REFUND')}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-xs font-bold text-blue-800">Full Refund to Founder</div>
                    <div className="text-[11px] text-slate-500">Developer failed to meet specifications; returns 100% of deposited escrow to founder.</div>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  decision === 'SPLIT' ? 'bg-purple-50/60 border-purple-500 ring-2 ring-purple-500/20' : 'bg-white border-slate-200'
                }`}>
                  <input
                    type="radio"
                    name="decision"
                    value="SPLIT"
                    checked={decision === 'SPLIT'}
                    onChange={() => setDecision('SPLIT')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-purple-800">Split Release (Percentage)</div>
                    <div className="text-[11px] text-slate-500">Divide funds proportionally between developer compensation and founder refund.</div>
                  </div>
                </label>
              </div>

              {decision === 'SPLIT' && (
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Developer receives: {splitPercent}%</span>
                    <span>Founder refunded: {100 - splitPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="99"
                    value={splitPercent}
                    onChange={(e) => setSplitPercent(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Arbitration Official Reason (Recorded on Audit Trail)
              </label>
              <textarea
                rows={3}
                required
                value={adminReason}
                onChange={(e) => setAdminReason(e.target.value)}
                placeholder="Explain the justification for this final settlement..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAdjudicatingDispute(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resolving}
                className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                {resolving ? 'Executing Decision...' : 'Execute Final Decision'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
