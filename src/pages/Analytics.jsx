const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Loader2, BarChart3, DollarSign, Package } from 'lucide-react';

import KpiCard from '@/components/KpiCard';
import ChartCard from '@/components/ChartCard';
import EmptyState from '@/components/EmptyState';
import { cn } from '@/lib/utils';

const PIE_COLORS = ['hsl(152,56%,40%)', 'hsl(140,60%,50%)', 'hsl(34,80%,55%)', 'hsl(200,65%,55%)', 'hsl(280,60%,60%)', 'hsl(340,75%,55%)', 'hsl(160,60%,45%)', 'hsl(30,80%,55%)'];

export default function Analytics() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <h1 className="text-2xl font-bold text-[hsl(152,56%,12%)] tracking-tight mb-6">Analytics</h1>
        <EmptyState
          icon={BarChart3}
          title="No Data to Analyze"
          description="Import your sales data CSV to see revenue trends, product breakdowns, and day-of-week analysis."
        />
      </div>
    );
  }

  // Revenue over time
  const byDate = {};
  records.forEach(r => {
    const date = r.date;
    if (!date) return;
    if (!byDate[date]) byDate[date] = { revenue: 0, quantity: 0 };
    byDate[date].revenue += r.revenue || 0;
    byDate[date].quantity += r.quantity_sold || 0;
  });
  const timeData = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, d]) => ({ date: date.substring(5), revenue: Math.round(d.revenue), quantity: d.quantity }));

  // By product
  const byProduct = {};
  records.forEach(r => {
    if (!r.product) return;
    if (!byProduct[r.product]) byProduct[r.product] = { quantity: 0, revenue: 0 };
    byProduct[r.product].quantity += r.quantity_sold || 0;
    byProduct[r.product].revenue += r.revenue || 0;
  });
  const productData = Object.entries(byProduct).map(([product, d]) => ({ product, quantity: d.quantity, revenue: Math.round(d.revenue) }));

  // Day of week
  const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayShort = { Sunday: 'Sun', Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat' };
  const byDay = {};
  records.forEach(r => {
    let dow = r.day_of_week;
    if (!dow && r.date) {
      try { dow = new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }); } catch (e) { return; }
    }
    if (!dow) return;
    if (!byDay[dow]) byDay[dow] = { total: 0, count: 0 };
    byDay[dow].total += r.quantity_sold || 0;
    byDay[dow].count++;
  });
  const dowData = dayOrder.filter(d => byDay[d]).map(d => ({ day: dayShort[d] || d.substring(0, 3), avg: Math.round(byDay[d].total / byDay[d].count) }));

  // Weather impact
  const byWeather = {};
  records.forEach(r => {
    if (!r.weather) return;
    if (!byWeather[r.weather]) byWeather[r.weather] = { total: 0, count: 0 };
    byWeather[r.weather].total += r.quantity_sold || 0;
    byWeather[r.weather].count++;
  });
  const weatherData = Object.entries(byWeather).map(([weather, d]) => ({ weather, avg: Math.round(d.total / d.count) }));
  const hasWeather = weatherData.length > 0;

  const totalRevenue = records.reduce((s, r) => s + (r.revenue || 0), 0);
  const totalQty = records.reduce((s, r) => s + (r.quantity_sold || 0), 0);
  const uniqueDates = Object.keys(byDate).length;
  const avgDailyRev = uniqueDates > 0 ? Math.round(totalRevenue / uniqueDates) : 0;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(152,56%,12%)] tracking-tight">Analytics</h1>
        <p className="text-sm text-[hsl(152,10%,45%)] mt-1">Performance insights from {records.length} sales records</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={DollarSign} label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} accent="green" />
        <KpiCard icon={DollarSign} label="Avg Daily Revenue" value={`$${avgDailyRev.toLocaleString()}`} accent="blue" />
        <KpiCard icon={Package} label="Total Units Sold" value={totalQty.toLocaleString()} accent="amber" />
        <KpiCard icon={BarChart3} label="Products" value={productData.length} accent="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Revenue Over Time" subtitle="Daily revenue trend">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={timeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(152,56%,40%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(152,56%,40%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(150,15%,92%)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(152,10%,45%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(152,10%,45%)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150,15%,90%)', fontSize: '12px' }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(152,56%,35%)" strokeWidth={2.5} fill="url(#revGrad)" name="Revenue ($)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Units Sold by Product" subtitle="Total quantity per product">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={productData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(150,15%,92%)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(152,10%,45%)' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="product" tick={{ fontSize: 11, fill: 'hsl(152,10%,45%)' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150,15%,90%)', fontSize: '12px' }} cursor={{ fill: 'hsl(150,30%,96%)' }} />
              <Bar dataKey="quantity" fill="hsl(152,56%,40%)" radius={[0, 6, 6, 0]} name="Units Sold" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Sales by Day of Week" subtitle="Average units sold per day">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(150,15%,92%)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(152,10%,45%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(152,10%,45%)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150,15%,90%)', fontSize: '12px' }} cursor={{ fill: 'hsl(150,30%,96%)' }} />
              <Bar dataKey="avg" fill="hsl(200,65%,55%)" radius={[6, 6, 0, 0]} name="Avg Units" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {hasWeather ? (
          <ChartCard title="Weather Impact on Sales" subtitle="Average units sold by weather condition">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weatherData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(150,15%,92%)" vertical={false} />
                <XAxis dataKey="weather" tick={{ fontSize: 11, fill: 'hsl(152,10%,45%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(152,10%,45%)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150,15%,90%)', fontSize: '12px' }} cursor={{ fill: 'hsl(150,30%,96%)' }} />
                <Bar dataKey="avg" fill="hsl(34,80%,55%)" radius={[6, 6, 0, 0]} name="Avg Units" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : (
          <ChartCard title="Revenue by Product" subtitle="Revenue distribution">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={productData} dataKey="revenue" nameKey="product" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {productData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150,15%,90%)', fontSize: '12px' }} formatter={(v) => `$${v}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {productData.map((d, i) => (
                <div key={d.product} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-[hsl(152,10%,45%)]">{d.product}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        )}
      </div>

      <ChartCard title="Daily Units Sold" subtitle="Quantity trend over time">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={timeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(150,15%,92%)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(152,10%,45%)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(152,10%,45%)' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150,15%,90%)', fontSize: '12px' }} cursor={{ fill: 'hsl(150,30%,96%)' }} />
            <Bar dataKey="quantity" fill="hsl(140,60%,45%)" radius={[4, 4, 0, 0]} name="Units" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}