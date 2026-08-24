import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactPhone: '',
    registrationNumber: '',
  });

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.getMe();
      if (res.success) {
        setProfile(res.user);
        setLicense(res.license);
        setFormData({
          name: res.user?.organization?.name || '',
          address: res.user?.organization?.address || '',
          contactPhone: res.user?.organization?.contactPhone || '',
          registrationNumber: res.user?.organization?.registrationNumber || '',
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!profile?.organization?._id) return;

    try {
      const res = await api.updateOrganization(profile.organization._id, formData);
      if (res.success) {
        alert('✓ Organization profile updated.');
        setIsEditing(false);
        await refreshUser();
        loadProfile();
      } else {
        alert(`Failed: ${res.message}`);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--accent-cyan)' }}>
        Loading entity credentials...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '30px auto 80px', padding: '0 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>
          👤 Organization & User Profile
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '4px' }}>
          Registered identity, compliance status, and regulatory authorization
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* User Account Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Authorized Representative</h3>
            <StatusBadge status={user?.accountStatus} />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            fontSize: '0.85rem',
          }}>
            <div>
              <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>FULL NAME</span>
              <strong style={{ fontSize: '1rem', color: '#fff' }}>{user?.name}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>AUTHORIZED EMAIL</span>
              <strong style={{ color: 'var(--accent-cyan)' }}>{user?.email}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>ROLE PERMISSION</span>
              <StatusBadge status={user?.role} />
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>LAST SESSION</span>
              <span style={{ color: 'var(--text-muted)' }}>
                {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Active Session'}
              </span>
            </div>
          </div>
        </div>

        {/* Organization Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Organization Information</h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-outline btn-sm"
            >
              {isEditing ? 'Cancel' : '✏️ Edit Profile'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  ORGANIZATION LEGAL NAME
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  HEADQUARTERS ADDRESS
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                    CONTACT PHONE
                  </label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                    REGISTRATION NUMBER
                  </label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: '10px', alignSelf: 'flex-start' }}>
                Save Profile Changes
              </button>
            </form>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              fontSize: '0.85rem',
            }}>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>LEGAL ENTITY</span>
                <strong style={{ fontSize: '1rem', color: '#fff' }}>{profile?.organization?.name || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>ENTITY CLASSIFICATION</span>
                <StatusBadge status={profile?.organization?.type || user?.role} />
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>REGISTRATION NUMBER</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>{profile?.organization?.registrationNumber || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>FACILITY ADDRESS</span>
                <span>{profile?.organization?.address || 'Address pending'}</span>
              </div>
            </div>
          )}
        </div>

        {/* License Credentials Card */}
        {license && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Active Regulatory License</h3>
              <StatusBadge status={license.verificationStatus} />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              fontSize: '0.85rem',
            }}>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>LICENSE NUMBER</span>
                <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: '#fff' }}>
                  {license.licenseNumber}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>CLASSIFICATION</span>
                <StatusBadge status={license.licenseType} />
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>EXPIRATION DATE</span>
                <strong style={{ color: new Date(license.expiryDate) < new Date() ? '#ef4444' : '#10b981' }}>
                  {new Date(license.expiryDate).toLocaleDateString()}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>ISSUING AUTHORITY</span>
                <span>{license.issuingAuthority}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
