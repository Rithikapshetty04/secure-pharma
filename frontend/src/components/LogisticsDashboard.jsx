import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function LogisticsDashboard({ user, onSelectBatchForTracking }) {
  const [batches, setBatches] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Record Event Modal
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventData, setEventData] = useState({
    batchNumber: '',
    eventType: 'SHIPPED',
    toOrganizationId: '',
    location: user.organization?.address || 'Distribution Center #1',
  });

  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [batchRes, orgRes] = await Promise.all([
        api.getBatches(),
        api.getOrganizations(),
      ]);

      if (batchRes.success) setBatches(batchRes.batches);
      if (orgRes.success) setOrganizations(orgRes.organizations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecordEvent = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    setModalSuccess('');

    try {
      const res = await api.recordEvent(eventData);
      if (res.success) {
        setModalSuccess(`Event '${eventData.eventType}' recorded with hash: ${res.event?.transactionHash?.slice(0, 14)}...`);
        setTimeout(() => {
          setShowEventModal(false);
          setModalSuccess('');
          fetchData();
        }, 1500);
      } else {
        setModalError(res.message || 'Failed to record event');
      }
    } catch (err) {
      setModalError('Network error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleQuickDispense = async (batchNumber) => {
    if (!window.confirm(`Confirm dispensing batch ${batchNumber} to patient?`)) return;

    try {
      const res = await api.recordEvent({
        batchNumber,
        eventType: 'DELIVERED',
        location: user.organization?.address || 'Pharmacy Counter Dispensing',
      });
      if (res.success) {
        fetchData();
      }
    } catch (err) {
      alert('Failed to record delivery');
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '30px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Supply Chain Logistics & Dispensing</h1>
            <span className="badge badge-purple">{user.role} NODE</span>
          </div>
          <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>
            {user.organization?.name || 'Supply Chain Partner'} — Track custodial transitions, log shipment handovers, and dispense authentic medicines.
          </p>
        </div>

        <button
          onClick={() => {
            setShowEventModal(true);
            setEventData({
              batchNumber: batches.length > 0 ? batches[0].batchNumber : '',
              eventType: user.role === 'PHARMACY' ? 'DELIVERED' : 'SHIPPED',
              toOrganizationId: '',
              location: user.organization?.address || 'Logistics Hub',
            });
          }}
          className="btn btn-primary"
        >
          📦 Record Custody Handover
        </button>
      </div>

      {/* Batches Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ fontSize: '1.2rem' }}>Active Pharmaceutical Batches in Network</h3>
          <span className="badge badge-info">{batches.length} Batches Tracked</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading batch logistics...</div>
        ) : batches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            No batches found in network.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '10px 12px' }}>BATCH #</th>
                  <th style={{ padding: '10px 12px' }}>MEDICINE</th>
                  <th style={{ padding: '10px 12px' }}>MANUFACTURER</th>
                  <th style={{ padding: '10px 12px' }}>QUANTITY</th>
                  <th style={{ padding: '10px 12px' }}>CURRENT STATUS</th>
                  <th style={{ padding: '10px 12px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: '600' }}>
                      {b.batchNumber}
                    </td>
                    <td style={{ padding: '14px', color: '#fff', fontWeight: '600' }}>
                      {b.product?.name || 'N/A'}
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{b.product?.productCode}</div>
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-muted)' }}>
                      {b.product?.manufacturer?.name || 'Authorized Manufacturer'}
                    </td>
                    <td style={{ padding: '14px' }}>
                      {b.quantity?.toLocaleString()}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span className={`badge ${
                        b.status === 'DELIVERED' ? 'badge-success' :
                        b.status === 'IN_TRANSIT' ? 'badge-warning' : 'badge-purple'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px', display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => onSelectBatchForTracking(b.batchNumber)}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem' }}
                      >
                        🔍 Trace
                      </button>

                      {user.role === 'PHARMACY' && b.status !== 'DELIVERED' && (
                        <button
                          onClick={() => handleQuickDispense(b.batchNumber)}
                          className="btn btn-success btn-sm"
                          style={{ fontSize: '0.75rem' }}
                        >
                          🏥 Dispense to Patient
                        </button>
                      )}

                      {(user.role === 'DISTRIBUTOR' || user.role === 'MANUFACTURER' || user.role === 'ADMIN') && (
                        <button
                          onClick={() => {
                            setEventData({
                              batchNumber: b.batchNumber,
                              eventType: 'SHIPPED',
                              toOrganizationId: '',
                              location: user.organization?.address || 'Logistics Hub',
                            });
                            setShowEventModal(true);
                          }}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem' }}
                        >
                          🚚 Transfer Custody
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Handover Event Modal */}
      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>Record Custody Handover Event</h2>
            <p style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
              Log a verifiable custody transition on the Secure Pharma distributed supply chain ledger.
            </p>

            {modalError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#fb7185', padding: '10px', borderRadius: '6px', marginBottom: '14px', fontSize: '0.85rem' }}>
                {modalError}
              </div>
            )}

            {modalSuccess && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', padding: '10px', borderRadius: '6px', marginBottom: '14px', fontSize: '0.85rem' }}>
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleRecordEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Target Batch Number *
                </label>
                <select
                  required
                  value={eventData.batchNumber}
                  onChange={(e) => setEventData({ ...eventData, batchNumber: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                >
                  <option value="">-- Select Active Batch --</option>
                  {batches.map((b) => (
                    <option key={b._id} value={b.batchNumber}>
                      {b.batchNumber} ({b.product?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Supply Chain Event Type *
                </label>
                <select
                  required
                  value={eventData.eventType}
                  onChange={(e) => setEventData({ ...eventData, eventType: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                >
                  <option value="SHIPPED">SHIPPED (Departing Custody / In Transit)</option>
                  <option value="RECEIVED">RECEIVED (Accepted at Logistics Hub)</option>
                  <option value="TRANSFERRED">TRANSFERRED (Forwarded to Downstream Node)</option>
                  <option value="DELIVERED">DELIVERED (Dispensed / Delivered to Pharmacy/Patient)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Destination Organization
                </label>
                <select
                  value={eventData.toOrganizationId}
                  onChange={(e) => setEventData({ ...eventData, toOrganizationId: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                >
                  <option value="">-- Same Facility / Internal Custody --</option>
                  {organizations.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name} ({org.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Physical Location / Checkpoint Name *
                </label>
                <input
                  type="text"
                  required
                  value={eventData.location}
                  onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                  placeholder="e.g. Regional Distribution Warehouse Hub #3, Chicago IL"
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowEventModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={modalLoading} className="btn btn-primary">
                  {modalLoading ? 'Recording On-Chain...' : '✍️ Anchor Custody Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
