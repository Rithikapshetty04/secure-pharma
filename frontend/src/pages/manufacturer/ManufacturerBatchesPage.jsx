import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
<<<<<<< HEAD
=======
import { useAuth } from '../../context/AuthContext';
>>>>>>> origin/main
import StatusBadge from '../../components/StatusBadge';
import QRCodeGenerator from '../../components/QRCodeGenerator';

export default function ManufacturerBatchesPage() {
<<<<<<< HEAD

  const [batches, setBatches] = useState([]);
=======
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [total, setTotal] = useState(0);
>>>>>>> origin/main
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedQRBatch, setSelectedQRBatch] = useState(null);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const res = await api.getBatches({
<<<<<<< HEAD
        limit: 50,
        search,
        status: statusFilter,
      });
      if (res.success) {
        setBatches(res.batches);
=======
        search,
        status: statusFilter,
        limit: 50,
      });
      if (res.success) {
        setBatches(res.batches);
        setTotal(res.total);
>>>>>>> origin/main
      }
    } catch (err) {
      console.error('Error fetching manufacturer batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadBatches();
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
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>
<<<<<<< HEAD
            📦 My Medicines & Production Batches
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Manage serialized pharmaceutical lots and cryptographic QR authenticity tags
=======
            📦 Manufactured Medicines & Batches
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '4px' }}>
            All pharmaceutical batches produced by {user?.organization?.name || 'Manufacturer'} ({total} total)
>>>>>>> origin/main
          </p>
        </div>

        <Link to="/manufacturer/batches/create" className="btn btn-primary">
          ➕ Create New Batch
        </Link>
      </div>

<<<<<<< HEAD
      {/* Filter and Search Bar */}
=======
      {/* Filter Bar */}
>>>>>>> origin/main
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', background: '#ffffff' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
<<<<<<< HEAD
            placeholder="Search by batch lot # or medicine name..."
=======
            placeholder="Search by batch number or medicine name..."
>>>>>>> origin/main
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
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
            }}
          >
            <option value="">All Statuses</option>
            <option value="MANUFACTURED">MANUFACTURED</option>
            <option value="IN_TRANSIT">IN_TRANSIT</option>
            <option value="RECEIVED">RECEIVED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="SOLD">SOLD</option>
            <option value="RECALLED">RECALLED</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="FLAGGED">FLAGGED</option>
          </select>

          <button type="submit" className="btn btn-primary btn-sm">
<<<<<<< HEAD
            Filter
=======
            Search
>>>>>>> origin/main
          </button>
        </form>
      </div>

      {/* Batches Table */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#2563eb', fontWeight: '600' }}>
            Loading batches...
          </div>
        ) : batches.length === 0 ? (
<<<<<<< HEAD
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-dim)' }}>
            No batches found matching your criteria.{' '}
            <Link to="/manufacturer/batches/create" style={{ color: '#2563eb', fontWeight: '600' }}>
              Create a batch now
            </Link>
=======
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            No batches found matching criteria. Click "Create New Batch" to register one.
>>>>>>> origin/main
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
<<<<<<< HEAD
                  <th>BATCH NUMBER</th>
                  <th>MEDICINE NAME</th>
                  <th>QUANTITY</th>
                  <th>MFG DATE</th>
                  <th>EXPIRY DATE</th>
=======
                  <th>MEDICINE</th>
                  <th>BATCH #</th>
                  <th>QTY</th>
                  <th>MFG DATE</th>
                  <th>EXPIRY DATE</th>
                  <th>CURRENT HOLDER</th>
>>>>>>> origin/main
                  <th>STATUS</th>
                  <th>QR CODE</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b._id}>
<<<<<<< HEAD
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#1e3a8a' }}>
                      {b.batchNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--text-heading)' }}>
                        {b.product?.name || 'Pharmaceutical Product'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {b.product?.genericName || b.product?.dosageForm}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {b.quantity?.toLocaleString()} {b.unit}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
=======
                    <td>
                      <div style={{ fontWeight: '700', color: '#1e3a8a' }}>
                        {b.product?.name || 'Medicine'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        {b.product?.productCode}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-heading)' }}>
                      {b.batchNumber}
                    </td>
                    <td>
                      {b.quantity?.toLocaleString()} {b.unit}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
>>>>>>> origin/main
                      {new Date(b.manufacturingDate).toLocaleDateString()}
                    </td>
                    <td
                      style={{
                        fontSize: '0.85rem',
<<<<<<< HEAD
                        fontWeight: '600',
                        color: new Date(b.expiryDate) < new Date() ? '#dc2626' : '#059669',
=======
                        color: new Date(b.expiryDate) < new Date() ? '#dc2626' : '#059669',
                        fontWeight: '600',
>>>>>>> origin/main
                      }}
                    >
                      {new Date(b.expiryDate).toLocaleDateString()}
                    </td>
<<<<<<< HEAD
=======
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {b.manufacturer?.name || user?.organization?.name || 'Manufacturer Cleanroom'}
                    </td>
>>>>>>> origin/main
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedQRBatch(b)}
                        className="btn btn-outline btn-sm"
                        style={{
                          fontSize: '0.75rem',
                          padding: '4px 8px',
                          background: '#eff6ff',
<<<<<<< HEAD
                          borderColor: '#bfdbfe',
                          color: '#1d4ed8',
                        }}
                      >
                        📱 View QR
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <Link
                          to={`/manufacturer/batches/${b._id}`}
                          className="btn btn-outline btn-sm"
=======
                          color: '#1d4ed8',
                          borderColor: '#bfdbfe',
                        }}
                      >
                        📱 QR
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                        <Link
                          to={`/manufacturer/batches/${b._id}`}
                          className="btn btn-primary btn-sm"
>>>>>>> origin/main
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          View
                        </Link>
                        <Link
                          to={`/manufacturer/transfers/${b._id}`}
                          className="btn btn-outline btn-sm"
<<<<<<< HEAD
                          style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#059669' }}
=======
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
>>>>>>> origin/main
                        >
                          Transfer
                        </Link>
                        <Link
                          to={`/verify/${b.qrIdentifier || b.batchNumber}`}
<<<<<<< HEAD
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          Verify →
=======
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          Verify
>>>>>>> origin/main
                        </Link>
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
      {/* QR Code Modal */}
=======
      {/* QR Code Popover Modal */}
>>>>>>> origin/main
      {selectedQRBatch && (
        <div className="modal-overlay" onClick={() => setSelectedQRBatch(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '420px', textAlign: 'center', padding: '30px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
<<<<<<< HEAD
              <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#1e3a8a' }}>QR Authenticity Seal</h3>
              <button onClick={() => setSelectedQRBatch(null)} className="btn btn-outline btn-sm">✕</button>
=======
              <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#1e3a8a' }}>Batch QR Authenticity</h3>
              <button onClick={() => setSelectedQRBatch(null)} className="btn btn-outline btn-sm">
                ✕
              </button>
>>>>>>> origin/main
            </div>

            <QRCodeGenerator
              identifier={selectedQRBatch.qrIdentifier || selectedQRBatch.batchNumber}
              batchNumber={selectedQRBatch.batchNumber}
              productName={selectedQRBatch.product?.name}
              size={240}
            />
<<<<<<< HEAD

            <div style={{ marginTop: '20px' }}>
              <Link
                to={`/verify/${selectedQRBatch.qrIdentifier || selectedQRBatch.batchNumber}`}
                className="btn btn-primary btn-sm"
                style={{ width: '100%' }}
              >
                Inspect 9-Point Verification Result →
              </Link>
            </div>
=======
>>>>>>> origin/main
          </div>
        </div>
      )}
    </div>
  );
}
