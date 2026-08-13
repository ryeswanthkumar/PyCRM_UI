import React from 'react';
import { useCRMStore } from '../store/crmStore';
import {
  LayoutDashboard,
  UserCheck,
  BarChart3,
  DatabaseBackup,
  History,
  X,
  Sun,
  Moon,
  LogOut,
  ClipboardCheck,
  WalletCards,
  BellRing,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleAuditLogs: () => void;
}

const NAV_ITEMS = [
  { key: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'DIRECT_PLACEMENT', label: 'Direct Placement', icon: UserCheck },
  { key: 'REPORTS', label: 'Reports', icon: BarChart3 },
  { key: 'BACKUP', label: 'Backup', icon: DatabaseBackup },
] as const;

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onToggleAuditLogs,
}) => {
  const {
    activeTab,
    setActiveTab,
    currentTheme,
    setTheme,
    currentUser,
    setUserRole,
    candidates,
    notifications,
  } = useCRMStore();

  const handleNavClick = (tab: typeof NAV_ITEMS[number]['key']) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) onClose();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // UI-only workload indicators derived from existing CRM state.
  const visibleCandidates =
    currentUser.role === 'TEAM_LEAD' && currentUser.team_id
      ? candidates.filter(candidate => candidate.team_id === currentUser.team_id)
      : candidates;

  const pendingApprovals = visibleCandidates.filter(
    candidate => candidate.placement_status === 'PENDING_APPROVAL'
  ).length;

  const pendingPayments = visibleCandidates.filter(
    candidate => candidate.pending_amount > 0
  ).length;

  const unreadNotifications = notifications.filter(
    notification => !notification.is_read
  ).length;

  const handleLogout = () => {
    const confirmed = window.confirm(
      'Log out and return to the default demo identity?'
    );
    if (confirmed) {
      setUserRole('SUPER_ADMIN', null);
      setActiveTab('DASHBOARD');
    }
  };

  const navButton = (key: typeof NAV_ITEMS[number]['key'], label: string, Icon: React.ElementType) => {
    const isActive = activeTab === key;
    return (
      <button
        key={key}
        onClick={() => handleNavClick(key)}
        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
          isActive
            ? 'bg-accent-orange text-white shadow-md shadow-accent-orange/20'
            : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
        }`}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        {isActive && <ChevronRight className="h-4 w-4 opacity-80" />}
      </button>
    );
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border-primary bg-bg-card text-text-primary transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border-primary px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-accent-orange" />
            <div className="leading-tight">
              <p className="font-mono text-sm font-bold uppercase tracking-wider text-text-primary">
                PyCRM
              </p>
              <p className="text-[10px] text-text-muted">Placement Payment System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
            title="Hide sidebar"
            aria-label="Hide sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-2 px-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-text-muted">
              Workspace
            </p>
          </div>
          <div className="space-y-1">
            {NAV_ITEMS.slice(0, 2).map(({ key, label, icon: Icon }) => navButton(key, label, Icon))}
          </div>

          <div className="mb-2 mt-6 px-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-text-muted">
              Insights
            </p>
          </div>
          {navButton('REPORTS', 'Reports', BarChart3)}

          <div className="mb-2 mt-6 px-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-text-muted">
              System
            </p>
          </div>
          <div className="space-y-1">
            {navButton('BACKUP', 'Backup', DatabaseBackup)}
            <button
              onClick={onToggleAuditLogs}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-text-secondary transition-all hover:bg-bg-hover hover:text-text-primary"
            >
              <History className="h-5 w-5 shrink-0" />
              <span className="flex-1 text-left">Audit Logs</span>
              {unreadNotifications > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[9px] font-bold text-white">
                  {unreadNotifications}
                </span>
              )}
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-border-primary bg-bg-secondary/60 p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-text-muted">Today</p>
                <p className="mt-0.5 text-xs font-semibold text-text-primary">Workload</p>
              </div>
              <BellRing className="h-4 w-4 text-accent-orange" />
            </div>

            <button
              onClick={() => handleNavClick('DIRECT_PLACEMENT')}
              className="group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-bg-hover"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <ClipboardCheck className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-text-primary">Placement approvals</p>
                <p className="text-[9px] text-text-muted">Needs review</p>
              </div>
              <span className="text-sm font-bold text-text-primary">{pendingApprovals}</span>
            </button>

            <button
              onClick={() => handleNavClick('REPORTS')}
              className="group mt-1 flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-bg-hover"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                <WalletCards className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-text-primary">Pending payments</p>
                <p className="text-[9px] text-text-muted">Outstanding dues</p>
              </div>
              <span className="text-sm font-bold text-text-primary">{pendingPayments}</span>
            </button>

            <button
              onClick={onToggleAuditLogs}
              className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-bg-hover"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <BellRing className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-text-primary">Unread alerts</p>
                <p className="text-[9px] text-text-muted">System notifications</p>
              </div>
              <span className="text-sm font-bold text-text-primary">{unreadNotifications}</span>
            </button>
          </div>

          <div className="mb-2 mt-6 px-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-text-muted">Preferences</p>
          </div>
          <button
            onClick={() => setTheme(currentTheme === 'sunny' ? 'command' : 'sunny')}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-text-secondary transition-all hover:bg-bg-hover hover:text-text-primary"
          >
            {currentTheme === 'sunny' ? <Moon className="h-5 w-5 shrink-0" /> : <Sun className="h-5 w-5 shrink-0" />}
            <span className="flex-1 text-left">
              {currentTheme === 'sunny' ? 'Dark Theme' : 'Light Theme'}
            </span>
          </button>
        </nav>

        <div className="border-t border-border-primary px-3 py-3">
          <div className="rounded-2xl border border-border-primary bg-bg-secondary/50 p-2.5">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-primary bg-bg-card text-xs font-bold text-text-primary shadow-sm"
                title={currentUser.role}
              >
                {getInitials(currentUser.full_name)}
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-bold text-text-primary">{currentUser.full_name}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <p className="truncate text-[9px] font-semibold uppercase tracking-wider text-text-muted">
                    {currentUser.role.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-text-secondary transition-all hover:bg-red-500/10 hover:text-red-500"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            Logout
          </button>

          <p className="mt-2 px-2 text-[9px] text-text-muted">© 2026 UNIQ Placement Payment System</p>
        </div>
      </aside>
    </>
  );
};
