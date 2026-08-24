import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';
import DocumentViewerModal from '../components/DocumentViewerModal';

export default function DashboardPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    products: 0,
    batches: 0,
    activeBatches: 0,
    licenses: 0,
    pendingLicenses: 0,
    organizations: 0,
    events: 0,
    auditLogs: 0,
  });

  const [recentBatches, setRecentBatches] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [pendingLicensesList, setPendingLicensesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const role = user?.role || '';
  const isRegulator = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'REGULATOR';
  const isMfg = role === 'MANUFACTURER';
  const isDist = role === 'DISTRIBUTOR';
  const isPharm = role === 'PHARMACY';

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [batchesRes, eventsRes, orgsRes, productsRes] = await Promise.all([
        api.getBatches({ limit: 6 }),
        api.getEvents({ limit: 6 }),
        api.getOrganizations({ limit: 10 }),
        api.getProducts({ limit: 10 }),
      ]);

      let pendingLic = [];
      let totalLic = 0;
      let pendingLicCount = 0;

      if (isRegulator) {
        const licRes = await api.getLicenses();
        if (licRes.success) {
          totalLic = licRes.total;
          pendingLic = licRes.licenses.filter(
            (l) => l.verificationStatus === 'PENDING' || l.verificationStatus === 'UNDER_REVIEW'
          );
          pendingLicCount = pendingLic.length;
          setPendingLicensesList(pendingLic);
        }
      }

      setRecentBatches(batchesRes.success ? batchesRes.batches : []);
      setRecentEvents(eventsRes.success ? eventsRes.events : []);

      setStats({
        products: productsRes.success ? productsRes.total : 0,
        batches: batchesRes.success ? batchesRes.total : 0,
        activeBatches: batchesRes.success
          ? batchesRes.batches.filter((b) => b.status !== 'EXPIRED' && b.status !== 'RECALLED').length
          : 0,
        licenses: totalLic,
        pendingLicenses: pendingLicCount,
        organizations: orgsRes.success ? orgsRes.total : 0,
        events: eventsRes.success ? eventsRes.total : 0,
      });
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [role]);

  const handleApproveLicense = async (id) => {
    const remarks = window.prompt('Enter approval remarks (optional):', 'Verified and compliant with regulatory standards.');
    if (remarks === null) return;

    try {
      const res = await api.approveLicense(id, remarks);
      if (res.success) {
        alert('✓ License successfully verified and approved.');
        loadDashboardData();
      } else {
        alert(`Failed: ${res.message}`);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRejectLicense = async (id) => {
    const reason = window.prompt('Enter mandatory rejection reason:');
    if (!reason) {
      alert('Rejection reason is required.');
      return;
    }

    try {
      const res = await api.rejectLicense(id, reason);
      if (res.success) {
        alert('License rejected.');
        loadDashboardData();
      } else {
        alert(`Failed: ${res.message}`);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Header Profile Greeting */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>
              {isRegulator && 'Regulatory Command & Oversight'}
              {isMfg && 'Manufacturing & Serialization Hub'}
              {isDist && 'Wholesale Distribution & Transit Hub'}
              {isPharm && 'Pharmacy Verification & Dispensing Desk'}
            </h1>
            <StatusBadge status={user?.role} />
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '4px' }}>
            Connected Entity: <strong style={{ color: '#fff' }}>{user?.organization?.name || user?.name}</strong> • Node Status: <span style={{ color: '#10b981' }}>● Certified Active</span>
          </p>
        </div>

        {/* Action Shortcuts */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {isMfg && (
            <Link to="/manufacturer/batches" className="btn btn-primary btn-sm">
              ➕ Mint New Batch
            </Link>
          )}
          {isDist && (
            <Link to="/distributor/shipments" className="btn btn-primary btn-sm">
              🚚 Log Custody Transfer
            </Link>
          )}
          {isPharm && (
            <Link to="/verify/BATCH-2026-TEST-001" className="btn btn-primary btn-sm">
              📷 QR Verification Scan
            </Link>
          )}
          {isRegulator && (
            <Link to="/regulator/licenses" className="btn btn-primary btn-sm">
              📜 Review Pending Licenses ({stats.pendingLicenses})
            </Link>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent-cyan)' }}>{stats.batches}</div>
          <div className="stat-label">Total Batches Minted</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>Cryptographically Serialized</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#10b981' }}>{stats.products}</div>
          <div className="stat-label">Formulary Drugs</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>Active Regulatory Codes</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#a855f7' }}>{stats.events}</div>
          <div className="stat-label">Custodial Events Logged</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>Chain-of-Custody Proofs</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: stats.pendingLicenses > 0 ? '#f59e0b' : '#10b981' }}>
            {isRegulator ? stats.pendingLicenses : stats.organizations}
          </div>
          <div className="stat-label">
            {isRegulator ? 'Pending License Approvals' : 'Registered Organizations'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            {isRegulator ? 'Requires Action' : 'Approved Supply Chain Nodes'}
          </div>
        </div>
      </div>

      {/* Regulator Priority Review Queue */}
      {isRegulator && pendingLicensesList.length > 0 && (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '32px', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', margin: 0, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚠️</span> Priority License Review Queue
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Organizations awaiting regulatory authorization
              </p>
            </div>
            <Link to="/regulator/licenses" className="btn btn-outline btn-sm">
              View All Licenses →
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
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
                {pendingLicensesList.slice(0, 5).map((lic) => (
                  <tr key={lic._id}>
                    <td>
                      <strong>{lic.organization?.name || 'New Organization'}</strong>
                    </td>
                    <td>
                      <StatusBadge status={lic.organization?.type || lic.licenseType} />
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{lic.licenseNumber}</td>
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
                          onClick={() => handleApproveLicense(lic._id)}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 10px', background: '#10b981' }}
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleRejectLicense(lic._id)}
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

      {/* Main Dual Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
        gap: '24px',
      }}>
        {/* Recent Batches */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>📦 Recent Production Batches</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Latest cryptographically stamped lots
              </p>
            </div>
            <Link to="/batches" className="btn btn-outline btn-sm">
              All Batches →
            </Link>
          </div>

          {recentBatches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-dim)' }}>
              No batches registered yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentBatches.map((b) => (
                <div
                  key={b._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#fff' }}>
                      {b.product?.name || 'Pharmaceutical Batch'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      Batch #{b.batchNumber} • Qty: {b.quantity?.toLocaleString()} {b.unit}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <StatusBadge status={b.status} />
                    <Link
                      to={`/verify/${b.qrIdentifier || b.batchNumber}`}
                      className="btn btn-outline btn-sm"
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    >
                      Verify
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Custodial Events */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>⛓️ Live Custody Events</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Real-time chain transitions & verification scans
              </p>
            </div>
            <Link to="/supply-chain" className="btn btn-outline btn-sm">
              All Events →
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
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StatusBadge status={evt.eventType} />
                      <strong style={{ fontSize: '0.85rem', color: '#fff' }}>
                        {evt.batch?.product?.name || evt.batch?.batchNumber || 'Batch Lot'}
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {new Date(evt.eventDate).toLocaleTimeString()}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {evt.fromOrganization?.name || 'Origin'} → {evt.toOrganization?.name || 'Destination'} ({evt.location})
                  </div>
                </div>
              ))}
            </div>
          )}
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
