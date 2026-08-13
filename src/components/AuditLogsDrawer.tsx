import React, { useState } from 'react';
import { useCRMStore } from '../store/crmStore';
import { X, Search, Clock, User } from 'lucide-react';

interface AuditLogsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogsDrawer: React.FC<AuditLogsDrawerProps> = ({ isOpen, onClose }) => {
  const { auditLogs } = useCRMStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch =
      log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.candidate_name && log.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'APPROVE_PLACEMENT':
        return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/20 dark:border-green-900/30';
      case 'REJECT_PLACEMENT':
      case 'SOFT_DELETE_CANDIDATE':
        return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/20 dark:border-red-900/30';
      case 'REGISTER_CANDIDATE':
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/20 dark:border-blue-900/30';
      case 'RECORD_PAYMENT':
        return 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-900/30';
      default:
        return 'text-text-secondary bg-bg-secondary border-border-primary';
    }
  };

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const actionTypes = ['ALL', 'REGISTER_CANDIDATE', 'APPROVE_PLACEMENT', 'RECORD_PAYMENT', 'UPDATE_PROFILE', 'SOFT_DELETE_CANDIDATE'];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-45 bg-black/30 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Slide-out Panel */}
      <div
        className={`pycrm-audit-drawer fixed top-0 right-0 h-full w-[420px] max-w-full bg-bg-card border-l border-border-primary shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col text-text-primary ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-border-secondary flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">System Change Log</h3>
            <p className="text-xs text-text-muted">Real-time transactional audit logs</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-border-secondary space-y-3 bg-bg-secondary/40">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search user, candidate, actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-border-primary bg-bg-card focus:outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange/20"
            />
          </div>

          {/* Action types horizontal scroll pills */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
            {actionTypes.map(type => (
              <button
                key={type}
                onClick={() => setActionFilter(type)}
                className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1.5 rounded-full border whitespace-nowrap transition-all ${
                  actionFilter === type
                    ? 'bg-accent-orange border-accent-orange text-white'
                    : 'bg-bg-card border-border-primary text-text-secondary hover:bg-bg-hover'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-10 text-xs text-text-muted">
              No system changes match the criteria.
            </div>
          ) : (
            filteredLogs.map(log => (
              <div
                key={log.id}
                className="p-4 rounded-xl border border-border-primary bg-bg-card shadow-sm space-y-2 hover:border-text-muted/30 transition-all text-xs"
              >
                {/* Meta Row: Action Badge & Time */}
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-mono border font-semibold ${getActionColor(log.action)}`}>
                    {log.action.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-text-muted flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(log.created_at)}
                  </span>
                </div>

                {/* Description */}
                <p className="text-text-primary leading-relaxed font-medium">
                  {log.description}
                </p>

                {/* User Metadata */}
                <div className="flex items-center justify-between text-[10px] text-text-secondary bg-bg-secondary/40 px-2 py-1.5 rounded-lg border border-border-secondary">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3 text-text-muted" />
                    By: <strong className="text-text-primary">{log.user_name}</strong>
                  </span>
                  <span className="font-mono text-text-muted">{log.ip_address}</span>
                </div>

                {/* Expandable Old/New Diffs if present */}
                {(log.old_value || log.new_value) && (
                  <div className="mt-2 space-y-1 bg-bg-secondary/20 p-2 rounded-lg border border-border-secondary font-mono text-[9px] overflow-x-auto">
                    {log.old_value && (
                      <div className="text-red-600 dark:text-red-400 flex items-start gap-1">
                        <span className="font-semibold">- OLD:</span>
                        <span>{log.old_value}</span>
                      </div>
                    )}
                    {log.new_value && (
                      <div className="text-green-600 dark:text-green-400 flex items-start gap-1">
                        <span className="font-semibold">+ NEW:</span>
                        <span>{log.new_value}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
