import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function AdminDashboard({ user }) {
  const [activeSubTab, setActiveSubTab] = useState('licenses'); // 'licenses' | 'organizations' | 'audits'
  const [loading, setLoading] = useState(false);
  const [licenses, setLicenses] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  
  // Verification action modal state
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      const data = await api.getLicenses(filterStatus);
      if (data.success) {
        setLicenses(data.licenses);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const data = await api.getOrganizations();
      if (data.success) {
        setOrganizations(data.organizations);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAudits = async () => {
    try {
      const data = await api.getAuditLogs({ limit: 50 });
      if (data.success) {
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLicenses();
    fetchOrganizations();
    fetchAudits();
  }, [filterStatus]);

  const handleVerify = async (status) => {
    if (!selectedLicense) return;
    setActionLoading(true);

    try {
      const res = await api.verifyLicense(selectedLicense._id, status, remarks);
      if (res.success) {
        setSelectedLicense(null);
        setRemarks('');
        fetchLicenses();
        fetchOrganizations();
        fetchAudits();
      } else {
        alert(res.message || 'Action failed');
      }
    } catch (err) {
      alert('Error updating license');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = licenses.filter((l) => l.verificationStatus === 'PENDING').length;
  const verifiedCount = licenses.filter((l) => l.verificationStatus === 'VERIFIED').length;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '30px 24px' }}>
      {/* Dashboard Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Regulatory Authority Portal</h1>
            <span className="badge badge-danger">ADMIN CONTROLS</span>
          </div>
          <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>
            Supervise entity credentials, approve GMP/GDP pharmaceutical licenses, and inspect compliance audit logs.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '6px',
          background: 'rgba(15, 23, 42, 0.8)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}>
          <button
            onClick={() => setActiveSubTab('licenses')}
            className={`btn btn-sm ${activeSubTab === 'licenses' ? 'btn-primary' : 'btn-outline'}`}
          >
            📋 License Applications ({pendingCount} Pending)
          </button>
          <button
            onClick={() => setActiveSubTab('organizations')}
            className={`btn btn-sm ${activeSubTab === 'organizations' ? 'btn-primary' : 'btn-outline'}`}
          >
            🏢 Entity Directory ({organizations.length})
          </button>
          <button
            onClick={() => setActiveSubTab('audits')}
            className={`btn btn-sm ${activeSubTab === 'audits' ? 'btn-primary' : 'btn-outline'}`}
          >
            📜 Audit Trail ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '28px',
      }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px' }}>PENDING LICENSES</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#fbbf24' }}>{pendingCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting review</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px' }}>VERIFIED ENTITIES</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#34d399' }}>{verifiedCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active in supply chain</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px' }}>REGISTERED ORGS</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#38bdf8' }}>{organizations.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total network nodes</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px' }}>AUDIT LOG ENTRIES</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#c084fc' }}>{auditLogs.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Security transactions</div>
        </div>
      </div>

      {/* SubTab 1: LICENSES */}
      {activeSubTab === 'licenses' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '1.2rem' }}>License Verification Queue</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setFilterStatus('')}
                className={`btn btn-sm ${filterStatus === '' ? 'btn-primary' : 'btn-outline'}`}
              >
                All ({licenses.length})
              </button>
              <button
                onClick={() => setFilterStatus('PENDING')}
                className={`btn btn-sm ${filterStatus === 'PENDING' ? 'btn-primary' : 'btn-outline'}`}
              >
                Pending Only ({pendingCount})
              </button>
              <button
                onClick={() => setFilterStatus('VERIFIED')}
                className={`btn btn-sm ${filterStatus === 'VERIFIED' ? 'btn-primary' : 'btn-outline'}`}
              >
                Verified
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading license applications...</div>
          ) : licenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
              No licenses found matching criteria.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                    <th style={{ padding: '12px 14px' }}>ORGANIZATION</th>
                    <th style={{ padding: '12px 14px' }}>TYPE</th>
                    <th style={{ padding: '12px 14px' }}>LICENSE #</th>
                    <th style={{ padding: '12px 14px' }}>DOCUMENT</th>
                    <th style={{ padding: '12px 14px' }}>STATUS</th>
                    <th style={{ padding: '12px 14px' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.map((lic) => (
                    <tr key={lic._id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}>
                      <td style={{ padding: '14px', fontWeight: '600', color: '#fff' }}>
                        {lic.organization?.name || 'N/A'}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{lic.organization?.contactEmail}</div>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span className="badge badge-info">{lic.organization?.type}</span>
                      </td>
                      <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                        {lic.licenseNumber}
                      </td>
                      <td style={{ padding: '14px' }}>
                        {lic.documentPath ? (
                          <a
                            href={`/${lic.documentPath.replace(/\\/g, '/')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          >
                            📄 View File
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>None</span>
                        )}
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span className={`badge ${
                          lic.verificationStatus === 'VERIFIED' ? 'badge-success' :
                          lic.verificationStatus === 'REJECTED' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {lic.verificationStatus}
                        </span>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <button
                          onClick={() => { setSelectedLicense(lic); setRemarks(''); }}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.8rem' }}
                        >
                          Review & Verify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SubTab 2: ORGANIZATIONS */}
      {activeSubTab === 'organizations' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '18px' }}>Verified Pharmaceutical Supply Network</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {organizations.map((org) => (
              <div key={org._id} style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '18px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '1.05rem', color: '#fff' }}>{org.name}</h4>
                  <span className={`badge ${org.status === 'APPROVED' ? 'badge-success' : 'badge-warning'}`}>
                    {org.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                  <span className="badge badge-info">{org.type}</span>
                </div>
                <p style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                  ✉️ {org.contactEmail || 'No email provided'}
                </p>
                <p style={{ fontSize: '0.85rem' }}>
                  📍 {org.address || 'Facility address on file'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 3: AUDIT LOGS */}
      {activeSubTab === 'audits' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '18px' }}>Regulatory Compliance Audit Log (21 CFR Part 11)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '10px 12px' }}>ACTION</th>
                  <th style={{ padding: '10px 12px' }}>ENTITY</th>
                  <th style={{ padding: '10px 12px' }}>DETAILS</th>
                  <th style={{ padding: '10px 12px' }}>TIMESTAMP</th>
                  <th style={{ padding: '10px 12px' }}>IP ADDRESS</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px' }}>
                      <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                      {log.entityType || 'System'}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#fff', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.details || '-'}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review & Verify Modal */}
      {selectedLicense && (
        <div className="modal-overlay" onClick={() => setSelectedLicense(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>
              Review License: {selectedLicense.licenseNumber}
            </h2>
            <p style={{ fontSize: '0.85rem', marginBottom: '18px' }}>
              Verify regulatory compliance for <strong>{selectedLicense.organization?.name}</strong>.
            </p>

            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div><strong>Organization:</strong> {selectedLicense.organization?.name}</div>
              <div><strong>Type:</strong> {selectedLicense.organization?.type}</div>
              <div><strong>License Type:</strong> {selectedLicense.licenseType}</div>
              <div><strong>Contact:</strong> {selectedLicense.organization?.contactEmail}</div>
              {selectedLicense.documentPath && (
                <div style={{ marginTop: '6px' }}>
                  <a
                    href={`/${selectedLicense.documentPath.replace(/\\/g, '/')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline btn-sm"
                  >
                    📄 View Uploaded Document Certificate
                  </a>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Inspector / Regulator Remarks
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Verified against state pharmacy database. All inspection criteria satisfied."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#fff',
                  resize: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedLicense(null)}
                className="btn btn-outline"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerify('REJECTED')}
                className="btn btn-danger"
                disabled={actionLoading}
              >
                Reject License
              </button>
              <button
                onClick={() => handleVerify('VERIFIED')}
                className="btn btn-success"
                disabled={actionLoading}
              >
                {actionLoading ? 'Updating...' : 'Approve & Verify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
