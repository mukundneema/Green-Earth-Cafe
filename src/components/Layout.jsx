const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Search, Bell, Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    db.auth.me().then(setUser).catch(() => setUser(null));
    db.entities.ProductionRecommendation.filter({ status: 'pending' })
      .then(recs => setPendingCount(recs.length))
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-screen bg-[hsl(150,20%,97%)] overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-[hsl(150,15%,90%)] flex items-center justify-between px-4 lg:px-6 shrink-0 z-30">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-[hsl(150,30%,96%)]"
            >
              <Menu className="w-5 h-5 text-[hsl(152,56%,20%)]" />
            </button>
            <div className="relative max-w-md w-full hidden sm:block">
              <Search className="w-4 h-4 text-[hsl(152,10%,50%)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-[hsl(150,20%,97%)] border border-[hsl(150,15%,90%)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[hsl(152,56%,30%)]/20 focus:border-[hsl(152,56%,30%)] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/manager-approval" className="relative p-2 rounded-xl hover:bg-[hsl(150,30%,96%)] transition-colors">
              <Bell className="w-5 h-5 text-[hsl(152,10%,35%)]" />
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </Link>

            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[hsl(150,15%,90%)]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(152,56%,30%)] to-[hsl(140,60%,45%)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {(user?.full_name || 'U').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="text-xs font-semibold text-[hsl(152,56%,15%)]">{user?.full_name || 'User'}</p>
                <p className="text-[10px] text-[hsl(152,10%,50%)]">Manager</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}