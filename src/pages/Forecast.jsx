const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Brain, Loader2, Sparkles, TrendingUp, Package } from 'lucide-react';

import KpiCard from '@/components/KpiCard';
import ChartCard from '@/components/ChartCard';
import EmptyState from '@/components/EmptyState';
import { generatePredictions } from '@/lib/aiService';
import { useToast } from '@/components/ui/use-toast';

export default function Forecast() {
  const [recs, setRecs] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        db.entities.ProductionRecommendation.list('-target_date', 100),
        db.entities.SalesRecord.list('-date', 500)
      ]);
      setRecs(r || []);
      setRecords(s || []);
    } catch (e) {
      setRecs([]);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generatePredictions();
      toast({ title: 'Predictions Generated', description: `${result.count} recommendations created.` });
      loadData();
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
        <h1 className="text-2xl font-bold text-[hsl(152,56%,12%)] tracking-tight mb-6">Forecast</h1>
        <EmptyState
          icon={Brain}
          title="No Forecasts Available"
          description={records.length > 0 ? "Generate AI predictions to see forecasts here." : "Import sales data and generate predictions to see forecasts."}
          action={
            records.length > 0 ? (
              <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[hsl(152,56%,30%)] to-[hsl(152,50%,35%)] text-white text-sm font-semibold disabled:opacity-60">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? 'Generating...' : 'Generate Predictions'}
              </button>
            ) : <Link to="/" className="px-4 py-2.5 rounded-xl bg-[hsl(152,50%,94%)] text-[hsl(152,56%,30%)] text-sm font-semibold">Import Data</Link>
          }
        />
      </div>
    );
  }

  const chartProducts = [...new Set(records.map(r => r.product).filter(Boolean))].slice(0, 4);
  const allDates = [...new Set(records.map(r => r.date).filter(Boolean))].sort().slice(-14);

  const chartData = allDates.map(date => {
    const point = { date: date.substring(5) };
    chartProducts.forEach(product => {
      const rec = records.find(r => r.product === product && r.date === date);
      point[product] = rec ? rec.quantity_sold : 0;
    });
    return point;
  });

  const histByProduct = {};
  records.forEach(r => {
    if (!r.product) return;
    if (!histByProduct[r.product]) histByProduct[r.product] = [];
    histByProduct[r.product].push({ date: r.date, quantity: r.quantity_sold });
  });

  const COLORS = ['hsl(152,56%,40%)', 'hsl(200,65%,55%)', 'hsl(34,80%,55%)', 'hsl(280,60%,60%)'];
  const analysis = recs[0]?.overall_analysis;
  const avgConfidence = recs.length > 0 ? Math.round(recs.reduce((s, r) => s + (r.confidence || 0), 0) / recs.length) : 0;
  const totalQty = recs.reduce((s, r) => s + r.recommended_quantity, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(152,56%,12%)] tracking-tight">Forecast</h1>
          <p className="text-sm text-[hsl(152,10%,45%)] mt-1">AI predictions with historical context for the next 3 days</p>
        </div>
        <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(152,50%,94%)] text-[hsl(152,56%,30%)] text-sm font-semibold hover:bg-[hsl(152,50%,90%)] transition-all disabled:opacity-60">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? 'Regenerating...' : 'Regenerate'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Package} label="Predicted Units" value={totalQty} accent="green" />
        <KpiCard icon={Brain} label="Avg Confidence" value={`${avgConfidence}%`} accent="blue" />
        <KpiCard icon={TrendingUp} label="Products" value={recs.length} accent="amber" />
        <KpiCard icon={Package} label="Data Points" value={records.length} accent="green" subtitle="historical records" />
      </div>

      {analysis && (
        <div className="bg-gradient-to-r from-[hsl(150,30%,97%)] to-white rounded-2xl border border-[hsl(150,15%,90%)] p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(152,56%,30%)] to-[hsl(140,60%,45%)] flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[hsl(152,56%,15%)]">AI Analysis</h3>
              <p className="text-sm text-[hsl(152,10%,45%)] mt-1 leading-relaxed">{analysis}</p>
            </div>
          </div>
        </div>
      )}

      {chartData.length > 0 && chartProducts.length > 0 && (
        <ChartCard title="Historical Sales by Product" subtitle="Last 14 days of actual sales data">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(150,15%,92%)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(152,10%,45%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(152,10%,45%)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150,15%,90%)', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              {chartProducts.map((product, i) => (
                <Line key={product} type="monotone" dataKey={product} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 2 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <ChartCard title="AI Production Predictions" subtitle={`${recs.length} predictions for the next 3 days`}>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-[hsl(150,15%,90%)]">
                <th className="text-left py-2.5 px-2 font-semibold text-xs text-[hsl(152,10%,45%)] uppercase tracking-wide">Date</th>
                <th className="text-left py-2.5 px-2 font-semibold text-xs text-[hsl(152,10%,45%)] uppercase tracking-wide">Product</th>
                <th className="text-right py-2.5 px-2 font-semibold text-xs text-[hsl(152,10%,45%)] uppercase tracking-wide">Recommend</th>
                <th className="text-center py-2.5 px-2 font-semibold text-xs text-[hsl(152,10%,45%)] uppercase tracking-wide">Confidence</th>
                <th className="text-left py-2.5 px-2 font-semibold text-xs text-[hsl(152,10%,45%)] uppercase tracking-wide">Reasoning</th>
              </tr>
            </thead>
            <tbody>
              {recs.map((rec) => {
                const hist = histByProduct[rec.product] || [];
                const avg = hist.length > 0 ? Math.round(hist.reduce((s, h) => s + h.quantity, 0) / hist.length) : 0;
                return (
                  <tr key={rec.id} className="border-b border-[hsl(150,15%,94%)] hover:bg-[hsl(150,30%,97%)] transition-colors">
                    <td className="py-3 px-2 text-xs text-[hsl(152,10%,45%)]">{rec.target_date}</td>
                    <td className="py-3 px-2 font-medium text-[hsl(152,56%,15%)]">{rec.product}</td>
                    <td className="py-3 px-2 text-right">
                      <span className="text-lg font-bold text-[hsl(152,56%,30%)]">{rec.recommended_quantity}</span>
                      {avg > 0 && <span className="text-xs text-[hsl(152,10%,45%)] block">avg: {avg}</span>}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1.5 justify-center">
                        <div className="w-10 h-1.5 bg-[hsl(150,20%,94%)] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[hsl(152,56%,35%)] to-[hsl(140,60%,45%)]" style={{ width: `${rec.confidence}%` }} />
                        </div>
                        <span className="text-xs font-bold text-[hsl(152,56%,20%)]">{rec.confidence}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-xs text-[hsl(152,10%,45%)] max-w-xs">{rec.reasoning}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}