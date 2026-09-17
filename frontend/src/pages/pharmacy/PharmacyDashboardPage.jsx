import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { batchApi, supplyChainApi } from '../../services/api';
import {
  ShoppingBag,
  ShoppingCart,
  Pill,
  ShieldCheck,
  Truck,
  ArrowRight,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';

const PharmacyDashboardPage = () => {
  const { user } = useAuth();
  const { cartItems, orders } = useCart();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await batchApi.getAll({ limit: 10 });
      setBatches(res.data?.batches || res.data || []);
    } catch (err) {
      console.error('Error fetching pharmacy dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const activeOrdersCount = orders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-800 dark:to-teal-900 rounded-2xl p-6 text-white shadow-lg">
        <div>
          <span className="px-2.5 py-1 bg-white/20 text-xs font-semibold rounded-full uppercase tracking-wider">
            Pharmacy Dispensing Portal
          </span>
          <h1 className="text-2xl font-bold mt-2">
            Welcome, {user?.name || 'Pharmacist'}
          </h1>
          <p className="text-emerald-100 text-sm mt-1 max-w-xl">
            {user?.organization?.name || 'Authorized Pharmacy'} • Procurement, Verification, and Dispensing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/pharmacy/medicines"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 text-sm font-semibold rounded-lg transition shadow"
          >
            <Pill className="w-4 h-4" />
            Browse Medicines
          </Link>
          <Link
            to="/pharmacy/cart"
            className="relative inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500/40 hover:bg-emerald-500/60 border border-white/20 text-white text-sm font-semibold rounded-lg transition"
          >
            <ShoppingCart className="w-4 h-4" />
            Cart
            {totalCartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {totalCartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Orders</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{activeOrdersCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">In processing / dispatch</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cart Items</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalCartCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{cartItems.length} distinct medicines</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Available Batches</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{batches.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Across verified suppliers</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <Pill className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Verification Status</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">100%</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">9-Point Authenticity Guard</p>
          </div>
          <div className="p-3 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Access Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/pharmacy/medicines"
          className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition group flex items-center gap-3.5"
        >
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Order Medicines</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Browse verified catalog & add to cart</p>
          </div>
        </Link>

        <Link
          to="/pharmacy/received"
          className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition group flex items-center gap-3.5"
        >
          <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Received Batches</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Inspect dispensary stock & barcodes</p>
          </div>
        </Link>

        <Link
          to="/verify"
          className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition group flex items-center gap-3.5"
        >
          <div className="p-2.5 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg group-hover:bg-teal-600 group-hover:text-white transition">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Verify QR / Code</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Instant 9-point authenticity check</p>
          </div>
        </Link>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Pharmacy Orders */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Recent Pharmacy Orders
            </h2>
            <Link
              to="/pharmacy/orders"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 flex-1">
            {orders.length === 0 ? (
              <div className="p-8 text-center">
                <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-900 dark:text-white">No orders placed yet</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Start ordering medicines from certified manufacturers & distributors.
                </p>
                <Link
                  to="/pharmacy/medicines"
                  className="inline-flex items-center gap-1 mt-3 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition"
                >
                  Order Medicines
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {orders.slice(0, 4).map((order) => (
                  <div key={order.orderId} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {order.orderId}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {order.items?.length || 0} items • ${order.totalAmount?.toLocaleString() || '0.00'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                        order.status === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : order.status === 'PROCESSING'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {order.status}
                      </span>
                      <Link
                        to={`/pharmacy/orders/${order.orderId}`}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Available Medicine Catalog Snippet */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Pill className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              Verified Available Batches
            </h2>
            <Link
              to="/pharmacy/medicines"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 flex items-center gap-1"
            >
              Browse Catalog <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 flex-1">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading batches...</div>
            ) : batches.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No active batches available.</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {batches.slice(0, 4).map((batch) => (
                  <div key={batch._id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">
                        {batch.productName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        Batch: {batch.batchNumber} • Exp: {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/verify/${batch.batchNumber}`}
                        className="text-xs px-2.5 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded font-medium hover:bg-teal-100 transition"
                      >
                        Verify
                      </Link>
                      <Link
                        to="/pharmacy/medicines"
                        className="text-xs px-2.5 py-1 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 transition flex items-center gap-1"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        Order
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyDashboardPage;
