import React from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import {
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Truck,
  Building2,
  MapPin,
  ShieldCheck,
  Package,
  Calendar,
  Pill,
  ExternalLink
} from 'lucide-react';

const PharmacyOrderDetailsPage = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const { getOrderById } = useCart();

  const isNewOrder = location.state?.newOrderSuccess;
  const order = getOrderById(orderId);

  if (!order) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center max-w-xl mx-auto my-12">
        <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Order Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          No order records found for identifier: <span className="font-mono text-slate-700 dark:text-slate-300">{orderId}</span>
        </p>
        <Link
          to="/pharmacy/orders"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>
      </div>
    );
  }

  const steps = [
    { title: 'Order Submitted', done: true, time: new Date(order.createdAt).toLocaleDateString() },
    { title: 'Custody Verified', done: true, time: 'Cryptographically Signed' },
    { title: 'Supplier Dispatch', done: order.status === 'PROCESSING' || order.status === 'FULFILLED' || order.status === 'DELIVERED', time: 'Cold-Chain Logged' },
    { title: 'Pharmacy Receipt', done: order.status === 'DELIVERED' || order.status === 'FULFILLED', time: 'Pending Arrival' }
  ];

  return (
    <div className="space-y-6">
      {/* Back button & title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/pharmacy/orders"
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                {order.orderId}
              </h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                order.status === 'DELIVERED' || order.status === 'FULFILLED'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
              }`}>
                {order.status}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <Link
          to="/pharmacy/medicines"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition shadow-sm self-start sm:self-auto"
        >
          <Pill className="w-4 h-4" />
          Order More Medicines
        </Link>
      </div>

      {/* Confirmation Success Toast if just placed */}
      {isNewOrder && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 shadow-sm">
          <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h3 className="text-sm font-bold">Purchase Order Confirmed & Logged!</h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300/80">
              Your procurement order has been broadcasted to verified distributors. You can track custody status below.
            </p>
          </div>
        </div>
      )}

      {/* Status Progress Timeline */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-6">
          Supply Chain Fulfillment Progress
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className={`p-2 rounded-full mt-0.5 ${
                step.done
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
              }`}>
                {step.done ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
              </div>
              <div>
                <p className={`text-sm font-semibold ${step.done ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                  {step.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{step.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Ordered Pharmaceutical Batches ({order.items?.length || 0})
              </h3>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {order.items?.map((item, idx) => (
                <div key={idx} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold rounded uppercase">
                        {item.dosageForm || 'Medicine'}
                      </span>
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        Batch: {item.batchNumber}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      {item.productName}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Supplier: <strong className="text-slate-700 dark:text-slate-300">{item.manufacturer}</strong> • Qty: {item.quantity} packs
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right mr-2">
                      <p className="text-base font-bold text-slate-900 dark:text-white">
                        ${((item.price || 45) * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        ${(item.price || 45).toFixed(2)} / pack
                      </p>
                    </div>

                    <Link
                      to={`/verify/${item.batchNumber}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/30 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 text-xs font-semibold rounded-lg transition"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verify Batch
                    </Link>

                    <Link
                      to={`/pharmacy/batches/${item.batchId || item.batchNumber}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition"
                    >
                      View Details
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Shipping info and financial totals */}
        <div className="space-y-4">
          {/* Recipient Details */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Delivery Destination
            </h3>
            <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
              <p>
                <span className="text-slate-400 block">Organization:</span>
                <strong className="text-slate-900 dark:text-white text-sm">{order.shippingAddress?.organization || order.pharmacyName}</strong>
              </p>
              <p>
                <span className="text-slate-400 block">License #:</span>
                <span className="font-mono">{order.shippingAddress?.licenseNumber || 'PHA-VERIFIED'}</span>
              </p>
              <p>
                <span className="text-slate-400 block">Address:</span>
                <span>{order.shippingAddress?.address || 'Licensed Pharmacy Location'}, {order.shippingAddress?.city || ''}</span>
              </p>
              {order.notes && (
                <p>
                  <span className="text-slate-400 block">Handling Notes:</span>
                  <span className="italic">{order.notes}</span>
                </p>
              )}
            </div>
          </div>

          {/* Payment / Cost Summary */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Billing & Cost Breakdown
            </h3>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Items Total</span>
                <span>${(order.items?.reduce((acc, i) => acc + (i.price || 45) * i.quantity, 0) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Regulatory Fee</span>
                <span>${(order.regulatoryFee || 15).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span>${(order.shippingFee || 0).toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                <span>Total Amount</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-base">
                  ${order.totalAmount?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyOrderDetailsPage;
