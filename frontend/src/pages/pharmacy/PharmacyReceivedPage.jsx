<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

export default function PharmacyReceivedPage() {
  const [receivedBatches, setReceivedBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadReceivedMedicines = async () => {
    setLoading(true);
    try {
      const res = await api.getBatches({ limit: 100, search });
      if (res.success) {
        // Filter for batches with delivered/received/active status in pharmacy
        setReceivedBatches(res.batches.filter((b) => b.status !== 'RECALLED'));
      }
    } catch (err) {
      console.error('Error loading received medicines:', err);
=======
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { batchApi } from '../../services/api';
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
  X
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const PharmacyReceivedPage = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [qrModalBatch, setQrModalBatch] = useState(null);

  useEffect(() => {
    fetchReceivedBatches();
  }, []);

  const fetchReceivedBatches = async () => {
    try {
      setLoading(true);
      const res = await batchApi.getAll({ limit: 50 });
      setBatches(res.data?.batches || res.data || []);
    } catch (err) {
      console.error('Error fetching received batches:', err);
>>>>>>> origin/main
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  useEffect(() => {
    loadReceivedMedicines();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadReceivedMedicines();
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
            📥 Received Medicines & Dispensary Inventory
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Authentic medicine lots delivered to pharmacy storage ready for point-of-sale verification
          </p>
        </div>

        <Link to="/pharmacy/medicines" className="btn btn-primary btn-sm">
          ➕ Order More Medicines
        </Link>
      </div>

      {/* Search Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', background: '#ffffff' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search received stock by medicine name or batch lot #..."
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

      {/* Received Medicines Table */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#2563eb', fontWeight: '600' }}>
            Loading dispensary inventory...
          </div>
        ) : receivedBatches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
            No received medicines currently recorded in dispensary vault.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>MEDICINE</th>
                  <th>BATCH NUMBER</th>
                  <th>IN-STOCK QTY</th>
                  <th>MANUFACTURER</th>
                  <th>EXPIRY DATE</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {receivedBatches.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--text-heading)' }}>
                        {b.product?.name || 'Pharmaceutical Product'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {b.product?.genericName} • {b.product?.dosageForm}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#1e3a8a' }}>
                      {b.batchNumber}
                    </td>
                    <td style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                      {b.quantity?.toLocaleString()} {b.unit}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {b.manufacturer?.name || b.product?.manufacturer?.name || 'Verified Manufacturer'}
                    </td>
                    <td
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color: new Date(b.expiryDate) < new Date() ? '#dc2626' : '#059669',
                      }}
                    >
                      {new Date(b.expiryDate).toLocaleDateString()}
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <Link
                          to={`/pharmacy/batches/${b._id}`}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          View
                        </Link>
                        <Link
                          to={`/verify/${b.qrIdentifier || b.batchNumber}`}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        >
                          Verify QR →
=======
  const getStatusBadge = (status) => {
    switch (status) {
      case 'RELEASED':
      case 'ACTIVE':
      case 'AVAILABLE':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'QUARANTINED':
      case 'FLAGGED':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'RECALLED':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    }
  };

  const filteredBatches = batches.filter(batch => {
    const matchesSearch =
      batch.batchNumber?.toLowerCase().includes(search.toLowerCase()) ||
      batch.productName?.toLowerCase().includes(search.toLowerCase()) ||
      batch.manufacturer?.name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      batch.status?.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Package className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Received Medicines & Dispensary Stock
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage authenticated pharmaceutical batches in pharmacy possession ready for patient dispensing
          </p>
        </div>

        <Link
          to="/pharmacy/medicines"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition shadow-sm self-start sm:self-auto"
        >
          Procure More Stock
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Stocked Batches</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{batches.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Authenticity Verified</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{batches.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Ready to Dispense</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {batches.filter(b => b.status !== 'RECALLED').length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search batch number, product name, maker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-auto"
          >
            <option value="ALL">All Statuses</option>
            <option value="RELEASED">Released</option>
            <option value="ACTIVE">Active</option>
            <option value="QUARANTINED">Quarantined</option>
            <option value="RECALLED">Recalled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading received batches...</p>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-medium text-slate-900 dark:text-white">No received stock found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Batches delivered to your pharmacy will be listed here with instant QR verification and custody timeline.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3.5">Batch Number</th>
                  <th className="px-5 py-3.5">Product Name</th>
                  <th className="px-5 py-3.5">Manufacturer</th>
                  <th className="px-5 py-3.5">Stock Available</th>
                  <th className="px-5 py-3.5">Expiry Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredBatches.map((batch) => (
                  <tr key={batch._id || batch.batchNumber} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
                      {batch.batchNumber}
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{batch.productName}</p>
                        <p className="text-xs text-slate-400">{batch.dosageForm || 'Medicinal Unit'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[140px]">{batch.manufacturer?.name || batch.manufacturer?.organization || 'Verified Lab'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                      {batch.quantity || 100} units
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs">
                      {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(batch.status)}`}>
                        {batch.status || 'RELEASED'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setQrModalBatch(batch)}
                          className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                          title="View QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        <Link
                          to={`/verify/${batch.batchNumber}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 bg-teal-50 dark:bg-teal-900/30 px-2.5 py-1.5 rounded-md transition"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Verify
                        </Link>

                        <Link
                          to={`/pharmacy/batches/${batch._id || batch.batchNumber}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1.5 rounded-md transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Details
>>>>>>> origin/main
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
<<<<<<< HEAD
    </div>
  );
}
=======

      {/* QR Code Modal */}
      {qrModalBatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setQrModalBatch(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center">
                <QrCode className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {qrModalBatch.productName}
                </h3>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                  Batch: {qrModalBatch.batchNumber}
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-inner flex justify-center">
                <QRCodeSVG
                  value={JSON.stringify({
                    batchNumber: qrModalBatch.batchNumber,
                    productName: qrModalBatch.productName,
                    verifyUrl: `${window.location.origin}/verify/${qrModalBatch.batchNumber}`
                  })}
                  size={180}
                  level="H"
                />
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Patients and regulatory inspectors can scan this QR code to verify medicine authenticity instantly.
              </p>

              <Link
                to={`/verify/${qrModalBatch.batchNumber}`}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition"
              >
                <ShieldCheck className="w-4 h-4" />
                Launch 9-Point Verification
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyReceivedPage;
>>>>>>> origin/main
