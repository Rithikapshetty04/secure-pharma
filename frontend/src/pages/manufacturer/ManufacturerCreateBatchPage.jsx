import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function ManufacturerCreateBatchPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [useExistingProduct, setUseExistingProduct] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState('');

  // Form Fields matching specification
  const [formData, setFormData] = useState({
    medicineName: '',
    genericName: '',
    category: 'Antibiotics & Anti-Infectives',
    dosageForm: 'Capsule (500mg)',
    batchNumber: '',
    quantity: 10000,
    unit: 'Bottles',
    manufacturingDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    location: 'Cleanroom Facility #1, Boston MA',
    description: 'Controlled room temperature between 15°C and 25°C. Keep dry.',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await api.getProducts({ limit: 100 });
        if (res.success && res.products.length > 0) {
          setProducts(res.products);
          setSelectedProductId(res.products[0]._id);
          setFormData((prev) => ({
            ...prev,
            medicineName: res.products[0].name,
            genericName: res.products[0].genericName || '',
            category: res.products[0].category || prev.category,
            dosageForm: res.products[0].dosageForm || prev.dosageForm,
          }));
        } else {
          setUseExistingProduct(false);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    loadProducts();
  }, []);

  const handleProductSelectChange = (productId) => {
    setSelectedProductId(productId);
    const prod = products.find((p) => p._id === productId);
    if (prod) {
      setFormData((prev) => ({
        ...prev,
        medicineName: prod.name,
        genericName: prod.genericName || '',
        category: prod.category || prev.category,
        dosageForm: `${prod.dosageForm || ''} ${prod.strength || ''}`.trim(),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!formData.batchNumber.trim()) {
      setError('Unique Batch Lot Number is required.');
      return;
    }

    if (new Date(formData.expiryDate) <= new Date(formData.manufacturingDate)) {
      setError('Expiry date must be strictly after the manufacturing date.');
      return;
    }

    if (formData.quantity <= 0) {
      setError('Production quantity must be at least 1.');
      return;
    }

    setLoading(true);

    try {
      let finalProductId = selectedProductId;

      // If user is registering a brand new product
      if (!useExistingProduct || !finalProductId) {
        const cleanProductCode = `NDC-${formData.medicineName.replace(/\s+/g, '-').toUpperCase().slice(0, 6)}-${Math.floor(100 + Math.random() * 900)}`;
        const prodRes = await api.createProduct({
          name: formData.medicineName,
          genericName: formData.genericName,
          category: formData.category,
          dosageForm: formData.dosageForm,
          productCode: cleanProductCode,
          description: formData.description,
          storageRequirements: formData.description,
        });

        if (!prodRes.success) {
          setError(`Product registration failed: ${prodRes.message}`);
          setLoading(false);
          return;
        }
        finalProductId = prodRes.product._id;
      }

      // Mint Batch
      const batchRes = await api.createBatch({
        productId: finalProductId,
        batchNumber: formData.batchNumber.trim().toUpperCase(),
        manufacturingDate: formData.manufacturingDate,
        expiryDate: formData.expiryDate,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        location: formData.location,
        storageRequirements: formData.description,
      });

      if (batchRes.success) {
        const createdBatchId = batchRes.batch._id;
        navigate(`/manufacturer/batches/${createdBatchId}?created=true`);
      } else {
        setError(batchRes.message || 'Failed to create batch.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred while creating batch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Back Link & Header */}
      <div style={{ marginBottom: '20px' }}>
        <Link
          to="/manufacturer/batches"
          style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}
        >
          ← Back to Medicines / Batches
        </Link>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '8px', color: '#1e293b' }}>
          ⚙️ Create & Serialize Production Batch
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Mint an authentic pharmaceutical batch into the supply-chain ledger
        </p>
      </div>

      <div className="glass-card" style={{ padding: '32px', background: '#ffffff' }}>
        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              color: '#b91c1c',
              fontSize: '0.85rem',
              marginBottom: '20px',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: Medicine Information */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1d4ed8', letterSpacing: '0.04em' }}>
                1. MEDICINE & PRODUCT INFORMATION
              </h3>
              {products.length > 0 && (
                <button
                  type="button"
                  onClick={() => setUseExistingProduct(!useExistingProduct)}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  {useExistingProduct ? '+ Create New Formulary Drug' : '↺ Select Existing Drug'}
                </button>
              )}
            </div>

            {useExistingProduct && products.length > 0 ? (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  SELECT REGISTERED FORMULARY PRODUCT *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductSelectChange(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}
                >
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.productCode}) — {p.dosageForm}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  MEDICINE NAME *
                </label>
                <input
                  type="text"
                  required
                  value={formData.medicineName}
                  onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                  placeholder="e.g. Amoxicillin Trihydrate"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  GENERIC / ACTIVE INGREDIENT
                </label>
                <input
                  type="text"
                  value={formData.genericName}
                  onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                  placeholder="e.g. Amoxicillin"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  MEDICINE CATEGORY
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                >
                  <option value="Antibiotics & Anti-Infectives">Antibiotics & Anti-Infectives</option>
                  <option value="Cardiovascular & Blood">Cardiovascular & Blood</option>
                  <option value="Analgesics & Anti-Inflammatory">Analgesics & Anti-Inflammatory</option>
                  <option value="Oncology & Immunotherapy">Oncology & Immunotherapy</option>
                  <option value="Vaccines & Biologics">Vaccines & Biologics</option>
                  <option value="General Pharmaceutical">General Pharmaceutical</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  DOSAGE & FORM
                </label>
                <input
                  type="text"
                  value={formData.dosageForm}
                  onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                  placeholder="e.g. Oral Capsule (500mg)"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  MANUFACTURER NAME
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.organization?.name || user?.name || 'Verified Manufacturer'}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', background: '#f1f5f9' }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Batch & Manufacturing Information */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#059669', marginBottom: '14px', letterSpacing: '0.04em' }}>
              2. BATCH SERIALIZATION & QUANTITY
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  UNIQUE BATCH NUMBER *
                </label>
                <input
                  type="text"
                  required
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  placeholder="e.g. BATCH-2026-AMOX-880"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '700',
                    color: '#1e3a8a',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  QUANTITY PRODUCED *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  PACKAGING UNIT
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g. Bottles, Vials, Blisters"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  MANUFACTURING DATE *
                </label>
                <input
                  type="date"
                  required
                  value={formData.manufacturingDate}
                  onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  EXPIRY DATE *
                </label>
                <input
                  type="date"
                  required
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  MANUFACTURING FACILITY / LOCATION
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. GMP Cleanroom #2, Cambridge MA Facility"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  STORAGE REQUIREMENTS & DESCRIPTION
                </label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Store at controlled room temp 15°C to 25°C. Protect from moisture."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/manufacturer/batches')}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ minWidth: '160px' }}
            >
              {loading ? 'Creating Batch...' : '⚙️ Create Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
