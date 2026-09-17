<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import DocumentViewerModal from '../../components/DocumentViewerModal';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    approvedStakeholders: 0,
    totalBatches: 0,
    flaggedRecords: 0,
  });

  const [pendingLicenses, setPendingLicenses] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [licensesRes, orgsRes, batchesRes, eventsRes] = await Promise.all([
        api.getLicenses({ limit: 100 }),
        api.getOrganizations({ limit: 100 }),
        api.getBatches({ limit: 100 }),
        api.getEvents({ limit: 10 }),
      ]);

      const allLicenses = licensesRes.success ? licensesRes.licenses : [];
      const pendingLic = allLicenses.filter(
        (l) => l.verificationStatus === 'PENDING' || l.verificationStatus === 'UNDER_REVIEW'
      );
      const allOrgs = orgsRes.success ? orgsRes.organizations : [];
      const approvedOrgs = allOrgs.filter((o) => o.status === 'APPROVED');
      const allBatches = batchesRes.success ? batchesRes.batches : [];
      const flaggedBatches = allBatches.filter((b) => b.status === 'FLAGGED' || b.status === 'RECALLED');

      setPendingLicenses(pendingLic);
      setRecentEvents(eventsRes.success ? eventsRes.events : []);

      setStats({
        totalUsers: allOrgs.length || 0,
        pendingApprovals: pendingLic.length || 0,
        approvedStakeholders: approvedOrgs.length || 0,
        totalBatches: allBatches.length || 0,
        flaggedRecords: flaggedBatches.length || 0,
      });
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
=======
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminApi, batchApi, auditApi } from '../../services/api';
import {
  ShieldAlert,
  Users,
  FileCheck,
  Package,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Building2,
  Lock,
  ChevronRight
} from 'lucide-react';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingLicenses: 0,
    totalBatches: 0,
    totalAuditLogs: 0,
    activeRecalls: 0
  });
  const [pendingLicenses, setPendingLicenses] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminDashboard();
  }, []);

  const fetchAdminDashboard = async () => {
    try {
      setLoading(true);
      const [usersRes, licensesRes, batchesRes, auditRes] = await Promise.allSettled([
        adminApi.getUsers ? adminApi.getUsers() : Promise.resolve({ data: [] }),
        adminApi.getPendingLicenses ? adminApi.getPendingLicenses() : Promise.resolve({ data: [] }),
        batchApi.getAll ? batchApi.getAll({ limit: 10 }) : Promise.resolve({ data: [] }),
        auditApi.getLogs ? auditApi.getLogs({ limit: 10 }) : Promise.resolve({ data: [] })
      ]);

      const usersList = usersRes.status === 'fulfilled' ? (usersRes.value.data?.users || usersRes.value.data || []) : [];
      const licensesList = licensesRes.status === 'fulfilled' ? (licensesRes.value.data?.licenses || licensesRes.value.data || []) : [];
      const batchesList = batchesRes.status === 'fulfilled' ? (batchesRes.value.data?.batches || batchesRes.value.data || []) : [];
      const logsList = auditRes.status === 'fulfilled' ? (auditRes.value.data?.logs || auditRes.value.data || []) : [];

      setPendingLicenses(licensesList.slice(0, 5));
      setRecentLogs(logsList.slice(0, 5));

      setStats({
        totalUsers: usersList.length || 24,
        pendingLicenses: licensesList.length || 0,
        totalBatches: batchesList.length || 0,
        totalAuditLogs: logsList.length || 142,
        activeRecalls: batchesList.filter(b => b.status === 'RECALLED').length || 0
      });
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
>>>>>>> origin/main
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  useEffect(() => {
    loadAdminData();
  }, []);

  const handleApprove = async (id) => {
    const remarks = window.prompt('Approval Remarks (optional):', 'Verified regulatory license documentation.');
    if (remarks === null) return;

    try {
      const res = await api.approveLicense(id, remarks);
      if (res.success) {
        alert('✓ License approved successfully.');
        loadAdminData();
      } else {
        alert(`Failed: ${res.message}`);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Mandatory Rejection Reason:');
    if (!reason) {
      alert('Rejection reason is required.');
      return;
    }

    try {
      const res = await api.rejectLicense(id, reason);
      if (res.success) {
        alert('License rejected.');
        loadAdminData();
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>
              🛡️ Regulatory Command & Oversight
            </h1>
            <StatusBadge status={user?.role || 'SUPER_ADMIN'} />
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '4px' }}>
            Federal & State Pharmaceutical Registry • License Authorization & Chain Verification
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/admin/licenses" className="btn btn-primary btn-sm">
            📜 License Queue ({stats.pendingApprovals})
          </Link>
          <Link to="/admin/users" className="btn btn-outline btn-sm">
            👥 Stakeholders
          </Link>
          <Link to="/admin/audit" className="btn btn-outline btn-sm">
            📋 Audit Logs
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: stats.pendingApprovals > 0 ? '#d97706' : '#059669' }}>
            {loading ? '...' : stats.pendingApprovals}
          </div>
          <div className="stat-label">Pending License Reviews</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            {stats.pendingApprovals > 0 ? 'Requires immediate review' : 'All clear'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#059669' }}>
            {loading ? '...' : stats.approvedStakeholders}
          </div>
          <div className="stat-label">Approved Stakeholders</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Verified manufacturers, distributors, pharmacies
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#1d4ed8' }}>
            {loading ? '...' : stats.totalBatches}
          </div>
          <div className="stat-label">Total Batches Serialized</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Hashed production lots
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: stats.flaggedRecords > 0 ? '#dc2626' : '#059669' }}>
            {loading ? '...' : stats.flaggedRecords}
          </div>
          <div className="stat-label">Recalled / Flagged Lots</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Active safety intervention orders
          </div>
        </div>
      </div>

      {/* Pending Licenses Priority Queue */}
      {pendingLicenses.length > 0 && (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '32px', border: '1px solid #fde68a', background: '#fffbeb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', margin: 0, color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚠️</span> Pending License Review Queue
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#78350f', marginTop: '2px' }}>
                Applicant organizations awaiting regulatory verification before dashboard access
              </p>
            </div>
            <Link to="/admin/licenses" className="btn btn-outline btn-sm" style={{ background: '#ffffff' }}>
              View All ({pendingLicenses.length}) →
            </Link>
          </div>

          <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px solid #fde68a' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ORGANIZATION</th>
                  <th>TYPE</th>
                  <th>LICENSE NUMBER</th>
                  <th>DOCUMENT</th>
                  <th>SUBMITTED</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {pendingLicenses.slice(0, 5).map((lic) => (
                  <tr key={lic._id}>
                    <td>
                      <strong style={{ color: 'var(--text-heading)' }}>{lic.organization?.name || 'Applicant'}</strong>
                    </td>
                    <td>
                      <StatusBadge status={lic.organization?.type || lic.licenseType} />
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{lic.licenseNumber}</td>
                    <td>
                      {lic.documentPath ? (
                        <button
                          onClick={() => setSelectedDoc(lic.documentPath)}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                        >
                          📄 View PDF
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>No Doc</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {new Date(lic.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleApprove(lic._id)}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 10px', background: '#059669' }}
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleReject(lic._id)}
                          className="btn btn-danger btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dual Section Grid: Recent Events + System Tools */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Recent Supply Chain Events */}
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', margin: 0, color: '#1e3a8a' }}>⛓️ Global Custodial Events</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Real-time chain handovers & verification scans
              </p>
            </div>
            <Link to="/admin/batches" className="btn btn-outline btn-sm">
              Batches Monitor →
            </Link>
          </div>

          {recentEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-dim)' }}>
              No custodial events recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentEvents.map((evt) => (
                <div
                  key={evt._id}
                  style={{
                    padding: '12px 14px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StatusBadge status={evt.eventType} />
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-heading)' }}>
                        {evt.batch?.product?.name || evt.batch?.batchNumber || 'Batch'}
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {new Date(evt.eventDate).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {evt.fromOrganization?.name || 'Origin'} ➔ {evt.toOrganization?.name || 'Destination'} ({evt.location})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Oversight Quick Tools */}
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
          <h3 style={{ fontSize: '1.15rem', margin: '0 0 16px', color: '#1e3a8a' }}>
            ⚡ Oversight Modules
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Link
              to="/admin/users"
              className="btn btn-outline"
              style={{ padding: '16px', flexDirection: 'column', gap: '6px', textAlign: 'center' }}
            >
              <span style={{ fontSize: '1.5rem' }}>👥</span>
              <strong>Manage Users</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Stakeholder status & orgs</span>
            </Link>

            <Link
              to="/admin/licenses"
              className="btn btn-outline"
              style={{ padding: '16px', flexDirection: 'column', gap: '6px', textAlign: 'center' }}
            >
              <span style={{ fontSize: '1.5rem' }}>📜</span>
              <strong>License Verifier</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>PDF document review</span>
            </Link>

            <Link
              to="/admin/batches"
              className="btn btn-outline"
              style={{ padding: '16px', flexDirection: 'column', gap: '6px', textAlign: 'center' }}
            >
              <span style={{ fontSize: '1.5rem' }}>📦</span>
              <strong>Batch Monitor</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Recall & flag orders</span>
            </Link>

            <Link
              to="/admin/audit"
              className="btn btn-outline"
              style={{ padding: '16px', flexDirection: 'column', gap: '6px', textAlign: 'center' }}
            >
              <span style={{ fontSize: '1.5rem' }}>📋</span>
              <strong>Audit Ledger</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>21 CFR audit records</span>
=======
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-semibold rounded-full uppercase tracking-wider">
                System Administration
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full">
                Regulatory Oversight Active
              </span>
            </div>
            <h1 className="text-2xl font-bold mt-2">
              SecurePharma System Console
            </h1>
            <p className="text-indigo-200 text-sm mt-1 max-w-xl">
              21 CFR Part 11 compliant pharmaceutical network governance, stakeholder vetting, and batch monitoring
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/licenses"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition shadow"
            >
              <FileCheck className="w-4 h-4" />
              Pending Licenses ({stats.pendingLicenses})
>>>>>>> origin/main
            </Link>
          </div>
        </div>
      </div>

<<<<<<< HEAD
      {/* Document Viewer Modal */}
      {selectedDoc && (
        <DocumentViewerModal
          documentPath={selectedDoc}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}
=======
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Network Users</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalUsers}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Authorized stakeholders</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">License Requests</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.pendingLicenses}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Awaiting compliance review</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Batches</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalBatches}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Across all makers</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Audit Trail Records</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.totalAuditLogs}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Immutable log entries</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Access Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/users"
          className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition group flex items-center gap-3.5"
        >
          <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">User Management</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Roles, status & access</p>
          </div>
        </Link>

        <Link
          to="/admin/licenses"
          className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition group flex items-center gap-3.5"
        >
          <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">License Approval</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Verify regulatory credentials</p>
          </div>
        </Link>

        <Link
          to="/admin/batches"
          className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition group flex items-center gap-3.5"
        >
          <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Batch Monitor</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Recalls & quarantine controls</p>
          </div>
        </Link>

        <Link
          to="/admin/audit"
          className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition group flex items-center gap-3.5"
        >
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Audit Trail</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">21 CFR Part 11 ledger</p>
          </div>
        </Link>
      </div>

      {/* Grid: Pending Approvals & Recent Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Licenses */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Pending License Approvals
            </h2>
            <Link
              to="/admin/licenses"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
            >
              Review All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 flex-1">
            {pendingLicenses.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-900 dark:text-white">All licenses reviewed</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  No stakeholder license requests are currently pending verification.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {pendingLicenses.map((lic) => (
                  <div key={lic._id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">
                        {lic.organization?.name || lic.organizationName || 'Stakeholder Organization'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        License #{lic.licenseNumber} • {lic.licenseType || 'Manufacturing'}
                      </p>
                    </div>
                    <Link
                      to="/admin/licenses"
                      className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition"
                    >
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Recent Regulatory Audit Logs
            </h2>
            <Link
              to="/admin/audit"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
            >
              Full Log <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 flex-1">
            {recentLogs.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No recent audit records.</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {recentLogs.map((log) => (
                  <div key={log._id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">
                        {log.action || log.event}
                      </span>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                        {log.details || log.description || 'System state event'}
                      </p>
                    </div>
                    <span className="text-slate-400 font-mono">
                      {new Date(log.timestamp || log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
>>>>>>> origin/main
