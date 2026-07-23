import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function KpiCard({ icon: Icon, label, value, unit, trend, trendLabel, accent = 'green', subtitle }) {
  const accentMap = {
    green: 'from-[hsl(152,56%,30%)] to-[hsl(140,60%,42%)]',
    amber: 'from-amber-500 to-orange-500',
    blue: 'from-blue-500 to-indigo-500',
    red: 'from-red-500 to-rose-500',
    purple: 'from-purple-500 to-violet-500',
  };

  const trendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const trendColor = trend > 0 ? 'text-[hsl(152,56%,35%)] bg-[hsl(152,50%,94%)]'
    : trend < 0 ? 'text-red-600 bg-red-50'
    : 'text-[hsl(152,10%,45%)] bg-[hsl(150,20%,94%)]';

  return (
    <div className="bg-white rounded-2xl border border-[hsl(150,15%,92%)] p-5 hover:shadow-lg hover:shadow-[hsl(152,56%,30%,0.06)] transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm", accentMap[accent])}>
          {Icon && <Icon className="w-5 h-5 text-white" />}
        </div>
        {trend !== undefined && trend !== null && (
          <div className={cn("flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold", trendColor)}>
            <TrendIcon className="w-3 h-3" />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-[hsl(152,10%,45%)] uppercase tracking-wide mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-[hsl(152,56%,12%)] tracking-tight">{value}</span>
        {unit && <span className="text-sm text-[hsl(152,10%,45%)] font-medium">{unit}</span>}
      </div>
      {(subtitle || trendLabel) && (
        <p className="text-xs text-[hsl(152,10%,50%)] mt-1.5">{subtitle || trendLabel}</p>
      )}
    </div>
  );
}