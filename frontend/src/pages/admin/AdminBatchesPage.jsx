import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../services/api';
import {
  Package,
  Search,
  Filter,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  QrCode,
  Layers,
  MapPin,
  User,
  History,
  Lock,
  ArrowRight,
  Truck,
  Store,
  Factory,
  Tag
} from 'lucide-react';

const AdminBatchesPage = () => {
  // Data State
  const [batches, setBatches] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    delivered: 0,
    issues: 0,
    expired: 0,
    onChain: 0,
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
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [expiryFilter, setExpiryFilter] = useState('ALL');
  const [blockchainFilter, setBlockchainFilter] = useState('ALL');

  // Detail Modal State
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [batchDetail, setBatchDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // Regulatory Action Modal States (Recall / Flag)
  const [actionBatch, setActionBatch] = useState(null);
  const [actionType, setActionType] = useState('RECALL'); // RECALL | FLAG | CLEAR
  const [actionReasonCategory, setActionReasonCategory] = useState('Quality Control Failure');
  const [actionReasonDetails, setActionReasonDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Fetch paginated batches
  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim(),
        status: statusFilter,
        role: roleFilter,
        expiry: expiryFilter,
        blockchain: blockchainFilter,
      };

      const res = await adminApi.getBatches(params);

      if (res.success && res.data) {
        setBatches(res.data.batches || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
        if (res.data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: res.data.pagination.total,
            totalPages: res.data.pagination.pages,
          }));
        }
      } else {
        setError(res.message || 'Failed to fetch pharmaceutical batch records.');
      }
    } catch (err) {
      console.error('Error fetching admin batches:', err);
      setError('Network error connecting to Secure Pharma backend API.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, roleFilter, expiryFilter, blockchainFilter]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Fetch detailed batch traceability & custody
  const fetchBatchDetails = async (id) => {
    try {
      setDetailLoading(true);
      setDetailError(null);
      const res = await adminApi.getBatchById(id);
      if (res.success && res.data) {
        setBatchDetail(res.data);
      } else {
        setDetailError(res.message || 'Could not load detailed batch history.');
      }
    } catch (err) {
      console.error('Error fetching batch detail:', err);
      setDetailError('Failed to retrieve supply chain history.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenDetails = (id) => {
    setSelectedBatchId(id);
    fetchBatchDetails(id);
  };

  const handleCloseDetails = () => {
    setSelectedBatchId(null);
    setBatchDetail(null);
    setDetailError(null);
  };

  // Open Action Modal
  const handleOpenAction = (batch, type) => {
    setActionBatch(batch);
    setActionType(type);
    if (type === 'RECALL') setActionReasonCategory('Quality Control Failure');
    else if (type === 'FLAG') setActionReasonCategory('Suspicious Supply Chain Anomaly');
    else setActionReasonCategory('Administrative Inspection Cleared');
    setActionReasonDetails('');
  };

  const handleExecuteAction = async () => {
    if (!actionBatch) return;

    const finalReason = actionReasonDetails.trim()
      ? `${actionReasonCategory}: ${actionReasonDetails.trim()}`
      : actionReasonCategory;

    if ((actionType === 'RECALL' || actionType === 'FLAG') && !finalReason) {
      setFeedback({ type: 'error', text: 'A clear regulatory reason is strictly required.' });
      return;
    }

    try {
      setSubmitting(true);
      const targetStatus = actionType === 'RECALL' ? 'RECALLED' : actionType === 'FLAG' ? 'FLAGGED' : 'MANUFACTURED';
      const res = await adminApi.updateBatchStatus(actionBatch._id, targetStatus, finalReason);

      if (res.success) {
        setFeedback({
          type: 'success',
          text: `Batch #${actionBatch.batchNumber} status updated to ${targetStatus}.`,
        });
        setTimeout(() => setFeedback({ type: '', text: '' }), 4000);
        setActionBatch(null);
        fetchBatches();
        if (selectedBatchId === actionBatch._id) {
          fetchBatchDetails(actionBatch._id);
        }
      } else {
        setFeedback({ type: 'error', text: res.message || 'Failed to update batch status.' });
      }
    } catch (err) {
      console.error('Error updating batch status:', err);
      setFeedback({ type: 'error', text: 'Error connecting to server to execute batch action.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Badge Formatter Helpers
  const getStatusBadge = (status) => {
    const s = (status || 'MANUFACTURED').toUpperCase();
    if (s === 'RECALLED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <XCircle className="w-3.5 h-3.5" />
          Recalled
        </span>
      );
    }
    if (s === 'FLAGGED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-3.5 h-3.5" />
          Flagged
        </span>
      );
    }
    if (s === 'EXPIRED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          <Clock className="w-3.5 h-3.5" />
          Expired
        </span>
      );
    }
    if (s === 'IN_TRANSIT') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <Truck className="w-3.5 h-3.5" />
          In Transit
        </span>
      );
    }
    if (s === 'RECEIVED' || s === 'DELIVERED' || s === 'DISTRIBUTED' || s === 'SOLD') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {s}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
        <Factory className="w-3.5 h-3.5" />
        {s}
      </span>
    );
  };

  const getRoleIcon = (role) => {
    const r = (role || 'MANUFACTURER').toUpperCase();
    if (r.includes('DISTRIBUTOR')) return <Truck className="w-3.5 h-3.5 text-purple-500" />;
    if (r.includes('PHARMACY')) return <Store className="w-3.5 h-3.5 text-teal-500" />;
    return <Factory className="w-3.5 h-3.5 text-blue-500" />;
  };

  const getExpiryLabel = (expiryDate) => {
    if (!expiryDate) return <span className="text-slate-400 text-xs">N/A</span>;
    const dateObj = new Date(expiryDate);
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (dateObj < now) {
      return (
        <span className="text-rose-600 dark:text-rose-400 font-semibold text-xs flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Expired ({dateObj.toLocaleDateString()})
        </span>
      );
    }
    if (dateObj <= thirtyDays) {
      return (
        <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Expiring Soon ({dateObj.toLocaleDateString()})
        </span>
      );
    }
    return <span className="text-slate-700 dark:text-slate-300 text-xs">{dateObj.toLocaleDateString()}</span>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Package className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            System-Wide Pharmaceutical Batch Monitor
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Controlled administrative console for global pharmaceutical lifecycle monitoring, current custody tracking, and blockchain traceability verification.
          </p>
        </div>
        <button
          onClick={fetchBatches}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Ledger Batches
        </button>
      </div>

      {/* Action Toast Alert */}
      {feedback.text && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm shadow-sm transition animate-in fade-in slide-in-from-top-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span className="font-medium">{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback({ type: '', text: '' })} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Batches</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{summary.total}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/40 shadow-sm space-y-1 bg-blue-50/20 dark:bg-blue-950/10">
          <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" />
            Active / In Transit
          </p>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{summary.active}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 shadow-sm space-y-1 bg-emerald-50/20 dark:bg-emerald-950/10">
          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Delivered / Sold
          </p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{summary.delivered}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/40 shadow-sm space-y-1 bg-indigo-50/20 dark:bg-indigo-950/10">
          <p className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            On-Chain Registered
          </p>
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{summary.onChain}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/40 shadow-sm space-y-1 bg-rose-50/20 dark:bg-rose-950/10">
          <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            Recalled / Flagged
          </p>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{summary.issues}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/40 shadow-sm space-y-1 bg-purple-50/20 dark:bg-purple-950/10">
          <p className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Expired Batches
          </p>
          <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">{summary.expired}</p>
        </div>
      </div>

      {/* Attention / Exception Section */}
      {summary.issues > 0 ? (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-900 dark:text-rose-300">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <p className="font-bold">Attention Required: {summary.issues} Batch Anomaly / Recall Orders Detected</p>
              <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">
                Certain batches have active regulatory recalls or suspicious flags attached.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('RECALLED')}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shrink-0"
          >
            View Flagged Batches
          </button>
        </div>
      ) : (
        <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>System Healthy: No active recall orders or supply chain anomalies reported across batches.</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search batch #, QR ID, product, or manufacturer..."
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
          {/* Status Filter */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setPagination(p => ({ ...p, page: 1 }));
              }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="MANUFACTURED">Manufactured</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="RECEIVED">Received</option>
              <option value="DELIVERED">Delivered</option>
              <option value="DISTRIBUTED">Distributed</option>
              <option value="SOLD">Sold</option>
              <option value="EXPIRED">Expired</option>
              <option value="RECALLED">Recalled</option>
              <option value="FLAGGED">Flagged</option>
            </select>
          </div>

          {/* Current Custody Role Filter */}
          <select
            value={roleFilter}
            onChange={e => {
              setRoleFilter(e.target.value);
              setPagination(p => ({ ...p, page: 1 }));
            }}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">All Custodian Roles</option>
            <option value="MANUFACTURER">At Manufacturer</option>
            <option value="DISTRIBUTOR">At Distributor</option>
            <option value="PHARMACY">At Pharmacy</option>
          </select>

          {/* Expiry Filter */}
          <select
            value={expiryFilter}
            onChange={e => {
              setExpiryFilter(e.target.value);
              setPagination(p => ({ ...p, page: 1 }));
            }}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">All Expiry Dates</option>
            <option value="VALID">Valid / Unexpired</option>
            <option value="EXPIRING_SOON">Expiring Soon (30 Days)</option>
            <option value="EXPIRED">Expired</option>
          </select>

          {/* Blockchain Filter */}
          <select
            value={blockchainFilter}
            onChange={e => {
              setBlockchainFilter(e.target.value);
              setPagination(p => ({ ...p, page: 1 }));
            }}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">All Proof Types</option>
            <option value="ON_CHAIN">On-Chain Registered</option>
            <option value="OFF_CHAIN">Off-Chain Only</option>
          </select>

          {(search || statusFilter !== 'ALL' || roleFilter !== 'ALL' || expiryFilter !== 'ALL' || blockchainFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
                setRoleFilter('ALL');
                setExpiryFilter('ALL');
                setBlockchainFilter('ALL');
                setPagination(p => ({ ...p, page: 1 }));
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Batch Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Fetching pharmaceutical batch records & custody states...
            </p>
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{error}</h3>
            <button
              onClick={fetchBatches}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
            >
              Retry Connection
            </button>
          </div>
        ) : batches.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No batch records found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {search || statusFilter !== 'ALL' || roleFilter !== 'ALL' || expiryFilter !== 'ALL'
                ? 'No batches match your active search or filter criteria.'
                : 'No pharmaceutical batches have been minted in the system ledger yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Batch Number</th>
                  <th className="px-5 py-3.5">Formulary Product</th>
                  <th className="px-5 py-3.5">Manufacturer</th>
                  <th className="px-5 py-3.5">Current Custodian</th>
                  <th className="px-5 py-3.5">Quantity</th>
                  <th className="px-5 py-3.5">Expiry Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Blockchain Proof</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {batches.map(batch => {
                  const prodName = batch.product?.name || 'Pharmaceutical Item';
                  const prodCode = batch.product?.productCode || '';
                  const mfgName = batch.manufacturer?.name || 'Origin Manufacturer';
                  const custodianName = batch.currentCustodian?.name || mfgName;

                  return (
                    <tr key={batch._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750/50 transition">
                      {/* Batch Number */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">{batch.batchNumber}</p>
                          <a
                            href={`/verify/${batch.qrIdentifier || batch.batchNumber}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-slate-400 hover:text-indigo-600 flex items-center gap-1 font-mono"
                          >
                            <QrCode className="w-3 h-3 text-indigo-500" />
                            {batch.qrIdentifier ? batch.qrIdentifier.substring(0, 14) + '...' : 'Verify QR'}
                          </a>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">{prodName}</p>
                        <p className="text-[11px] text-slate-400">{prodCode && `Code: ${prodCode}`}</p>
                      </td>

                      {/* Manufacturer */}
                      <td className="px-5 py-4 text-slate-700 dark:text-slate-300 font-medium">
                        {mfgName}
                      </td>

                      {/* Current Custodian */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-white">
                          {getRoleIcon(batch.currentRole)}
                          <span>{custodianName}</span>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="px-5 py-4 text-slate-700 dark:text-slate-300 font-semibold">
                        {batch.quantity} {batch.unit || 'Units'}
                      </td>

                      {/* Expiry Date */}
                      <td className="px-5 py-4">{getExpiryLabel(batch.expiryDate)}</td>

                      {/* Status */}
                      <td className="px-5 py-4">{getStatusBadge(batch.status)}</td>

                      {/* Blockchain Proof */}
                      <td className="px-5 py-4">
                        {batch.blockchainTxHash ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800"
                            title={batch.blockchainTxHash}
                          >
                            <ShieldCheck className="w-3 h-3 text-indigo-500" />
                            {batch.blockchainTxHash.substring(0, 10)}...
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Off-Chain</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDetails(batch._id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold border border-indigo-200 dark:border-indigo-800 transition shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Inspect Batch
                          </button>

                          {batch.status !== 'RECALLED' ? (
                            <button
                              onClick={() => handleOpenAction(batch, 'RECALL')}
                              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition"
                            >
                              Recall
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenAction(batch, 'CLEAR')}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                            >
                              Clear Flag
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div>
              Showing page <span className="font-bold text-slate-900 dark:text-white">{pagination.page}</span> of{' '}
              <span className="font-bold text-slate-900 dark:text-white">{pagination.totalPages}</span> ({pagination.total}{' '}
              total batch records)
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

      {/* Comprehensive Batch Traceability & Details Modal */}
      {selectedBatchId && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative animate-in fade-in zoom-in duration-150 space-y-6 max-h-[90vh] overflow-y-auto my-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-800">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Batch Traceability Record
                    </h2>
                    {batchDetail?.batch && getStatusBadge(batchDetail.batch.status)}
                  </div>
                  <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                    #{batchDetail?.batch?.batchNumber || 'Batch Identifier'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseDetails}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="p-12 text-center space-y-2">
                <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-500 font-semibold">Loading batch history & supply chain timeline...</p>
              </div>
            ) : detailError ? (
              <div className="p-8 text-center space-y-2">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <p className="text-xs font-bold text-slate-900 dark:text-white">{detailError}</p>
              </div>
            ) : batchDetail ? (
              <div className="space-y-6">
                {/* 1. Identity & Custody Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Formulary Product Info */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-2.5 text-xs">
                    <h3 className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-[11px]">
                      <Tag className="w-3.5 h-3.5 text-indigo-500" />
                      Formulary Product Specification
                    </h3>

                    <div className="space-y-1.5">
                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Medicine Name:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {batchDetail.batch.product?.name || 'N/A'}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Generic Name:</span>
                        <span className="text-slate-900 dark:text-white">
                          {batchDetail.batch.product?.genericName || 'N/A'}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Product Code / SKU:</span>
                        <span className="font-mono text-slate-900 dark:text-white">
                          {batchDetail.batch.product?.productCode || 'N/A'}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Dosage Form & Strength:</span>
                        <span className="text-slate-900 dark:text-white">
                          {batchDetail.batch.product?.dosageForm || 'Formulation'} ({batchDetail.batch.product?.strength || 'Std'})
                        </span>
                      </div>

                      <div className="flex justify-between py-1">
                        <span className="text-slate-500 dark:text-slate-400">Storage Environment:</span>
                        <span className="text-slate-900 dark:text-white">
                          {batchDetail.batch.storageRequirements || 'Controlled Room Temp'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Custody & Stakeholder Info */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-2.5 text-xs">
                    <h3 className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-[11px]">
                      <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                      Manufacturer & Current Custody
                    </h3>

                    <div className="space-y-1.5">
                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Origin Manufacturer:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {batchDetail.batch.manufacturer?.name || 'N/A'}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Current Custodian:</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          {getRoleIcon(batchDetail.batch.currentRole)}
                          {batchDetail.batch.currentCustodian?.name || batchDetail.batch.manufacturer?.name}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Custodian Contact:</span>
                        <span className="text-slate-900 dark:text-white">
                          {batchDetail.batch.currentCustodian?.contactEmail || 'N/A'}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Quantity Minted / Unit:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {batchDetail.batch.quantity} {batchDetail.batch.unit || 'Units'}
                        </span>
                      </div>

                      <div className="flex justify-between py-1">
                        <span className="text-slate-500 dark:text-slate-400">Expiry Window:</span>
                        <span>{getExpiryLabel(batchDetail.batch.expiryDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Chronological Supply-Chain History Timeline */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-indigo-500" />
                    Custodial Provenance & Transfer Event Log ({batchDetail.events?.length || 0} Events)
                  </h3>

                  <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/70 space-y-4">
                    {batchDetail.events?.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No supply chain events recorded yet.</p>
                    ) : (
                      <div className="relative border-l-2 border-indigo-200 dark:border-indigo-900/60 ml-3 pl-6 space-y-5">
                        {batchDetail.events?.map((evt, idx) => (
                          <div key={evt._id || idx} className="relative space-y-1 text-xs">
                            <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white">
                              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide flex items-center gap-1.5">
                                {evt.eventType}
                                {evt.transactionHash && (
                                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                                    [On-Chain]
                                  </span>
                                )}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {evt.eventDate ? new Date(evt.eventDate).toLocaleString() : 'N/A'}
                              </span>
                            </div>

                            <p className="text-slate-600 dark:text-slate-300">
                              <strong className="text-slate-900 dark:text-white">
                                {evt.fromOrganization?.name || 'Origin'}
                              </strong>{' '}
                              <ArrowRight className="w-3 h-3 inline text-slate-400" />{' '}
                              <strong className="text-slate-900 dark:text-white">
                                {evt.toOrganization?.name || 'Destination'}
                              </strong>
                            </p>

                            {evt.notes && <p className="text-[11px] text-slate-500 italic bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">{evt.notes}</p>}

                            {evt.transactionHash && (
                              <p className="text-[10px] font-mono text-slate-400 truncate">
                                Event Tx: {evt.transactionHash}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Blockchain Information (Read-Only Section) */}
                <div className="bg-slate-950 text-white p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <Lock className="w-4 h-4" />
                      Read-Only Blockchain Proof & Integrity Ledger
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 font-bold">
                      {batchDetail.verification?.state || 'ON-CHAIN'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <p className="text-slate-400 text-[10px]">Blockchain Network:</p>
                      <p className="text-slate-200 truncate">{batchDetail.verification?.network || 'Ethereum Testnet'}</p>
                    </div>

                    <div>
                      <p className="text-slate-400 text-[10px]">On-Chain Block Number:</p>
                      <p className="text-slate-200">{batchDetail.verification?.blockNumber || 'Recorded'}</p>
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-slate-400 text-[10px]">Batch SHA-256 Digest:</p>
                      <p className="text-indigo-400 truncate">{batchDetail.verification?.calculatedHash || 'N/A'}</p>
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-slate-400 text-[10px]">On-Chain Transaction Hash:</p>
                      <p className="text-indigo-400 truncate">{batchDetail.verification?.storedHash || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* 4. Public QR Verification Link */}
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Public Consumer Verification Path</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        ID: {batchDetail.batch.qrIdentifier || batchDetail.batch.batchNumber}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`/verify/${batchDetail.batch.qrIdentifier || batchDetail.batch.batchNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Public Verification
                  </a>
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-end border-t border-slate-200 dark:border-slate-700 pt-4">
              <button
                onClick={handleCloseDetails}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
              >
                Close Traceability Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regulatory Action Modal (Recall / Flag) */}
      {actionBatch && (
        <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-full ${
                  actionType === 'RECALL'
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                    : actionType === 'FLAG'
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {actionType === 'RECALL'
                    ? 'Issue Regulatory Batch Recall'
                    : actionType === 'FLAG'
                    ? 'Flag Suspicious Anomaly'
                    : 'Clear Batch Flag'}
                </h3>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  Batch: #{actionBatch.batchNumber}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Regulatory Action Category:
                </label>
                <select
                  value={actionReasonCategory}
                  onChange={e => setActionReasonCategory(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium"
                >
                  {actionType === 'RECALL' ? (
                    <>
                      <option value="Quality Control Failure">Quality Control Failure</option>
                      <option value="Sub-standard Potency or Formulation">Sub-standard Potency</option>
                      <option value="Packaging / Seal Contamination">Packaging Contamination</option>
                      <option value="Temperature Excursion in Transit">Temperature Excursion</option>
                      <option value="Regulatory Order Revocation">Regulatory Order Revocation</option>
                      <option value="Other Safety Precaution">Other Safety Precaution</option>
                    </>
                  ) : actionType === 'FLAG' ? (
                    <>
                      <option value="Suspicious Supply Chain Anomaly">Suspicious Supply Chain Anomaly</option>
                      <option value="Unexplained Custody Gap">Unexplained Custody Gap</option>
                      <option value="Documentation Discrepancy">Documentation Discrepancy</option>
                      <option value="Counterfeit Suspect Alert">Counterfeit Suspect Alert</option>
                      <option value="Other Suspicious Activity">Other Suspicious Activity</option>
                    </>
                  ) : (
                    <option value="Administrative Inspection Cleared">Administrative Inspection Cleared</option>
                  )}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Regulatory Explanation Notes:
                </label>
                <textarea
                  value={actionReasonDetails}
                  onChange={e => setActionReasonDetails(e.target.value)}
                  placeholder="Enter specific audit observations, test results, or official regulatory notice notes..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActionBatch(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={handleExecuteAction}
                disabled={submitting}
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition disabled:opacity-50 ${
                  actionType === 'RECALL'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : actionType === 'FLAG'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {submitting ? 'Processing...' : 'Confirm Regulatory Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBatchesPage;
