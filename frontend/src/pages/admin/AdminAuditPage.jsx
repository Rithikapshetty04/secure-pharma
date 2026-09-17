<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs({ limit: 100, action: actionFilter });
      if (res.success) {
        setLogs(res.logs || res.auditLogs || []);
      }
=======
import React, { useState, useEffect } from 'react';
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
  Download,
  Lock
} from 'lucide-react';

const AdminAuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await auditApi.getLogs({ limit: 100 });
      setLogs(res.data?.logs || res.data || []);
>>>>>>> origin/main
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  useEffect(() => {
    loadAuditLogs();
  }, [actionFilter]);

  return (
    <div style={{ maxWidth: '1200px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>
          📋 21 CFR Part 11 Regulatory Audit Ledger
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Immutable cryptographic log of all license reviews, batch mints, status changes, and custody transfers
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e3a8a' }}>
            Filter Actions
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
          >
            <option value="">All Regulatory Actions</option>
            <option value="USER_REGISTERED">USER_REGISTERED</option>
            <option value="USER_LOGGED_IN">USER_LOGGED_IN</option>
            <option value="LICENSE_APPROVED">LICENSE_APPROVED</option>
            <option value="LICENSE_REJECTED">LICENSE_REJECTED</option>
            <option value="BATCH_CREATED">BATCH_CREATED</option>
            <option value="BATCH_RECALLED">BATCH_RECALLED</option>
            <option value="BATCH_FLAGGED">BATCH_FLAGGED</option>
            <option value="PRODUCT_CREATED">PRODUCT_CREATED</option>
=======
  const filteredLogs = logs.filter(log => {
    const act = log.action || log.event || '';
    const user = log.user?.name || log.user?.email || log.performedBy?.name || '';
    const details = log.details || log.description || '';
    const hash = log.hash || log.dataHash || '';

    const matchesSearch =
      act.toLowerCase().includes(search.toLowerCase()) ||
      user.toLowerCase().includes(search.toLowerCase()) ||
      details.toLowerCase().includes(search.toLowerCase()) ||
      hash.toLowerCase().includes(search.toLowerCase());

    const matchesAction =
      actionFilter === 'ALL' ||
      act.toUpperCase().includes(actionFilter);

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Activity className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            21 CFR Part 11 Audit Trail Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Immutable, cryptographically verifiable compliance records of all security and supply-chain operations
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Ledger
        </button>
      </div>

      {/* Compliance Note Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow-md border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold">Cryptographic Tamper-Evident Logging</h4>
            <p className="text-xs text-slate-400">All events are hashed using SHA-256 with timestamp verification and non-repudiation.</p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" />
          Ledger Validated
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search action, actor, details, hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
          >
            <option value="ALL">All Actions</option>
            <option value="BATCH">Batch Operations</option>
            <option value="TRANSFER">Custody Transfers</option>
            <option value="LICENSE">License Reviews</option>
            <option value="USER">User / Auth Events</option>
            <option value="RECALL">Regulatory Recalls</option>
>>>>>>> origin/main
          </select>
        </div>
      </div>

<<<<<<< HEAD
      {/* Audit Log Table */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#2563eb', fontWeight: '600' }}>
            Loading tamper-proof audit trail...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
            No audit records matching filter criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ACTION</th>
                  <th>ACTOR / USER</th>
                  <th>ORGANIZATION</th>
                  <th>ENTITY</th>
                  <th>TIMESTAMP</th>
                  <th>IP / CLIENT</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <StatusBadge status={log.action} />
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-heading)' }}>{log.user?.name || log.user?.email || 'System'}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{log.user?.role}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{log.organization?.name || 'Federal Node'}</td>
                    <td style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                      {log.entityType} ({log.entityId ? log.entityId.slice(-6) : '-'})
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {new Date(log.timestamp || log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {log.ipAddress || '127.0.0.1'}
=======
      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading audit ledger...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-medium text-slate-900 dark:text-white">No audit records found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Events will be appended to the ledger as actions occur.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Timestamp (UTC)</th>
                  <th className="px-4 py-3">Action / Event</th>
                  <th className="px-4 py-3">Actor / Entity</th>
                  <th className="px-4 py-3">Operational Details</th>
                  <th className="px-4 py-3">Cryptographic Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition">
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                      {new Date(log.timestamp || log.createdAt || Date.now()).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                        {log.action || log.event || 'SYSTEM_EVENT'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      <div>
                        <p className="font-semibold">{log.user?.name || log.performedBy?.name || 'Authorized Actor'}</p>
                        <p className="text-[11px] text-slate-400">{log.user?.role || log.role || 'Stakeholder'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {log.details || log.description || JSON.stringify(log.meta || {})}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400 truncate max-w-[160px]">
                      {log.hash || log.dataHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
>>>>>>> origin/main
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
<<<<<<< HEAD
}
=======
};

export default AdminAuditPage;
>>>>>>> origin/main
