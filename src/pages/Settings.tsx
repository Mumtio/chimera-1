import React, { useState, useEffect, useCallback } from 'react';
import {
  Save,
  Download,
  Trash2,
  Database,
  Loader2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { CyberButton } from '../components/ui/CyberButton';
import { CyberCard } from '../components/ui/CyberCard';
import { CyberInput } from '../components/ui/CyberInput';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { settingsApi } from '../lib/api';
import type { CleanupInfoResponse } from '../lib/api';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const settings = useSettingsStore((state) => state.settings);
  const isLoading = useSettingsStore((state) => state.isLoading);
  const error = useSettingsStore((state) => state.error);
  const fetchSettings = useSettingsStore((state) => state.fetchSettings);
  const updateProfile = useSettingsStore((state) => state.updateProfile);
  const updateMemoryRetention = useSettingsStore(
    (state) => state.updateMemoryRetention
  );
  const exportData = useSettingsStore((state) => state.exportData);
  const deleteAccount = useSettingsStore((state) => state.deleteAccount);
  const clearError = useSettingsStore((state) => state.clearError);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [retentionPeriod, setRetentionPeriod] = useState('indefinite-84');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingRetention, setSavingRetention] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cleanupInfo, setCleanupInfo] = useState<CleanupInfoResponse | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [cleaningUp, setCleaningUp] = useState(false);

  const fetchCleanupInfo = useCallback(async () => {
    try {
      const info = await settingsApi.getCleanupInfo();
      setCleanupInfo(info);
    } catch (err) {
      console.error('Failed to fetch cleanup info:', err);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchCleanupInfo();
  }, [fetchSettings, fetchCleanupInfo]);


  useEffect(() => {
    if (!cleanupInfo || cleanupInfo.is_indefinite || !cleanupInfo.total_seconds_remaining) return;
    let totalSeconds = cleanupInfo.total_seconds_remaining;
    const updateCountdown = () => {
      if (totalSeconds <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setCountdown({ days, hours, minutes, seconds });
      totalSeconds--;
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [cleanupInfo]);

  useEffect(() => {
    if (user) {
      setName(settings.profile.name || user.name);
      setEmail(settings.profile.email || user.email);
    }
    setRetentionPeriod(settings.memoryRetention.retentionPeriod);
  }, [user, settings]);

  useEffect(() => {
    fetchCleanupInfo();
  }, [settings.memoryRetention.retentionPeriod, fetchCleanupInfo]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    clearError();
    try {
      await updateProfile(name, email);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch { /* Error handled in store */ }
    finally { setSavingProfile(false); }
  };

  const handleSaveMemoryRetention = async () => {
    setSavingRetention(true);
    clearError();
    try {
      await updateMemoryRetention(true, retentionPeriod);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchCleanupInfo();
    } catch { /* Error handled in store */ }
    finally { setSavingRetention(false); }
  };

  const handleExportData = async () => {
    setExporting(true);
    clearError();
    try { await exportData(); }
    catch { /* Error handled in store */ }
    finally { setExporting(false); }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    clearError();
    try {
      const deleted = await deleteAccount();
      if (deleted) { logout(); navigate('/login'); }
    } catch { /* Error handled in store */ }
    finally { setDeleting(false); }
  };

  const handleManualCleanup = async () => {
    if (!confirm('This will permanently delete ALL your workspaces, conversations, and memories. Are you sure?')) return;
    setCleaningUp(true);
    try {
      const result = await settingsApi.triggerCleanup();
      alert(`Cleanup complete!\n\nDeleted:\n- ${result.workspaces_deleted} workspaces\n- ${result.conversations_deleted} conversations\n- ${result.memories_deleted} memories\n- ${result.messages_deleted} messages`);
      fetchCleanupInfo();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to cleanup data');
    } finally { setCleaningUp(false); }
  };

  const formatCountdown = () => {
    if (!cleanupInfo || cleanupInfo.is_indefinite) return null;
    const parts = [];
    if (countdown.days > 0) parts.push(`${countdown.days}d`);
    if (countdown.hours > 0 || countdown.days > 0) parts.push(`${countdown.hours}h`);
    parts.push(`${countdown.minutes}m`);
    parts.push(`${countdown.seconds}s`);
    return parts.join(' ');
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 relative">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-neon-green rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-neon-green rounded-full blur-3xl"></div>
      </div>
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-cyber text-neon-green mb-2">System Config</h1>
          <p className="text-gray-400 text-sm">Configure your profile, memory retention, and account settings</p>
        </div>
        {saveSuccess && (
          <div className="mb-6 p-4 bg-neon-green/10 border-2 border-neon-green angular-frame">
            <p className="text-neon-green text-sm font-mono">✓ Settings saved successfully</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-error-red/10 border-2 border-error-red angular-frame">
            <p className="text-error-red text-sm font-mono">✗ {error}</p>
          </div>
        )}
        {isLoading && !savingProfile && !savingRetention && !exporting && !deleting && (
          <div className="mb-6 p-4 bg-deep-teal/10 border-2 border-deep-teal angular-frame flex items-center gap-2">
            <Loader2 size={16} className="animate-spin text-neon-green" />
            <p className="text-gray-400 text-sm font-mono">Loading settings...</p>
          </div>
        )}
        <CyberCard title="Profile Settings" subtitle="Update your personal information" glowBorder={false} cornerAccents className="mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-neon-green text-sm font-medium mb-2">Name</label>
              <CyberInput type="text" value={name} onChange={setName} placeholder="Enter your name" name="name" />
            </div>
            <div>
              <label className="block text-neon-green text-sm font-medium mb-2">Email</label>
              <CyberInput type="email" value={email} onChange={setEmail} placeholder="Enter your email" name="email" />
            </div>
            <div className="flex justify-end mt-6">
              <CyberButton variant="primary" glow onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? <Loader2 size={16} className="inline mr-2 animate-spin" /> : <Save size={16} className="inline mr-2" />}
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </CyberButton>
            </div>
          </div>
        </CyberCard>

        <CyberCard title="Memory Retention" subtitle="Configure automatic memory storage and retention policies" glowBorder={false} cornerAccents className="mb-6">
          <div className="space-y-6">
            {cleanupInfo && !cleanupInfo.is_indefinite && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 angular-frame">
                <div className="flex items-start gap-3">
                  <Clock size={20} className="text-yellow-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-yellow-400 font-medium text-sm mb-1">Next Data Cleanup</h4>
                    <p className="text-gray-400 text-xs mb-3">All your workspaces, conversations, and memories will be deleted when the timer reaches zero.</p>
                    <div className="flex items-center gap-4">
                      <div className="font-mono text-2xl text-yellow-400 tracking-wider">{formatCountdown()}</div>
                      <CyberButton variant="danger" onClick={handleManualCleanup} disabled={cleaningUp} className="text-xs">
                        {cleaningUp ? <Loader2 size={14} className="inline mr-1 animate-spin" /> : <AlertTriangle size={14} className="inline mr-1" />}
                        {cleaningUp ? 'Cleaning...' : 'Cleanup Now'}
                      </CyberButton>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {cleanupInfo?.is_indefinite && (
              <div className="p-4 bg-neon-green/10 border border-neon-green/30 angular-frame">
                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-neon-green" />
                  <div>
                    <h4 className="text-neon-green font-medium text-sm">No Scheduled Cleanup</h4>
                    <p className="text-gray-400 text-xs">Your data will be retained indefinitely with the current settings.</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="retention-period" className="block text-gray-400 text-xs mb-2 uppercase tracking-wider">Retention Period</label>
              <select id="retention-period" value={retentionPeriod} onChange={(e) => setRetentionPeriod(e.target.value)} className="w-full px-4 py-3 bg-black border-2 border-deep-teal text-neon-green font-mono text-sm focus:border-neon-green focus:shadow-neon focus:outline-none transition-all duration-300 angular-frame cursor-pointer">
                <option value="7-days">7 Days</option>
                <option value="30-days">30 Days</option>
                <option value="90-days">90 Days</option>
                <option value="indefinite-84">Indefinite (84 days)</option>
                <option value="indefinite-forever">Indefinite (Forever)</option>
              </select>
              <p className="text-gray-500 text-xs mt-2 font-mono">All data will be permanently deleted after this period</p>
            </div>
            <div className="flex justify-end mt-6">
              <CyberButton variant="primary" glow onClick={handleSaveMemoryRetention} disabled={savingRetention}>
                {savingRetention ? <Loader2 size={16} className="inline mr-2 animate-spin" /> : <Database size={16} className="inline mr-2" />}
                {savingRetention ? 'Saving...' : 'Save Retention Settings'}
              </CyberButton>
            </div>
          </div>
        </CyberCard>
        <CyberCard title="Data Management" subtitle="Export or delete your account data" glowBorder={false} cornerAccents className="mb-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-deep-teal/10 border border-deep-teal angular-frame">
              <div>
                <h4 className="text-white font-medium text-sm mb-1">Export All Data (JSON)</h4>
                <p className="text-gray-400 text-xs">Download all your workspaces, conversations, memories, and settings as JSON</p>
              </div>
              <CyberButton variant="secondary" onClick={handleExportData} disabled={exporting}>
                {exporting ? <Loader2 size={16} className="inline mr-2 animate-spin" /> : <Download size={16} className="inline mr-2" />}
                {exporting ? 'Exporting...' : 'Export'}
              </CyberButton>
            </div>
            <div className="flex items-center justify-between p-4 bg-error-red/5 border border-error-red/30 angular-frame">
              <div>
                <h4 className="text-error-red font-medium text-sm mb-1">Delete Chimera Account</h4>
                <p className="text-gray-400 text-xs">Permanently delete your account and all associated data</p>
              </div>
              <CyberButton variant="danger" onClick={handleDeleteAccount} disabled={deleting}>
                {deleting ? <Loader2 size={16} className="inline mr-2 animate-spin" /> : <Trash2 size={16} className="inline mr-2" />}
                {deleting ? 'Deleting...' : 'Delete Account'}
              </CyberButton>
            </div>
          </div>
        </CyberCard>
        <div className="mt-8 p-4 border border-deep-teal/30 angular-frame">
          <div className="flex items-center justify-between text-xs font-mono text-gray-500">
            <span>Chimera Protocol v1.0.0</span>
            <span>Neural Core: Online</span>
            <span>Last Sync: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
