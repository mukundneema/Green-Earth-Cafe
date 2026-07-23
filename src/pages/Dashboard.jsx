const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Database, Brain, Package, DollarSign, Sparkles, ArrowRight, Trash2, Loader2 } from 'lucide-react';

import KpiCard from '@/components/KpiCard';
import ChartCard from '@/components/ChartCard';
import DataImporter from '@/components/DataImporter';
import { getSalesSummary, generatePredictions, clearAllData } from '@/lib/aiService';
import { useToast } from '@/components/ui/use-toast';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, allRecs] = await Promise.all([
        getSalesSummary(),
        db.entities.ProductionRecommendation.list('-target_date', 100)
      ]);
      setSummary(s);
      const pending = (allRecs || []).filter(r => r.status === 'pending');
      setPredictions(pending);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generatePredictions();
      toast({ title: 'Predictions Generated', description: `${result.count} product recommendations created by AI.` });
      loadData();
    } catch (e) {
      toast({ title: 'Generation Failed', description: e.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('This will permanently delete ALL imported data and predictions. Continue?')) return;
    try {
      await clearAllData();
      toast({ title: 'Data Cleared', description: 'All data has been removed.' });
      setSummary(null);
      setPredictions([]);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to clear data.', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-[hsl(152,56%,40%)] animate-spin" /></div>;
  }

  if (!summary) {
    return (
      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(152,56%,30%)] to-[hsl(140,60%,45%)] flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[hsl(152,56%,12%)] tracking-tight">Welcome to Green Earth Café AI</h1>
          <p className="text-sm text-[hsl(152,10%,45%)] mt-2">Import your sales data and the AI will predict how much food to produce each day.</p>
        </div>
        <DataImporter onImported={loadData} />
      </div>
    );
  }

  const totalQty = predictions.reduce((s, r) => s + r.recommended_quantity, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(152,56%,12%)] tracking-tight">Dashboard</h1>
          <p className="text-sm text-[hsl(152,10%,45%)] mt-1">
            {summary.totalRecords} records · {summary.uniqueProducts} products
            {summary.dateRange ? ` · ${summary.dateRange.start} to ${summary.dateRange.end}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {predictions.length === 0 ? (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[hsl(152,56%,30%)] to-[hsl(152,50%,35%)] text-white text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-60"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? 'AI Analyzing...' : 'Generate AI Predictions'}
            </button>
          ) : (
            <Link to="/recommendations" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(152,50%,94%)] text-[hsl(152,56%,30%)] text-sm font-semibold hover:bg-[hsl(152,50%,90%)] transition-all">
              View Predictions <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <button onClick={handleClear} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-all">
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Database} label="Total Records" value={summary.totalRecords} accent="green" />
        <KpiCard icon={Package} label="Products" value={summary.uniqueProducts} accent="blue" />
        <KpiCard icon={DollarSign} label="Total Revenue" value={`$${summary.totalRevenue.toLocaleString()}`} accent="green" />
        <KpiCard icon={DollarSign} label="Avg Daily Revenue" value={`$${summary.avgDailyRevenue.toLocaleString()}`} accent="amber" />
      </div>

      {predictions.length > 0 ? (
        <ChartCard
          title="AI Production Predictions"
          subtitle={`${predictions.length} predictions · ${totalQty} total units for the next 3 days`}
          action={<Link to="/recommendations" className="flex items-center gap-1 text-xs font-semibold text-[hsl(152,56%,30%)]">View All <ArrowRight className="w-3 h-3" /></Link>}
        >
          <div className="space-y-2">
            {predictions.slice(0, 5).map((rec) => (
              <div key={rec.id} className="flex items-center gap-3 p-3 rounded-xl border border-[hsl(150,15%,92%)]">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[hsl(152,56%,12%)]">{rec.product}</p>
                  <p className="text-xs text-[hsl(152,10%,45%)] mt-0.5 line-clamp-1">{rec.reasoning}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-[hsl(152,56%,30%)]">{rec.recommended_quantity}</p>
                  <p className="text-xs text-[hsl(152,10%,45%)]">{rec.confidence}% conf.</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/manager-approval" className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-[hsl(152,56%,30%)] to-[hsl(152,50%,35%)] text-white text-sm font-semibold hover:shadow-lg transition-all">
            Review & Approve
          </Link>
        </ChartCard>
      ) : (
        <ChartCard title="AI Predictions" subtitle="Generate production recommendations from your data">
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-[hsl(152,10%,30%)] mx-auto mb-3" />
            <p className="text-sm text-[hsl(152,10%,45%)] mb-4">The AI will analyze your {summary.totalRecords} sales records to predict tomorrow's production needs.</p>
            <button onClick={handleGenerate} disabled={generating} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[hsl(152,56%,30%)] to-[hsl(152,50%,35%)] text-white text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-60">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? 'AI Analyzing Your Data...' : 'Generate Predictions Now'}
            </button>
          </div>
        </ChartCard>
      )}

      <ChartCard title="Import More Data" subtitle="Add additional sales records from a CSV file">
        <DataImporter onImported={loadData} />
      </ChartCard>
    </div>
  );
}