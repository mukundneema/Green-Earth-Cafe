const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Package, Loader2, Sparkles } from 'lucide-react';

import ChartCard from '@/components/ChartCard';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { generatePredictions } from '@/lib/aiService';
import { useToast } from '@/components/ui/use-toast';

export default function Recommendations() {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const loadRecs = async () => {
    setLoading(true);
    try {
      const data = await db.entities.ProductionRecommendation.list('-target_date', 100);
      setRecs(data || []);
    } catch (e) {
      setRecs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRecs(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generatePredictions();
      toast({ title: 'Predictions Generated', description: `${result.count} recommendations created.` });
      loadRecs();
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-[hsl(152,56%,40%)] animate-spin" /></div>;
  }

  if (recs.length === 0) {
    return (
      <div className="p-4 lg:p-6">
        <h1 className="text-2xl font-bold text-[hsl(152,56%,12%)] tracking-tight mb-6">Recommendations</h1>
        <EmptyState
          icon={Brain}
          title="No AI Predictions Yet"
          description="Import your sales data and generate AI predictions to see production recommendations here."
          action={
            <div className="flex gap-2">
              <Link to="/" className="px-4 py-2.5 rounded-xl bg-[hsl(152,50%,94%)] text-[hsl(152,56%,30%)] text-sm font-semibold">Import Data</Link>
              <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[hsl(152,56%,30%)] to-[hsl(152,50%,35%)] text-white text-sm font-semibold disabled:opacity-60">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? 'Generating...' : 'Generate Predictions'}
              </button>
            </div>
          }
        />
      </div>
    );
  }

  const analysis = recs[0]?.overall_analysis;
  const totalQty = recs.reduce((s, r) => s + r.recommended_quantity, 0);
  const avgConfidence = recs.length > 0 ? Math.round(recs.reduce((s, r) => s + (r.confidence || 0), 0) / recs.length) : 0;
  const targetDate = recs[0]?.target_date;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(152,56%,12%)] tracking-tight">AI Recommendations</h1>
          <p className="text-sm text-[hsl(152,10%,45%)] mt-1">
            {recs.length} predictions for the next 3 days · {avgConfidence}% avg confidence
          </p>
        </div>
        <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(152,50%,94%)] text-[hsl(152,56%,30%)] text-sm font-semibold hover:bg-[hsl(152,50%,90%)] transition-all disabled:opacity-60">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? 'Regenerating...' : 'Regenerate'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[hsl(150,15%,92%)] p-5">
          <Package className="w-8 h-8 text-[hsl(152,56%,30%)] mb-2" />
          <p className="text-2xl font-bold text-[hsl(152,56%,12%)]">{totalQty}</p>
          <p className="text-xs text-[hsl(152,10%,45%)]">Total Units</p>
        </div>
        <div className="bg-white rounded-2xl border border-[hsl(150,15%,92%)] p-5">
          <Brain className="w-8 h-8 text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-[hsl(152,56%,12%)]">{avgConfidence}%</p>
          <p className="text-xs text-[hsl(152,10%,45%)]">Avg Confidence</p>
        </div>
        <div className="bg-white rounded-2xl border border-[hsl(150,15%,92%)] p-5">
          <Package className="w-8 h-8 text-amber-500 mb-2" />
          <p className="text-2xl font-bold text-[hsl(152,56%,12%)]">{recs.length}</p>
          <p className="text-xs text-[hsl(152,10%,45%)]">Products</p>
        </div>
      </div>

      {analysis && (
        <div className="bg-gradient-to-r from-[hsl(150,30%,97%)] to-white rounded-2xl border border-[hsl(150,15%,90%)] p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(152,56%,30%)] to-[hsl(140,60%,45%)] flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[hsl(152,56%,15%)]">AI Analysis Summary</h3>
              <p className="text-sm text-[hsl(152,10%,45%)] mt-1 leading-relaxed">{analysis}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {recs.map((rec) => (
          <div key={rec.id} className="bg-white rounded-2xl border border-[hsl(150,15%,92%)] p-5 hover:shadow-lg transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base text-[hsl(152,56%,12%)]">{rec.product} <span className="text-xs font-normal text-[hsl(152,10%,45%)]">· {rec.target_date}</span></h3>
                  {rec.status !== 'pending' && <StatusBadge status={rec.status} />}
                </div>
                <p className="text-sm text-[hsl(152,10%,45%)] mt-1 leading-relaxed">{rec.reasoning}</p>
              </div>
              <div className="flex items-center gap-6 shrink-0">
                <div className="text-center">
                  <p className="text-xs text-[hsl(152,10%,45%)]">Produce</p>
                  <p className="text-3xl font-bold text-[hsl(152,56%,12%)]">{rec.recommended_quantity}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[hsl(152,10%,45%)]">Confidence</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-12 h-1.5 bg-[hsl(150,20%,94%)] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[hsl(152,56%,35%)] to-[hsl(140,60%,45%)]" style={{ width: `${rec.confidence}%` }} />
                    </div>
                    <span className="text-sm font-bold text-[hsl(152,56%,20%)]">{rec.confidence}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Link to="/manager-approval" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-[hsl(152,56%,30%)] to-[hsl(152,50%,35%)] text-white text-sm font-semibold hover:shadow-lg transition-all">
        Review & Approve Production Plan
      </Link>
    </div>
  );
}