import React, { useState, useEffect, useCallback } from 'react';
import { auditApi } from '../../services/api';
import {
  Activity,
  Search,
  Filter,
  ShieldCheck,
  Calendar,
  Clock,
  User,
  Building2,
  RefreshCw,
  Lock,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Server,
  Link2,
  Cpu
} from 'lucide-react';

const AdminAuditPage = () => {
  // Data State
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({
    totalEvents: 0,
    applicationEvents: 0,
    blockchainEvents: 0,
    onChainBatches: 0,
  });
  const [blockchainMonitoring, setBlockchainMonitoring] = useState({
    status: 'CONNECTED',
    network: 'Sepolia Ethereum Testnet (Simulated Proof)',
    contractAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    totalOnChainBatches: 0,
    totalOnChainEvents: 0,
    latestTx: null,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // UI & Filter States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [copiedHash, setCopiedHash] = useState('');

  // Detail Modal State
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // Fetch paginated audit logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim(),
        source: sourceFilter,
        action: actionFilter,
        status: statusFilter,
        startDate: startDate ? new Date(startDate).toISOString() : '',
        endDate: endDate ? new Date(endDate).toISOString() : '',
      };

      const res = await auditApi.getLogs(params);

      if (res.success && res.data) {
        setLogs(res.data.logs || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
        if (res.data.blockchainMonitoring) {
          setBlockchainMonitoring(res.data.blockchainMonitoring);
        }
        if (res.data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: res.data.pagination.total,
            totalPages: res.data.pagination.totalPages,
          }));
        }
      } else {
        setError(res.message || 'Failed to retrieve system audit logs.');
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Network error connecting to Secure Pharma backend API.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, sourceFilter, actionFilter, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Fetch single audit log detail
  const handleOpenDetail = async (id) => {
    setSelectedLogId(id);
    try {
      setDetailLoading(true);
      setDetailError(null);
      const res = await auditApi.getLogById(id);
      if (res.success && res.data?.log) {
        setSelectedLog(res.data.log);
      } else {
        setDetailError(res.message || 'Could not load audit log details.');
      }
    } catch (err) {
      console.error('Error fetching log detail:', err);
      setDetailError('Failed to fetch detailed audit record.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedLogId(null);
    setSelectedLog(null);
    setDetailError(null);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(''), 2500);
  };

  // Badge Formatter Helpers
  const getSourceBadge = (source) => {
    const s = (source || 'APPLICATION').toUpperCase();
    if (s === 'BLOCKCHAIN') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-mono">
          <Layers className="w-3 h-3" />
          Blockchain (On-Chain)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
        <Server className="w-3 h-3" />
        Application (Off-Chain)
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const s = (status || 'SUCCESS').toUpperCase();
    if (s === 'CONFIRMED' || s === 'SUCCESS') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3 h-3" />
          {s === 'CONFIRMED' ? 'Confirmed' : 'Success'}
        </span>
      );
    }
    if (s === 'FAILED' || s === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <XCircle className="w-3 h-3" />
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        <Clock className="w-3 h-3" />
        {s}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Activity className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Audit & Blockchain Monitoring Console
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Read-only compliance audit portal providing immutable verification of off-chain application activity and on-chain blockchain protocol events.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Audit Ledger
        </button>
      </div>

      {/* Compliance Integrity Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold flex items-center gap-2">
              Cryptographic Tamper-Evident Audit Ledger
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Every system interaction is recorded with SHA-256 non-repudiation hashing, strict role attribution, and on-chain checkpoint correlation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4" />
            Read-Only Immutability Enforced
          </span>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Audit Events</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{summary.totalEvents}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Server className="w-3.5 h-3.5 text-slate-400" />
            Application (Off-Chain)
          </p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{summary.applicationEvents}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/40 shadow-sm space-y-1 bg-indigo-50/20 dark:bg-indigo-950/10">
          <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            Blockchain (On-Chain)
          </p>
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{summary.blockchainEvents}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 shadow-sm space-y-1 bg-emerald-50/20 dark:bg-emerald-950/10">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            On-Chain Batches
          </p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{summary.onChainBatches}</p>
        </div>
      </div>

      {/* Dedicated Blockchain Monitoring Panel */}
      <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Live Blockchain Provider & Smart Contract Monitoring
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Provider Status: {blockchainMonitoring.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          {/* Network */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Target Network:</span>
            <p className="font-semibold text-indigo-300 truncate">{blockchainMonitoring.network}</p>
          </div>

          {/* Smart Contract Address */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1 md:col-span-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Deployed Smart Contract Address:</span>
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-indigo-400 truncate">{blockchainMonitoring.contractAddress}</p>
              <button
                onClick={() => copyToClipboard(blockchainMonitoring.contractAddress)}
                className="p-1 text-slate-400 hover:text-white rounded transition"
                title="Copy Address"
              >
                {copiedHash === blockchainMonitoring.contractAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Latest Transaction Feed */}
        {blockchainMonitoring.latestTx && (
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-300">
                Latest On-Chain Event:{' '}
                <strong className="text-white font-mono">#{blockchainMonitoring.latestTx.batchNumber}</strong> ({blockchainMonitoring.latestTx.eventType})
              </span>
            </div>

            <div className="font-mono text-[11px] text-indigo-400 truncate max-w-xs" title={blockchainMonitoring.latestTx.txHash}>
              Tx: {blockchainMonitoring.latestTx.txHash}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search action, actor name, email, details, entity, or tx hash..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPagination(p => ({ ...p, page: 1 }));
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Source Filter */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sourceFilter}
              onChange={e => {
                setSourceFilter(e.target.value);
                setPagination(p => ({ ...p, page: 1 }));
              }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">All Event Sources</option>
              <option value="APPLICATION">Application (Off-Chain)</option>
              <option value="BLOCKCHAIN">Blockchain (On-Chain)</option>
            </select>
          </div>

          {/* Action Category Filter */}
          <select
            value={actionFilter}
            onChange={e => {
              setActionFilter(e.target.value);
              setPagination(p => ({ ...p, page: 1 }));
            }}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">All Action Categories</option>
            <option value="USER_AUTH">User & Authentication</option>
            <option value="LICENSE">License Verification</option>
            <option value="BATCH">Batch Minting & Recalls</option>
            <option value="SUPPLY_CHAIN">Supply Chain Transfers</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setPagination(p => ({ ...p, page: 1 }));
            }}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">All Result Statuses</option>
            <option value="SUCCESS">Success / Confirmed</option>
            <option value="FAILED">Failed / Rejected</option>
          </select>

          {(search || sourceFilter !== 'ALL' || actionFilter !== 'ALL' || statusFilter !== 'ALL' || startDate || endDate) && (
            <button
              onClick={() => {
                setSearch('');
                setSourceFilter('ALL');
                setActionFilter('ALL');
                setStatusFilter('ALL');
                setStartDate('');
                setEndDate('');
                setPagination(p => ({ ...p, page: 1 }));
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Audit Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Querying database audit logs & blockchain event records...
            </p>
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{error}</h3>
            <button
              onClick={fetchLogs}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
            >
              Retry Connection
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Activity className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No audit records found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {search || sourceFilter !== 'ALL' || actionFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'No audit logs or blockchain events match your filter parameters.'
                : 'System events will be appended to the immutable audit log as operational activity occurs.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Timestamp (UTC)</th>
                  <th className="px-4 py-3.5">Source</th>
                  <th className="px-4 py-3.5">Action / Event</th>
                  <th className="px-4 py-3.5">Actor / Role</th>
                  <th className="px-4 py-3.5">Target Entity</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Operational Details & Proof</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {logs.map(log => {
                  const actorName = log.actor?.name || 'System / Anonymous';
                  const actorRole = log.actor?.role || log.organization?.type || 'System';

                  return (
                    <tr key={log._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750/50 transition">
                      {/* Timestamp */}
                      <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap text-[11px]">
                        {new Date(log.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                      </td>

                      {/* Source Badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">{getSourceBadge(log.source)}</td>

                      {/* Action */}
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        {log.action}
                      </td>

                      {/* Actor */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900 dark:text-white">{actorName}</p>
                        <p className="text-[11px] text-slate-400">{actorRole}</p>
                      </td>

                      {/* Entity */}
                      <td className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-300">
                        {log.entityType || 'System'}
                        {log.batchNumber && <span className="block font-mono text-indigo-600 dark:text-indigo-400">#{log.batchNumber}</span>}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">{getStatusBadge(log.status)}</td>

                      {/* Details & Proof */}
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 max-w-xs">
                        <p className="truncate" title={log.details}>{log.details || '—'}</p>
                        {log.transactionHash && (
                          <p className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 truncate mt-0.5" title={log.transactionHash}>
                            Tx: {log.transactionHash.substring(0, 12)}...
                          </p>
                        )}
                      </td>

                      {/* Inspect Action */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenDetail(log._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect Record
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div>
              Showing page <span className="font-bold text-slate-900 dark:text-white">{pagination.page}</span> of{' '}
              <span className="font-bold text-slate-900 dark:text-white">{pagination.totalPages}</span> ({pagination.total}{' '}
              total events)
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1 || loading}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-50 font-semibold"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <button
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-50 font-semibold"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Inspection Drawer / Modal */}
      {selectedLogId && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative animate-in fade-in zoom-in duration-150 space-y-5 max-h-[90vh] overflow-y-auto my-6">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-800">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      {selectedLog?.action || 'Audit Record'}
                    </h2>
                    {selectedLog && getSourceBadge(selectedLog.source)}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    Record ID: {selectedLogId}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseDetail}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="p-12 text-center space-y-2">
                <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-semibold text-slate-500">Loading audit metadata & correlated proofs...</p>
              </div>
            ) : detailError ? (
              <div className="p-8 text-center space-y-2">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <p className="text-xs font-bold text-slate-900 dark:text-white">{detailError}</p>
              </div>
            ) : selectedLog ? (
              <div className="space-y-4 text-xs">
                {/* 1. Event Attributes */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-2">
                  <h3 className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[11px] mb-1">
                    Event Specification
                  </h3>

                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Timestamp (UTC):</span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {new Date(selectedLog.timestamp).toUTCString()}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Result Status:</span>
                    <span>{getStatusBadge(selectedLog.status)}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Target Entity Type:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{selectedLog.entityType || 'System'}</span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">Recorded IP Address:</span>
                    <span className="font-mono text-slate-900 dark:text-white">{selectedLog.ipAddress || 'Internal Protocol'}</span>
                  </div>
                </div>

                {/* 2. Actor & Organization Info */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-2">
                  <h3 className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[11px] mb-1">
                    Actor Attribution
                  </h3>

                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Performed By:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedLog.actor?.name || 'Authorized Actor'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Actor Role:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{selectedLog.actor?.role || 'System'}</span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">Organization:</span>
                    <span className="text-slate-900 dark:text-white">
                      {selectedLog.organization?.name || 'Platform Ledger'}
                    </span>
                  </div>
                </div>

                {/* 3. Operational Details */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-1">
                  <h3 className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[11px]">
                    Operational Event Details
                  </h3>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-mono text-[11px] bg-white dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                    {selectedLog.details || 'No additional details logged.'}
                  </p>
                </div>

                {/* 4. Correlated Blockchain Information if available */}
                {(selectedLog.transactionHash || selectedLog.correlatedBatch) && (
                  <div className="bg-slate-950 text-white p-4 rounded-xl border border-slate-800 space-y-2 font-mono">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      Correlated On-Chain Proof
                    </h3>

                    {selectedLog.correlatedBatch && (
                      <div className="flex justify-between py-1 border-b border-slate-800 text-[11px]">
                        <span className="text-slate-400">Correlated Batch Number:</span>
                        <span className="text-indigo-300 font-bold">#{selectedLog.correlatedBatch.batchNumber}</span>
                      </div>
                    )}

                    {selectedLog.transactionHash && (
                      <div className="space-y-1 text-[11px]">
                        <span className="text-slate-400">On-Chain Transaction Hash:</span>
                        <div className="flex items-center justify-between gap-2 bg-slate-900 p-2 rounded border border-slate-800">
                          <span className="text-indigo-400 truncate">{selectedLog.transactionHash}</span>
                          <button
                            onClick={() => copyToClipboard(selectedLog.transactionHash)}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            {copiedHash === selectedLog.transactionHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-4">
              <span className="text-[11px] text-slate-400 font-mono">Read-Only Historical Record</span>
              <button
                onClick={handleCloseDetail}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditPage;
