import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Timeline from '../components/Timeline';

export default function SupplyChainPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [batches, setBatches] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [inspectBatchId, setInspectBatchId] = useState('');
  const [inspectedBatchTimeline, setInspectedBatchTimeline] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  const [showLogEventModal, setShowLogEventModal] = useState(false);
  const [eventFormData, setEventFormData] = useState({
    batchId: '',
    eventType: 'DISPATCHED',
    toOrganizationId: '',
    location: '',
    quantity: '',
    notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, orgsRes, batchesRes] = await Promise.all([
        api.getEvents({ page, limit: 15, eventType: eventTypeFilter }),
        api.getOrganizations({ limit: 100 }),
        api.getBatches({ limit: 100 }),
      ]);

      if (eventsRes.success) {
        setEvents(eventsRes.events);
        setTotal(eventsRes.total);
      }
      if (orgsRes.success) {
        setOrganizations(orgsRes.organizations);
        if (orgsRes.organizations.length > 0 && !eventFormData.toOrganizationId) {
          setEventFormData((prev) => ({ ...prev, toOrganizationId: orgsRes.organizations[0]._id }));
        }
      }
      if (batchesRes.success) {
        setBatches(batchesRes.batches);
        if (batchesRes.batches.length > 0 && !eventFormData.batchId) {
          setEventFormData((prev) => ({ ...prev, batchId: batchesRes.batches[0]._id }));
        }
      }
    } catch (err) {
      console.error('Error loading supply chain data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, eventTypeFilter]);

  const handleInspectBatch = async (batchId) => {
    const idToInspect = batchId || inspectBatchId;
    if (!idToInspect) return;

    setInspectLoading(true);
    try {
      const res = await api.getBatchEvents(idToInspect);
      if (res.success) {
        setInspectedBatchTimeline(res);
      } else {
        alert(res.message || 'Batch not found.');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setInspectLoading(false);
    }
  };

  const handleLogEventSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.recordEvent(eventFormData);
      if (res.success) {
        alert(`✓ Supply chain event '${res.event.eventType}' recorded and cryptographically signed on ledger!`);
        setShowLogEventModal(false);
        setEventFormData({
          batchId: batches[0]?._id || '',
          eventType: 'DISPATCHED',
          toOrganizationId: organizations[0]?._id || '',
          location: '',
          quantity: '',
          notes: '',
        });
        loadData();
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
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>
            ⛓️ Supply Chain Custody & Provenance Engine
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '4px' }}>
            Auditable custody handovers with multi-node validation & cryptographic chain linking
          </p>
        </div>

        {user && (
          <button onClick={() => setShowLogEventModal(true)} className="btn btn-primary">
            🚚 Log Custody Transition
          </button>
        )}
      </div>

      {/* Batch Specific Inspector Search */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', border: '1px solid rgba(0, 242, 254, 0.3)' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent-cyan)', marginBottom: '8px' }}>
          🔍 INSPECT FULL CUSTODIAL PROVENANCE FOR A SPECIFIC BATCH
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleInspectBatch(inspectBatchId);
          }}
          style={{ display: 'flex', gap: '10px' }}
        >
          <input
            type="text"
            required
            value={inspectBatchId}
            onChange={(e) => setInspectBatchId(e.target.value)}
            placeholder="Enter batch number (e.g. BATCH-2026-TEST-001)..."
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: '0.85rem',
            }}
          />
          <button type="submit" disabled={inspectLoading} className="btn btn-primary btn-sm">
            {inspectLoading ? 'Loading...' : 'Inspect Provenance'}
          </button>
        </form>

        {inspectedBatchTimeline && (
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <strong style={{ fontSize: '1.1rem', color: '#fff' }}>
                  Batch #{inspectedBatchTimeline.batch?.batchNumber}
                </strong>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginLeft: '10px' }}>
                  ({inspectedBatchTimeline.batch?.product?.name})
                </span>
              </div>
              <StatusBadge status={inspectedBatchTimeline.batch?.status} />
            </div>

            <Timeline events={inspectedBatchTimeline.events} />
          </div>
        )}
      </div>

      {/* Global Event Stream */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Global Custodial Event Stream</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              {total} verified supply chain transitions on network
            </p>
          </div>

          {/* Event Filter */}
          <select
            value={eventTypeFilter}
            onChange={(e) => {
              setEventTypeFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '8px 12px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: '0.85rem',
            }}
          >
            <option value="">All Event Types</option>
            <option value="MANUFACTURED">MANUFACTURED</option>
            <option value="DISPATCHED">DISPATCHED</option>
            <option value="RECEIVED">RECEIVED</option>
            <option value="TRANSFERRED">TRANSFERRED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="SOLD">SOLD</option>
            <option value="RECALLED">RECALLED</option>
            <option value="FLAGGED">FLAGGED</option>
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--accent-cyan)' }}>
            Loading event stream...
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            No supply chain events found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>EVENT</th>
                  <th>BATCH #</th>
                  <th>FROM CUSTODIAN</th>
                  <th>TO DESTINATION</th>
                  <th>LOCATION</th>
                  <th>TIMESTAMP</th>
                  <th style={{ textAlign: 'right' }}>PROVENANCE</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt) => (
                  <tr key={evt._id}>
                    <td>
                      <StatusBadge status={evt.eventType} />
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#fff' }}>
                      {evt.batch?.batchNumber || 'Batch'}
                    </td>
                    <td>{evt.fromOrganization?.name || 'Origin Facility'}</td>
                    <td>{evt.toOrganization?.name || 'Destination Node'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{evt.location}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {new Date(evt.eventDate).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleInspectBatch(evt.batch?._id || evt.batch?.batchNumber)}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      >
                        Inspect Timeline →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Custody Event Modal */}
      {showLogEventModal && (
        <div className="modal-overlay" onClick={() => setShowLogEventModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>🚚 Record Custodial Handover Event</h3>
              <button onClick={() => setShowLogEventModal(false)} className="btn btn-outline btn-sm">✕</button>
            </div>

            <form onSubmit={handleLogEventSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  TARGET BATCH *
                </label>
                <select
                  required
                  value={eventFormData.batchId}
                  onChange={(e) => setEventFormData({ ...eventFormData, batchId: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                >
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>
                      Batch #{b.batchNumber} - {b.product?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                    EVENT TYPE *
                  </label>
                  <select
                    required
                    value={eventFormData.eventType}
                    onChange={(e) => setEventFormData({ ...eventFormData, eventType: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                  >
                    <option value="DISPATCHED">DISPATCHED / SHIPPED</option>
                    <option value="RECEIVED">RECEIVED</option>
                    <option value="TRANSFERRED">TRANSFERRED (Wholesale Handover)</option>
                    <option value="DELIVERED">DELIVERED (Pharmacy Vault)</option>
                    <option value="SOLD">SOLD / DISPENSED</option>
                    <option value="RETURNED">RETURNED</option>
                    <option value="RECALLED">RECALLED</option>
                    <option value="FLAGGED">FLAGGED (Suspicious Anomaly)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                    DESTINATION ORGANIZATION
                  </label>
                  <select
                    value={eventFormData.toOrganizationId}
                    onChange={(e) => setEventFormData({ ...eventFormData, toOrganizationId: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                  >
                    {organizations.map((org) => (
                      <option key={org._id} value={org._id}>
                        {org.name} ({org.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  PHYSICAL FACILITY / TRANSIT LOCATION
                </label>
                <input
                  type="text"
                  value={eventFormData.location}
                  onChange={(e) => setEventFormData({ ...eventFormData, location: e.target.value })}
                  placeholder="e.g. Central Distribution Hub Bay 4, Chicago IL"
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  INSPECTION NOTES / COLD-CHAIN TELEMETRY
                </label>
                <textarea
                  rows="3"
                  value={eventFormData.notes}
                  onChange={(e) => setEventFormData({ ...eventFormData, notes: e.target.value })}
                  placeholder="e.g. Temperature sensor recorded 20.4°C throughout transit. Seal intact."
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px', padding: '12px' }}>
                ⛓️ Cryptographically Anchor Transition Event
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
