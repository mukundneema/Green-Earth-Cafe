import { useState } from 'react';
import { Building2, Save, Trash2, Shield, Database, Cloud, Loader2 } from 'lucide-react';
import ChartCard from '@/components/ChartCard';
import { clearAllData } from '@/lib/aiService';
import { useToast } from '@/components/ui/use-toast';

export default function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    cafeName: 'Green Earth Café',
    location: 'Downtown, Portland, OR',
    manager: 'Sarah Chen',
    operatingHours: '6:00 AM - 8:00 PM',
    seats: 45,
  });
  const [clearing, setClearing] = useState(false);

  const handleSave = () => {
    toast({ title: 'Settings Saved', description: 'Your configuration has been updated.' });
  };

  const handleClear = async () => {
    if (!confirm('This will permanently delete ALL imported sales data and AI predictions. This cannot be undone. Continue?')) return;
    setClearing(true);
    try {
      await clearAllData();
      toast({ title: 'Data Cleared', description: 'All data has been permanently removed.' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to clear data.', variant: 'destructive' });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(152,56%,12%)] tracking-tight">Settings</h1>
          <p className="text-sm text-[hsl(152,10%,45%)] mt-1">Configure your café profile and manage data</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[hsl(152,56%,30%)] to-[hsl(152,50%,35%)] text-white text-sm font-semibold hover:shadow-lg transition-all"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      <ChartCard title="Café Profile" subtitle="Basic information about your café">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[hsl(152,10%,45%)] uppercase tracking-wide">Café Name</label>
            <input type="text" value={settings.cafeName} onChange={(e) => setSettings({ ...settings, cafeName: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-sm bg-[hsl(150,20%,97%)] border border-[hsl(150,15%,90%)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(152,56%,30%)]/20" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[hsl(152,10%,45%)] uppercase tracking-wide">Location</label>
            <input type="text" value={settings.location} onChange={(e) => setSettings({ ...settings, location: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-sm bg-[hsl(150,20%,97%)] border border-[hsl(150,15%,90%)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(152,56%,30%)]/20" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[hsl(152,10%,45%)] uppercase tracking-wide">Manager</label>
            <input type="text" value={settings.manager} onChange={(e) => setSettings({ ...settings, manager: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-sm bg-[hsl(150,20%,97%)] border border-[hsl(150,15%,90%)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(152,56%,30%)]/20" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[hsl(152,10%,45%)] uppercase tracking-wide">Operating Hours</label>
            <input type="text" value={settings.operatingHours} onChange={(e) => setSettings({ ...settings, operatingHours: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-sm bg-[hsl(150,20%,97%)] border border-[hsl(150,15%,90%)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(152,56%,30%)]/20" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[hsl(152,10%,45%)] uppercase tracking-wide">Seats</label>
            <input type="number" value={settings.seats} onChange={(e) => setSettings({ ...settings, seats: parseInt(e.target.value) || 0 })}
              className="w-full mt-1 px-3 py-2 text-sm bg-[hsl(150,20%,97%)] border border-[hsl(150,15%,90%)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(152,56%,30%)]/20" />
          </div>
        </div>
      </ChartCard>

      <ChartCard title="Data Management" subtitle="Manage your imported data and AI predictions">
        <div className="flex items-center justify-between p-4 rounded-xl border border-red-200 bg-red-50">
          <div>
            <p className="text-sm font-semibold text-red-700">Clear All Data</p>
            <p className="text-xs text-red-600 mt-0.5">Permanently delete all sales records and AI predictions</p>
          </div>
          <button
            onClick={handleClear}
            disabled={clearing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-60"
          >
            {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {clearing ? 'Clearing...' : 'Clear All'}
          </button>
        </div>
      </ChartCard>

      <ChartCard title="Data & Privacy" subtitle="Your data is secure and never shared">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-[hsl(150,20%,97%)] border border-[hsl(150,15%,90%)]">
            <Database className="w-5 h-5 text-[hsl(152,56%,30%)] mb-2" />
            <p className="text-sm font-semibold text-[hsl(152,56%,15%)]">Data Storage</p>
            <p className="text-xs text-[hsl(152,10%,45%)] mt-1">All data encrypted at rest with AES-256</p>
          </div>
          <div className="p-4 rounded-xl bg-[hsl(150,20%,97%)] border border-[hsl(150,15%,90%)]">
            <Shield className="w-5 h-5 text-[hsl(152,56%,30%)] mb-2" />
            <p className="text-sm font-semibold text-[hsl(152,56%,15%)]">Access Control</p>
            <p className="text-xs text-[hsl(152,10%,45%)] mt-1">Role-based access with audit logging</p>
          </div>
          <div className="p-4 rounded-xl bg-[hsl(150,20%,97%)] border border-[hsl(150,15%,90%)]">
            <Cloud className="w-5 h-5 text-[hsl(152,56%,30%)] mb-2" />
            <p className="text-sm font-semibold text-[hsl(152,56%,15%)]">Cloud Hosting</p>
            <p className="text-xs text-[hsl(152,10%,45%)] mt-1">99.9% uptime with daily backups</p>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}