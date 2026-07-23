import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Lightbulb, Package, Database,
  BarChart3, FileText, CheckCircle, Settings,
  Leaf, ChevronLeft, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/forecast', label: 'Forecast', icon: TrendingUp },
  { path: '/recommendations', label: 'Recommendations', icon: Lightbulb },
  { path: '/inventory', label: 'Data', icon: Database },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/manager-approval', label: 'Manager Approval', icon: CheckCircle },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      <aside className={cn(
        "fixed lg:relative z-50 h-full bg-white border-r border-[hsl(150,15%,90%)] flex flex-col transition-all duration-300",
        collapsed ? "w-20" : "w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[hsl(150,15%,92%)] shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(152,56%,30%)] to-[hsl(140,60%,45%)] flex items-center justify-center shrink-0 shadow-sm">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="leading-tight overflow-hidden">
                <p className="font-bold text-sm text-[hsl(152,56%,15%)] truncate">Green Earth</p>
                <p className="text-[10px] text-[hsl(152,10%,50%)] uppercase tracking-wider">AI Consultant</p>
              </div>
            )}
          </div>
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1 rounded-lg hover:bg-[hsl(150,30%,96%)]"
          >
            <X className="w-5 h-5 text-[hsl(152,10%,40%)]" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={onMobileClose}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                  isActive
                    ? "bg-gradient-to-r from-[hsl(152,56%,30%)] to-[hsl(152,50%,35%)] text-white shadow-sm"
                    : "text-[hsl(152,10%,35%)] hover:bg-[hsl(150,30%,96%)] hover:text-[hsl(152,56%,20%)]"
                )}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {collapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-[hsl(152,56%,15%)] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop) */}
        <div className="hidden lg:block p-2 border-t border-[hsl(150,15%,92%)] shrink-0">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[hsl(152,10%,45%)] hover:bg-[hsl(150,30%,96%)] transition-colors"
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}