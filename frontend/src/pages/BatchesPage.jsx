import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import QRCodeGenerator from '../components/QRCodeGenerator';

export default function BatchesPage() {
  const [searchParams] = useSearchParams();
  const productIdParam = searchParams.get('productId') || '';

  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const [showMintModal, setShowMintModal] = useState(false);
  const [selectedQRBatch, setSelectedQRBatch] = useState(null);

  const [mintFormData, setMintFormData] = useState({
    productId: productIdParam || '',
    batchNumber: '',
    manufacturingDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    quantity: 10000,
    unit: 'Bottles',
    storageRequirements: 'Store between 15°C and 25°C',
    location: 'Cleanroom Facility #1',
  });

  const isMfgOrAdmin = user?.role === 'MANUFACTURER' || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'REGULATOR';

  const loadBatchesAndProducts = async () => {
    setLoading(true);
    try {
      const [batchesRes, productsRes] = await Promise.all([
        api.getBatches({ page, limit: 12, search, status, productId: productIdParam }),
        api.getProducts({ limit: 100 }),
      ]);

      if (batchesRes.success) {
        setBatches(batchesRes.batches);
        setTotal(batchesRes.total);
      }
      if (productsRes.success) {
        setProducts(productsRes.products);
        if (!mintFormData.productId && productsRes.products.length > 0) {
          setMintFormData((prev) => ({ ...prev, productId: productsRes.products[0]._id }));
        }
      }
    } catch (err) {
      console.error('Error fetching batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatchesAndProducts();
  }, [page, status, productIdParam]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadBatchesAndProducts();
  };

  const handleMintSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createBatch(mintFormData);
      if (res.success) {
        alert(`✓ Batch #${res.batch.batchNumber} successfully minted and hashed on ledger!`);
        setShowMintModal(false);
        setMintFormData({
          productId: products[0]?._id || '',
          batchNumber: '',
          manufacturingDate: new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          quantity: 10000,
          unit: 'Bottles',
          storageRequirements: 'Store between 15°C and 25°C',
          location: 'Cleanroom Facility #1',
        });
        loadBatchesAndProducts();
      } else {
        alert(`Minting failed: ${res.message}`);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (batchId, batchNum) => {
    const newStatus = window.prompt(
      `Enter new status for Batch #${batchNum} (RECALLED, FLAGGED, IN_TRANSIT, DELIVERED, SOLD):`
    );
    if (!newStatus) return;

    const normalized = newStatus.trim().toUpperCase();
    const valid = ['RECALLED', 'FLAGGED', 'IN_TRANSIT', 'DELIVERED', 'SOLD', 'EXPIRED'];
    if (!valid.includes(normalized)) {
      alert(`Invalid status. Must be one of: ${valid.join(', ')}`);
      return;
    }

    const reason = window.prompt(`Enter mandatory reason for setting status to ${normalized}:`);
    if (!reason) {
      alert('Reason is required.');
      return;
    }

    try {
      const res = await api.updateBatchStatus(batchId, normalized, reason);
      if (res.success) {
        alert(`✓ Batch #${batchNum} status updated to ${normalized}.`);
        loadBatchesAndProducts();
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>
            📦 Pharmaceutical Batch Serialization & QR Ledger
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '4px' }}>
            Serialized production lots with SHA-256 cryptographic fingerprints & tamper-proof QR codes
          </p>
        </div>

        {isMfgOrAdmin && (
          <button onClick={() => setShowMintModal(true)} className="btn btn-primary">
            ⚙️ Mint Production Batch
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', background: '#ffffff' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by batch number or QR identifier..."
            style={{
              flex: 1,
              minWidth: '240px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
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
            Filter
          </button>
        </form>
      </div>

      {/* Batches Table */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#2563eb', fontWeight: '600' }}>
            Loading serialized batch ledger...
          </div>
        ) : batches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            No batches found matching criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>BATCH LOT #</th>
                  <th>FORMULARY DRUG</th>
                  <th>MANUFACTURER</th>
                  <th>QTY & UNIT</th>
                  <th>EXPIRATION</th>
                  <th>STATUS</th>
                  <th>QR CODE</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#1e3a8a' }}>
                      {b.batchNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{b.product?.name || 'Pharmaceutical Drug'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        {b.product?.productCode}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {b.manufacturer?.name || b.product?.manufacturer?.name || 'Verified Mfg'}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {b.quantity?.toLocaleString()} {b.unit}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: new Date(b.expiryDate) < new Date() ? '#dc2626' : '#059669', fontWeight: '600' }}>
                      {new Date(b.expiryDate).toLocaleDateString()}
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedQRBatch(b)}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', padding: '4px 10px', background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' }}
                      >
                        📱 View QR
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <Link
                          to={`/verify/${b.qrIdentifier || b.batchNumber}`}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        >
                          Verify →
                        </Link>
                        {isMfgOrAdmin && (
                          <button
                            onClick={() => handleStatusChange(b._id, b.batchNumber)}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          >
                            ⚠️ Status
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

      {/* Mint Batch Modal */}
      {showMintModal && (
        <div className="modal-overlay" onClick={() => setShowMintModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#1e3a8a' }}>⚙️ Mint & Serialize Production Batch</h3>
              <button onClick={() => setShowMintModal(false)} className="btn btn-outline btn-sm">✕</button>
            </div>

            <form onSubmit={handleMintSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-dim)' }}>
                  SELECT FORMULARY PRODUCT *
                </label>
                <select
                  required
                  value={mintFormData.productId}
                  onChange={(e) => setMintFormData({ ...mintFormData, productId: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
                >
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.productCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-dim)' }}>
                  UNIQUE BATCH NUMBER *
                </label>
                <input
                  type="text"
                  required
                  value={mintFormData.batchNumber}
                  onChange={(e) => setMintFormData({ ...mintFormData, batchNumber: e.target.value })}
                  placeholder="e.g. BATCH-2026-AMOX-880"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-dim)' }}>
                    MANUFACTURING DATE
                  </label>
                  <input
                    type="date"
                    required
                    value={mintFormData.manufacturingDate}
                    onChange={(e) => setMintFormData({ ...mintFormData, manufacturingDate: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-dim)' }}>
                    EXPIRATION DATE *
                  </label>
                  <input
                    type="date"
                    required
                    value={mintFormData.expiryDate}
                    onChange={(e) => setMintFormData({ ...mintFormData, expiryDate: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-dim)' }}>
                    PRODUCTION QUANTITY *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={mintFormData.quantity}
                    onChange={(e) => setMintFormData({ ...mintFormData, quantity: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-dim)' }}>
                    UNIT CLASSIFICATION
                  </label>
                  <input
                    type="text"
                    value={mintFormData.unit}
                    onChange={(e) => setMintFormData({ ...mintFormData, unit: e.target.value })}
                    placeholder="e.g. Bottles, Vials, Boxes"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-dim)' }}>
                  CLEANROOM / MANUFACTURING LOCATION
                </label>
                <input
                  type="text"
                  value={mintFormData.location}
                  onChange={(e) => setMintFormData({ ...mintFormData, location: e.target.value })}
                  placeholder="e.g. Cleanroom Facility #4, Cambridge MA"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-dim)' }}>
                  STORAGE & TEMPERATURE SPECIFICATIONS
                </label>
                <input
                  type="text"
                  value={mintFormData.storageRequirements}
                  onChange={(e) => setMintFormData({ ...mintFormData, storageRequirements: e.target.value })}
                  placeholder="e.g. Store at controlled room temp 15°C to 25°C"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px', padding: '12px' }}>
                ⚙️ Cryptographically Mint & Hash Batch
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Popover Modal */}
      {selectedQRBatch && (
        <div className="modal-overlay" onClick={() => setSelectedQRBatch(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '420px', textAlign: 'center', padding: '30px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#1e3a8a' }}>QR Authenticity Seal</h3>
              <button onClick={() => setSelectedQRBatch(null)} className="btn btn-outline btn-sm">✕</button>
            </div>

            <QRCodeGenerator
              identifier={selectedQRBatch.qrIdentifier || selectedQRBatch.batchNumber}
              batchNumber={selectedQRBatch.batchNumber}
              productName={selectedQRBatch.product?.name}
              size={240}
            />
          </div>
        </div>
      )}
    </div>
  );
}
