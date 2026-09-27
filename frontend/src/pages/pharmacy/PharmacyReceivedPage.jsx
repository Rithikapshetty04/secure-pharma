import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import {
  Package,
  Search,
  Filter,
  ShieldCheck,
  QrCode,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  X,
  RefreshCw,
  Loader2,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const PharmacyReceivedPage = () => {
  const [batches, setBatches] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('newest');
  const [qrModalBatch, setQrModalBatch] = useState(null);

  const fetchReceivedBatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPharmacyReceivedBatches({
        search: search.trim(),
        status: statusFilter,
        sort: sortOrder,
      });

      if (res && res.success) {
        setBatches(res.batches || []);
        setTotal(res.total || (res.batches ? res.batches.length : 0));
      } else {
        setError(res?.message || 'Failed to fetch received pharmaceutical batches.');
      }
    } catch (err) {
      console.error('Error fetching pharmacy received batches:', err);
      setError(err.message || 'Server connection error loading received inventory.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sortOrder]);

  useEffect(() => {
    fetchReceivedBatches();
  }, [fetchReceivedBatches]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReceivedBatches();
  };

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const readyToDispenseCount = batches.filter(
    (b) => b.status !== 'RECALLED' && new Date(b.expiryDate) > now
  ).length;
  const expiringSoonCount = batches.filter((b) => {
    const exp = new Date(b.expiryDate);
    return exp > now && exp <= thirtyDaysFromNow;
  }).length;
  const expiredCount = batches.filter((b) => new Date(b.expiryDate) <= now).length;

  const getStatusBadge = (status, expiryDate) => {
    const exp = new Date(expiryDate);
    if (exp <= now) {
      return (
        <span style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <AlertTriangle style={{ width: '13px', height: '13px' }} />
          Expired
        </span>
      );
    }

    switch (status) {
      case 'RECEIVED':
      case 'ACTIVE':
      case 'RELEASED':
      case 'AVAILABLE':
        return (
          <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 style={{ width: '13px', height: '13px' }} />
            Received / Stocked
          </span>
        );
      case 'IN_TRANSIT':
      case 'MANUFACTURED':
        return (
          <span style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Package style={{ width: '13px', height: '13px' }} />
            In Transit
          </span>
        );
      case 'QUARANTINED':
      case 'FLAGGED':
        return (
          <span style={{ background: '#fffbebfb', color: '#b45309', border: '1px solid #fde68a', fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle style={{ width: '13px', height: '13px' }} />
            Quarantined
          </span>
        );
      case 'RECALLED':
        return (
          <span style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle style={{ width: '13px', height: '13px' }} />
            Recalled
          </span>
        );
      default:
        return (
          <span style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '9999px' }}>
            {status || 'Stocked'}
          </span>
        );
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '32px 20px 80px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ background: '#ecfdf5', color: '#047857', fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
                Custody Management
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Authentic Dispensary Stock & Received Batches
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Received Batches & Inventory Stock
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
              View pharmaceutical batches received through verified supply chain transfers in pharmacy possession.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => fetchReceivedBatches()}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
              title="Refresh Received Inventory"
            >
              <RefreshCw style={{ width: '15px', height: '15px' }} />
              Sync Inventory
            </button>
            <Link
              to="/pharmacy/medicines"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.88rem', fontWeight: '700', background: '#059669', borderColor: '#059669' }}
            >
              <ShoppingBag style={{ width: '16px', height: '16px' }} />
              Procure More Stock
            </Link>
          </div>
        </div>

        {/* Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#ffffff', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>Total Received Batches</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>{total}</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>Ready to Dispense</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>{readyToDispenseCount}</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#fffbebfb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>Expiring Soon (&lt;30d)</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: expiringSoonCount > 0 ? '#d97706' : '#0f172a' }}>{expiringSoonCount}</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>Expired Batches</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: expiredCount > 0 ? '#ef4444' : '#0f172a' }}>{expiredCount}</div>
            </div>
          </div>
        </div>

        {/* Search, Filter & Sort Controls */}
        <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search style={{ width: '18px', height: '18px', color: '#94a3b8', position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search batch number, medicine name, manufacturer..."
                style={{ width: '100%', padding: '9px 14px 9px 38px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter style={{ width: '16px', height: '16px', color: '#64748b' }} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', background: '#ffffff' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="RECEIVED">Received</option>
                <option value="ACTIVE">Active</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="EXPIRED">Expired</option>
                <option value="RECALLED">Recalled</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', background: '#ffffff' }}
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="expiry-asc">Sort: Expiring Soonest</option>
              </select>
            </div>
          </form>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#b91c1c', fontSize: '0.88rem' }}>
            <AlertCircle style={{ width: '20px', height: '20px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Received Batches Table */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
              <Loader2 style={{ width: '36px', height: '36px', color: '#059669', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ fontSize: '0.92rem', fontWeight: '600' }}>Loading received batches from database...</p>
            </div>
          ) : batches.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Package style={{ width: '48px', height: '48px', color: '#cbd5e1', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>No Received Batches Found</h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 auto 20px', maxWidth: '420px', lineHeight: '1.5' }}>
                {search || statusFilter !== 'ALL'
                  ? 'No received batches match your search filters.'
                  : 'Your pharmacy has not received any pharmaceutical batch shipments yet.'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <Link
                  to="/pharmacy/medicines"
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.88rem', background: '#059669', borderColor: '#059669' }}
                >
                  <ShoppingBag style={{ width: '16px', height: '16px' }} />
                  Browse Medicine Catalog
                </Link>
                <Link
                  to="/pharmacy/orders"
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.88rem' }}
                >
                  View Purchase Orders
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '14px 18px' }}>Batch Number</th>
                    <th style={{ padding: '14px 18px' }}>Product & Formulary</th>
                    <th style={{ padding: '14px 18px' }}>Manufacturer</th>
                    <th style={{ padding: '14px 18px' }}>Current Stock</th>
                    <th style={{ padding: '14px 18px' }}>Expiry Date</th>
                    <th style={{ padding: '14px 18px' }}>Custody Status</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ divideY: '1px solid #f1f5f9' }}>
                  {batches.map((batch) => {
                    const prodName = batch.product?.name || batch.productName || 'Pharmaceutical Product';
                    const dosageForm = batch.product?.dosageForm || batch.dosageForm || 'Formulary Unit';
                    const strength = batch.product?.strength || batch.strength || '';
                    const mfgName = batch.manufacturer?.name || batch.manufacturerName || 'Authorized Manufacturer';
                    const expDate = batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'N/A';
                    const isExpiringSoon = new Date(batch.expiryDate) > now && new Date(batch.expiryDate) <= thirtyDaysFromNow;
                    const isExpired = new Date(batch.expiryDate) <= now;

                    return (
                      <tr key={batch._id || batch.batchNumber} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px 18px', fontFamily: 'monospace', fontWeight: '800', color: '#059669' }}>
                          #{batch.batchNumber}
                        </td>
                        <td style={{ padding: '16px 18px' }}>
                          <div>
                            <strong style={{ fontSize: '0.92rem', color: '#0f172a', display: 'block' }}>{prodName}</strong>
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              {dosageForm} {strength ? `• ${strength}` : ''}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 18px', color: '#334155' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building2 style={{ width: '14px', height: '14px', color: '#64748b' }} />
                            <span>{mfgName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 18px', fontWeight: '700', color: batch.quantity < 20 ? '#d97706' : '#0f172a' }}>
                          {batch.quantity} {batch.unit || 'units'}
                        </td>
                        <td style={{ padding: '16px 18px', fontSize: '0.82rem', color: isExpired ? '#b91c1c' : isExpiringSoon ? '#b45309' : '#475569', fontWeight: isExpired || isExpiringSoon ? '700' : '500' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar style={{ width: '13px', height: '13px', color: '#94a3b8' }} />
                            {expDate}
                          </div>
                        </td>
                        <td style={{ padding: '16px 18px' }}>
                          {getStatusBadge(batch.status, batch.expiryDate)}
                        </td>
                        <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              onClick={() => setQrModalBatch(batch)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '6px 10px' }}
                              title="View Batch QR Code"
                            >
                              <QrCode style={{ width: '14px', height: '14px' }} />
                            </button>
                            <Link
                              to={`/verify/${encodeURIComponent(batch.batchNumber)}`}
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#047857' }}
                            >
                              <ShieldCheck style={{ width: '13px', height: '13px' }} />
                              Verify
                            </Link>
                            <Link
                              to={`/pharmacy/batches/${batch._id || batch.batchNumber}`}
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: '700' }}
                            >
                              <Eye style={{ width: '13px', height: '13px' }} />
                              Details
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {qrModalBatch && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', maxWidth: '380px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', textAlign: 'center', position: 'relative' }}>
            <button
              onClick={() => setQrModalBatch(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
            >
              <X style={{ width: '20px', height: '20px' }} />
            </button>

            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <QrCode style={{ width: '26px', height: '26px' }} />
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              {qrModalBatch.product?.name || qrModalBatch.productName || 'Pharmaceutical Product'}
            </h3>
            <p style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#059669', margin: '0 0 16px 0', fontWeight: '700' }}>
              Batch #{qrModalBatch.batchNumber}
            </p>

            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'inline-block', marginBottom: '16px' }}>
              <QRCodeSVG
                value={`${window.location.origin}/verify/${qrModalBatch.batchNumber}`}
                size={180}
                level="H"
              />
            </div>

            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 16px 0', lineHeight: '1.4' }}>
              Scan this QR code to access 21 CFR Part 11 cryptographic verification and supply chain provenance.
            </p>

            <Link
              to={`/verify/${encodeURIComponent(qrModalBatch.batchNumber)}`}
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px', fontSize: '0.85rem', fontWeight: '700', background: '#059669', borderColor: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <ShieldCheck style={{ width: '16px', height: '16px' }} />
              Open Public QR Verification Page
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyReceivedPage;
