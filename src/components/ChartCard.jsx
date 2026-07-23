import { cn } from '@/lib/utils';

export default function ChartCard({ title, subtitle, children, className, action, noPadding }) {
  return (
    <div className={cn("bg-white rounded-2xl border border-[hsl(150,15%,92%)] overflow-hidden", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div>
            {title && <h3 className="font-semibold text-sm text-[hsl(152,56%,12%)]">{title}</h3>}
            {subtitle && <p className="text-xs text-[hsl(152,10%,45%)] mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn(!noPadding && "px-5 pb-5")}>
        {children}
      </div>
    </div>
  );
}