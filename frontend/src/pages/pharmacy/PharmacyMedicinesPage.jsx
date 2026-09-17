import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useCart } from '../../context/CartContext';
import StatusBadge from '../../components/StatusBadge';

export default function PharmacyMedicinesPage() {
  const { addToCart, cartCount } = useCart();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addedItemBatchId, setAddedItemBatchId] = useState(null);

  const loadMedicines = async () => {
    setLoading(true);
    try {
      const res = await api.getBatches({ limit: 100, search });
      if (res.success) {
        // Only active / unexpired batches are eligible for pharmacy order
        const eligible = res.batches.filter(
          (b) => b.status !== 'EXPIRED' && b.status !== 'RECALLED' && new Date(b.expiryDate) > new Date()
        );
        setBatches(eligible);
      }
    } catch (err) {
      console.error('Error loading medicines for ordering:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadMedicines();
  };

  const handleAddToCart = (product, batch) => {
    addToCart(product, batch, 100);
    setAddedItemBatchId(batch._id);
    setTimeout(() => {
      setAddedItemBatchId(null);
    }, 2500);
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
            💊 Pharmaceutical Formulary & Ordering
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Browse authentic, verified medicine batches available for pharmacy dispensary requisition
          </p>
        </div>

        <Link
          to="/pharmacy/cart"
          className="btn btn-primary"
          style={{ position: 'relative', padding: '10px 20px' }}
        >
          🛒 View Cart ({cartCount})
        </Link>
      </div>

      {/* Search Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', background: '#ffffff' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search formulary drugs by name, active ingredient, or batch lot #..."
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
            }}
          />
          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>
      </div>

      {/* Medicines Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#2563eb', fontWeight: '600' }}>
          Loading available medicines & verified batches...
        </div>
      ) : batches.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)', background: '#ffffff' }}>
          No medicines matching your search are currently available.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '20px',
          }}
        >
          {batches.map((b) => {
            const product = b.product || { name: 'Pharmaceutical Product', genericName: 'Generic' };
            const isJustAdded = addedItemBatchId === b._id;

            return (
              <div
                key={b._id}
                className="glass-card glass-card-hover"
                style={{
                  padding: '22px',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '16px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                      {product.category || 'Pharmaceutical'}
                    </span>
                    <StatusBadge status={b.status} />
                  </div>

                  <h3 style={{ fontSize: '1.15rem', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                    {product.name}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '14px' }}>
                    {product.genericName} • {product.dosageForm || 'Standard formulation'}
                  </div>

                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.8rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Batch Lot:</span>
                      <strong style={{ fontFamily: 'var(--font-mono)', color: '#1e3a8a' }}>{b.batchNumber}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Manufacturer:</span>
                      <strong>{b.manufacturer?.name || product.manufacturer?.name || 'Verified Mfg'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Available Stock:</span>
                      <strong style={{ color: '#059669' }}>{b.quantity?.toLocaleString()} {b.unit}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Expiration:</span>
                      <strong style={{ color: '#059669' }}>{new Date(b.expiryDate).toLocaleDateString()}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleAddToCart(product, b)}
                    className={`btn btn-sm ${isJustAdded ? 'btn-success' : 'btn-primary'}`}
                    style={{ flex: 1, padding: '10px 14px', fontWeight: '700' }}
                  >
                    {isJustAdded ? '✓ Added to Cart!' : '🛒 Add to Cart (100 Units)'}
                  </button>
                  <Link
                    to={`/verify/${b.qrIdentifier || b.batchNumber}`}
                    className="btn btn-outline btn-sm"
                    style={{ padding: '10px 12px' }}
                    title="Verify QR"
                  >
                    🔍
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
