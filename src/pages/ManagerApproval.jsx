const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Edit3, Brain, Shield, Clock, Loader2, Minus, Plus } from 'lucide-react';

import ChartCard from '@/components/ChartCard';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

export default function ManagerApproval() {
  const { toast } = useToast();
  const [pendingRecs, setPendingRecs] = useState([]);
  const [reviewedRecs, setReviewedRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState('');
  const [managerName, setManagerName] = useState('');

  useEffect(() => {
    db.auth.me().then(u => setManagerName(u?.full_name || '')).catch(() => {});
    loadRecs();
  }, []);

  const loadRecs = async () => {
    setLoading(true);
    try {
      const all = await db.entities.ProductionRecommendation.list('-target_date', 100);
      const pending = (all || []).filter(r => r.status === 'pending').map(r => ({ ...r, adjustedQuantity: r.recommended_quantity }));
      const reviewed = (all || []).filter(r => r.status !== 'pending');
      setPendingRecs(pending);
      setReviewedRecs(reviewed);
    } catch (e) {
      setPendingRecs([]);
      setReviewedRecs([]);
    } finally {
      setLoading(false);
    }
  };

  const adjustQty = (id, delta) => {
    setPendingRecs(prev => prev.map(r => r.id === id ? { ...r, adjustedQuantity: Math.max(0, r.adjustedQuantity + delta) } : r));
  };

  const setQty = (id, val) => {
    setPendingRecs(prev => prev.map(r => r.id === id ? { ...r, adjustedQuantity: Math.max(0, parseInt(val) || 0) } : r));
  };

  const handleSubmit = async (action) => {
    setSubmitting(true);
    try {
      const updates = pendingRecs.map(r => {
        const modified = r.adjustedQuantity !== r.recommended_quantity;
        const update = {
          id: r.id,
          status: action === 'rejected' ? 'rejected' : (modified ? 'modified' : 'approved'),
          manager_name: managerName || 'Manager',
          manager_comments: comments,
          review_date: new Date().toISOString()
        };
        if (action !== 'rejected') {
          update.adjusted_quantity = r.adjustedQuantity;
        }
        return update;
      });

      await db.entities.ProductionRecommendation.bulkUpdate(updates);

      const modifiedCount = updates.filter(u => u.status === 'modified').length;
      toast({
        title: action === 'rejected' ? 'Plan Rejected' : 'Plan Approved',
        description: action === 'rejected'
          ? `${pendingRecs.length} recommendations rejected.`
          : `${pendingRecs.length} approved${modifiedCount > 0 ? ` (${modifiedCount} modified)` : ''}.`,
      });

      setComments('');
      loadRecs();
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to submit review.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-[hsl(152,56%,40%)] animate-spin" /></div>;
  }

  if (pendingRecs.length === 0) {
    return (
      <div className="p-4 lg:p-6">
        <h1 className="text-2xl font-bold text-[hsl(152,56%,12%)] tracking-tight mb-6">Manager Approval</h1>
        <EmptyState
          icon={CheckCircle}
          title="No Pending Approvals"
          description={reviewedRecs.length > 0 ? "All recommendations have been reviewed." : "Generate AI predictions to start the approval process."}
          action={reviewedRecs.length === 0 ? <Link to="/" className="px-4 py-2.5 rounded-xl bg-[hsl(152,50%,94%)] text-[hsl(152,56%,30%)] text-sm font-semibold">Go to Dashboard</Link> : null}
        />
        {reviewedRecs.length > 0 && (
          <div className="mt-8">
            <ChartCard title="Review History" subtitle={`${reviewedRecs.length} past reviews`}>
              <ReviewedTable recs={reviewedRecs} />
            </ChartCard>
          </div>
        )}
      </div>
    );
  }

  const modifiedCount = pendingRecs.filter(r => r.adjustedQuantity !== r.recommended_quantity).length;
  const totalQty = pendingRecs.reduce((s, r) => s + r.adjustedQuantity, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(152,56%,12%)] tracking-tight">Manager Approval</h1>
          <p className="text-sm text-[hsl(152,10%,45%)] mt-1">Review, modify, and approve AI production recommendations</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-200">
          <Shield className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-semibold text-amber-700">Human Approval Required</span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[hsl(150,30%,97%)] to-white rounded-2xl border border-[hsl(150,15%,90%)] p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(152,56%,30%)] to-[hsl(140,60%,45%)] flex items-center justify-center shrink-0">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[hsl(152,56%,15%)]">AI Advisory — Human Decision</p>
          <p className="text-xs text-[hsl(152,10%,45%)] mt-0.5 leading-relaxed">
            Adjust any quantity before approval. The AI recommends — you decide.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-[hsl(150,15%,92%)] p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-[hsl(152,10%,45%)] uppercase tracking-wide font-medium">Total Units</p>
                <p className="text-xl font-bold text-[hsl(152,56%,20%)]">{totalQty}</p>
              </div>
              <div>
                <p className="text-xs text-[hsl(152,10%,45%)] uppercase tracking-wide font-medium">Items</p>
                <p className="text-xl font-bold text-[hsl(152,56%,20%)]">{pendingRecs.length}</p>
              </div>
              <div>
                <p className="text-xs text-[hsl(152,10%,45%)] uppercase tracking-wide font-medium">Modified</p>
                <p className="text-xl font-bold text-amber-600">{modifiedCount}</p>
              </div>
            </div>
          </div>

          {pendingRecs.map((rec) => {
            const isModified = rec.adjustedQuantity !== rec.recommended_quantity;
            return (
              <div key={rec.id} className={cn("bg-white rounded-2xl border p-5 transition-all", isModified ? "border-amber-300 shadow-sm" : "border-[hsl(150,15%,92%)]")}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-[hsl(152,56%,12%)]">{rec.product} <span className="text-xs font-normal text-[hsl(152,10%,45%)]">· {rec.target_date}</span></h3>
                      {isModified && <StatusBadge status="modified" />}
                    </div>
                    <p className="text-xs text-[hsl(152,10%,45%)] mt-0.5 line-clamp-2">{rec.reasoning}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-[hsl(152,10%,50%)]">AI: <strong className="text-[hsl(152,56%,30%)]">{rec.recommended_quantity}</strong></span>
                      <span className="text-xs text-[hsl(152,10%,50%)]">Confidence: <strong className="text-[hsl(152,56%,30%)]">{rec.confidence}%</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2 bg-[hsl(150,20%,97%)] rounded-xl p-1">
                      <button onClick={() => adjustQty(rec.id, -1)} className="w-8 h-8 rounded-lg bg-white hover:bg-[hsl(150,30%,94%)] flex items-center justify-center transition-colors">
                        <Minus className="w-4 h-4 text-[hsl(152,56%,30%)]" />
                      </button>
                      <input
                        type="number"
                        value={rec.adjustedQuantity}
                        onChange={(e) => setQty(rec.id, e.target.value)}
                        className="w-14 text-center bg-transparent font-bold text-lg text-[hsl(152,56%,12%)] focus:outline-none"
                      />
                      <button onClick={() => adjustQty(rec.id, 1)} className="w-8 h-8 rounded-lg bg-white hover:bg-[hsl(150,30%,94%)] flex items-center justify-center transition-colors">
                        <Plus className="w-4 h-4 text-[hsl(152,56%,30%)]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <ChartCard title="Review Information">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[hsl(152,10%,45%)] uppercase tracking-wide">Manager</label>
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="Your name"
                  className="w-full mt-1 px-3 py-2 text-sm bg-[hsl(150,20%,97%)] border border-[hsl(150,15%,90%)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(152,56%,30%)]/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[hsl(152,10%,45%)] uppercase tracking-wide">Date & Time</label>
                <p className="text-sm text-[hsl(152,56%,15%)] mt-1">{new Date().toLocaleString()}</p>
              </div>
            </div>
          </ChartCard>

          <ChartCard title="Comments">
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add notes or feedback..."
              rows={4}
              className="w-full px-3 py-2 text-sm bg-[hsl(150,20%,97%)] border border-[hsl(150,15%,90%)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(152,56%,30%)]/20 resize-none"
            />
          </ChartCard>

          <div className="space-y-2">
            <button
              onClick={() => handleSubmit('approved')}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[hsl(152,56%,30%)] to-[hsl(152,50%,35%)] text-white text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {submitting ? 'Submitting...' : 'Approve Production Plan'}
            </button>
            <button
              onClick={() => handleSubmit('rejected')}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-700 text-sm font-semibold border border-red-200 hover:bg-red-100 transition-all disabled:opacity-60"
            >
              <XCircle className="w-4 h-4" />
              Reject All
            </button>
          </div>
        </div>
      </div>

      {reviewedRecs.length > 0 && (
        <ChartCard title="Review History" subtitle={`${reviewedRecs.length} past reviews`}>
          <ReviewedTable recs={reviewedRecs} />
        </ChartCard>
      )}
    </div>
  );
}

function ReviewedTable({ recs }) {
  return (
    <div className="overflow-x-auto -mx-5 px-5">
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="border-b border-[hsl(150,15%,90%)]">
            <th className="text-left py-2.5 px-2 font-semibold text-xs text-[hsl(152,10%,45%)] uppercase tracking-wide">Product</th>
            <th className="text-right py-2.5 px-2 font-semibold text-xs text-[hsl(152,10%,45%)] uppercase tracking-wide">Recommended</th>
            <th className="text-right py-2.5 px-2 font-semibold text-xs text-[hsl(152,10%,45%)] uppercase tracking-wide">Adjusted</th>
            <th className="text-left py-2.5 px-2 font-semibold text-xs text-[hsl(152,10%,45%)] uppercase tracking-wide">Status</th>
            <th className="text-left py-2.5 px-2 font-semibold text-xs text-[hsl(152,10%,45%)] uppercase tracking-wide">Manager</th>
            <th className="text-left py-2.5 px-2 font-semibold text-xs text-[hsl(152,10%,45%)] uppercase tracking-wide">Date</th>
          </tr>
        </thead>
        <tbody>
          {recs.map((r) => (
            <tr key={r.id} className="border-b border-[hsl(150,15%,94%)] hover:bg-[hsl(150,30%,97%)] transition-colors">
              <td className="py-3 px-2 font-medium text-[hsl(152,56%,15%)]">{r.product}</td>
              <td className="py-3 px-2 text-right text-[hsl(152,10%,55%)]">{r.recommended_quantity}</td>
              <td className="py-3 px-2 text-right text-[hsl(152,56%,20%)] font-semibold">{r.adjusted_quantity ?? '—'}</td>
              <td className="py-3 px-2"><StatusBadge status={r.status} /></td>
              <td className="py-3 px-2 text-[hsl(152,10%,45%)] text-xs">{r.manager_name || '—'}</td>
              <td className="py-3 px-2 text-[hsl(152,10%,45%)] text-xs">{r.review_date ? new Date(r.review_date).toLocaleDateString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}