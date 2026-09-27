import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useCart } from '../../context/CartContext';
import StatusBadge from '../../components/StatusBadge';
import {
  Pill,
  Search,
  Filter,
  ShoppingCart,
  Check,
  ShieldCheck,
  Building,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  RefreshCw,
  AlertCircle,
  RotateCcw,
  Minus,
  Plus,
  X,
  Package,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function PharmacyMedicinesPage() {
  const { addToCart, cartCount, cartItems } = useCart();

  const [batches, setBatches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dosageForms, setDosageForms] = useState([]);

  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 24;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Controls
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [dosageFormFilter, setDosageFormFilter] = useState('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL'); // 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'name-asc' | 'name-desc' | 'qty-desc'

  // Per-item quantity selection map { [batchId]: number }
  const [quantities, setQuantities] = useState({});
  // Temporary added-to-cart feedback map { [batchId]: boolean }
  const [addedIds, setAddedIds] = useState({});

  // Selected Medicine Detail Modal
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchMedicines = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPharmacyMedicines({
        search: search.trim(),
        category: categoryFilter,
        dosageForm: dosageFormFilter,
        availability: availabilityFilter,
        sort: sortOrder,
        page,
        limit,
      });

      if (res && res.success) {
        setBatches(res.batches || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
        if (res.categories) setCategories(res.categories);
        if (res.dosageForms) setDosageForms(res.dosageForms);
      } else {
        setError(res?.message || 'Failed to load medicine catalog.');
      }
    } catch (err) {
      console.error('Error fetching pharmacy medicines:', err);
      setError(err.message || 'Server connection error loading catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [categoryFilter, dosageFormFilter, availabilityFilter, sortOrder, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMedicines();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategoryFilter('ALL');
    setDosageFormFilter('ALL');
    setAvailabilityFilter('ALL');
    setSortOrder('newest');
    setPage(1);
  };

  const getItemQuantity = (batchId) => {
    return quantities[batchId] || 1;
  };

  const setItemQuantity = (batchId, val, maxAvailable) => {
    const qty = Math.max(1, Math.min(Number(val) || 1, maxAvailable || 10000));
    setQuantities((prev) => ({ ...prev, [batchId]: qty }));
  };

  const handleAddToCartClick = async (batch, event) => {
    if (event) event.stopPropagation();
    const batchId = batch._id || batch.batchNumber;
    const requestedQty = getItemQuantity(batchId);

    const productObj = batch.product || {
      _id: batch.product?._id || batch._id,
      name: batch.productName || batch.product?.name || 'Pharmaceutical Product',
      genericName: batch.genericName || batch.product?.genericName || '',
      dosageForm: batch.dosageForm || batch.product?.dosageForm || 'Tablet',
      strength: batch.strength || batch.product?.strength || '',
      productCode: batch.productCode || batch.product?.productCode || 'PC-1001',
      manufacturer: batch.manufacturer,
    };

    const res = await addToCart(productObj, batch, requestedQty);

    if (res && res.success) {
      setAddedIds((prev) => ({ ...prev, [batchId]: true }));
      setTimeout(() => {
        setAddedIds((prev) => ({ ...prev, [batchId]: false }));
      }, 2000);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '32px 20px 80px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Header Bar */}
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
                  background: '#ecfdf5',
                  color: '#059669',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                }}
              >
                Procurement Formulary
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Verified Pharmaceutical Supply Chain Catalog
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', margin: 0, tracking: '-0.02em' }}>
              Pharmacy Medicine Catalog
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
              Search, inspect, and order authentic pharmaceutical batches from certified manufacturers and wholesale distributors.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              to="/pharmacy/cart"
              className="btn btn-primary"
              style={{
                padding: '10px 18px',
                fontSize: '0.88rem',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#059669',
                borderColor: '#059669',
              }}
            >
              <ShoppingCart style={{ width: '16px', height: '16px' }} />
              <span>View Cart</span>
              {cartCount > 0 && (
                <span
                  style={{
                    background: '#ffffff',
                    color: '#059669',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    borderRadius: '9999px',
                    padding: '2px 8px',
                    marginLeft: '4px',
                  }}
                >
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search, Filter & Controls Bar */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '18px 20px',
            marginBottom: '24px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          }}
        >
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search style={{ width: '18px', height: '18px', color: '#94a3b8', position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search medicine name, generic name, brand, GTIN/code, or batch..."
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Category Filter */}
            <div style={{ minWidth: '160px' }}>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                title="Category"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  background: '#ffffff',
                  outline: 'none',
                }}
              >
                <option value="ALL">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Dosage Form Filter */}
            <div style={{ minWidth: '150px' }}>
              <select
                value={dosageFormFilter}
                onChange={(e) => {
                  setDosageFormFilter(e.target.value);
                  setPage(1);
                }}
                title="Dosage Form"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  background: '#ffffff',
                  outline: 'none',
                }}
              >
                <option value="ALL">All Dosage Forms</option>
                <option value="TABLET">Tablets</option>
                <option value="CAPSULE">Capsules</option>
                <option value="INJECTION">Injections</option>
                <option value="SYRUP">Syrups</option>
                <option value="VIAL">Vials</option>
              </select>
            </div>

            {/* Availability Filter */}
            <div style={{ minWidth: '140px' }}>
              <select
                value={availabilityFilter}
                onChange={(e) => {
                  setAvailabilityFilter(e.target.value);
                  setPage(1);
                }}
                title="Availability Status"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  background: '#ffffff',
                  outline: 'none',
                }}
              >
                <option value="ALL">All Availability</option>
                <option value="IN_STOCK">In Stock (10+)</option>
                <option value="LOW_STOCK">Low Stock (&lt;10)</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>

            {/* Sort Selector */}
            <div style={{ minWidth: '135px' }}>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  setPage(1);
                }}
                title="Sort Order"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  background: '#ffffff',
                  outline: 'none',
                }}
              >
                <option value="newest">Recently Added</option>
                <option value="name-asc">Batch ID (A-Z)</option>
                <option value="name-desc">Batch ID (Z-A)</option>
                <option value="qty-desc">Quantity (High to Low)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '10px 18px', fontSize: '0.88rem', fontWeight: '700', background: '#059669', borderColor: '#059669' }}>
              Search
            </button>

            {(search || categoryFilter !== 'ALL' || dosageFormFilter !== 'ALL' || availabilityFilter !== 'ALL' || sortOrder !== 'newest') && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '0.85rem',
                  color: '#475569',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RotateCcw style={{ width: '14px', height: '14px' }} />
                <span>Reset Filters</span>
              </button>
            )}
          </form>
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
            <button onClick={fetchMedicines} className="btn btn-secondary btn-sm" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
              Retry Connection
            </button>
          </div>
        )}

        {/* Catalog Grid */}
        {loading ? (
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '60px 0', textAlign: 'center' }}>
            <RefreshCw style={{ width: '32px', height: '32px', color: '#059669', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>Loading pharmaceutical catalog...</div>
          </div>
        ) : batches.length === 0 ? (
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '50px 20px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Pill style={{ width: '28px', height: '28px' }} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
              {search || categoryFilter !== 'ALL' || dosageFormFilter !== 'ALL' || availabilityFilter !== 'ALL' ? 'No medicines match your search criteria' : 'No medicines currently available in formulary'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: '460px', margin: '0 auto 20px' }}>
              {search || categoryFilter !== 'ALL' || dosageFormFilter !== 'ALL' || availabilityFilter !== 'ALL'
                ? 'Try adjusting your search terms, clearing active category or dosage filters.'
                : 'As verified manufacturers register new batch releases, available products will appear here for procurement.'}
            </p>
            {(search || categoryFilter !== 'ALL' || dosageFormFilter !== 'ALL' || availabilityFilter !== 'ALL') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-secondary"
                style={{ padding: '10px 20px', fontSize: '0.88rem', fontWeight: '600' }}
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '20px',
                marginBottom: '28px',
              }}
            >
              {batches.map((batch) => {
                const batchId = batch._id || batch.batchNumber;
                const productName = batch.product?.name || batch.productName || 'Pharmaceutical Drug';
                const genericName = batch.product?.genericName || batch.genericName || '';
                const brandName = batch.product?.brandName || batch.brandName || '';
                const dosageForm = batch.product?.dosageForm || batch.dosageForm || 'Tablet';
                const strength = batch.product?.strength || batch.strength || '';
                const productCode = batch.product?.productCode || batch.productCode || 'PC-FORMULARY';
                const manufacturerName = batch.manufacturer?.name || batch.manufacturer?.organization || 'Verified Mfg';
                const unitPrice = Number(batch.product?.unitPrice || batch.unitPrice || 45.00);
                const availableQty = Number(batch.quantity || 0);

                const isOutOfStock = availableQty <= 0;
                const isLowStock = availableQty > 0 && availableQty < 10;
                const isAdded = addedIds[batchId];
                const inCartItem = cartItems.find((i) => i.batchId === batchId || i.batchNumber === batch.batchNumber);
                const currentQty = getItemQuantity(batchId);

                return (
                  <div
                    key={batchId}
                    onClick={() => setSelectedItem(batch)}
                    style={{
                      background: '#ffffff',
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                  >
                    <div style={{ padding: '20px' }}>
                      {/* Top Badges Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span
                          style={{
                            background: '#eff6ff',
                            color: '#2563eb',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                          }}
                        >
                          {dosageForm}
                        </span>

                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            padding: '3px 9px',
                            borderRadius: '9999px',
                            background: isOutOfStock ? '#fef2f2' : isLowStock ? '#fffbeb' : '#ecfdf5',
                            color: isOutOfStock ? '#dc2626' : isLowStock ? '#d97706' : '#059669',
                            border: `1px solid ${isOutOfStock ? '#fecaca' : isLowStock ? '#fde68a' : '#a7f3d0'}`,
                          }}
                        >
                          {isOutOfStock ? 'Out of Stock' : isLowStock ? `Low Stock (${availableQty})` : `In Stock (${availableQty.toLocaleString()})`}
                        </span>
                      </div>

                      {/* Medicine Titles */}
                      <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px', lineHeight: '1.3' }}>
                        {productName}
                      </h3>
                      {(genericName || brandName) && (
                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', marginBottom: '12px' }}>
                          {genericName}{brandName ? ` (${brandName})` : ''} {strength ? `• ${strength}` : ''}
                        </div>
                      )}

                      {/* Batch & Supplier Attributes Table */}
                      <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px 12px', border: '1px solid #f1f5f9', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Batch Lot:</span>
                          <strong style={{ fontFamily: 'monospace', color: '#2563eb' }}>#{batch.batchNumber}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>GTIN / Code:</span>
                          <span style={{ fontFamily: 'monospace', color: '#334155' }}>{productCode}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Manufacturer:</span>
                          <strong style={{ color: '#334155', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {manufacturerName}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Expiry Date:</span>
                          <span style={{ fontWeight: '600', color: '#334155' }}>
                            {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div
                      style={{
                        padding: '14px 20px',
                        background: '#f8fafc',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>PRICE / PACK</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>
                          ${unitPrice.toFixed(2)}
                        </span>
                      </div>

                      {/* Quantity Selector & Add Button */}
                      {!isOutOfStock ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                            <button
                              type="button"
                              onClick={() => setItemQuantity(batchId, currentQty - 1, availableQty)}
                              style={{ background: 'none', border: 'none', padding: '6px 8px', cursor: 'pointer', color: '#475569' }}
                            >
                              <Minus style={{ width: '13px', height: '13px' }} />
                            </button>
                            <input
                              type="number"
                              value={currentQty}
                              min="1"
                              max={availableQty}
                              onChange={(e) => setItemQuantity(batchId, e.target.value, availableQty)}
                              onClick={(e) => e.stopPropagation()}
                              style={{ width: '36px', textAlign: 'center', border: 'none', outline: 'none', fontSize: '0.82rem', fontWeight: '700', color: '#0f172a' }}
                            />
                            <button
                              type="button"
                              onClick={() => setItemQuantity(batchId, currentQty + 1, availableQty)}
                              style={{ background: 'none', border: 'none', padding: '6px 8px', cursor: 'pointer', color: '#475569' }}
                            >
                              <Plus style={{ width: '13px', height: '13px' }} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleAddToCartClick(batch, e)}
                            className="btn btn-primary btn-sm"
                            style={{
                              padding: '8px 14px',
                              fontSize: '0.82rem',
                              fontWeight: '700',
                              background: isAdded ? '#059669' : '#059669',
                              borderColor: '#059669',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            {isAdded ? (
                              <>
                                <Check style={{ width: '14px', height: '14px' }} />
                                <span>Added!</span>
                              </>
                            ) : (
                              <>
                                <ShoppingCart style={{ width: '14px', height: '14px' }} />
                                <span>{inCartItem ? `+ Add (${inCartItem.quantity})` : 'Add to Cart'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '8px 14px', fontSize: '0.8rem', opacity: 0.6, cursor: 'not-allowed' }}
                        >
                          Out of Stock
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '14px 20px',
                }}
              >
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total catalog items)
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 12px', opacity: page <= 1 ? 0.5 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
                  >
                    <ChevronLeft style={{ width: '16px', height: '16px' }} />
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 12px', opacity: page >= totalPages ? 0.5 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
                  >
                    <span>Next</span>
                    <ChevronRight style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Medicine Details Modal */}
      {selectedItem && (
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
          onClick={() => setSelectedItem(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '28px 32px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ textAlign: 'left' }}>
                <span style={{ background: '#ecfdf5', color: '#059669', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'inline-block', marginBottom: '6px' }}>
                  {selectedItem.product?.dosageForm || selectedItem.dosageForm || 'Formulated Drug'}
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                  {selectedItem.product?.name || selectedItem.productName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.85rem', marginBottom: '20px' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>GENERIC FORMULARY</span>
                <strong style={{ color: '#0f172a' }}>{selectedItem.product?.genericName || selectedItem.genericName || 'Standard Formulation'}</strong>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>BRAND NAME</span>
                <strong style={{ color: '#0f172a' }}>{selectedItem.product?.brandName || selectedItem.brandName || 'Pharma Grade'}</strong>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>STRENGTH / DOSAGE</span>
                <span style={{ fontWeight: '600', color: '#334155' }}>{selectedItem.product?.strength || selectedItem.strength || 'Standard Dose'}</span>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>PRODUCT CODE (GTIN/NDC)</span>
                <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#2563eb' }}>{selectedItem.product?.productCode || selectedItem.productCode}</span>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>BATCH LOT NUMBER</span>
                <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a' }}>#{selectedItem.batchNumber}</span>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>AVAILABLE STOCK</span>
                <span style={{ fontWeight: '700', color: selectedItem.quantity > 0 ? '#059669' : '#dc2626' }}>
                  {Number(selectedItem.quantity || 0).toLocaleString()} {selectedItem.unit || 'Units'}
                </span>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>MANUFACTURER</span>
                <span style={{ fontWeight: '600', color: '#334155' }}>
                  {selectedItem.manufacturer?.name || selectedItem.manufacturer?.organization || 'Verified Manufacturer'}
                </span>
              </div>

              {selectedItem.product?.description && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>DESCRIPTION</span>
                  <p style={{ color: '#475569', margin: '2px 0 0', fontSize: '0.82rem' }}>
                    {selectedItem.product.description}
                  </p>
                </div>
              )}

              {selectedItem.product?.storageRequirements && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>STORAGE REQUIREMENTS</span>
                  <span style={{ color: '#334155', fontSize: '0.82rem' }}>
                    {selectedItem.product.storageRequirements}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>UNIT PRICE</span>
                <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                  ${(Number(selectedItem.product?.unitPrice || selectedItem.unitPrice || 45.00)).toFixed(2)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Link
                  to={`/verify/${selectedItem.batchNumber}`}
                  className="btn btn-secondary"
                  style={{ padding: '10px 16px', fontSize: '0.88rem', fontWeight: '600' }}
                >
                  Verify QR
                </Link>
                <button
                  type="button"
                  disabled={Number(selectedItem.quantity || 0) <= 0}
                  onClick={(e) => {
                    handleAddToCartClick(selectedItem, e);
                    setSelectedItem(null);
                  }}
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', fontSize: '0.88rem', fontWeight: '700', background: '#059669', borderColor: '#059669' }}
                >
                  Add to Dispensary Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
