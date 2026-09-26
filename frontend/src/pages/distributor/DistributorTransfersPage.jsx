import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';

export default function DistributorTransfersPage() {
  const { batchId: paramBatchId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active Tab: 'incoming' | 'create' | 'history'
  const [activeTab, setActiveTab] = useState(paramBatchId ? 'create' : 'incoming');

  // Data states
  const [transfers, setTransfers] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    pendingIncomingCount: 0,
    receivedIncomingCount: 0,
    outgoingCount: 0,
  });
  const [activeInventoryBatches, setActiveInventoryBatches] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters for History
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Receive Modal State
  const [receivingItem, setReceivingItem] = useState(null);
  const [receiveLocation, setReceiveLocation] = useState('');
  const [receiveNotes, setReceiveNotes] = useState('');
  const [receivingSubmitting, setReceivingSubmitting] = useState(false);
  const [receiveError, setReceiveError] = useState('');
  const [receiveSuccess, setReceiveSuccess] = useState('');

  // Dispatch Form State
  const [dispatchForm, setDispatchForm] = useState({
    batchId: paramBatchId || '',
    toOrganizationId: '',
    quantity: '',
    transferDate: new Date().toISOString().split('T')[0],
    location: user?.organization?.address || 'Regional Distribution Center Hub',
    notes: '',
  });
  const [dispatchSubmitting, setDispatchSubmitting] = useState(false);
  const [dispatchError, setDispatchError] = useState('');
  const [dispatchSuccess, setDispatchSuccess] = useState('');

  // Copy helper
  const [copiedHash, setCopiedHash] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [transfersRes, inventoryRes, orgsRes] = await Promise.all([
        api.getDistributorTransfers({
          category: categoryFilter,
          search,
          status: statusFilter,
          page,
          limit: 20,
        }),
        api.getDistributorInventory({ limit: 100 }),
        api.getOrganizations({ type: 'PHARMACY', status: 'APPROVED' }),
      ]);

      if (transfersRes.success) {
        setTransfers(transfersRes.transfers || []);
        if (transfersRes.stats) setStats(transfersRes.stats);
        setTotal(transfersRes.total || 0);
        setTotalPages(transfersRes.totalPages || 1);
      }

      if (inventoryRes.success) {
        const validInventory = (inventoryRes.inventory || []).filter(
          (b) => !b.isExpired && b.status !== 'RECALLED' && b.quantity > 0
        );
        setActiveInventoryBatches(validInventory);

        // Pre-select initial batch for dispatch
        const defaultBatchId = paramBatchId || (validInventory[0] ? validInventory[0]._id : '');
        const initialBatch = validInventory.find((b) => b._id === defaultBatchId) || validInventory[0];
        setDispatchForm((prev) => ({
          ...prev,
          batchId: defaultBatchId,
          quantity: initialBatch ? initialBatch.quantity : '',
        }));
      }

      if (orgsRes.success) {
        setPharmacies(orgsRes.organizations || []);
        if (orgsRes.organizations && orgsRes.organizations.length > 0) {
          setDispatchForm((prev) => ({ ...prev, toOrganizationId: orgsRes.organizations[0]._id }));
        }
      }
    } catch (err) {
      console.error('Error fetching distributor transfer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter, statusFilter, page]);

  const handleBatchSelect = (id) => {
    const selected = activeInventoryBatches.find((b) => b._id === id);
    setDispatchForm((prev) => ({
      ...prev,
      batchId: id,
      quantity: selected ? selected.quantity : '',
    }));
  };

  // Open Receive Confirmation Modal
  const openReceiveModal = (item) => {
    setReceivingItem(item);
    setReceiveLocation(user?.organization?.address || 'Distributor Receiving Bay #1');
    setReceiveNotes('');
    setReceiveError('');
    setReceiveSuccess('');
  };

  // Execute Receive Confirmation
  const handleConfirmReceive = async () => {
    if (!receivingItem) return;
    setReceivingSubmitting(true);
    setReceiveError('');
    setReceiveSuccess('');

    try {
      const payload = {
        batchId: receivingItem.batch?._id || receivingItem.batch,
        location: receiveLocation.trim(),
        notes: receiveNotes.trim(),
      };

      const res = await api.receiveDistributorBatch(payload);
      if (res.success) {
        setReceiveSuccess(`✓ Batch #${receivingItem.batch?.batchNumber || ''} receipt confirmed and logged on blockchain!`);
        setTimeout(() => {
          setReceivingItem(null);
          loadData();
        }, 1200);
      } else {
        setReceiveError(res.message || 'Failed to record receipt.');
      }
    } catch (err) {
      setReceiveError(err.message || 'Network error while confirming receipt.');
    } finally {
      setReceivingSubmitting(false);
    }
  };

  // Execute Dispatch to Pharmacy
  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    setDispatchError('');
    setDispatchSuccess('');

    if (!dispatchForm.batchId) {
      setDispatchError('Please select a batch from active inventory.');
      return;
    }

    if (!dispatchForm.toOrganizationId) {
      setDispatchError('Please select an approved pharmacy recipient.');
      return;
    }

    const selectedBatch = activeInventoryBatches.find((b) => b._id === dispatchForm.batchId);
    if (!selectedBatch) {
      setDispatchError('Selected batch is invalid or expired.');
      return;
    }

    const qty = Number(dispatchForm.quantity);
    if (isNaN(qty) || qty <= 0 || qty > selectedBatch.quantity) {
      setDispatchError(`Transfer quantity must be between 1 and available stock (${selectedBatch.quantity}).`);
      return;
    }

    setDispatchSubmitting(true);

    try {
      const payload = {
        batchId: dispatchForm.batchId,
        toOrganizationId: dispatchForm.toOrganizationId,
        quantity: qty,
        location: dispatchForm.location.trim() || 'Logistics Transfer Bay',
        notes: dispatchForm.notes.trim() || `Wholesale distribution delivery to pharmacy on ${dispatchForm.transferDate}.`,
      };

      const res = await api.dispatchDistributorBatch(payload);
      if (res.success) {
        setDispatchSuccess(`✓ Transfer to pharmacy recorded and anchored on blockchain! Redirecting...`);
        setTimeout(() => {
          navigate(`/distributor/batches/${dispatchForm.batchId}`);
        }, 1200);
      } else {
        setDispatchError(res.message || 'Failed to execute transfer.');
      }
    } catch (err) {
      setDispatchError(err.message || 'Network error during custody transfer.');
    } finally {
      setDispatchSubmitting(false);
    }
  };

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const selectedDispatchBatch = activeInventoryBatches.find((b) => b._id === dispatchForm.batchId);

  // Incoming dispatches awaiting receipt
  const pendingIncomingTransfers = transfers.filter(
    (t) =>
      (t.toOrganization?._id || t.toOrganization)?.toString() === user?.organization?._id?.toString() &&
      (t.eventType === 'DISPATCHED' || t.eventType === 'SHIPPED' || t.eventType === 'TRANSFERRED')
  );

  return (
    <div style={{ maxWidth: '1280px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.8rem' }}>🚚</span>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>
              Distributor Custody Transfers & Receiving Hub
            </h1>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', marginTop: '6px' }}>
            Inspect incoming manufacturer dispatches, confirm batch receipts, and execute verified custody transfers to licensed pharmacies.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/distributor/inventory" className="btn btn-outline">
            📦 Warehouse Inventory
          </Link>
          <Link to="/distributor/batches" className="btn btn-outline">
            📋 Full Batch Ledger
          </Link>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="glass-card" style={{ padding: '16px 20px', background: '#ffffff', borderLeft: '4px solid #f59e0b' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Pending Incoming Shipments
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: stats.pendingIncomingCount > 0 ? '#b45309' : '#1e293b', marginTop: '4px' }}>
            {stats.pendingIncomingCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', background: '#ffffff', borderLeft: '4px solid #059669' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Confirmed Receipts
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
            {stats.receivedIncomingCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', background: '#ffffff', borderLeft: '4px solid #2563eb' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Pharmacy Dispatches
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#2563eb', marginTop: '4px' }}>
            {stats.outgoingCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', background: '#ffffff', borderLeft: '4px solid #6366f1' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Total Audit Checkpoints
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#6366f1', marginTop: '4px' }}>
            {stats.totalEvents}
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setActiveTab('incoming')}
          style={{
            padding: '12px 20px',
            fontSize: '0.9rem',
            fontWeight: '700',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'incoming' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'incoming' ? '#2563eb' : 'var(--text-dim)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>📥 Incoming Shipments</span>
          {stats.pendingIncomingCount > 0 && (
            <span
              style={{
                background: '#d97706',
                color: '#ffffff',
                fontSize: '0.72rem',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: '12px',
              }}
            >
              {stats.pendingIncomingCount} Pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('create')}
          style={{
            padding: '12px 20px',
            fontSize: '0.9rem',
            fontWeight: '700',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'create' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'create' ? '#2563eb' : 'var(--text-dim)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>🚚 Transfer to Pharmacy</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '12px 20px',
            fontSize: '0.9rem',
            fontWeight: '700',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'history' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'history' ? '#2563eb' : 'var(--text-dim)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>📜 Transfer History & Ledger</span>
        </button>
      </div>

      {/* TAB 1: INCOMING SHIPMENTS (AWAITING RECEIPT) */}
      {activeTab === 'incoming' && (
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>
              📥 Incoming Manufacturer Shipments
            </h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '4px' }}>
              Batches dispatched to your distribution hub awaiting physical receipt confirmation.
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 12px' }}></div>
              <p style={{ color: '#2563eb', fontWeight: '600', fontSize: '0.9rem' }}>Loading incoming dispatches...</p>
            </div>
          ) : pendingIncomingTransfers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>✅</span>
              <h3 style={{ fontSize: '1.15rem', color: '#1e293b', marginBottom: '6px' }}>
                No pending incoming dispatches
              </h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', maxWidth: '460px', margin: '0 auto' }}>
                All shipments dispatched to your distributor organization have been confirmed and processed into warehouse inventory.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
              {pendingIncomingTransfers.map((item) => (
                <div
                  key={item._id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderLeft: '4px solid #d97706',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <span style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', fontSize: '0.72rem', fontWeight: '800', padding: '3px 8px', borderRadius: '12px', display: 'inline-block', marginBottom: '6px' }}>
                        ⏳ AWAITING RECEIPT
                      </span>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e3a8a', margin: 0 }}>
                        Batch #{item.batch?.batchNumber}
                      </h3>
                    </div>
                    <StatusBadge status={item.eventType} />
                  </div>

                  <div style={{ fontSize: '0.85rem', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)', fontWeight: '600' }}>Medicine: </span>
                      <strong>{item.batch?.product?.name}</strong> <code style={{ color: '#2563eb' }}>({item.batch?.product?.productCode})</code>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-dim)', fontWeight: '600' }}>Quantity: </span>
                      <strong style={{ color: '#059669' }}>{item.quantity?.toLocaleString()} units</strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-dim)', fontWeight: '600' }}>Dispatched By: </span>
                      <strong>{item.fromOrganization?.name || 'Manufacturer'}</strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-dim)', fontWeight: '600' }}>Dispatch Hub / Date: </span>
                      <span>{item.location} • {new Date(item.eventDate).toLocaleDateString()}</span>
                    </div>

                    {item.notes && (
                      <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.8rem', background: '#f8fafc', padding: '8px 10px', borderRadius: '6px' }}>
                        "{item.notes}"
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => openReceiveModal(item)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, padding: '10px' }}
                    >
                      📥 Confirm Batch Receipt
                    </button>
                    <Link
                      to={`/distributor/batches/${item.batch?._id}`}
                      className="btn btn-outline btn-sm"
                      style={{ padding: '10px' }}
                    >
                      Inspect Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INITIATE TRANSFER TO PHARMACY */}
      {activeTab === 'create' && (
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <div className="glass-card" style={{ padding: '36px', background: '#ffffff' }}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>
                🚚 Initiate Custody Transfer to Pharmacy
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '4px' }}>
                Dispatch medicine lots from your active warehouse inventory to an approved retail or hospital pharmacy dispensary.
              </p>
            </div>

            {dispatchError && (
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
                ⚠️ {dispatchError}
              </div>
            )}

            {dispatchSuccess && (
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
                {dispatchSuccess}
              </div>
            )}

            {activeInventoryBatches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>📦</span>
                <h3>No active inventory available for transfer</h3>
                <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                  You must confirm receipt of incoming manufacturer shipments before transferring lots to pharmacies.
                </p>
                <button onClick={() => setActiveTab('incoming')} className="btn btn-primary btn-sm" style={{ marginTop: '16px' }}>
                  View Incoming Shipments
                </button>
              </div>
            ) : (
              <form onSubmit={handleDispatchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Batch Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                    SELECT WAREHOUSE BATCH LOT *
                  </label>
                  <select
                    required
                    value={dispatchForm.batchId}
                    onChange={(e) => handleBatchSelect(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', border: '1px solid #cbd5e1' }}
                  >
                    {activeInventoryBatches.map((b) => (
                      <option key={b._id} value={b._id}>
                        Batch #{b.batchNumber} — {b.product?.name} ({b.quantity?.toLocaleString()} {b.unit || 'Units'} available)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedDispatchBatch && (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 'var(--radius-sm)',
                      padding: '16px',
                      fontSize: '0.85rem',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', display: 'block', fontWeight: '700' }}>MEDICINE NAME</span>
                      <strong>{selectedDispatchBatch.product?.name}</strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', display: 'block', fontWeight: '700' }}>EXPIRY DATE</span>
                      <strong style={{ color: '#059669' }}>
                        {new Date(selectedDispatchBatch.expiryDate).toLocaleDateString()}
                      </strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', display: 'block', fontWeight: '700' }}>AVAILABLE VOLUME</span>
                      <strong style={{ color: '#1e3a8a' }}>
                        {selectedDispatchBatch.quantity?.toLocaleString()} {selectedDispatchBatch.unit || 'Units'}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Pharmacy Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                    SELECT APPROVED DESTINATION PHARMACY *
                  </label>
                  {pharmacies.length === 0 ? (
                    <div style={{ color: '#b91c1c', fontSize: '0.85rem', padding: '8px 0' }}>
                      No approved pharmacies registered on the regulatory ledger.
                    </div>
                  ) : (
                    <select
                      required
                      value={dispatchForm.toOrganizationId}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, toOrganizationId: e.target.value })}
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', border: '1px solid #cbd5e1' }}
                    >
                      {pharmacies.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} — {p.address || 'Licensed Dispensary'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Quantity and Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                      TRANSFER QUANTITY *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={selectedDispatchBatch?.quantity || 100000}
                      value={dispatchForm.quantity}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, quantity: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                      DISPATCH DATE *
                    </label>
                    <input
                      type="date"
                      required
                      value={dispatchForm.transferDate}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, transferDate: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>

                {/* Location & Notes */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                    DISPATCH FACILITY LOCATION
                  </label>
                  <input
                    type="text"
                    value={dispatchForm.location}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, location: e.target.value })}
                    placeholder="e.g. Regional Distribution Warehouse Hub #1, Bay 4"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                    DISPATCH NOTES / MANIFEST
                  </label>
                  <textarea
                    rows={3}
                    value={dispatchForm.notes}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, notes: e.target.value })}
                    placeholder="e.g. Dispatched to retail pharmacy for prescription inventory fulfillment."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={dispatchSubmitting || pharmacies.length === 0}
                  className="btn btn-primary"
                  style={{ padding: '14px', fontSize: '1rem', marginTop: '8px' }}
                >
                  {dispatchSubmitting ? 'Recording Custody Transfer on Blockchain...' : 'Execute Pharmacy Transfer & Seal Ledger'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TRANSFER HISTORY & LEDGER */}
      {activeTab === 'history' && (
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>
              📜 Custody Audit History & Ledger
            </h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '4px' }}>
              Immutable record of all dispatches, receipts, and custody handovers involving your distributor organization.
            </p>
          </div>

          {/* Filter Controls */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by batch number or event ID..."
              style={{ flex: 1, minWidth: '240px', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', border: '1px solid #cbd5e1' }}
            />

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', border: '1px solid #cbd5e1' }}
            >
              <option value="ALL">All Categories</option>
              <option value="INCOMING">Incoming Shipments</option>
              <option value="OUTGOING">Outgoing Dispatches</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', border: '1px solid #cbd5e1' }}
            >
              <option value="ALL">All Event Types</option>
              <option value="RECEIVED">RECEIVED</option>
              <option value="TRANSFERRED">TRANSFERRED</option>
              <option value="DISPATCHED">DISPATCHED</option>
            </select>

            <button onClick={() => { setPage(1); loadData(); }} className="btn btn-primary btn-sm">
              Search
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 12px' }}></div>
              <p style={{ color: '#2563eb', fontWeight: '600' }}>Loading audit history...</p>
            </div>
          ) : transfers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
              No transfer events found matching criteria.
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>EVENT TYPE</th>
                      <th>BATCH LOT #</th>
                      <th>ORIGIN → DESTINATION</th>
                      <th>QUANTITY</th>
                      <th>DATE & TIMESTAMP</th>
                      <th>BLOCKCHAIN TX HASH</th>
                      <th style={{ textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.map((t) => (
                      <tr key={t._id}>
                        <td>
                          <StatusBadge status={t.eventType} />
                        </td>
                        <td>
                          <Link
                            to={`/distributor/batches/${t.batch?._id || t.batch}`}
                            style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#2563eb', textDecoration: 'none' }}
                          >
                            {t.batch?.batchNumber || 'Batch'}
                          </Link>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          <strong>{t.fromOrganization?.name || 'Origin'}</strong>
                          <span style={{ color: 'var(--text-dim)', margin: '0 4px' }}>→</span>
                          <strong>{t.toOrganization?.name || 'Destination'}</strong>
                        </td>
                        <td>
                          <strong style={{ color: '#0f172a' }}>{t.quantity?.toLocaleString()}</strong> units
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {new Date(t.eventDate).toLocaleString()}
                        </td>
                        <td>
                          {t.transactionHash ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                              <span style={{ color: '#64748b' }}>{t.transactionHash.slice(0, 10)}...</span>
                              <button
                                onClick={() => handleCopy(t.transactionHash, t._id)}
                                style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: '600', fontSize: '0.72rem' }}
                              >
                                {copiedHash === t._id ? '✓' : 'Copy'}
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Off-chain record</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link
                            to={`/distributor/batches/${t.batch?._id || t.batch}`}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                  <div style={{ color: 'var(--text-dim)' }}>
                    Page {page} of {totalPages} ({total} events)
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="btn btn-outline btn-sm">
                      ← Previous
                    </button>
                    <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="btn btn-outline btn-sm">
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* CONFIRM RECEIPT MODAL */}
      {receivingItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '540px',
              width: '100%',
              background: '#ffffff',
              borderRadius: 'var(--radius-md)',
              padding: '28px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e3a8a', margin: 0 }}>
                📥 Confirm Batch Receipt
              </h3>
              <button
                onClick={() => setReceivingItem(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-dim)' }}
              >
                ✕
              </button>
            </div>

            {receiveError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '6px', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '16px' }}>
                ⚠️ {receiveError}
              </div>
            )}

            {receiveSuccess && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px 14px', borderRadius: '6px', color: '#047857', fontSize: '0.85rem', marginBottom: '16px', fontWeight: '600' }}>
                {receiveSuccess}
              </div>
            )}

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <span style={{ color: 'var(--text-dim)', fontWeight: '600' }}>Batch Lot #: </span>
                <strong style={{ color: '#2563eb', fontFamily: 'var(--font-mono)' }}>{receivingItem.batch?.batchNumber}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', fontWeight: '600' }}>Medicine Name: </span>
                <strong>{receivingItem.batch?.product?.name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', fontWeight: '600' }}>Quantity: </span>
                <strong style={{ color: '#059669' }}>{receivingItem.quantity?.toLocaleString()} units</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', fontWeight: '600' }}>Manufacturer / Sender: </span>
                <span>{receivingItem.fromOrganization?.name || 'Manufacturer'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  RECEIVING WAREHOUSE / BAY *
                </label>
                <input
                  type="text"
                  value={receiveLocation}
                  onChange={(e) => setReceiveLocation(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  RECEIVING INSPECTION NOTES
                </label>
                <textarea
                  rows={2}
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  placeholder="e.g. Shipment packaging intact, cold chain temperature verified."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                disabled={receivingSubmitting}
                onClick={() => setReceivingItem(null)}
                className="btn btn-outline btn-sm"
              >
                Cancel
              </button>
              <button
                disabled={receivingSubmitting}
                onClick={handleConfirmReceive}
                className="btn btn-primary btn-sm"
              >
                {receivingSubmitting ? 'Confirming & Anchoring Blockchain...' : 'Confirm & Log Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
