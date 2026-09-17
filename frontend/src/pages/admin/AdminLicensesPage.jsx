import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import DocumentViewerModal from '../../components/DocumentViewerModal';

export default function AdminLicensesPage() {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);

  const loadLicenses = async () => {
    setLoading(true);
    try {
      const res = await api.getLicenses({ limit: 100, status: statusFilter });
      if (res.success) {
        setLicenses(res.licenses);
      }
    } catch (err) {
      console.error('Error fetching licenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLicenses();
  }, [statusFilter]);

  const handleApprove = async (id, licNumber) => {
    const remarks = window.prompt(`Approval Remarks for License #${licNumber} (optional):`, 'Regulatory documentation verified & approved.');
    if (remarks === null) return;

    try {
      const res = await api.approveLicense(id, remarks);
      if (res.success) {
        alert('✓ License successfully verified & approved.');
        loadLicenses();
      } else {
        alert(`Failed: ${res.message}`);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReject = async (id, licNumber) => {
    const reason = window.prompt(`Mandatory Rejection Reason for License #${licNumber}:`);
    if (!reason) {
      alert('Rejection reason is required.');
      return;
    }

    try {
      const res = await api.rejectLicense(id, reason);
      if (res.success) {
        alert('License rejected.');
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
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>
          📜 Regulatory License Verification
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Review official pharmaceutical license certificates and issue regulatory clearance
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e3a8a' }}>
            Filter Applications by Verification Status
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
          >
            <option value="">All Applications</option>
            <option value="PENDING">PENDING</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
            <option value="APPROVED">APPROVED / VERIFIED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {/* Licenses Table */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#2563eb', fontWeight: '600' }}>
            Loading license applications...
          </div>
        ) : licenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
            No license applications found matching filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ORGANIZATION</th>
                  <th>LICENSE TYPE</th>
                  <th>LICENSE NUMBER</th>
                  <th>CERTIFICATE DOCUMENT</th>
                  <th>SUBMITTED DATE</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((lic) => (
                  <tr key={lic._id}>
                    <td>
                      <strong style={{ color: 'var(--text-heading)' }}>{lic.organization?.name || 'Applicant Organization'}</strong>
                    </td>
                    <td>
                      <StatusBadge status={lic.organization?.type || lic.licenseType} />
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#1e3a8a' }}>
                      {lic.licenseNumber}
                    </td>
                    <td>
                      {lic.documentPath ? (
                        <button
                          onClick={() => setSelectedDoc(lic.documentPath)}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#1d4ed8', borderColor: '#bfdbfe' }}
                        >
                          📄 View Document
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>No file attached</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {new Date(lic.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <StatusBadge status={lic.verificationStatus} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {lic.verificationStatus !== 'APPROVED' && lic.verificationStatus !== 'VERIFIED' && (
                          <button
                            onClick={() => handleApprove(lic._id, lic.licenseNumber)}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '4px 10px', background: '#059669' }}
                          >
                            ✓ Approve
                          </button>
                        )}
                        {lic.verificationStatus !== 'REJECTED' && (
                          <button
                            onClick={() => handleReject(lic._id, lic.licenseNumber)}
                            className="btn btn-danger btn-sm"
                            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                          >
                            ✕ Reject
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
