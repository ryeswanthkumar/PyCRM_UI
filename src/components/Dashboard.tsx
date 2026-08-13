import React, { useState } from 'react';
import { useCRMStore } from '../store/crmStore';
import type { Candidate } from '../store/crmStore';
import { Users, UserPlus, CheckCircle, IndianRupee, Search, Mail, Send, Activity, ShieldAlert, X, Upload, TrendingUp, WalletCards, ShieldCheck, Building2, GraduationCap, CircleDollarSign, AlertTriangle, Clock3, BarChart3, Zap } from 'lucide-react';
import { StudentDetailView } from './StudentDetailView';

export const Dashboard: React.FC = () => {
  const {
    candidates,
    payments,
    auditLogs,
    currentUser,
    updateCandidate,
    approveCandidate,
    rejectCandidate,
    addPayment,
    addDocument,
    setActiveTab,
    setSelectedCandidateId
  } = useCRMStore();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Custom Filter Pills
  const [formPendingOnly, setFormPendingOnly] = useState(false);
  const [bgvClearedOnly, setBgvClearedOnly] = useState(false);
  const [hasDuesOnly, setHasDuesOnly] = useState(false);

  // Workflow Dispatcher States
  const [workflowEmail, setWorkflowEmail] = useState('');
  const [workflowType, setWorkflowType] = useState<'NEW_REG' | 'DP_REG' | 'BGV' | 'DP_BGV' | 'CONTACT'>('NEW_REG');

  // Interactive Modal States
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isPlacementModalOpen, setIsPlacementModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Form Fields for Modals
  const [companyName, setCompanyName] = useState('');
  const [designation, setDesignation] = useState('');
  const [ctc, setCtc] = useState('');
  const [collectionPercentage, setCollectionPercentage] = useState(10);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [txRef, setTxRef] = useState('');
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [docType, setDocType] = useState('OFFER_LETTER');
  const [docName, setDocName] = useState('');

  // Dynamic greeting based on the user's local time
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? 'Good Morning'
      : currentHour < 17
        ? 'Good Afternoon'
        : 'Good Evening';

  // 1. FILTER CANDIDATES BASED ON ACTIVE ROLE & ISOLATION
  const getVisibleCandidates = () => {
    let list = candidates;
    // Team Isolation: Team Leads can only see their own team's candidates
    if (currentUser.role === 'TEAM_LEAD' && currentUser.team_id) {
      list = candidates.filter(c => c.team_id === currentUser.team_id);
    }
    return list;
  };

  const visibleCandidates = getVisibleCandidates();

  // 2. METRICS CALCULATIONS
  const totalCandidatesCount = visibleCandidates.length;
  
  // New Joinees = Training candidates who haven't completed BGV details yet
  const newJoineesCount = visibleCandidates.filter(
    c => c.candidate_type === 'TRAINING' && !c.date_of_birth
  ).length;

  // Placed Candidates
  const placedCandidatesCount = visibleCandidates.filter(
    c => c.placement_status === 'APPROVED' || c.placement_status === 'PENDING_APPROVAL'
  ).length;

  // Revenue Received for visible candidates
  const visibleCandidateIds = new Set(visibleCandidates.map(c => c.id));
  const revenueReceived = payments
    .filter(p => visibleCandidateIds.has(p.candidate_id))
    .reduce((sum, p) => sum + p.amount, 0);

  // Pending Dues for visible candidates
  const pendingDues = visibleCandidates.reduce((sum, c) => sum + c.pending_amount, 0);

  // 3. EXTRACT DROP-DOWN FILTER VALUES DYNAMICALLY
  const branches = ['ALL', ...Array.from(new Set(visibleCandidates.map(c => c.branch)))];
  const courses = ['ALL', ...Array.from(new Set(visibleCandidates.map(c => c.course)))];

  // 4. APPLY SEARCH & FILTER CONTROLS
  const filteredCandidates = visibleCandidates.filter(c => {
    const matchesSearch =
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.candidate_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.batch && c.batch.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesBranch = branchFilter === 'ALL' || c.branch === branchFilter;
    const matchesCourse = courseFilter === 'ALL' || c.course === courseFilter;
    
    let matchesStatus = true;
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'PLACED') {
        matchesStatus = c.placement_status === 'APPROVED';
      } else if (statusFilter === 'PENDING_APPROVAL') {
        matchesStatus = c.placement_status === 'PENDING_APPROVAL';
      } else if (statusFilter === 'NOT_PLACED') {
        matchesStatus = c.placement_status === 'NOT_PLACED';
      }
    }

    // Filter pills logic
    const matchesFormPending = !formPendingOnly || !c.date_of_birth; // No DOB means BGV form pending
    const matchesBgvCleared = !bgvClearedOnly || !!c.date_of_birth;  // Has DOB means BGV submitted
    const matchesHasDues = !hasDuesOnly || c.pending_amount > 0;

    return matchesSearch && matchesBranch && matchesCourse && matchesStatus && matchesFormPending && matchesBgvCleared && matchesHasDues;
  });

  // 5. HANDLERS
  const handleDispatchWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflowEmail) return;

    // Simulate sending email notification
    alert(`Branded email workflow dispatched successfully to ${workflowEmail}`);
    
    // Log the event in Zustand store
    useCRMStore.getState().addCandidate({
      full_name: workflowEmail.split('@')[0],
      email: workflowEmail,
      phone: '',
      course: 'Pending Registration',
      branch: 'Online',
      batch: 'Pending Batch',
      candidate_type: workflowType.includes('DP') ? 'DIRECT_PLACEMENT' : 'TRAINING',
      placement_status: 'NOT_PLACED'
    });

    setWorkflowEmail('');
  };

  const handleOpenDetailModal = (candidate: Candidate) => {
    if (candidate.candidate_type === 'DIRECT_PLACEMENT') {
      setActiveTab('DIRECT_PLACEMENT');
      setSelectedCandidateId(candidate.id);
    } else {
      setSelectedCandidate(candidate);
      setIsDetailModalOpen(true);
    }
  };



  const handleSubmitPlacement = () => {
    if (!selectedCandidate || !companyName || !designation || !ctc) return;
    
    updateCandidate(selectedCandidate.id, {
      placement_company: companyName,
      designation: designation,
      annual_ctc: Number(ctc),
      placement_status: 'PENDING_APPROVAL'
    });

    // Mock upload of initial offer letter
    addDocument({
      candidate_id: selectedCandidate.id,
      doc_type: 'OFFER_LETTER',
      file_name: `${companyName.replace(/\s+/g, '_')}_Offer_Letter.pdf`,
      file_url: '#',
      uploaded_by: currentUser.id
    });

    setIsPlacementModalOpen(false);
    setSelectedCandidate(null);
  };



  const handleApprove = () => {
    if (!selectedCandidate) return;
    approveCandidate(selectedCandidate.id, collectionPercentage);
    setIsApprovalModalOpen(false);
    setSelectedCandidate(null);
  };

  const handleReject = () => {
    if (!selectedCandidate) return;
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      rejectCandidate(selectedCandidate.id, reason);
    }
    setIsApprovalModalOpen(false);
    setSelectedCandidate(null);
  };



  const handleSubmitPayment = () => {
    if (!selectedCandidate || !paymentAmount) return;
    addPayment({
      candidate_id: selectedCandidate.id,
      amount: Number(paymentAmount),
      payment_date: new Date().toISOString().split('T')[0],
      payment_mode: paymentMode,
      transaction_ref: txRef || `TXN${Date.now()}`,
      collected_by: currentUser.full_name,
      remarks: paymentRemarks || 'Installment Payment'
    });
    setIsPaymentModalOpen(false);
    setSelectedCandidate(null);
  };



  const handleSubmitDoc = () => {
    if (!selectedCandidate || !docName) return;
    addDocument({
      candidate_id: selectedCandidate.id,
      doc_type: docType,
      file_name: docName,
      file_url: '#',
      uploaded_by: currentUser.id
    });
    setIsDocModalOpen(false);
    setSelectedCandidate(null);
  };

  if (isDetailModalOpen && selectedCandidate) {
    return (
      <StudentDetailView
        candidate={selectedCandidate}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedCandidate(null);
          setSelectedCandidateId(null);
        }}
        breadcrumbSource="Dashboard"
      />
    );
  }

  return (
    <div className="pycrm-dashboard w-full py-5 md:py-7 space-y-7 fade-in">
      {/* Premium but restrained welcome hero */}
      <section className="pycrm-hero relative overflow-hidden rounded-2xl border border-violet-500/25 bg-[#080d18] p-6 md:p-8 shadow-[0_20px_60px_rgba(30,20,70,.28)]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -right-16 -top-28 h-80 w-80 rounded-full bg-violet-600/15 blur-3xl" />
          <div
            className="absolute inset-y-0 right-0 w-[58%] bg-cover bg-center opacity-[0.16] mix-blend-screen"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #080d18 0%, rgba(8,13,24,.82) 28%, rgba(8,13,24,.20) 100%), url('https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=80')",
            }}
          />
          <div className="absolute inset-y-0 right-0 w-[58%] bg-gradient-to-l from-violet-500/10 via-transparent to-transparent" />
        </div>
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-violet-300 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" /> Live placement overview
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              {greeting}, <span className="text-violet-300">{currentUser.full_name}</span> <span className="text-2xl">👋</span>
            </h1>
            <p className="mt-2 text-sm text-slate-300">A clean command view of candidates, placements, collections and approvals.</p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <div className="pycrm-mini-chip"><span>Today</span><strong>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
              <div className="pycrm-mini-chip"><span>Pipeline</span><strong>{totalCandidatesCount} candidates</strong></div>
              <div className="pycrm-mini-chip"><span>System</span><strong className="text-emerald-300">Demo workspace</strong></div>
            </div>
          </div>
          <div className="pycrm-score-card shrink-0">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Placement rate</div>
            <div className="mt-1 flex items-end gap-2"><span className="text-4xl font-extrabold text-white">{totalCandidatesCount ? Math.round((placedCandidatesCount / totalCandidatesCount) * 100) : 0}</span><span className="pb-1 text-xs text-emerald-300">current pipeline</span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-emerald-400" style={{ width: `${totalCandidatesCount ? Math.min(100, Math.round((placedCandidatesCount / totalCandidatesCount) * 100)) : 0}%` }} /></div>
          </div>
        </div>
      </section>

      {/* KPI strip */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: 'Total Candidates', value: totalCandidatesCount, sub: 'Active pipeline', icon: Users, tone: 'violet' },
          { label: 'New Joinees', value: newJoineesCount, sub: 'Needs onboarding', icon: UserPlus, tone: 'blue' },
          { label: 'Placement Pipeline', value: placedCandidatesCount, sub: 'Approved + pending', icon: CheckCircle, tone: 'emerald' },
          { label: 'Recorded Payments', value: `₹${revenueReceived.toLocaleString()}`, sub: 'All recorded collections', icon: CircleDollarSign, tone: 'green' },
          { label: 'Placement Dues', value: `₹${pendingDues.toLocaleString()}`, sub: 'Existing placement balance', icon: IndianRupee, tone: 'red' },
          { label: 'BGV Ready', value: `${totalCandidatesCount ? Math.round((visibleCandidates.filter(c => !!c.date_of_birth).length / totalCandidatesCount) * 100) : 0}%`, sub: 'Profiles cleared', icon: ShieldCheck, tone: 'yellow' },
        ].map(({ label, value, sub, icon: Icon, tone }) => (
          <div key={label} className={`pycrm-kpi pycrm-${tone}`}>
            <div className="pycrm-kpi-icon"><Icon className="h-5 w-5" /></div>
            <div className="min-w-0"><div className="text-[9px] font-bold uppercase tracking-[.13em] text-slate-400 truncate">{label}</div><div className="mt-1 text-xl font-extrabold text-white truncate">{value}</div><div className="text-[10px] text-slate-500 truncate">{sub}</div></div>
          </div>
        ))}
      </section>

      {/* Analytics row */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="pycrm-panel xl:col-span-4">
          <div className="pycrm-panel-head"><div><p className="pycrm-eyebrow">Placement pipeline</p><h3>Candidate movement</h3></div><TrendingUp className="h-4 w-4 text-violet-300" /></div>
          <div className="mt-5 space-y-3">
            {[
              ['Registered', totalCandidatesCount, 'bg-violet-500'],
              ['BGV Completed', visibleCandidates.filter(c => !!c.date_of_birth).length, 'bg-blue-500'],
              ['In Pipeline', visibleCandidates.filter(c => c.placement_status === 'PENDING_APPROVAL').length, 'bg-amber-400'],
              ['Approved', visibleCandidates.filter(c => c.placement_status === 'APPROVED').length, 'bg-emerald-400'],
            ].map(([label, val, color]) => {
              const n = Number(val); const pct = totalCandidatesCount ? Math.max(8, Math.round((n / totalCandidatesCount) * 100)) : 8;
              return <div key={String(label)}><div className="flex justify-between text-[11px] mb-1.5"><span className="text-slate-300">{label}</span><strong className="text-white">{n}</strong></div><div className="h-2 rounded-full bg-white/5 overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} /></div></div>;
            })}
          </div>
          <div className="mt-5 rounded-xl bg-violet-500/8 border border-violet-500/15 px-3 py-2.5 flex items-center justify-between"><span className="text-xs text-slate-400">Overall conversion</span><strong className="text-violet-300">{totalCandidatesCount ? Math.round((placedCandidatesCount / totalCandidatesCount) * 100) : 0}%</strong></div>
        </div>

        <div className="pycrm-panel xl:col-span-5 pycrm-conversion-panel">
          <div className="pycrm-panel-head"><div><p className="pycrm-eyebrow">Performance</p><h3>Current conversion</h3></div><BarChart3 className="h-4 w-4 text-violet-300" /></div>
          {totalCandidatesCount > 0 ? (
            <div className="mt-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500">Candidates converted to placement</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-text-primary">{Math.round((placedCandidatesCount / totalCandidatesCount) * 100)}</span>
                    <span className="text-sm font-semibold text-violet-500 dark:text-violet-300">%</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Placed</div>
                  <div className="mt-1 text-lg font-bold text-emerald-500 dark:text-emerald-300">{placedCandidatesCount}</div>
                  <div className="text-[10px] text-slate-500">of {totalCandidatesCount} candidates</div>
                </div>
              </div>
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Placement conversion</span>
                  <span className="text-[10px] font-bold text-violet-500 dark:text-violet-300">{Math.round((placedCandidatesCount / totalCandidatesCount) * 100)}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-400 transition-all duration-700" style={{ width: `${Math.min(100, Math.round((placedCandidatesCount / totalCandidatesCount) * 100))}%` }} />
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2">
                <div className="pycrm-metric-mini"><div>Pipeline</div><strong>{totalCandidatesCount}</strong></div>
                <div className="pycrm-metric-mini"><div>Placed</div><strong className="text-emerald-500 dark:text-emerald-300">{placedCandidatesCount}</strong></div>
                <div className="pycrm-metric-mini"><div>Remaining</div><strong>{Math.max(0, totalCandidatesCount - placedCandidatesCount)}</strong></div>
              </div>
            </div>
          ) : (
            <div className="pycrm-data-empty mt-5">
              <div className="pycrm-data-empty-icon"><BarChart3 className="h-6 w-6" /></div>
              <p className="mt-3 text-sm font-semibold text-text-primary">No conversion data yet</p>
              <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-text-muted">Placement performance will appear here once candidates enter the placement pipeline.</p>
            </div>
          )}
        </div>

        <div className="pycrm-panel xl:col-span-3">
          <div className="pycrm-panel-head"><div><p className="pycrm-eyebrow">Collection health</p><h3>Cash position</h3></div><WalletCards className="h-4 w-4 text-emerald-300" /></div>
          <div className="mt-5 flex items-center gap-4"><div className="pycrm-donut" style={{ ['--pct' as any]: `${revenueReceived + pendingDues ? Math.round((revenueReceived / (revenueReceived + pendingDues)) * 100) : 0}%` }}><span>{revenueReceived + pendingDues ? Math.round((revenueReceived / (revenueReceived + pendingDues)) * 100) : 0}%</span></div><div className="space-y-3 text-xs"><div><span className="text-slate-500">Recorded collections</span><div className="font-bold text-emerald-500 dark:text-emerald-300">₹{revenueReceived.toLocaleString()}</div></div><div><span className="text-slate-500">Outstanding dues</span><div className="font-bold text-red-500 dark:text-red-300">₹{pendingDues.toLocaleString()}</div></div></div></div>
          <div className="mt-5 rounded-xl border border-border-primary bg-bg-secondary/60 px-3 py-2.5 text-[10px] text-text-muted"><span className="font-semibold text-text-secondary">Note:</span> collection figures use recorded payments; outstanding dues follow the existing candidate payment state.</div>
        </div>
      </section>

      {/* Compact analytics */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: 'Average Dues', value: `₹${totalCandidatesCount ? Math.round(pendingDues / totalCandidatesCount).toLocaleString() : 0}`, tone: 'red', Icon: CircleDollarSign },
          { label: 'Approval Rate', value: `${totalCandidatesCount ? Math.round((visibleCandidates.filter(c => c.placement_status === 'APPROVED').length / totalCandidatesCount) * 100) : 0}%`, tone: 'yellow', Icon: CheckCircle },
          { label: 'Active Batches', value: new Set(visibleCandidates.map(c => c.batch).filter(Boolean)).size, tone: 'violet', Icon: GraduationCap },
          { label: 'Active Branches', value: new Set(visibleCandidates.map(c => c.branch).filter(Boolean)).size, tone: 'blue', Icon: Building2 },
          { label: 'Needs Attention', value: visibleCandidates.filter(c => c.pending_amount > 0 || c.placement_status === 'PENDING_APPROVAL').length, tone: 'red', Icon: AlertTriangle },
          { label: 'Recent Activity', value: Math.min(5, auditLogs.length), tone: 'green', Icon: Activity },
        ].map(({ label, value, tone, Icon }) => <div key={label} className="pycrm-small-stat"><Icon className={`h-4 w-4 ${tone === 'green' ? 'text-emerald-300' : tone === 'yellow' ? 'text-yellow-300' : tone === 'blue' ? 'text-blue-300' : tone === 'red' ? 'text-red-300' : 'text-violet-300'}`} /><div><div className="text-[9px] uppercase tracking-wider text-slate-500">{label}</div><strong className="text-sm text-white">{String(value)}</strong></div></div>)}
      </section>

      {/* Action center — derived only from existing dashboard data. */}
      <section className="pycrm-action-center grid grid-cols-1 md:grid-cols-3 gap-3">
        <button onClick={() => setActiveTab('DIRECT_PLACEMENT')} className="pycrm-action-card text-left">
          <div className="pycrm-action-icon amber"><Clock3 className="h-4 w-4" /></div>
          <div className="min-w-0 flex-1"><p>Approvals waiting</p><span>{visibleCandidates.filter(c => c.placement_status === 'PENDING_APPROVAL').length} candidate{visibleCandidates.filter(c => c.placement_status === 'PENDING_APPROVAL').length === 1 ? '' : 's'} need review</span></div>
          <span className="pycrm-action-count amber">{visibleCandidates.filter(c => c.placement_status === 'PENDING_APPROVAL').length}</span>
        </button>

        <button onClick={() => setActiveTab('REPORTS')} className="pycrm-action-card text-left">
          <div className="pycrm-action-icon red"><WalletCards className="h-4 w-4" /></div>
          <div className="min-w-0 flex-1"><p>Outstanding dues</p><span>{visibleCandidates.filter(c => c.pending_amount > 0).length} candidate{visibleCandidates.filter(c => c.pending_amount > 0).length === 1 ? '' : 's'} with pending balance</span></div>
          <span className="pycrm-action-count red">{visibleCandidates.filter(c => c.pending_amount > 0).length}</span>
        </button>

        <button onClick={() => setActiveTab('DASHBOARD')} className="pycrm-action-card text-left">
          <div className="pycrm-action-icon violet"><ShieldAlert className="h-4 w-4" /></div>
          <div className="min-w-0 flex-1"><p>BGV follow-up</p><span>{visibleCandidates.filter(c => !c.date_of_birth).length} profile{visibleCandidates.filter(c => !c.date_of_birth).length === 1 ? '' : 's'} still need BGV</span></div>
          <span className="pycrm-action-count violet">{visibleCandidates.filter(c => !c.date_of_birth).length}</span>
        </button>
      </section>

      {/* Operations */}
      <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="pycrm-panel"><div className="pycrm-panel-head"><div><p className="pycrm-eyebrow">Branch pulse</p><h3>Top locations</h3></div><Building2 className="h-4 w-4 text-yellow-300" /></div><div className="mt-4 space-y-3">{branches.filter(b => b !== 'ALL').slice(0,4).map((b) => <div key={b}><div className="flex justify-between text-[10px] mb-1"><span className="text-slate-300">{b}</span><span className="text-slate-400">{visibleCandidates.filter(c => c.branch === b).length}</span></div><div className="h-1.5 rounded-full bg-white/5"><div className="h-full rounded-full bg-violet-400" style={{width:`${Math.max(8, totalCandidatesCount ? visibleCandidates.filter(c=>c.branch===b).length/totalCandidatesCount*100 : 8)}%`}} /></div></div>)}</div></div>
        <div className="pycrm-panel"><div className="pycrm-panel-head"><div><p className="pycrm-eyebrow">Recent collections</p><h3>Payment activity</h3></div><WalletCards className="h-4 w-4 text-emerald-300" /></div><div className="mt-3 space-y-2">{payments.slice(-4).reverse().map(p => { const c = candidates.find(x => x.id === p.candidate_id); return <div key={p.id} className="flex items-center justify-between border-b border-white/5 pb-2"><div className="min-w-0"><div className="text-[11px] font-semibold text-slate-200 truncate">{c?.full_name || 'Candidate'}</div><div className="text-[9px] text-slate-500">{p.payment_mode} · {p.payment_date}</div></div><strong className="text-[11px] text-emerald-300">₹{p.amount.toLocaleString()}</strong></div>})}</div></div>
        <div className="pycrm-panel"><div className="pycrm-panel-head"><div><p className="pycrm-eyebrow">Approval queue</p><h3>Pending decisions</h3></div><Clock3 className="h-4 w-4 text-yellow-300" /></div><div className="mt-4 space-y-2">{visibleCandidates.filter(c=>c.placement_status==='PENDING_APPROVAL').slice(0,4).map(c=><div key={c.id} className="rounded-lg border border-yellow-400/10 bg-yellow-400/5 px-3 py-2 flex justify-between items-center"><div><div className="text-[11px] font-semibold text-white">{c.full_name}</div><div className="text-[9px] text-slate-500">{c.placement_company || 'Placement pending'}</div></div><span className="text-[9px] font-bold text-yellow-300">REVIEW</span></div>)}{visibleCandidates.filter(c=>c.placement_status==='PENDING_APPROVAL').length===0&&<p className="text-xs text-slate-500">No pending approvals.</p>}</div></div>
        <div className="pycrm-panel"><div className="pycrm-panel-head"><div><p className="pycrm-eyebrow">Risk & attention</p><h3>Priority signals</h3></div><Zap className="h-4 w-4 text-red-300" /></div><div className="mt-4 space-y-2"><div className="pycrm-alert red"><AlertTriangle className="h-4 w-4"/><span>{visibleCandidates.filter(c=>c.pending_amount>0).length} candidates with outstanding dues</span></div><div className="pycrm-alert yellow"><Clock3 className="h-4 w-4"/><span>{visibleCandidates.filter(c=>c.placement_status==='PENDING_APPROVAL').length} placements awaiting approval</span></div><div className="pycrm-alert purple"><ShieldAlert className="h-4 w-4"/><span>{visibleCandidates.filter(c=>!c.date_of_birth).length} BGV profiles pending</span></div></div></div>
      </section>

      {/* Search and candidates — functionality preserved */}
      <section className="pycrm-panel p-4 md:p-5">
        <div className="pycrm-search-row">
          <div className="pycrm-input-wrap">
            <Search className="pycrm-search-icon text-slate-500" />
            <input
              type="text"
              placeholder="Search students, emails, phones, batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pycrm-input pl-10"
            />
          </div>
          <select value={branchFilter} onChange={(e)=>setBranchFilter(e.target.value)} className="pycrm-select"><option value="ALL">All Branches</option>{branches.filter(b=>b!=='ALL').map(b=><option key={b} value={b}>{b}</option>)}</select>
          <select value={courseFilter} onChange={(e)=>setCourseFilter(e.target.value)} className="pycrm-select"><option value="ALL">All Courses</option>{courses.filter(c=>c!=='ALL').map(c=><option key={c} value={c}>{c}</option>)}</select>
          <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} className="pycrm-select"><option value="ALL">All Statuses</option><option value="NOT_PLACED">Training (Unplaced)</option><option value="PENDING_APPROVAL">Pending Approval</option><option value="PLACED">Placed & Approved</option></select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2"><button onClick={()=>setFormPendingOnly(!formPendingOnly)} className={`pycrm-filter ${formPendingOnly?'active':''}`}>BGV Pending</button><button onClick={()=>setBgvClearedOnly(!bgvClearedOnly)} className={`pycrm-filter ${bgvClearedOnly?'active':''}`}>BGV Completed</button><button onClick={()=>setHasDuesOnly(!hasDuesOnly)} className={`pycrm-filter ${hasDuesOnly?'active':''}`}>Outstanding Dues</button></div>
        <div className="mt-4 flex items-center justify-between"><h3 className="text-sm font-bold text-white">Students Database <span className="text-slate-500">({filteredCandidates.length})</span></h3><span className="text-[9px] uppercase tracking-wider text-emerald-300">Live results</span></div>
        {filteredCandidates.length===0 ? <div className="pycrm-empty"><ShieldAlert className="h-6 w-6 text-violet-300"/><div><div className="font-semibold text-white">No matching candidates</div><div className="text-xs text-slate-500">Adjust the filters or search term.</div></div></div> : <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">{filteredCandidates.map(candidate=><div key={candidate.id} onClick={()=>handleOpenDetailModal(candidate)} className="pycrm-candidate"><div className="min-w-0"><span className="text-[8px] font-mono text-violet-300">{candidate.candidate_code}</span><h4 className="mt-1 text-sm font-semibold text-white truncate">{candidate.full_name}</h4><p className="text-[10px] text-slate-500 truncate">{candidate.branch} · {candidate.course}</p></div><span className={`pycrm-status ${candidate.placement_status==='APPROVED'?'approved':candidate.placement_status==='PENDING_APPROVAL'?'pending':candidate.placement_status==='REJECTED'?'rejected':'neutral'}`}>{candidate.placement_status.replace('_',' ')}</span></div>)}</div>}
      </section>

      {/* Workflow + system status */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="pycrm-panel xl:col-span-2"><div className="pycrm-panel-head"><div><p className="pycrm-eyebrow">Quick workflow</p><h3>Dispatch a candidate journey</h3></div><Send className="h-4 w-4 text-violet-300" /></div><form onSubmit={handleDispatchWorkflow} className="mt-4"><div className="pycrm-input-wrap"><Mail className="pycrm-search-icon text-slate-500"/><input type="email" required placeholder="Candidate email address..." value={workflowEmail} onChange={(e)=>setWorkflowEmail(e.target.value)} className="pycrm-input pl-10"/></div><div className="mt-3 flex flex-wrap gap-2">{([['NEW_REG','New Registration'],['DP_REG','DP Registration'],['BGV','BGV Form'],['DP_BGV','DP BGV'],['CONTACT','Contact Mail']] as const).map(([key,label])=><button key={key} type="button" onClick={()=>setWorkflowType(key)} className={`pycrm-filter ${workflowType===key?'active':''}`}>{label}</button>)}<button type="submit" className="ml-auto pycrm-send"><Send className="h-3.5 w-3.5"/>Send Workflow</button></div></form></div>
        <div className="pycrm-panel"><div className="pycrm-panel-head"><div><p className="pycrm-eyebrow">Environment</p><h3>Demo workspace</h3></div><Activity className="h-4 w-4 text-emerald-300" /></div><div className="mt-4 space-y-2"><div className="pycrm-env-row"><span>Data source</span><strong>Local CRM state</strong></div><div className="pycrm-env-row"><span>Audit events</span><strong>{auditLogs.length}</strong></div><div className="pycrm-env-row"><span>Notifications</span><strong>{auditLogs.length ? 'Active' : 'Waiting'}</strong></div></div><p className="mt-3 text-[9px] leading-relaxed text-text-muted">Operational labels here describe the current demo state only; no backend health is assumed.</p></div>
      </section>

      {/* Audit log — same data, refreshed presentation */}
      <section className="pycrm-panel"><div className="pycrm-panel-head"><div><p className="pycrm-eyebrow">Audit trail</p><h3>Recent system activity</h3></div><Activity className="h-4 w-4 text-violet-300" /></div><div className="mt-3 divide-y divide-white/5">{auditLogs.slice(0,3).map(log=><div key={log.id} className="py-3 flex items-center justify-between gap-3"><div className="min-w-0"><div className="text-xs font-semibold text-slate-200 truncate">{log.description}</div><div className="text-[9px] text-slate-500">By {log.user_name} · {new Date(log.created_at).toLocaleString()}</div></div><span className="text-[9px] font-mono text-violet-300 border border-violet-500/20 rounded px-2 py-1">{log.action}</span></div>)}{auditLogs.length===0&&<div className="py-5 text-center text-xs text-slate-500">No system changes recorded yet.</div>}</div></section>

      {/* ------------------------------------------------------------------------------------------ */}
      {/* MODALS IMPLEMENTATIONS */}
      {/* ------------------------------------------------------------------------------------------ */}

      {/* 0. Student Detail Screen replacing old modal */}

      {/* A. Register Placement Details Modal */}
      {isPlacementModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 w-full max-w-md shadow-2xl text-text-primary space-y-4 fade-in">
            <div className="flex justify-between items-center border-b border-border-secondary pb-3">
              <h3 className="font-bold text-lg">Register Placement: {selectedCandidate.full_name}</h3>
              <button onClick={() => setIsPlacementModalOpen(false)} className="p-1 hover:bg-bg-hover rounded-full"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Company Name</label>
                <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Zoho Corporation" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Designation</label>
                <input type="text" required value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g. Software Engineer" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Annual CTC (INR)</label>
                <input type="number" required value={ctc} onChange={e => setCtc(e.target.value)} placeholder="e.g. 600000" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border-secondary pt-4">
              <button onClick={() => setIsPlacementModalOpen(false)} className="px-4 py-2 rounded-lg border border-border-primary bg-bg-secondary hover:bg-bg-hover text-xs font-semibold">Cancel</button>
              <button onClick={handleSubmitPlacement} className="px-4 py-2 rounded-lg bg-accent-orange hover:bg-accent-orangeHover text-white text-xs font-semibold">Submit Placement</button>
            </div>
          </div>
        </div>
      )}

      {/* B. Review & Approve Placement Modal */}
      {isApprovalModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 w-full max-w-md shadow-2xl text-text-primary space-y-4 fade-in">
            <div className="flex justify-between items-center border-b border-border-secondary pb-3">
              <h3 className="font-bold text-lg">Approve Placement - Review</h3>
              <button onClick={() => setIsApprovalModalOpen(false)} className="p-1 hover:bg-bg-hover rounded-full"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="space-y-3 text-xs bg-bg-secondary/40 p-4 rounded-xl border border-border-secondary">
              <div className="flex justify-between"><span>Candidate Code:</span><span className="font-bold">{selectedCandidate.candidate_code}</span></div>
              <div className="flex justify-between"><span>Full Name:</span><span className="font-bold">{selectedCandidate.full_name}</span></div>
              <div className="flex justify-between"><span>Company:</span><span className="font-bold text-accent-orange">{selectedCandidate.placement_company}</span></div>
              <div className="flex justify-between"><span>Designation:</span><span className="font-bold">{selectedCandidate.designation}</span></div>
              <div className="flex justify-between"><span>Annual CTC:</span><span className="font-bold text-green-600 dark:text-green-400">₹{(selectedCandidate.annual_ctc || 0).toLocaleString()}</span></div>
              <div className="flex justify-between items-center border-t border-border-secondary pt-2.5 mt-2">
                <span className="font-semibold text-text-primary">Verify Offer Letter:</span>
                <span className="bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 border border-green-200 px-2 py-0.5 rounded font-mono text-[10px]">Verified PDF</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-semibold block">Define Collection Percentage (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={collectionPercentage}
                  onChange={e => setCollectionPercentage(Number(e.target.value))}
                  placeholder="e.g. 7"
                  className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:border-accent-orange"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted font-semibold">%</span>
              </div>
              <div className="text-[10px] text-text-muted mt-1.5 bg-bg-secondary/40 border border-border-secondary rounded-lg px-3 py-2">
                Calculated Payable: <strong className="text-text-primary">₹{((selectedCandidate.annual_ctc || 0) * collectionPercentage / 100).toLocaleString()}</strong>
              </div>
            </div>

            <div className="flex justify-between gap-2 border-t border-border-secondary pt-4">
              <button onClick={handleReject} className="px-4 py-2 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold">Reject</button>
              <div className="flex gap-2">
                <button onClick={() => setIsApprovalModalOpen(false)} className="px-4 py-2 rounded-lg border border-border-primary bg-bg-secondary hover:bg-bg-hover text-xs font-semibold">Cancel</button>
                <button onClick={handleApprove} className="px-4 py-2 rounded-lg bg-accent-green hover:bg-accent-greenHover text-white text-xs font-semibold">Approve & Freeze</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* C. Record Installment Payment Modal */}
      {isPaymentModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 w-full max-w-md shadow-2xl text-text-primary space-y-4 fade-in">
            <div className="flex justify-between items-center border-b border-border-secondary pb-3">
              <h3 className="font-bold text-lg">Record Installment: {selectedCandidate.full_name}</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-1 hover:bg-bg-hover rounded-full"><X className="h-5 w-5" /></button>
            </div>

            <div className="text-xs bg-bg-secondary p-3 rounded-lg flex justify-between">
              <span>Remaining Balance:</span>
              <strong className="text-red-500 font-mono">₹{selectedCandidate.pending_amount.toLocaleString()}</strong>
            </div>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Installment Amount (INR)</label>
                <input type="number" required value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="e.g. 20000" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>

              <div>
                <label className="font-semibold block mb-1">Payment Mode</label>
                <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange text-text-secondary">
                  <option value="UPI">UPI (GPay / PhonePe)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Transaction Ref ID / Bank Proof</label>
                <input type="text" value={txRef} onChange={e => setTxRef(e.target.value)} placeholder="e.g. UPI808129038" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>

              <div>
                <label className="font-semibold block mb-1">Remarks</label>
                <input type="text" value={paymentRemarks} onChange={e => setPaymentRemarks(e.target.value)} placeholder="e.g. 2nd Installment paid" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border-secondary pt-4">
              <button onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 rounded-lg border border-border-primary bg-bg-secondary hover:bg-bg-hover text-xs font-semibold">Cancel</button>
              <button onClick={handleSubmitPayment} className="px-4 py-2 rounded-lg bg-accent-orange hover:bg-accent-orangeHover text-white text-xs font-semibold">Record Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* D. Upload Document Modal */}
      {isDocModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 w-full max-w-md shadow-2xl text-text-primary space-y-4 fade-in">
            <div className="flex justify-between items-center border-b border-border-secondary pb-3">
              <h3 className="font-bold text-lg">Upload Document: {selectedCandidate.full_name}</h3>
              <button onClick={() => setIsDocModalOpen(false)} className="p-1 hover:bg-bg-hover rounded-full"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Document Type</label>
                <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange text-text-secondary">
                  <option value="OFFER_LETTER">Offer Letter (Mandatory)</option>
                  <option value="SALARY_SLIP">Salary Slip</option>
                  <option value="JOINING_LETTER">Joining Letter</option>
                  <option value="EXPERIENCE_LETTER">Experience Letter</option>
                  <option value="BGV">BGV Document</option>
                  <option value="RECEIPT">Payment Receipt</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">File Name</label>
                <input type="text" required value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. Infosys_Offer_Letter.pdf" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>

              {/* Simulated Upload drag/drop area */}
              <div className="border-2 border-dashed border-border-primary hover:border-accent-orange/45 rounded-xl p-6 text-center space-y-2 cursor-pointer transition-all bg-bg-secondary/20">
                <Upload className="h-8 w-8 text-text-muted mx-auto" />
                <span className="text-[11px] text-text-secondary block">Click to select files or drag-and-drop</span>
                <span className="text-[9px] text-text-muted block">PDF, PNG, JPG up to 10MB</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border-secondary pt-4">
              <button onClick={() => setIsDocModalOpen(false)} className="px-4 py-2 rounded-lg border border-border-primary bg-bg-secondary hover:bg-bg-hover text-xs font-semibold">Cancel</button>
              <button onClick={handleSubmitDoc} className="px-4 py-2 rounded-lg bg-accent-orange hover:bg-accent-orangeHover text-white text-xs font-semibold">Upload Attachment</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
