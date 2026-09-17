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
    } finally {
      setLoading(false);
    }
  };

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
            </Link>
          </div>
        </div>
      </div>

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
