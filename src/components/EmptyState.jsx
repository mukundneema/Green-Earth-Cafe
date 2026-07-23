import { cn } from '@/lib/utils';

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-[hsl(150,20%,96%)] flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-[hsl(152,10%,40%)]" />
        </div>
      )}
      <h3 className="font-semibold text-base text-[hsl(152,56%,12%)]">{title}</h3>
      {description && <p className="text-sm text-[hsl(152,10%,45%)] mt-1.5 max-w-md leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}