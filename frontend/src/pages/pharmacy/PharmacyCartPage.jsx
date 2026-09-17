import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Building2,
  MapPin,
  FileText,
  Truck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const PharmacyCartPage = () => {
  const { user } = useAuth();
  const { cartItems, updateQuantity, removeFromCart, clearCart, getCartTotal, placeOrder } = useCart();
  const navigate = useNavigate();

  const [shippingInfo, setShippingInfo] = useState({
    organization: user?.organization?.name || user?.name || 'Pharmacy Dispensary',
    address: '450 Healthcare Boulevard, Suite 100',
    city: 'New York, NY 10001',
    contactPerson: user?.name || 'Licensed Pharmacist',
    licenseNumber: user?.organization?.licenseNumber || 'PHA-NY-889021',
    notes: 'Standard temperature-controlled delivery requested.'
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const subtotal = getCartTotal();
  const regulatoryComplianceFee = subtotal > 0 ? 15.00 : 0;
  const shippingFee = subtotal > 500 ? 0 : (subtotal > 0 ? 35.00 : 0);
  const grandTotal = subtotal + regulatoryComplianceFee + shippingFee;

  const handleQuantityChange = (batchId, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      removeFromCart(batchId);
    } else {
      updateQuantity(batchId, newQty);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setError('Your procurement cart is empty.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const orderData = {
        pharmacyName: shippingInfo.organization,
        shippingAddress: {
          organization: shippingInfo.organization,
          address: shippingInfo.address,
          city: shippingInfo.city,
          contactPerson: shippingInfo.contactPerson,
          licenseNumber: shippingInfo.licenseNumber
        },
        notes: shippingInfo.notes,
        regulatoryFee: regulatoryComplianceFee,
        shippingFee: shippingFee
      };

      const createdOrder = await placeOrder(orderData);
      navigate(`/pharmacy/orders/${createdOrder.orderId}`, {
        state: { newOrderSuccess: true }
      });
    } catch (err) {
      console.error('Error placing order:', err);
      setError('Failed to process purchase order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center max-w-2xl mx-auto my-8 shadow-sm">
        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your procurement cart is empty</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
          Explore our certified pharmaceutical catalog to order authentic, batch-verified medications for your pharmacy.
        </p>
        <Link
          to="/pharmacy/medicines"
          className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition shadow"
        >
          Browse Medicine Catalog
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <ShoppingCart className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          Pharmacy Procurement Cart
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review batch orders, verify supplier information, and finalize purchase dispatch
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart items list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Selected Medicines ({cartItems.length})
              </span>
              <button
                onClick={clearCart}
                className="text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Cart
              </button>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {cartItems.map((item) => (
                <div key={item.batchId} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold rounded uppercase">
                        {item.dosageForm || 'Medicine'}
                      </span>
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        Batch: {item.batchNumber}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                      {item.productName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>Supplier: <strong className="text-slate-700 dark:text-slate-300">{item.manufacturer}</strong></span>
                      {item.expiryDate && (
                        <span>• Exp: {new Date(item.expiryDate).toLocaleDateString()}</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    {/* Quantity controls */}
                    <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900">
                      <button
                        onClick={() => handleQuantityChange(item.batchId, item.quantity, -1)}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 py-1 text-sm font-bold text-slate-900 dark:text-white min-w-[36px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.batchId, item.quantity, 1)}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Price and remove */}
                    <div className="text-right min-w-[80px]">
                      <p className="text-base font-bold text-slate-900 dark:text-white">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        ${item.price.toFixed(2)} / unit
                      </p>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.batchId)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 transition"
                      title="Remove from cart"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Pharmacy Details Form */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Delivery & License Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Receiving Pharmacy Name
                </label>
                <input
                  type="text"
                  value={shippingInfo.organization}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, organization: e.target.value })}
                  className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Pharmacy State License #
                </label>
                <input
                  type="text"
                  value={shippingInfo.licenseNumber}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, licenseNumber: e.target.value })}
                  className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Delivery Destination Address
                </label>
                <input
                  type="text"
                  value={shippingInfo.address}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                  className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Special Handling / Cold Chain Instructions
                </label>
                <textarea
                  rows="2"
                  value={shippingInfo.notes}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, notes: e.target.value })}
                  className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary & Checkout */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900 dark:text-white text-base pb-3 border-b border-slate-100 dark:border-slate-700">
              Procurement Summary
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Subtotal ({cartItems.length} items)</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  Regulatory Compliance Fee
                </span>
                <span className="font-medium">${regulatoryComplianceFee.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Insured Cold-Chain Shipping</span>
                <span className="font-medium">
                  {shippingFee === 0 ? (
                    <span className="text-emerald-600 font-semibold">FREE</span>
                  ) : (
                    `$${shippingFee.toFixed(2)}`
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-base">
                <span className="font-bold text-slate-900 dark:text-white">Total Order Cost</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xl">
                  ${grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={submitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating Order...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Place Purchase Order
                </>
              )}
            </button>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                21 CFR Part 11 Compliant
              </div>
              <p>Each batch in this order will have verifiable custody transfers and cryptographic audit trails.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyCartPage;
