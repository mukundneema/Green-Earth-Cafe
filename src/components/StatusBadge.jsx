import { cn } from '@/lib/utils';

const statusConfig = {
  healthy: { label: 'Healthy', className: 'bg-[hsl(152,50%,94%)] text-[hsl(152,56%,30%)] border-[hsl(152,50%,85%)]' },
  low: { label: 'Low Stock', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  critical: { label: 'Critical', className: 'bg-red-50 text-red-700 border-red-200' },
  overstock: { label: 'Overstock', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  approved: { label: 'Approved', className: 'bg-[hsl(152,50%,94%)] text-[hsl(152,56%,30%)] border-[hsl(152,50%,85%)]' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200' },
  modified: { label: 'Modified', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  critical_alert: { label: 'Critical', className: 'bg-red-50 text-red-700 border-red-200' },
  warning_alert: { label: 'Warning', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  info_alert: { label: 'Info', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  success_alert: { label: 'Success', className: 'bg-[hsl(152,50%,94%)] text-[hsl(152,56%,30%)] border-[hsl(152,50%,85%)]' },
};

export default function StatusBadge({ status, label, className }) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
      config.className,
      className
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label || config.label}
    </span>
  );
}