import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function ManufacturerCreateBatchPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Mode: select existing or register new inline
  const [isNewProduct, setIsNewProduct] = useState(false);

  const [formData, setFormData] = useState({
    productId: '',
    // If new product:
    newProductName: '',
    genericName: '',
    category: 'Antibiotic / Anti-Infective',
    dosageForm: 'Capsule',
    strength: '500mg',
    productCode: '',
    // Batch Info:
    batchNumber: '',
    quantity: 10000,
    unit: 'Units',
    manufacturingDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    location: user?.organization?.address || 'Primary Cleanroom Facility #1',
    storageRequirements: 'Store at controlled room temperature (15°C to 25°C)',
    description: '',
  });

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await api.getProducts({ limit: 100 });
        if (res.success) {
          setProducts(res.products);
          if (res.products.length > 0) {
            setFormData((prev) => ({ ...prev, productId: res.products[0]._id }));
          } else {
            setIsNewProduct(true);
          }
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Validation
    if (!formData.batchNumber.trim()) {
      setError('Batch number is required.');
      return;
    }

    if (Number(formData.quantity) <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }

    const mfgDate = new Date(formData.manufacturingDate);
    const expDate = new Date(formData.expiryDate);

    if (expDate <= mfgDate) {
      setError('Expiry date must be after manufacturing date.');
      return;
    }

    setSubmitting(true);

    try {
      let targetProductId = formData.productId;

      // If user is registering a new product inline:
      if (isNewProduct) {
        if (!formData.newProductName.trim() || !formData.productCode.trim()) {
          setError('Medicine Name and Product Code are required.');
          setSubmitting(false);
          return;
        }

        const prodRes = await api.createProduct({
          name: formData.newProductName.trim(),
          genericName: formData.genericName.trim(),
          category: formData.category,
          dosageForm: formData.dosageForm,
          strength: formData.strength,
          productCode: formData.productCode.trim().toUpperCase(),
          storageRequirements: formData.storageRequirements,
          description: formData.description,
        });

        if (!prodRes.success) {
          setError(prodRes.message || 'Failed to register new medicine formulary.');
          setSubmitting(false);
          return;
        }

        targetProductId = prodRes.product._id;
      }

      if (!targetProductId) {
        setError('Please select or register a pharmaceutical medicine formulation.');
        setSubmitting(false);
        return;
      }

      const batchPayload = {
        productId: targetProductId,
        batchNumber: formData.batchNumber.trim().toUpperCase(),
        manufacturingDate: formData.manufacturingDate,
        expiryDate: formData.expiryDate,
        quantity: Number(formData.quantity),
        unit: formData.unit.trim() || 'Units',
        location: formData.location.trim(),
        storageRequirements: formData.storageRequirements.trim(),
      };

      const res = await api.createBatch(batchPayload);

      if (res.success && res.batch) {
        setSuccessMsg(`✓ Batch #${res.batch.batchNumber} created successfully! Redirecting...`);
        setTimeout(() => {
          navigate(`/manufacturer/batches/${res.batch._id}`);
        }, 1200);
      } else {
        setError(res.message || 'Failed to create batch.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during batch creation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '820px', margin: '30px auto 80px', padding: '0 20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link
          to="/manufacturer/batches"
          style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}
        >
          ← Back to Batches
        </Link>
      </div>

      <div className="glass-card" style={{ padding: '36px', background: '#ffffff' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>
            ➕ Create & Mint New Pharmaceutical Batch
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '4px' }}>
            Enter medicine details, serialization lot number, quantity, and manufacturing parameters.
          </p>
        </div>

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              color: '#b91c1c',
              fontSize: '0.85rem',
              marginBottom: '20px',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              color: '#047857',
              fontSize: '0.85rem',
              marginBottom: '20px',
              fontWeight: '600',
            }}
          >
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Section 1: Medicine Information */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1d4ed8', letterSpacing: '0.04em' }}>
                1. MEDICINE FORMULATION INFORMATION
              </h4>

              {products.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsNewProduct(!isNewProduct)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  {isNewProduct ? '← Select Existing Drug' : '+ Register New Formulation'}
                </button>
              )}
            </div>

            {!isNewProduct && products.length > 0 ? (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  SELECT MEDICINE *
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9rem',
                  }}
                >
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.productCode}) — {p.dosageForm}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                    MEDICINE NAME *
                  </label>
                  <input
                    type="text"
                    required={isNewProduct}
                    value={formData.newProductName}
                    onChange={(e) => setFormData({ ...formData, newProductName: e.target.value })}
                    placeholder="e.g. Paracetamol 500mg"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                    GENERIC NAME
                  </label>
                  <input
                    type="text"
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    placeholder="e.g. Acetaminophen"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                    PRODUCT CODE / NDC *
                  </label>
                  <input
                    type="text"
                    required={isNewProduct}
                    value={formData.productCode}
                    onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                    placeholder="e.g. PARA-500MG-TAB"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                    CATEGORY
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                  >
                    <option value="Antibiotic / Anti-Infective">Antibiotic / Anti-Infective</option>
                    <option value="Analgesic / Pain">Analgesic / Pain</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Biological / Vaccine">Biological / Vaccine</option>
                    <option value="Respiratory">Respiratory</option>
                    <option value="General Pharmaceutical">General Pharmaceutical</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                    DOSAGE FORM
                  </label>
                  <input
                    type="text"
                    value={formData.dosageForm}
                    onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                    placeholder="e.g. Tablet, Capsule, Syrup"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                    STRENGTH
                  </label>
                  <input
                    type="text"
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    placeholder="e.g. 500mg"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Batch & Serialization Information */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#059669', marginBottom: '14px', letterSpacing: '0.04em' }}>
              2. SERIALIZATION & BATCH SPECIFICATIONS
            </h4>

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
                  placeholder="e.g. BATCH-2026-PARA-001"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: '600' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  MANUFACTURER NAME
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.organization?.name || 'Manufacturer'}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', background: '#f1f5f9' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  QUANTITY *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="10000"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  UNIT CLASSIFICATION
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g. Bottles, Boxes, Vials"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Manufacturing Dates & Location */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#7c3aed', marginBottom: '14px', letterSpacing: '0.04em' }}>
              3. MANUFACTURING DATES & FACILITY
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
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
                  MANUFACTURING LOCATION / CLEANROOM FACILITY
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Sterile Cleanroom Suite 4, Boston MA"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  STORAGE & HANDLING REQUIREMENTS
                </label>
                <input
                  type="text"
                  value={formData.storageRequirements}
                  onChange={(e) => setFormData({ ...formData, storageRequirements: e.target.value })}
                  placeholder="e.g. Store at controlled room temperature 15°C to 25°C"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ padding: '14px', fontSize: '1rem', marginTop: '6px' }}
          >
            {submitting ? 'Creating & Registering Batch...' : 'Create Batch & Generate Proof'}
          </button>
        </form>
      </div>
    </div>
  );
}
