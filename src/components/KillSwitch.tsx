import React, { useState, useEffect } from 'react';

const KillSwitch: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/owner/kill-switch');
      if (res.ok) {
        const data = await res.json();
        setIsEnabled(data.enabled || false);
      }
    } catch (e) {
      console.error('Failed to fetch kill switch status', e);
    }
  };

  const toggle = async () => {
    const confirmAction = window.confirm(isEnabled ? 'Enable all scripts?' : 'Disable ALL scripts?');
    if (!confirmAction) return;
    setLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem('luarmen_user') || '{}');
      const res = await fetch('/api/owner/kill-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: userData.api_key,
          enabled: !isEnabled,
        }),
      });
      if (res.ok) {
        setIsEnabled(!isEnabled);
        alert(!isEnabled ? '✅ All scripts enabled' : '⚠️ All scripts disabled');
      } else {
        alert('Failed to toggle');
      }
    } catch (e) {
      alert('Error');
    }
    setLoading(false);
  };

  return (
    <div style={{ background: '#11141f', border: '1px solid #1a1e2e', borderRadius: '12px', padding: '24px', maxWidth: '400px' }}>
      <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>🔫 Global Kill Switch</h3>
      <p style={{ color: '#8b90a8', fontSize: '14px', marginBottom: '16px' }}>
        {isEnabled ? '🔴 All scripts DISABLED' : '🟢 All scripts ENABLED'}
      </p>
      <button
        onClick={toggle}
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: 'none',
          fontWeight: 'bold',
          cursor: 'pointer',
          background: isEnabled ? '#3ddc84' : '#ff6b6b',
          color: isEnabled ? '#000' : '#fff',
        }}
      >
        {loading ? 'Processing...' : isEnabled ? 'Enable All Scripts' : 'Disable All Scripts'}
      </button>
    </div>
  );
};

export default KillSwitch;