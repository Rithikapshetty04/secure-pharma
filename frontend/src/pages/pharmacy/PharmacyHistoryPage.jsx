<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

export default function PharmacyHistoryPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState('');

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getEvents({
        limit: 100,
        eventType: eventTypeFilter,
      });
      if (res.success) {
        setEvents(res.events);
      }
    } catch (err) {
      console.error('Error fetching pharmacy supply-chain history:', err);
=======
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supplyChainApi } from '../../services/api';
import {
  History,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Building2,
  MapPin,
  Clock,
  RefreshCw,
  Eye
} from 'lucide-react';

const PharmacyHistoryPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await supplyChainApi.getEvents({ limit: 100 });
      setEvents(res.data?.events || res.data || []);
    } catch (err) {
      console.error('Error fetching pharmacy history:', err);
>>>>>>> origin/main
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  useEffect(() => {
    loadHistory();
  }, [eventTypeFilter]);

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
            ⛓️ Pharmacy Custody & Verification History
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            End-to-end pharmaceutical lineage from manufacture to dispensary reception
          </p>
        </div>

        <Link to="/pharmacy/medicines" className="btn btn-primary btn-sm">
          💊 Browse Medicines
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e3a8a' }}>
            Filter Custodial Checkpoints
          </div>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
          >
            <option value="">All Checkpoints</option>
            <option value="DELIVERED">DELIVERED (Dispensary Arrival)</option>
            <option value="SOLD">SOLD (Dispensed to Patient)</option>
            <option value="TRANSFERRED">TRANSFERRED (Transit Hub)</option>
            <option value="MANUFACTURED">MANUFACTURED (Origin Release)</option>
=======
  const getEventBadge = (type) => {
    switch (type) {
      case 'RECEIVED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'SOLD':
      case 'DISPENSED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'TRANSFERRED':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const filteredEvents = events.filter(e => {
    const bNum = e.batch?.batchNumber || e.batchNumber || '';
    const prodName = e.batch?.productName || e.productName || '';
    const loc = e.location?.facility || e.location?.city || '';
    const matchesSearch =
      bNum.toLowerCase().includes(search.toLowerCase()) ||
      prodName.toLowerCase().includes(search.toLowerCase()) ||
      loc.toLowerCase().includes(search.toLowerCase());

    const matchesType = eventTypeFilter === 'ALL' || e.eventType === eventTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <History className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Pharmacy Custody & Dispensing History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete cryptographic audit trail of all medicine receipts, dispensary custody, and dispensing logs
          </p>
        </div>
        <button
          onClick={fetchHistory}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search batch, medicine, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-auto"
          >
            <option value="ALL">All Event Types</option>
            <option value="RECEIVED">Received</option>
            <option value="DELIVERED">Delivered</option>
            <option value="SOLD">Dispensed / Sold</option>
            <option value="TRANSFERRED">Transferred</option>
>>>>>>> origin/main
          </select>
        </div>
      </div>

<<<<<<< HEAD
      {/* History Table */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#2563eb', fontWeight: '600' }}>
            Loading custody history...
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
            No supply chain events recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>EVENT TYPE</th>
                  <th>BATCH NUMBER</th>
                  <th>FROM ENTITY</th>
                  <th>TO ENTITY</th>
                  <th>LOCATION</th>
                  <th>QUANTITY</th>
                  <th>TIMESTAMP</th>
                  <th style={{ textAlign: 'right' }}>VERIFY</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt) => (
                  <tr key={evt._id}>
                    <td>
                      <StatusBadge status={evt.eventType} />
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#1e3a8a' }}>
                      {evt.batch?.batchNumber || 'Batch Lot'}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{evt.fromOrganization?.name || 'Wholesale Supplier'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{evt.toOrganization?.name || 'Pharmacy Dispensary'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{evt.location || 'N/A'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{evt.quantity?.toLocaleString() || '-'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {new Date(evt.eventDate).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/verify/${evt.batch?.qrIdentifier || evt.batch?.batchNumber}`}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
=======
      {/* Timeline */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading audit history...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-medium text-slate-900 dark:text-white">No history records found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Supply chain lifecycle events recorded for your pharmacy will appear here chronologically.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
            {filteredEvents.map((evt, idx) => {
              const bNumber = evt.batch?.batchNumber || evt.batchNumber || 'UNKNOWN';
              const pName = evt.batch?.productName || evt.productName || 'Pharmaceutical Product';
              const batchId = evt.batch?._id || evt.batch || bNumber;

              return (
                <div key={evt._id || idx} className="relative group">
                  <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border-2 border-emerald-600 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 sm:p-5 hover:border-emerald-200 dark:hover:border-emerald-800/60 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${getEventBadge(evt.eventType)}`}>
                          {evt.eventType}
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          Batch: {bNumber}
                        </span>
                        <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                          ({pName})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(evt.timestamp || evt.createdAt || Date.now()).toLocaleString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-300 mb-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Actor / Custodian: <strong className="text-slate-800 dark:text-slate-200">{evt.performedBy?.name || evt.performedBy?.organization || 'Pharmacy Node'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Location: <strong className="text-slate-800 dark:text-slate-200">{evt.location?.facility || evt.location?.city || 'Pharmacy Dispensary'}</strong></span>
                      </div>
                    </div>

                    {evt.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/50 mb-3">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Notes: </span>
                        {evt.notes}
                      </p>
                    )}

                    {evt.dataHash && (
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 mb-3">
                        Event Hash: {evt.dataHash}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/50">
                      <Link
                        to={`/pharmacy/batches/${batchId}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                      >
                        View Batch
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <Link
                        to={`/verify/${bNumber}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verify
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
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

export default PharmacyHistoryPage;
>>>>>>> origin/main
