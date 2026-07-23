const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';
import { Database, Loader2, Search, Trash2 } from 'lucide-react';

import ChartCard from '@/components/ChartCard';
import EmptyState from '@/components/EmptyState';
import { cn } from '@/lib/utils';

export default function Inventory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState('all');

  useEffect(() => {
    db.entities.SalesRecord.list('-date', 500)
      .then(data => setRecords(data || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-[hsl(152,56%,40%)] animate-spin" /></div>;
  }

  if (records.length === 0) {
    return (
      <div className="p-4 lg:p-6">
        <h1 className="text-2xl font-bold text-[hsl(152,56%,12%)] tracking-tight mb-6">Sales Data</h1>
        <EmptyState
          icon={Database}
          title="No Data Imported"
          description="Import a CSV file with your sales data to view it here."
        />
      </div>
    );
  }

  const products = [...new Set(records.map(r => r.product).filter(Boolean))].sort();
  const filtered = records.filter(r => {
    const matchesSearch = !search || (r.product || '').toLowerCase().includes(search.toLowerCase()) || (r.date || '').includes(search);
    const matchesProduct = productFilter === 'all' || r.product === productFilter;
    return matchesSearch && matchesProduct;
  });

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(152,56%,12%)] tracking-tight">Sales Data</h1>
        <p className="text-sm text-[hsl(152,10%,45%)] mt-1">{records.length} records imported · {products.length} products</p>
      </div>

      <ChartCard
        title="Imported Records"
        subtitle={`${filtered.length} showing`}
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-[hsl(152,10%,50%)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-9 pr-3 py-1.5 text-xs bg-[hsl(150,20%,97%)] border border-[hsl(150,15%,90%)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(152,56%,30%)]/20 w-40"
              />
            </div>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[hsl(150,20%,97%)] border border-[hsl(150,15%,90%)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(152,56%,30%)]/20"
            >
              <option value="all">All Products</option>
              {products.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-[hsl(150,15%,90%)]">
                <th className="text-left py-2.5 px-2 font-semibold text-xs text-[hsl(152,10%,45%)] uppercase tracking-wide">Date</th>
                <th className="text-left py-2.5 px-2 font-semibold text-xs text-[hsl(152,10%,45%)] uppercase tracking-wide">Product</th>
                <th className="text-right py-2.5 px-2 font-semibold text-xs text-[hsl(152,10%,45%)] uppercase tracking-wide">Qty Sold</th>
                <th className="text-right py-2.5 px-2 font-semibold text-xs text-[hsl(152,10%,45%)] uppercase tracking-wide">Revenue</th>
                <th className="text-left py-2.5 px-2 font-semibold text-xs text-[hsl(152,10%,45%)] uppercase tracking-wide">Day</th>
                <th className="text-left py-2.5 px-2 font-semibold text-xs text-[hsl(152,10%,45%)] uppercase tracking-wide">Weather</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((r) => (
                <tr key={r.id} className="border-b border-[hsl(150,15%,94%)] hover:bg-[hsl(150,30%,97%)] transition-colors">
                  <td className="py-3 px-2 text-[hsl(152,10%,45%)] text-xs">{r.date || '—'}</td>
                  <td className="py-3 px-2 font-medium text-[hsl(152,56%,15%)]">{r.product || '—'}</td>
                  <td className="py-3 px-2 text-right font-semibold text-[hsl(152,56%,20%)]">{r.quantity_sold ?? '—'}</td>
                  <td className="py-3 px-2 text-right text-[hsl(152,10%,45%)]">{r.revenue != null ? `$${r.revenue.toLocaleString()}` : '—'}</td>
                  <td className="py-3 px-2 text-[hsl(152,10%,45%)] text-xs">{r.day_of_week || '—'}</td>
                  <td className="py-3 px-2 text-[hsl(152,10%,45%)] text-xs">{r.weather || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 200 && (
            <p className="text-center text-xs text-[hsl(152,10%,45%)] py-3">Showing first 200 of {filtered.length} records</p>
          )}
        </div>
      </ChartCard>
    </div>
  );
}