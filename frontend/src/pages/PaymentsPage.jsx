import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { 
  CreditCard, 
  ShieldCheck, 
  ArrowDownLeft, 
  ArrowUpRight, 
  DollarSign, 
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  AlertCircle,
  Clock,
  Ban
} from 'lucide-react';

export default function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments/my');
      if (res.data?.data) {
        setPayments(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load payments ledger:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (milestoneId, amount) => {
    const reason = window.prompt(`Issue Stripe refund for $${amount} USD? Enter reason:`, 'Test mode refund');
    if (!reason) return;

    try {
      setActionLoading(true);
      setFeedbackMsg(null);
      const res = await api.post('/payments/stripe/refund', { milestoneId, reason });
      if (res.data?.data) {
        setFeedbackMsg({ type: 'success', text: `Refund of $${amount} USD processed successfully via Stripe Test Mode!` });
        await loadTransactions();
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.response?.data?.message || 'Refund failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const totalHeld = payments.filter(p => p.status === 'HELD').reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalReleased = payments.filter(p => p.status === 'RELEASED').reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalRefunded = payments.filter(p => p.status === 'REFUNDED').reduce((acc, p) => acc + (p.amount || 0), 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RELEASED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">RELEASED</span>;
      case 'HELD':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">HELD IN ESCROW</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">PENDING</span>;
      case 'REFUNDED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">REFUNDED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">CANCELLED</span>;
      case 'FAILED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">FAILED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Stripe Test Mode Gateway
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payments & Escrow Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Every transaction is verified server-side with Stripe and held safely in platform escrow until milestone approval.
          </p>
        </div>

        <button
          onClick={loadTransactions}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs flex items-center gap-1.5 self-start"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className={`mb-6 p-4 rounded-2xl text-xs font-medium flex items-center gap-2 border ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">Total Transactions</div>
          <div className="text-2xl font-black text-slate-900">{payments.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Stripe Checkout records</div>
        </div>

        <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-200 shadow-xs">
          <div className="text-xs text-blue-700 font-semibold mb-1">Held in Platform Escrow</div>
          <div className="text-2xl font-black text-blue-800">${totalHeld.toFixed(2)}</div>
          <div className="text-[10px] text-blue-600 mt-1">Locked until milestone approval</div>
        </div>

        <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="text-xs text-emerald-700 font-semibold mb-1">Approved & Released</div>
          <div className="text-2xl font-black text-emerald-800">${totalReleased.toFixed(2)}</div>
          <div className="text-[10px] text-emerald-600 mt-1">Settled to developer payout</div>
        </div>

        <div className="bg-purple-50/70 p-5 rounded-2xl border border-purple-200 shadow-xs">
          <div className="text-xs text-purple-700 font-semibold mb-1">Refunded in Test Mode</div>
          <div className="text-2xl font-black text-purple-800">${totalRefunded.toFixed(2)}</div>
          <div className="text-[10px] text-purple-600 mt-1">Returned to founder test balance</div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recorded Payment History</h3>
            <p className="text-[11px] text-slate-400">Chronological ledger of Stripe sessions and milestone settlements</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Stripe Test Mode
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading ledger...</div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No payments recorded yet. Deposit milestone funds to view ledger entries.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Milestone</th>
                  <th className="py-3.5 px-6">Gateway</th>
                  <th className="py-3.5 px-6">Amount (USD)</th>
                  <th className="py-3.5 px-6">Escrow Status</th>
                  <th className="py-3.5 px-6">Stripe Reference</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {payments.map((p) => {
                  const stripeRef = p.stripePaymentIntentId || p.stripeSessionId || p.razorpayPaymentId || p.razorpayOrderId || 'N/A';
                  const canRefund = (user?.role === 'FOUNDER' || user?.role === 'ADMIN') && p.status === 'HELD' && p.stripePaymentIntentId;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {p.milestoneId ? `Milestone #${p.milestoneId.substring(0, 6)}...` : 'Project Funding'}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {p.paymentGateway || 'STRIPE'}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-extrabold text-slate-900">
                        ${p.amount?.toFixed ? p.amount.toFixed(2) : p.amount}
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(p.status)}
                      </td>
                      <td className="py-4 px-6 font-mono text-[11px] text-slate-500 max-w-xs truncate" title={stripeRef}>
                        {stripeRef.length > 22 ? stripeRef.substring(0, 20) + '...' : stripeRef}
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap space-x-2">
                        {p.receiptUrl && (
                          <a
                            href={p.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            <span>Receipt</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        {canRefund && (
                          <button
                            onClick={() => handleRefund(p.milestoneId, p.amount)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold border border-rose-200 transition"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Refund</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
