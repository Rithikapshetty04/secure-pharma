import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';

export default function ManufacturerTransfersPage() {
  const { batchId: paramBatchId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [batches, setBatches] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    batchId: paramBatchId || '',
    toOrganizationId: '',
    quantity: '',
    transferDate: new Date().toISOString().split('T')[0],
    location: user?.organization?.address || 'Primary Logistics Dispatch Bay',
    notes: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [batchesRes, orgsRes] = await Promise.all([
          api.getBatches({ limit: 100 }),
          api.getOrganizations({ type: 'DISTRIBUTOR', status: 'APPROVED' }),
        ]);

        if (batchesRes.success) {
          // Filter transferable batches (not expired, not recalled)
          const validBatches = batchesRes.batches.filter(
            (b) => b.status !== 'RECALLED' && new Date(b.expiryDate) > new Date()
          );
          setBatches(validBatches);

          const defaultBatchId = paramBatchId || (validBatches[0] ? validBatches[0]._id : '');
          const initialBatch = validBatches.find((b) => b._id === defaultBatchId) || validBatches[0];

          setFormData((prev) => ({
            ...prev,
            batchId: defaultBatchId,
            quantity: initialBatch ? initialBatch.quantity : '',
          }));
        }

        if (orgsRes.success) {
          setDistributors(orgsRes.organizations);
          if (orgsRes.organizations.length > 0) {
            setFormData((prev) => ({ ...prev, toOrganizationId: orgsRes.organizations[0]._id }));
          }
        }
      } catch (err) {
        console.error('Error fetching transfer prerequisites:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [paramBatchId]);

  const handleBatchSelect = (id) => {
    const selected = batches.find((b) => b._id === id);
    setFormData((prev) => ({
      ...prev,
      batchId: id,
      quantity: selected ? selected.quantity : '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.batchId) {
      setError('Please select a batch to transfer.');
      return;
    }

    if (!formData.toOrganizationId) {
      setError('Please select an approved distributor.');
      return;
    }

    const selectedBatch = batches.find((b) => b._id === formData.batchId);
    if (!selectedBatch) {
      setError('Selected batch is invalid or cannot be transferred.');
      return;
    }

    if (new Date(selectedBatch.expiryDate) <= new Date()) {
      setError('Expired batches cannot be transferred into the supply chain.');
      return;
    }

    const qty = Number(formData.quantity);
    if (qty <= 0 || qty > selectedBatch.quantity) {
      setError(`Quantity must be between 1 and available quantity (${selectedBatch.quantity}).`);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        batchId: formData.batchId,
        eventType: 'DISPATCHED',
        toOrganizationId: formData.toOrganizationId,
        quantity: qty,
        location: formData.location.trim() || 'Logistics Handover Center',
        notes: formData.notes.trim() || `Custody transfer to wholesale distributor on ${formData.transferDate}.`,
      };

      const res = await api.recordEvent(payload);

      if (res.success) {
        setSuccessMsg(`✓ Transfer recorded successfully! Redirecting to batch details...`);
        setTimeout(() => {
          navigate(`/manufacturer/batches/${formData.batchId}`);
        }, 1200);
      } else {
        setError(res.message || 'Failed to record transfer.');
      }
    } catch (err) {
      setError(err.message || 'Network error during custody transfer.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBatchInfo = batches.find((b) => b._id === formData.batchId);

  return (
    <div style={{ maxWidth: '820px', margin: '30px auto 80px', padding: '0 20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link
          to="/manufacturer/batches"
          style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}
        >
          ← Back to Batches
        </Link>
      </div>

      <div className="glass-card" style={{ padding: '36px', background: '#ffffff' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>
            🚚 Transfer Batch to Approved Distributor
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '4px' }}>
            Hand over physical custody of manufactured pharmaceuticals to certified wholesale distributors.
          </p>
        </div>

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              color: '#b91c1c',
              fontSize: '0.85rem',
              marginBottom: '20px',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              color: '#047857',
              fontSize: '0.85rem',
              marginBottom: '20px',
              fontWeight: '600',
            }}
          >
            {successMsg}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#2563eb' }}>
            Loading transfer prerequisites...
          </div>
        ) : batches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
            No transferable batches available.
            <div style={{ marginTop: '12px' }}>
              <Link to="/manufacturer/batches/create" className="btn btn-primary btn-sm">
                ➕ Create a Batch First
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Batch Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                SELECT BATCH TO TRANSFER *
              </label>
              <select
                required
                value={formData.batchId}
                onChange={(e) => handleBatchSelect(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}
              >
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    Batch #{b.batchNumber} — {b.product?.name} ({b.quantity?.toLocaleString()} {b.unit} available)
                  </option>
                ))}
              </select>
            </div>

            {selectedBatchInfo && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px 16px',
                  fontSize: '0.85rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '10px',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>MEDICINE:</span>
                  <strong>{selectedBatchInfo.product?.name}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>EXPIRATION:</span>
                  <strong style={{ color: '#059669' }}>
                    {new Date(selectedBatchInfo.expiryDate).toLocaleDateString()}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>STATUS:</span>
                  <StatusBadge status={selectedBatchInfo.status} />
                </div>
              </div>
            )}

            {/* Distributor Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                SELECT APPROVED DISTRIBUTOR *
              </label>
              {distributors.length === 0 ? (
                <div style={{ color: '#b91c1c', fontSize: '0.85rem', padding: '8px 0' }}>
                  No approved distributors found on the regulatory ledger.
                </div>
              ) : (
                <select
                  required
                  value={formData.toOrganizationId}
                  onChange={(e) => setFormData({ ...formData, toOrganizationId: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}
                >
                  {distributors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} — {d.address || 'Certified Facility'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Quantity and Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  TRANSFER QUANTITY *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedBatchInfo?.quantity || 100000}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  TRANSFER DATE *
                </label>
                <input
                  type="date"
                  required
                  value={formData.transferDate}
                  onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Location & Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                DISPATCH BAY / FACILITY LOCATION
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Loading Dock #2, Boston Plant"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                TRANSFER NOTES / BILL OF LADING DETAILS
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g. Dispatched in tamper-evident secure cold storage container."
                style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || distributors.length === 0}
              className="btn btn-primary"
              style={{ padding: '14px', fontSize: '1rem', marginTop: '8px' }}
            >
              {submitting ? 'Recording Custody Transfer...' : 'Complete Transfer to Distributor'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
