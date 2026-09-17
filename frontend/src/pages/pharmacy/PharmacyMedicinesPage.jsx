<<<<<<< HEAD
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
=======
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { batchApi } from '../../services/api';
import { useCart } from '../../context/CartContext';
import {
  Pill,
  Search,
  Filter,
  ShoppingCart,
  Check,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';

const PharmacyMedicinesPage = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [addedIds, setAddedIds] = useState({});

  const { addToCart, cartItems } = useCart();

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await batchApi.getAll({ limit: 50 });
      setBatches(res.data?.batches || res.data || []);
    } catch (err) {
      console.error('Error fetching medicines:', err);
>>>>>>> origin/main
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
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
=======
  const handleAddToCart = (batch) => {
    const item = {
      batchId: batch._id || batch.batchNumber,
      batchNumber: batch.batchNumber,
      productName: batch.productName,
      genericName: batch.genericName || batch.productName,
      dosageForm: batch.dosageForm || 'Tablets',
      strength: batch.strength || 'Standard',
      manufacturer: batch.manufacturer?.name || batch.manufacturer?.organization || 'Verified Manufacturer',
      expiryDate: batch.expiryDate,
      price: batch.unitPrice || 45.00,
      quantity: 1,
      maxQuantity: batch.quantity || 100
    };

    addToCart(item);

    // Show temporary checkmark feedback
    setAddedIds(prev => ({ ...prev, [batch._id || batch.batchNumber]: true }));
    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [batch._id || batch.batchNumber]: false }));
    }, 1800);
  };

  const filteredBatches = batches.filter(b => {
    const pName = b.productName || '';
    const gName = b.genericName || '';
    const bNum = b.batchNumber || '';
    const mName = b.manufacturer?.name || '';

    const matchesSearch =
      pName.toLowerCase().includes(search.toLowerCase()) ||
      gName.toLowerCase().includes(search.toLowerCase()) ||
      bNum.toLowerCase().includes(search.toLowerCase()) ||
      mName.toLowerCase().includes(search.toLowerCase());

    const matchesCat = filterCategory === 'ALL' || b.dosageForm === filterCategory;

    return matchesSearch && matchesCat;
  });

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Pill className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Pharmaceutical Medicine Catalog
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Procure authentic, batch-verified pharmaceuticals from certified supply chain partners
>>>>>>> origin/main
          </p>
        </div>

        <Link
          to="/pharmacy/cart"
<<<<<<< HEAD
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
=======
          className="relative inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition shadow-sm self-start sm:self-auto"
        >
          <ShoppingCart className="w-4 h-4" />
          View Cart ({totalCartCount})
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search medicine, generic, batch, maker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-auto"
          >
            <option value="ALL">All Dosage Forms</option>
            <option value="TABLET">Tablets</option>
            <option value="CAPSULE">Capsules</option>
            <option value="INJECTION">Injections</option>
            <option value="SYRUP">Syrups</option>
            <option value="VIAL">Vials</option>
          </select>
        </div>
>>>>>>> origin/main
      </div>

      {/* Medicines Grid */}
      {loading ? (
<<<<<<< HEAD
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
=======
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading pharmaceutical catalog...</p>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Pill className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-medium text-slate-900 dark:text-white">No medicines found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or filter to find available pharmaceutical products.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBatches.map((batch) => {
            const batchKey = batch._id || batch.batchNumber;
            const isAdded = addedIds[batchKey];
            const inCart = cartItems.find(i => i.batchId === batchKey);

            return (
              <div
                key={batchKey}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-full uppercase tracking-wider">
                      {batch.dosageForm || 'Pharmaceutical'}
                    </span>
                    <Link
                      to={`/verify/${batch.batchNumber}`}
                      title="Verify Authenticity"
                      className="p-1 text-teal-600 hover:text-teal-700 dark:text-teal-400 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/30 transition"
                    >
                      <ShieldCheck className="w-5 h-5" />
                    </Link>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                    {batch.productName}
                  </h3>
                  {batch.genericName && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-2">
                      {batch.genericName}
                    </p>
                  )}

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Batch Number:</span>
                      <span className="font-mono font-medium text-slate-900 dark:text-white">{batch.batchNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Manufacturer:</span>
                      <span className="truncate max-w-[140px] font-medium text-slate-800 dark:text-slate-200">
                        {batch.manufacturer?.name || batch.manufacturer?.organization || 'Certified Lab'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Expiry Date:</span>
                      <span>{batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Units in Stock:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{batch.quantity || 100}</span>
>>>>>>> origin/main
                    </div>
                  </div>
                </div>

<<<<<<< HEAD
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
=======
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Price / Pack</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      ${(batch.unitPrice || 45.00).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddToCart(batch)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                      isAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white shadow-sm'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        Added!
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        {inCart ? `Add More (${inCart.quantity})` : 'Add to Cart'}
                      </>
                    )}
                  </button>
>>>>>>> origin/main
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
<<<<<<< HEAD
}
=======
};

export default PharmacyMedicinesPage;
>>>>>>> origin/main
