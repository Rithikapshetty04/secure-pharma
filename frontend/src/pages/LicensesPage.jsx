import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import DocumentViewerModal from '../components/DocumentViewerModal';

export default function LicensesPage() {
  const { user } = useAuth();
  const [licenses, setLicenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const isRegulator = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'REGULATOR';

  const loadLicenses = async () => {
    setLoading(true);
    try {
      const res = await api.getLicenses({ page, limit: 12, search, status });
      if (res.success) {
        setLicenses(res.licenses);
        setTotal(res.total);
      }
    } catch (err) {
      console.error('Error fetching licenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLicenses();
  }, [page, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadLicenses();
  };

  const handleApprove = async (id, licNum) => {
    const remarks = window.prompt(`Approve license #${licNum}. Enter optional audit remarks:`, 'Full cGMP/GDP compliance verified.');
    if (remarks === null) return;

    try {
      const res = await api.approveLicense(id, remarks);
      if (res.success) {
        alert(`✓ License #${licNum} approved and verified.`);
        loadLicenses();
      } else {
        alert(`Failed: ${res.message}`);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReject = async (id, licNum) => {
    const reason = window.prompt(`Enter mandatory rejection reason for license #${licNum}:`);
    if (!reason) {
      alert('Rejection reason is required.');
      return;
    }

    try {
      const res = await api.rejectLicense(id, reason);
      if (res.success) {
        alert(`License #${licNum} rejected.`);
        loadLicenses();
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
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>
          📜 Regulatory License Verification Queue
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '4px' }}>
          Inspect submitted manufacturer, wholesale, and pharmacy credentials with document validation
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by license number..."
            style={{
              flex: 1,
              minWidth: '240px',
              padding: '10px 14px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: '0.85rem',
            }}
          />

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '10px 14px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: '0.85rem',
            }}
          >
            <option value="">All Verification Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
            <option value="APPROVED">APPROVED / VERIFIED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>

          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>
      </div>

      {/* Licenses Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--accent-cyan)' }}>
            Loading license registry...
          </div>
        ) : licenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            No licenses found matching criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>LICENSE #</th>
                  <th>ORGANIZATION</th>
                  <th>CLASSIFICATION</th>
                  <th>EXPIRY DATE</th>
                  <th>DOCUMENT</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>REGULATORY ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((lic) => (
                  <tr key={lic._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#fff' }}>
                      {lic.licenseNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{lic.organization?.name || 'Organization'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{lic.organization?.type}</div>
                    </td>
                    <td>
                      <StatusBadge status={lic.licenseType} />
                    </td>
                    <td style={{ fontSize: '0.85rem', color: new Date(lic.expiryDate) < new Date() ? '#ef4444' : '#10b981' }}>
                      {new Date(lic.expiryDate).toLocaleDateString()}
                    </td>
                    <td>
                      {lic.documentPath ? (
                        <button
                          onClick={() => setSelectedDoc(lic.documentPath)}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                        >
                          📄 View Document
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>None</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={lic.verificationStatus} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {isRegulator ? (
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleApprove(lic._id, lic.licenseNumber)}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '4px 10px', background: '#10b981' }}
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleReject(lic._id, lic.licenseNumber)}
                            className="btn btn-danger btn-sm"
                            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Read Only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedDoc && (
        <DocumentViewerModal
          documentPath={selectedDoc}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}
