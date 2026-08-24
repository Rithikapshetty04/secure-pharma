import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function ManufacturerDashboard({ user, onSelectBatchForTracking }) {
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Product Modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', productCode: '', description: '' });

  // New Batch Modal
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [newBatch, setNewBatch] = useState({
    productId: '',
    batchNumber: '',
    quantity: 10000,
    manufacturingDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 2).toISOString().split('T')[0],
    location: user.organization?.address || 'Primary Manufacturing Facility',
  });

  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, batchRes] = await Promise.all([
        api.getProducts(),
        api.getBatches(),
      ]);

      if (prodRes.success) setProducts(prodRes.products);
      if (batchRes.success) setBatches(batchRes.batches);
    } catch (err) {
      console.error('Error fetching manufacturer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    try {
      const res = await api.createProduct(newProduct);
      if (res.success) {
        setShowProductModal(false);
        setNewProduct({ name: '', productCode: '', description: '' });
        fetchData();
      } else {
        setModalError(res.message || 'Failed to create product');
      }
    } catch (err) {
      setModalError('Network error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    try {
      const res = await api.createBatch(newBatch);
      if (res.success) {
        setShowBatchModal(false);
        setNewBatch({
          productId: '',
          batchNumber: '',
          quantity: 10000,
          manufacturingDate: new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 2).toISOString().split('T')[0],
          location: user.organization?.address || 'Primary Manufacturing Facility',
        });
        fetchData();
      } else {
        setModalError(res.message || 'Failed to mint batch');
      }
    } catch (err) {
      setModalError('Network error');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '30px 24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Manufacturer Production Studio</h1>
            <span className="badge badge-success">CERTIFIED GMP FACILITY</span>
          </div>
          <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>
            {user.organization?.name || 'BioPharma Manufacturer'} — Register medicines, mint cryptographic batches, and record provenance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowProductModal(true)}
            className="btn btn-outline"
          >
            + Register Medicine
          </button>
          <button
            onClick={() => setShowBatchModal(true)}
            className="btn btn-primary"
          >
            ⚡ Mint Production Batch
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '28px',
      }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px' }}>REGISTERED DRUGS</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#38bdf8' }}>{products.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>In active formulary</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px' }}>BATCHES MINTED</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#34d399' }}>{batches.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cryptographically anchored</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px' }}>TOTAL UNITS PRODUCED</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#c084fc' }}>
            {batches.reduce((acc, b) => acc + (b.quantity || 0), 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Traceable packages</div>
        </div>
      </div>

      {/* 2-Column Grid: Drug Catalog & Minted Batches */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Drug Catalog */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Drug Formulary Catalog</h3>
            <span className="badge badge-info">{products.length} Drugs</span>
          </div>

          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
              No drugs registered yet. Click '+ Register Medicine' above.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {products.map((p) => (
                <div key={p._id} style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ color: '#fff' }}>{p.name}</strong>
                    <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{p.productCode}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {p.description || 'Verified pharmaceutical formulation'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Minted Batches Table */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Manufactured Production Batches</h3>
            <span className="badge badge-success">{batches.length} Batches</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading batches...</div>
          ) : batches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
              No batches minted yet. Click '⚡ Mint Production Batch' to create one.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                    <th style={{ padding: '10px 12px' }}>BATCH #</th>
                    <th style={{ padding: '10px 12px' }}>MEDICINE</th>
                    <th style={{ padding: '10px 12px' }}>QTY</th>
                    <th style={{ padding: '10px 12px' }}>EXPIRY</th>
                    <th style={{ padding: '10px 12px' }}>STATUS</th>
                    <th style={{ padding: '10px 12px' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b) => (
                    <tr key={b._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: '600' }}>
                        {b.batchNumber}
                      </td>
                      <td style={{ padding: '12px', color: '#fff', fontWeight: '600' }}>
                        {b.product?.name || 'N/A'}
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{b.product?.productCode}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {b.quantity?.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                        {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span className={`badge ${
                          b.status === 'MANUFACTURED' ? 'badge-success' :
                          b.status === 'IN_TRANSIT' ? 'badge-warning' : 'badge-purple'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => onSelectBatchForTracking(b.batchNumber)}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          🔍 Trace Provenance
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Register Product */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>Register New Pharmaceutical Formulary</h2>
            <p style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
              Define drug code and formula specifications before production batch minting.
            </p>

            {modalError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#fb7185', padding: '10px', borderRadius: '6px', marginBottom: '14px', fontSize: '0.85rem' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Drug Name *
                </label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g. Amoxicillin Trihydrate 500mg"
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Product Code / GTIN / NDC *
                </label>
                <input
                  type="text"
                  required
                  value={newProduct.productCode}
                  onChange={(e) => setNewProduct({ ...newProduct, productCode: e.target.value })}
                  placeholder="e.g. AMOX-500MG"
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Description / Strength / Packaging
                </label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="e.g. Oral Capsules 500mg, Pack of 100 with tamper-evident seal."
                  rows={3}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowProductModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={modalLoading} className="btn btn-primary">
                  {modalLoading ? 'Saving...' : 'Register Formulary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Mint Batch */}
      {showBatchModal && (
        <div className="modal-overlay" onClick={() => setShowBatchModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>Mint Cryptographic Production Batch</h2>
            <p style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
              Create an immutable production batch anchored with SHA-256 and smart contract ledger event.
            </p>

            {modalError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#fb7185', padding: '10px', borderRadius: '6px', marginBottom: '14px', fontSize: '0.85rem' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateBatch} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Select Medicine Formulary *
                </label>
                <select
                  required
                  value={newBatch.productId}
                  onChange={(e) => setNewBatch({ ...newBatch, productId: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                >
                  <option value="">-- Select Registered Drug --</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.productCode})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Batch Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBatch.batchNumber}
                    onChange={(e) => setNewBatch({ ...newBatch, batchNumber: e.target.value })}
                    placeholder="e.g. BATCH-2026-TEST-001"
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Batch Quantity (Units) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newBatch.quantity}
                    onChange={(e) => setNewBatch({ ...newBatch, quantity: e.target.value })}
                    placeholder="10000"
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Manufacturing Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newBatch.manufacturingDate}
                    onChange={(e) => setNewBatch({ ...newBatch, manufacturingDate: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newBatch.expiryDate}
                    onChange={(e) => setNewBatch({ ...newBatch, expiryDate: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Facility Location
                </label>
                <input
                  type="text"
                  value={newBatch.location}
                  onChange={(e) => setNewBatch({ ...newBatch, location: e.target.value })}
                  placeholder="Manufacturing Facility Cleanroom #2, Boston MA"
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowBatchModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={modalLoading} className="btn btn-success">
                  {modalLoading ? 'Minting On-Chain...' : '⚡ Mint & Register Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
