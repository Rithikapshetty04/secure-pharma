<<<<<<< HEAD
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import StatusBadge from '../../components/StatusBadge';

export default function DistributorOrdersPage() {
  const { orders, updateOrderStatus } = useCart();
  const [statusFilter, setStatusFilter] = useState('');

  const filteredOrders = statusFilter
    ? orders.filter((o) => o.status === statusFilter)
    : orders;

  const handleStatusUpdate = (orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus);
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
            📋 Pharmacy Fulfillment Orders
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Review and dispatch medicine requisitions from licensed pharmacy dispensaries
          </p>
        </div>

        <Link to="/distributor/transfers" className="btn btn-primary btn-sm">
          🚚 Dispatch Custody Transfer
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e3a8a' }}>
            Filter Requisitions by Status
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
          >
            <option value="">All Orders ({orders.length})</option>
            <option value="PENDING">PENDING</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
=======
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { supplyChainApi, batchApi } from '../../services/api';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowUpRight,
  Truck,
  Building2,
  Package,
  Eye
} from 'lucide-react';

const DistributorOrdersPage = () => {
  const { user } = useAuth();
  const { orders } = useCart();
  const [supplyEvents, setSupplyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchOrdersAndEvents();
  }, []);

  const fetchOrdersAndEvents = async () => {
    try {
      setLoading(true);
      const res = await supplyChainApi.getEvents({ limit: 50 });
      setSupplyEvents(res.data?.events || res.data || []);
    } catch (err) {
      console.error('Error loading supply events for orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Combine cart orders with supply chain transfer records
  const allOrders = orders || [];

  const filteredOrders = allOrders.filter(order => {
    const matchesSearch =
      order.orderId?.toLowerCase().includes(search.toLowerCase()) ||
      order.pharmacyName?.toLowerCase().includes(search.toLowerCase()) ||
      order.items?.some(i => i.productName?.toLowerCase().includes(search.toLowerCase()) || i.batchNumber?.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      order.status?.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Fulfillment & Pharmacy Orders
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track pharmacy order requests, batch dispatches, and fulfillment status
          </p>
        </div>
        <Link
          to="/distributor/transfers"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition shadow-sm self-start sm:self-auto"
        >
          <Truck className="w-4 h-4" />
          Dispatch Batch to Pharmacy
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Orders</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{allOrders.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Fulfilled & Dispatched</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {allOrders.filter(o => o.status === 'FULFILLED' || o.status === 'DELIVERED').length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Fulfillment</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {allOrders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length}
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
            placeholder="Search by Order ID, pharmacy, medicine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="FULFILLED">Fulfilled</option>
            <option value="DELIVERED">Delivered</option>
>>>>>>> origin/main
          </select>
        </div>
      </div>

      {/* Orders List */}
<<<<<<< HEAD
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
            No pharmacy orders found in queue.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredOrders.map((ord) => (
              <div
                key={ord.orderId || ord._id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  background: '#f8fafc',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                    marginBottom: '14px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '1.05rem', color: '#1e3a8a', fontFamily: 'var(--font-mono)' }}>
                      Order #{ord.orderId || ord._id}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: '12px' }}>
                      Placed: {new Date(ord.orderDate || ord.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <StatusBadge status={ord.status} />

                    {/* Quick status transitions for distributor */}
                    {ord.status === 'PENDING' && (
                      <button
                        onClick={() => handleStatusUpdate(ord.orderId || ord._id, 'ACCEPTED')}
                        className="btn btn-outline btn-sm"
                        style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}
                      >
                        ✓ Accept Order
                      </button>
                    )}
                    {ord.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleStatusUpdate(ord.orderId || ord._id, 'SHIPPED')}
                        className="btn btn-primary btn-sm"
                      >
                        🚚 Mark as Shipped
                      </button>
                    )}
                    {ord.status === 'SHIPPED' && (
                      <button
                        onClick={() => handleStatusUpdate(ord.orderId || ord._id, 'DELIVERED')}
                        className="btn btn-outline btn-sm"
                        style={{ color: '#059669', borderColor: '#a7f3d0' }}
                      >
                        ✓ Confirm Delivered
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>DESTINATION</span>
                    <strong>{ord.deliveryAddress || 'Pharmacy Vault'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>ITEMS ORDERED</span>
                    <strong>{ord.items?.length || 0} Products ({ord.totalItems} Units total)</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>DISPATCH ACTION</span>
                    <Link
                      to={`/distributor/transfers`}
                      style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}
                    >
                      Initiate Custody Transfer →
                    </Link>
                  </div>
                </div>

                {/* Ordered Items Table */}
                <div style={{ marginTop: '14px', background: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                  <table className="data-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>PRODUCT</th>
                        <th>BATCH LOT #</th>
                        <th>ORDERED QUANTITY</th>
                        <th style={{ textAlign: 'right' }}>VERIFY</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ord.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{item.productName}</strong>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{item.genericName}</div>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{item.batchNumber}</td>
                          <td>{item.quantity?.toLocaleString()} {item.unit || 'Units'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <Link
                              to={`/verify/${item.qrIdentifier || item.batchNumber}`}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                            >
                              Verify Batch
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
=======
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading order records...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-medium text-slate-900 dark:text-white">No orders found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              When pharmacies submit medicine purchase orders, they will appear here for dispatch and fulfillment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3.5">Order ID</th>
                  <th className="px-5 py-3.5">Pharmacy / Recipient</th>
                  <th className="px-5 py-3.5">Items</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredOrders.map((order) => (
                  <tr key={order.orderId || order._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition">
                    <td className="px-5 py-4 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                      {order.orderId || `ORD-${order._id?.slice(-6)}`}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {order.pharmacyName || order.shippingAddress?.organization || 'Registered Pharmacy'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {order.shippingAddress?.city || 'Verified Location'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-slate-400" />
                        <span>{order.items?.length || 0} medicine types</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">
                      ${order.totalAmount?.toLocaleString() || '0.00'}
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(order.createdAt || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'DELIVERED' || order.status === 'FULFILLED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : order.status === 'PROCESSING'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {order.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to="/distributor/transfers"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1.5 rounded-md transition"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Transfer Batch
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
>>>>>>> origin/main
          </div>
        )}
      </div>
    </div>
  );
<<<<<<< HEAD
}
=======
};

export default DistributorOrdersPage;
>>>>>>> origin/main
