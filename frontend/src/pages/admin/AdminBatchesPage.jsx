<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

export default function AdminBatchesPage() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadBatches = async () => {
    setLoading(true);
    try {
      const res = await api.getBatches({ limit: 100, search, status: statusFilter });
      if (res.success) {
        setBatches(res.batches);
      }
    } catch (err) {
      console.error('Error loading admin batches:', err);
=======
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { batchApi, supplyChainApi } from '../../services/api';
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
  RefreshCw
} from 'lucide-react';

const AdminBatchesPage = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionBatch, setActionBatch] = useState(null);
  const [actionType, setActionType] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await batchApi.getAll({ limit: 100 });
      setBatches(res.data?.batches || res.data || []);
    } catch (err) {
      console.error('Error fetching admin batches:', err);
>>>>>>> origin/main
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  useEffect(() => {
    loadBatches();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadBatches();
  };

  const handleStatusUpdate = async (batchId, batchNumber, newStatus) => {
    const reason = window.prompt(`Enter mandatory regulatory reason for updating Batch #${batchNumber} to ${newStatus}:`);
    if (!reason) {
      alert('Reason is required for regulatory batch status updates.');
      return;
    }

    try {
      const res = await api.updateBatchStatus(batchId, newStatus, reason);
      if (res.success) {
        alert(`✓ Batch #${batchNumber} marked as ${newStatus}. Broadcast notification issued.`);
        loadBatches();
      } else {
        alert(`Failed: ${res.message}`);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>
          📦 System-Wide Batch & Recall Monitoring
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Inspect all serialized medicine production lots, issue regulatory recall orders, and flag anomalies
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', background: '#ffffff' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by batch lot #, product code, or manufacturer..."
            style={{
              flex: 1,
              minWidth: '240px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
          >
            <option value="">All Statuses</option>
            <option value="MANUFACTURED">MANUFACTURED</option>
            <option value="IN_TRANSIT">IN_TRANSIT</option>
            <option value="RECEIVED">RECEIVED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="SOLD">SOLD</option>
            <option value="RECALLED">RECALLED</option>
            <option value="FLAGGED">FLAGGED</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>

          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>
      </div>

      {/* Batches Table */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#2563eb', fontWeight: '600' }}>
            Loading system batches...
          </div>
        ) : batches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
            No batches found matching filter criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>BATCH NUMBER</th>
                  <th>MEDICINE</th>
                  <th>MANUFACTURER</th>
                  <th>QTY</th>
                  <th>EXPIRY</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>REGULATORY CONTROLS</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#1e3a8a' }}>
                      {b.batchNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--text-heading)' }}>
                        {b.product?.name || 'Pharmaceutical Formulation'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {b.product?.genericName}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {b.manufacturer?.name || b.product?.manufacturer?.name || 'Verified Manufacturer'}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {b.quantity?.toLocaleString()} {b.unit}
                    </td>
                    <td
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color: new Date(b.expiryDate) < new Date() ? '#dc2626' : '#059669',
                      }}
                    >
                      {new Date(b.expiryDate).toLocaleDateString()}
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <Link
                          to={`/verify/${b.qrIdentifier || b.batchNumber}`}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          Verify
                        </Link>
                        {b.status !== 'RECALLED' && (
                          <button
                            onClick={() => handleStatusUpdate(b._id, b.batchNumber, 'RECALLED')}
                            className="btn btn-danger btn-sm"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          >
                            🛑 Recall
                          </button>
                        )}
                        {b.status !== 'FLAGGED' && (
                          <button
                            onClick={() => handleStatusUpdate(b._id, b.batchNumber, 'FLAGGED')}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#d97706' }}
                          >
                            ⚠️ Flag
=======
  const handleOpenAction = (batch, type) => {
    setActionBatch(batch);
    setActionType(type);
    setActionReason('');
  };

  const handleExecuteAction = async () => {
    if (!actionBatch) return;

    try {
      setSubmitting(true);
      if (actionType === 'RECALL') {
        if (batchApi.recall) {
          await batchApi.recall(actionBatch._id || actionBatch.batchNumber, { reason: actionReason });
        }
      } else if (actionType === 'FLAG') {
        if (batchApi.flag) {
          await batchApi.flag(actionBatch._id || actionBatch.batchNumber, { reason: actionReason });
        }
      } else if (actionType === 'RELEASE') {
        if (batchApi.updateStatus) {
          await batchApi.updateStatus(actionBatch._id || actionBatch.batchNumber, { status: 'RELEASED' });
        }
      }

      setBatches(batches.map(b => (b._id === actionBatch._id || b.batchNumber === actionBatch.batchNumber)
        ? { ...b, status: actionType === 'RECALL' ? 'RECALLED' : actionType === 'FLAG' ? 'FLAGGED' : 'RELEASED' }
        : b
      ));

      setFeedback({
        type: 'success',
        text: `Batch ${actionBatch.batchNumber} has been updated to ${actionType === 'RECALL' ? 'RECALLED' : actionType === 'FLAG' ? 'FLAGGED' : 'RELEASED'}.`
      });
      setTimeout(() => setFeedback({ type: '', text: '' }), 4000);
      setActionBatch(null);
    } catch (err) {
      console.error('Error executing batch action:', err);
      setFeedback({ type: 'error', text: 'Failed to update batch status.' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'RELEASED':
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'QUARANTINED':
      case 'FLAGGED':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'RECALLED':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    }
  };

  const filteredBatches = batches.filter(batch => {
    const bNum = batch.batchNumber || '';
    const pName = batch.productName || '';
    const mName = batch.manufacturer?.name || batch.manufacturer?.organization || '';

    const matchesSearch =
      bNum.toLowerCase().includes(search.toLowerCase()) ||
      pName.toLowerCase().includes(search.toLowerCase()) ||
      mName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      batch.status?.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Package className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            System-Wide Pharmaceutical Batch Monitor
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Global monitoring, regulatory recalls, and quarantine controls across all manufacturers
          </p>
        </div>
        <button
          onClick={fetchBatches}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {feedback.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
          feedback.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search batch #, product, or manufacturer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
          >
            <option value="ALL">All Batch Statuses</option>
            <option value="RELEASED">Released / Active</option>
            <option value="QUARANTINED">Quarantined</option>
            <option value="FLAGGED">Flagged / Suspicious</option>
            <option value="RECALLED">Recalled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading batch monitor records...</p>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-medium text-slate-900 dark:text-white">No batches found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Adjust your search criteria to view registered pharmaceutical batches.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3.5">Batch Number</th>
                  <th className="px-5 py-3.5">Product Name</th>
                  <th className="px-5 py-3.5">Manufacturer</th>
                  <th className="px-5 py-3.5">Expiry Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Regulatory Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredBatches.map((batch) => (
                  <tr key={batch._id || batch.batchNumber} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
                      {batch.batchNumber}
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{batch.productName}</p>
                        <p className="text-xs text-slate-400">{batch.dosageForm || 'Pharmaceutical'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{batch.manufacturer?.name || batch.manufacturer?.organization || 'Registered Maker'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs">
                      {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(batch.status)}`}>
                        {batch.status || 'RELEASED'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/verify/${batch.batchNumber}`}
                          className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-md text-xs font-semibold transition"
                        >
                          Verify
                        </Link>

                        {batch.status !== 'FLAGGED' && (
                          <button
                            onClick={() => handleOpenAction(batch, 'FLAG')}
                            className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 text-amber-700 dark:text-amber-300 rounded-md text-xs font-semibold transition"
                          >
                            Flag
                          </button>
                        )}

                        {batch.status !== 'RECALLED' ? (
                          <button
                            onClick={() => handleOpenAction(batch, 'RECALL')}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold transition"
                          >
                            Recall
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenAction(batch, 'RELEASE')}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition"
                          >
                            Release
>>>>>>> origin/main
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
<<<<<<< HEAD
    </div>
  );
}
=======

      {/* Action Reason Modal */}
      {actionBatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative animate-in fade-in zoom-in duration-150 space-y-4">
            <button
              onClick={() => setActionBatch(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${
                actionType === 'RECALL'
                  ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                  : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
              }`}>
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {actionType === 'RECALL' ? 'Issue Product Recall' : actionType === 'FLAG' ? 'Flag Suspicious Batch' : 'Release Quarantine'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Batch: {actionBatch.batchNumber}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Regulatory Justification & Reason
              </label>
              <textarea
                rows="3"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="e.g. Quality control failure, temperature deviation during transit, or suspected tampering..."
                className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActionBatch(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAction}
                disabled={submitting}
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition disabled:opacity-50 ${
                  actionType === 'RECALL' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {submitting ? 'Submitting...' : 'Confirm Regulatory Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBatchesPage;
>>>>>>> origin/main
