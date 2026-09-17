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
    } finally {
      setLoading(false);
    }
  };

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
          </p>
        </div>

        <Link
          to="/pharmacy/cart"
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
      </div>

      {/* Medicines Grid */}
      {loading ? (
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
                    </div>
                  </div>
                </div>

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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PharmacyMedicinesPage;
