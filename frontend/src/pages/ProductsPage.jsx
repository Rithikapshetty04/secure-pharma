import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    brandName: '',
    productCode: '',
    regulatoryApprovalNumber: '',
    category: 'Antibiotic / Anti-Infective',
    dosageForm: 'Capsule',
    strength: '',
    packageSize: '',
    description: '',
    storageRequirements: 'Store at 15°C to 25°C',
  });

  const isMfgOrAdmin = user?.role === 'MANUFACTURER' || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'REGULATOR';

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.getProducts({ page, limit: 12, search, category });
      if (res.success) {
        setProducts(res.products);
        setTotal(res.total);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [page, category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createProduct(formData);
      if (res.success) {
        alert('✓ Pharmaceutical product registered in formulary.');
        setShowCreateModal(false);
        setFormData({
          name: '',
          genericName: '',
          brandName: '',
          productCode: '',
          regulatoryApprovalNumber: '',
          category: 'Antibiotic / Anti-Infective',
          dosageForm: 'Capsule',
          strength: '',
          packageSize: '',
          description: '',
          storageRequirements: 'Store at 15°C to 25°C',
        });
        loadProducts();
      } else {
        alert(`Failed: ${res.message}`);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>
            💊 Pharmaceutical Formulary Catalog
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '4px' }}>
            Verified medicinal products and regulatory GTIN/NDC registrations
          </p>
        </div>

        {isMfgOrAdmin && (
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            ➕ Register New Drug
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by drug name, brand, or GTIN/NDC..."
            style={{
              flex: 1,
              minWidth: '240px',
              padding: '10px 14px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: '0.85rem',
            }}
          />

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '10px 14px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: '0.85rem',
            }}
          >
            <option value="">All Categories</option>
            <option value="Antibiotic / Anti-Infective">Antibiotic / Anti-Infective</option>
            <option value="Biological / Vaccine">Biological / Vaccine</option>
            <option value="Cardiovascular">Cardiovascular</option>
            <option value="Analgesic / Pain">Analgesic / Pain</option>
            <option value="Oncology">Oncology</option>
            <option value="Respiratory">Respiratory</option>
          </select>

          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--accent-cyan)' }}>
          Loading registered pharmaceutical formulary...
        </div>
      ) : products.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
          No pharmaceutical products found matching criteria.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '20px',
        }}>
          {products.map((p) => (
            <div key={p._id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                  {p.category}
                </span>
                <StatusBadge status={p.status} />
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
                {p.name}
              </h3>

              {p.genericName && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
                  Generic: {p.genericName}
                </div>
              )}

              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                margin: '10px 0 16px',
                fontSize: '0.8rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
              }}>
                <div>
                  <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.7rem' }}>PRODUCT CODE</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{p.productCode}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.7rem' }}>DOSAGE / FORM</span>
                  <strong>{p.dosageForm} ({p.strength || 'N/A'})</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.7rem' }}>NDC / REG ID</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{p.regulatoryApprovalNumber || 'FDA-REG'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.7rem' }}>MANUFACTURER</span>
                  <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                    {p.manufacturer?.name || 'Verified Mfg'}
                  </strong>
                </div>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                <Link
                  to={`/products/${p._id}`}
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  Drug Details & Batches →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Register New Pharmaceutical Drug</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-outline btn-sm">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  PRODUCT TRADE NAME *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Amoxicillin Trihydrate 500mg"
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                    GENERIC NAME
                  </label>
                  <input
                    type="text"
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    placeholder="e.g. Amoxicillin"
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                    BRAND NAME
                  </label>
                  <input
                    type="text"
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    placeholder="e.g. AmoxApex"
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                    UNIQUE PRODUCT CODE / GTIN *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.productCode}
                    onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                    placeholder="e.g. AMOX-500MG"
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                    REGULATORY APPROVAL / NDC #
                  </label>
                  <input
                    type="text"
                    value={formData.regulatoryApprovalNumber}
                    onChange={(e) => setFormData({ ...formData, regulatoryApprovalNumber: e.target.value })}
                    placeholder="e.g. NDC-65123-401-10"
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                    CATEGORY
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                  >
                    <option value="Antibiotic / Anti-Infective">Antibiotic / Anti-Infective</option>
                    <option value="Biological / Vaccine">Biological / Vaccine</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Analgesic / Pain">Analgesic / Pain</option>
                    <option value="Oncology">Oncology</option>
                    <option value="Respiratory">Respiratory</option>
                    <option value="General Pharmaceutical">General Pharmaceutical</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                    DOSAGE FORM
                  </label>
                  <input
                    type="text"
                    value={formData.dosageForm}
                    onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                    placeholder="e.g. Capsule, Tablet, Injectable"
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                    STRENGTH
                  </label>
                  <input
                    type="text"
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    placeholder="e.g. 500mg, 10mg/ml"
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                    PACKAGE SIZE
                  </label>
                  <input
                    type="text"
                    value={formData.packageSize}
                    onChange={(e) => setFormData({ ...formData, packageSize: e.target.value })}
                    placeholder="e.g. 100 Capsules / Bottle"
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  STORAGE REQUIREMENTS
                </label>
                <input
                  type="text"
                  value={formData.storageRequirements}
                  onChange={(e) => setFormData({ ...formData, storageRequirements: e.target.value })}
                  placeholder="e.g. Store at controlled room temperature 15°C to 25°C"
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px', padding: '12px' }}>
                ✓ Save Drug to Formulary
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
