import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api';

export default function ManufacturerTransferPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();

  const [batches, setBatches] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(batchId || '');
  const [selectedDistributorId, setSelectedDistributorId] = useState('');
  const [quantity, setQuantity] = useState(1000);
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('Boston Regional Distribution Center, Dock 4');
  const [notes, setNotes] = useState('Authorized wholesale distribution handover with cryptographic custody seal.');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTransferFormData = async () => {
      setLoading(true);
      try {
        const [batchesRes, orgsRes] = await Promise.all([
          api.getBatches({ limit: 100 }),
          api.getOrganizations({ type: 'DISTRIBUTOR', limit: 50 }),
        ]);

        if (batchesRes.success) {
          setBatches(batchesRes.batches);
          if (!selectedBatchId && batchesRes.batches.length > 0) {
            setSelectedBatchId(batchesRes.batches[0]._id);
            setQuantity(batchesRes.batches[0].quantity || 1000);
          } else if (selectedBatchId) {
            const current = batchesRes.batches.find((b) => b._id === selectedBatchId);
            if (current) setQuantity(current.quantity || 1000);
          }
        }

        if (orgsRes.success) {
          // Only show approved distributors
          const approvedDistributors = orgsRes.organizations.filter(
            (org) => org.type === 'DISTRIBUTOR' && (org.status === 'APPROVED' || org.status === 'ACTIVE' || !org.status)
          );
          setDistributors(approvedDistributors.length > 0 ? approvedDistributors : orgsRes.organizations);
          if (approvedDistributors.length > 0) {
            setSelectedDistributorId(approvedDistributors[0]._id);
          } else if (orgsRes.organizations.length > 0) {
            setSelectedDistributorId(orgsRes.organizations[0]._id);
          }
        }
      } catch (err) {
        console.error('Error loading transfer form data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTransferFormData();
  }, [batchId]);

  const handleBatchSelect = (id) => {
    setSelectedBatchId(id);
    const b = batches.find((item) => item._id === id);
    if (b) {
      setQuantity(b.quantity || 1000);
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

    if (!selectedDistributorId) {
      setError('Please select an authorized distributor.');
      return;
    }

    if (selectedBatch) {
      if (new Date(selectedBatch.expiryDate) < new Date()) {
        setError('Expired batches cannot be transferred into the supply chain.');
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
        eventType: 'DISPATCHED',
        toOrganizationId: selectedDistributorId,
        location,
        quantity: Number(quantity),
        notes,
      });

      if (res.success) {
        navigate(`/manufacturer/batches/${selectedBatchId}`);
      } else {
        setError(res.message || 'Failed to record transfer event.');
      }
    } catch (err) {
      setError(err.message || 'Error executing custody transfer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '30px auto 80px', padding: '0 20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link
          to="/manufacturer/batches"
          style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}
        >
          ← Back to Batches
        </Link>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '8px', color: '#1e293b' }}>
          🚚 Transfer Custody to Approved Distributor
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Dispatch serialized pharmaceutical inventory to wholesale distribution partners
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
            Loading eligible distributors and batch inventory...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Batch Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: '#1e293b' }}>
                SELECT PRODUCTION BATCH TO TRANSFER *
              </label>
              <select
                required
                value={selectedBatchId}
                onChange={(e) => handleBatchSelect(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}
              >
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    Batch #{b.batchNumber} — {b.product?.name} (Available: {b.quantity?.toLocaleString()} {b.unit})
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
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>Available Qty:</span>
                    <strong>{selectedBatch.quantity?.toLocaleString()} {selectedBatch.unit}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>Expiry Date:</span>
                    <strong style={{ color: new Date(selectedBatch.expiryDate) < new Date() ? '#dc2626' : '#059669' }}>
                      {new Date(selectedBatch.expiryDate).toLocaleDateString()}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Destination Distributor */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: '#1e293b' }}>
                DESTINATION WHOLESALE DISTRIBUTOR *
              </label>
              <select
                required
                value={selectedDistributorId}
                onChange={(e) => setSelectedDistributorId(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}
              >
                {distributors.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.address || 'Approved Distribution Hub'})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: '#1e293b' }}>
                  TRANSFER QUANTITY *
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
                  DISPATCH / HANDOVER DATE *
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
                TRANSIT LOGISTICS LOCATION
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Northeast Regional Hub, Bay 4"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: '#1e293b' }}>
                TRANSFER NOTES & COLD-CHAIN TELEMETRY
              </label>
              <textarea
                rows="2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Sealed pallets dispatched under temperature-controlled shipping."
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => navigate('/manufacturer/batches')}
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
                {submitting ? 'Recording Handover...' : '🚚 Dispatch Transfer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
