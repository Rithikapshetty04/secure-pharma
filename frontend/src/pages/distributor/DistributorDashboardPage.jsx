import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import {
  Truck,
  Package,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Building,
  Calendar,
  Eye,
  Search,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
  Layers,
  FileText,
} from 'lucide-react';

export default function DistributorDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalReceivedBatches: 0,
    activeInventoryCount: 0,
    pendingTransfersCount: 0,
    completedTransfersCount: 0,
  });

  const [recentInventory, setRecentInventory] = useState([]);
  const [pendingActions, setPendingActions] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDistributorDashboard();
      if (res && res.success) {
        setStats(res.stats || {});
        setRecentInventory(res.recentInventory || []);
        setPendingActions(res.pendingActions || []);
        setRecentActivity(res.recentActivity || []);
      } else {
        setError(res?.message || 'Failed to load distributor dashboard data.');
      }
    } catch (err) {
      console.error('Error fetching distributor dashboard:', err);
      setError(err.message || 'Server connection error loading dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const [confirmingId, setConfirmingId] = useState(null);

  const handleConfirmReceipt = async (batchId, batchNumber) => {
    const targetBatchId = batchId || batchNumber;
    if (!targetBatchId) return;

    setConfirmingId(targetBatchId);
    setError(null);
    try {
      const res = await api.receiveDistributorBatch({
        batchId: targetBatchId,
        location: user?.organization?.address || 'Distributor Receiving Warehouse',
        notes: `Receipt confirmed by wholesale distributor ${user?.organization?.name || ''}.`,
      });

      if (res && res.success) {
        await loadDashboardData();
      } else {
        setError(res?.message || 'Failed to confirm batch receipt.');
      }
    } catch (err) {
      console.error('Error confirming batch receipt:', err);
      setError(err.message || 'Server error confirming batch receipt.');
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '32px 20px 80px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Dashboard Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  background: '#eff6ff',
                  color: '#2563eb',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                }}
              >
                Wholesale Logistics Hub
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Org: <strong style={{ color: '#0f172a' }}>{user?.organization?.name || user?.name || 'Distributor'}</strong>
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', margin: 0, tracking: '-0.02em' }}>
              Distributor Dashboard
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
              Monitor pharmaceutical inventory, incoming dispatches, pharmacy transfers, and supply-chain activity.
            </p>
          </div>

          {/* Quick Actions Navigation Bar */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              to="/distributor/batches"
              className="btn btn-primary btn-sm"
              style={{ padding: '9px 16px', fontSize: '0.85rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Package style={{ width: '15px', height: '15px' }} />
              <span>Received Batches</span>
            </Link>

            <Link
              to="/distributor/inventory"
              className="btn btn-secondary btn-sm"
              style={{ padding: '9px 14px', fontSize: '0.85rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Layers style={{ width: '15px', height: '15px' }} />
              <span>Full Inventory</span>
            </Link>

            <Link
              to="/distributor/transfers"
              className="btn btn-secondary btn-sm"
              style={{ padding: '9px 14px', fontSize: '0.85rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Truck style={{ width: '15px', height: '15px' }} />
              <span>Pharmacy Transfers</span>
            </Link>

            <Link
              to="/verify"
              className="btn btn-secondary btn-sm"
              style={{ padding: '9px 14px', fontSize: '0.85rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ExternalLink style={{ width: '15px', height: '15px' }} />
              <span>Verify QR</span>
            </Link>
          </div>
        </div>

        {/* Global Error Alert */}
        {error && (
          <div
            style={{
              padding: '16px 20px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              color: '#991b1b',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle style={{ width: '20px', height: '20px', color: '#dc2626' }} />
              <span style={{ fontSize: '0.88rem', fontWeight: '600' }}>{error}</span>
            </div>
            <button onClick={loadDashboardData} className="btn btn-secondary btn-sm" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
              Retry Connection
            </button>
          </div>
        )}

        {/* Real Overview Statistics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Active Inventory
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#059669' }}>
              {loading ? '...' : stats.activeInventoryCount || 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Active lots in warehouse storage</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Received Batches
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#2563eb' }}>
              {loading ? '...' : stats.totalReceivedBatches || 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Batches from certified manufacturers</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Pending Transfers
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#d97706' }}>
              {loading ? '...' : stats.pendingTransfersCount || 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Batches in transit to/from facility</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Completed Dispatches
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#7c3aed' }}>
              {loading ? '...' : stats.completedTransfersCount || 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Transfers delivered to partners</div>
          </div>
        </div>

        {/* Pending Receipts / Actions Section */}
        {pendingActions.length > 0 && (
          <div
            style={{
              background: '#fffbeb',
              borderRadius: '16px',
              border: '1px solid #fde68a',
              padding: '24px',
              marginBottom: '28px',
              boxShadow: '0 4px 16px rgba(217, 119, 6, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#92400e', margin: 0 }}>
                  Pending Inbound Receipts ({pendingActions.length})
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#b45309', margin: '2px 0 0' }}>
                  Pharmaceutical dispatches en route to your distribution warehouse requiring receipt confirmation.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingActions.map((evt) => (
                <div
                  key={evt._id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #fcd34d',
                    borderRadius: '10px',
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#2563eb', fontSize: '0.9rem' }}>
                        Batch #{evt.batch?.batchNumber}
                      </span>
                      <StatusBadge status={evt.eventType} />
                    </div>
                    <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{evt.batch?.product?.name || 'Medicine'}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                      Dispatched by: <strong style={{ color: '#334155' }}>{evt.fromOrganization?.name || 'Manufacturer'}</strong> • Volume: {Number(evt.quantity || evt.batch?.quantity || 0).toLocaleString()} Units
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      disabled={confirmingId === (evt.batch?._id || evt.batch)}
                      onClick={() => handleConfirmReceipt(evt.batch?._id || evt.batch, evt.batch?.batchNumber)}
                      className="btn btn-primary btn-sm"
                      style={{
                        padding: '8px 16px',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        background: '#059669',
                        borderColor: '#059669',
                        opacity: confirmingId === (evt.batch?._id || evt.batch) ? 0.7 : 1,
                        cursor: confirmingId === (evt.batch?._id || evt.batch) ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {confirmingId === (evt.batch?._id || evt.batch) ? (
                        <>
                          <RefreshCw style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                          <span>Confirming...</span>
                        </>
                      ) : (
                        <span>✓ Confirm Receipt</span>
                      )}
                    </button>

                    <Link
                      to={`/distributor/batches/${evt.batch?._id}`}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '8px 12px', fontSize: '0.82rem', fontWeight: '600' }}
                    >
                      Inspect
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2-Column Grid: Active Wholesale Inventory & Recent Supply Chain Activity */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Active Wholesale Inventory Overview */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers style={{ width: '20px', height: '20px', color: '#059669' }} />
                  Active Wholesale Inventory
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px', margin: 0 }}>
                  Pharmaceutical lots available in warehouse storage
                </p>
              </div>

              <Link
                to="/distributor/inventory"
                style={{ fontSize: '0.82rem', fontWeight: '700', color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <span>Full Inventory</span>
                <ArrowRight style={{ width: '14px', height: '14px' }} />
              </Link>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <RefreshCw style={{ width: '28px', height: '28px', color: '#059669', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                <div style={{ fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>Loading active inventory...</div>
              </div>
            ) : recentInventory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Layers style={{ width: '24px', height: '24px' }} />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                  No Active Inventory Assigned
                </h4>
                <p style={{ fontSize: '0.82rem', margin: 0 }}>
                  No pharmaceutical batches are currently held in your warehouse inventory.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentInventory.map((b) => {
                  const isExpired = new Date(b.expiryDate) < new Date();
                  return (
                    <div
                      key={b._id}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.92rem', color: '#0f172a' }}>
                          {b.product?.name || 'Formulated Drug'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                          Lot <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#2563eb' }}>#{b.batchNumber}</span> • Qty: {Number(b.quantity).toLocaleString()} {b.unit || 'Units'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
                          Exp: <span style={{ fontWeight: '600', color: isExpired ? '#dc2626' : '#059669' }}>{new Date(b.expiryDate).toLocaleDateString()}</span> • Mfg: {b.manufacturer?.name || 'Verified Mfg'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <StatusBadge status={b.status} />
                        <Link
                          to={`/distributor/transfers/${b._id}`}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '5px 10px', fontSize: '0.78rem', fontWeight: '600', borderColor: '#cbd5e1', color: '#334155' }}
                        >
                          Transfer →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Supply-Chain Activity Feed */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock style={{ width: '20px', height: '20px', color: '#2563eb' }} />
                  Recent Supply-Chain Activity
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px', margin: 0 }}>
                  Auditable log of custody transfers & blockchain events
                </p>
              </div>

              <Link
                to="/distributor/transfers"
                style={{ fontSize: '0.82rem', fontWeight: '700', color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <span>View All Log</span>
                <ArrowRight style={{ width: '14px', height: '14px' }} />
              </Link>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <RefreshCw style={{ width: '28px', height: '28px', color: '#2563eb', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                <div style={{ fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>Loading recent activity...</div>
              </div>
            ) : recentActivity.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Clock style={{ width: '24px', height: '24px' }} />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                  No Supply-Chain Activity
                </h4>
                <p style={{ fontSize: '0.82rem', margin: 0 }}>
                  No recent custody events logged for your distributor organization.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentActivity.map((evt) => (
                  <div
                    key={evt._id}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <StatusBadge status={evt.eventType} />
                        <span style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '0.85rem', color: '#2563eb' }}>
                          #{evt.batch?.batchNumber || 'Batch'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(evt.eventDate).toLocaleDateString(undefined, { dateStyle: 'short' })}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>
                      {evt.batch?.product?.name || 'Pharmaceutical Batch'}
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                      {evt.fromOrganization?.name} → <strong style={{ color: '#1e40af' }}>{evt.toOrganization?.name}</strong>
                    </div>

                    {evt.transactionHash && (
                      <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldCheck style={{ width: '13px', height: '13px' }} />
                        <span style={{ fontFamily: 'monospace' }}>
                          Hash: {evt.transactionHash.slice(0, 10)}...{evt.transactionHash.slice(-6)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
