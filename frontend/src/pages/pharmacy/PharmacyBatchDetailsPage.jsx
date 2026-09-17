import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { batchApi, supplyChainApi } from '../../services/api';
import {
  ArrowLeft,
  ShieldCheck,
  QrCode,
  Package,
  Calendar,
  Building2,
  MapPin,
  Clock,
  Layers,
  FileCheck,
  AlertCircle,
  Truck
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const PharmacyBatchDetailsPage = () => {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBatchAndProvenance();
  }, [batchId]);

  const fetchBatchAndProvenance = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await batchApi.getById(batchId);
      const batchData = res.data?.batch || res.data;
      setBatch(batchData);

      // Fetch provenance events
      if (batchData?.batchNumber) {
        try {
          const eventsRes = await supplyChainApi.getBatchEvents(batchData.batchNumber);
          setEvents(eventsRes.data?.events || eventsRes.data || []);
        } catch (eventErr) {
          console.error('Error fetching batch events:', eventErr);
        }
      }
    } catch (err) {
      console.error('Error fetching batch details:', err);
      setError('Failed to load pharmaceutical batch details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading batch details and provenance...</p>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center max-w-lg mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Batch Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{error || 'Could not locate batch.'}</p>
        <Link
          to="/pharmacy/received"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Received Batches
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/pharmacy/received"
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                {batch.batchNumber}
              </h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                batch.status === 'RELEASED' || batch.status === 'ACTIVE'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
              }`}>
                {batch.status || 'RELEASED'}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {batch.productName} {batch.genericName ? `(${batch.genericName})` : ''}
            </p>
          </div>
        </div>

        <Link
          to={`/verify/${batch.batchNumber}`}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition shadow-sm self-start sm:self-auto"
        >
          <ShieldCheck className="w-4 h-4" />
          Verify 9-Point Authenticity
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Metadata and QR */}
        <div className="space-y-6">
          {/* QR Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm text-center">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4">
              Batch Verification QR
            </h3>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-inner inline-block">
              <QRCodeSVG
                value={JSON.stringify({
                  batchNumber: batch.batchNumber,
                  productName: batch.productName,
                  verifyUrl: `${window.location.origin}/verify/${batch.batchNumber}`
                })}
                size={160}
                level="H"
              />
            </div>
            <p className="text-xs text-slate-400 mt-3 font-mono">
              Scan with camera or pharmacy barcode reader
            </p>
          </div>

          {/* Core Specifications */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm pb-2 border-b border-slate-100 dark:border-slate-700">
              Product Specifications
            </h3>
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Dosage Form:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{batch.dosageForm || 'Tablets'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Strength:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{batch.strength || '500mg'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Manufacture Date:</span>
                <span>{batch.manufacturingDate ? new Date(batch.manufacturingDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expiry Date:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dispensary Stock:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{batch.quantity || 100} units</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Provenance and Supply Chain Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Cryptographic Supply Chain Provenance
            </h3>

            {events.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No recorded transfer events yet for this batch.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                {events.map((evt, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-slate-800 border-2 border-emerald-600 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded text-xs font-bold uppercase">
                          {evt.eventType}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(evt.timestamp || evt.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                        <p><strong>Actor:</strong> {evt.performedBy?.name || evt.performedBy?.organization || 'Authorized Node'}</p>
                        <p><strong>Location:</strong> {evt.location?.facility || evt.location?.city || 'Verified Facility'}</p>
                        {evt.notes && <p className="italic text-slate-500">"{evt.notes}"</p>}
                      </div>

                      {evt.dataHash && (
                        <p className="text-[10px] font-mono text-slate-400 truncate mt-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded">
                          Hash: {evt.dataHash}
                        </p>
                      )}
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

export default PharmacyBatchDetailsPage;
