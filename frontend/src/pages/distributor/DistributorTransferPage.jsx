import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api';

export default function DistributorTransferPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();

  const [batches, setBatches] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(batchId || '');
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('');
  const [quantity, setQuantity] = useState(500);
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('Central Dispensary Vault, Bay 2');
  const [notes, setNotes] = useState('Certified wholesale delivery to licensed retail pharmacy dispensary.');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTransferData = async () => {
      setLoading(true);
      try {
        const [batchesRes, orgsRes] = await Promise.all([
          api.getBatches({ limit: 100 }),
          api.getOrganizations({ type: 'PHARMACY', limit: 50 }),
        ]);

        if (batchesRes.success) {
          setBatches(batchesRes.batches);
          if (!selectedBatchId && batchesRes.batches.length > 0) {
            setSelectedBatchId(batchesRes.batches[0]._id);
            setQuantity(Math.min(500, batchesRes.batches[0].quantity || 500));
          } else if (selectedBatchId) {
            const current = batchesRes.batches.find((b) => b._id === selectedBatchId);
            if (current) setQuantity(Math.min(500, current.quantity || 500));
          }
        }

        if (orgsRes.success) {
          const approvedPharmacies = orgsRes.organizations.filter(
            (org) => org.type === 'PHARMACY' && (org.status === 'APPROVED' || org.status === 'ACTIVE' || !org.status)
          );
          setPharmacies(approvedPharmacies.length > 0 ? approvedPharmacies : orgsRes.organizations);
          if (approvedPharmacies.length > 0) {
            setSelectedPharmacyId(approvedPharmacies[0]._id);
          } else if (orgsRes.organizations.length > 0) {
            setSelectedPharmacyId(orgsRes.organizations[0]._id);
          }
        }
      } catch (err) {
        console.error('Error loading distributor transfer data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTransferData();
  }, [batchId]);

  const handleBatchSelect = (id) => {
    setSelectedBatchId(id);
    const b = batches.find((item) => item._id === id);
    if (b) {
      setQuantity(Math.min(500, b.quantity || 500));
    }
  };

  const selectedBatch = batches.find((b) => b._id === selectedBatchId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedBatchId) {
      setError('Please select a batch to transfer.');
      return;
    }

    if (!selectedPharmacyId) {
      setError('Please select an authorized destination pharmacy.');
      return;
    }

    if (selectedBatch) {
      if (new Date(selectedBatch.expiryDate) < new Date()) {
        setError('Expired medicine batches cannot be transferred to pharmacies.');
        return;
      }
      if (quantity > selectedBatch.quantity) {
        setError(`Transfer quantity (${quantity}) cannot exceed batch total quantity (${selectedBatch.quantity}).`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const res = await api.recordEvent({
        batchId: selectedBatchId,
        eventType: 'DELIVERED',
        toOrganizationId: selectedPharmacyId,
        location,
        quantity: Number(quantity),
        notes,
      });

      if (res.success) {
        navigate(`/distributor/batches/${selectedBatchId}?transferred=true`);
      } else {
        setError(res.message || 'Failed to record custody handover.');
      }
    } catch (err) {
      setError(err.message || 'Error processing delivery to pharmacy.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '30px auto 80px', padding: '0 20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link
          to="/distributor/inventory"
          style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}
        >
          ← Back to Inventory
        </Link>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '8px', color: '#1e293b' }}>
          🚚 Transfer Custody to Licensed Pharmacy
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Record wholesale medicine shipment delivery to approved pharmacy dispensaries
        </p>
      </div>

      <div className="glass-card" style={{ padding: '32px', background: '#ffffff' }}>
        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              color: '#b91c1c',
              fontSize: '0.85rem',
              marginBottom: '20px',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#2563eb' }}>
            Loading available batches and licensed pharmacies...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Batch Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: '#1e293b' }}>
                SELECT MEDICINE BATCH FROM INVENTORY *
              </label>
              <select
                required
                value={selectedBatchId}
                onChange={(e) => handleBatchSelect(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}
              >
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    Batch #{b.batchNumber} — {b.product?.name} (Stock: {b.quantity?.toLocaleString()} {b.unit})
                  </option>
                ))}
              </select>
            </div>

            {selectedBatch && (
              <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>Medicine:</span>
                    <strong>{selectedBatch.product?.name}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>Manufacturer:</span>
                    <strong>{selectedBatch.manufacturer?.name || selectedBatch.product?.manufacturer?.name}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>Expiration:</span>
                    <strong style={{ color: new Date(selectedBatch.expiryDate) < new Date() ? '#dc2626' : '#059669' }}>
                      {new Date(selectedBatch.expiryDate).toLocaleDateString()}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Destination Pharmacy */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: '#1e293b' }}>
                DESTINATION LICENSED PHARMACY *
              </label>
              <select
                required
                value={selectedPharmacyId}
                onChange={(e) => setSelectedPharmacyId(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}
              >
                {pharmacies.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.address || 'Licensed Pharmacy Dispensary'})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: '#1e293b' }}>
                  DELIVERY QUANTITY *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedBatch?.quantity || 1000000}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: '#1e293b' }}>
                  DELIVERY DATE *
                </label>
                <input
                  type="date"
                  required
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: '#1e293b' }}>
                RECEIVING DISPENSARY LOCATION
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Hospital Pharmacy Storage Vault #3"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: '#1e293b' }}>
                DELIVERY NOTES & CHAIN OF CUSTODY VERIFICATION
              </label>
              <textarea
                rows="2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Temperature-controlled shipment received in good order. Seal verified."
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => navigate('/distributor/inventory')}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ minWidth: '180px' }}
              >
                {submitting ? 'Recording Delivery...' : '🚚 Complete Handover'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
