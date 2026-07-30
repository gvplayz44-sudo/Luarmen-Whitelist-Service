import React from 'react';

interface SidebarProps {
  plan: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOwner: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ plan, activeTab, setActiveTab, isOwner }) => {
  const items = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'scripts', label: '📜 Scripts' },
    ...(isOwner ? [{ id: 'users', label: '👥 Users' }, { id: 'killswitch', label: '🔫 Kill Switch' }] : []),
    { id: 'profile', label: '👤 Profile' },
  ];

  return (
    <div style={{ width: '240px', background: '#11141f', borderRight: '1px solid #1a1e2e', padding: '20px', minHeight: '100vh' }}>
      <h2 style={{ color: '#eef0f7', marginBottom: '20px' }}><span style={{ color: '#e8c468' }}>Luar</span>men</h2>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          style={{
            width: '100%',
            padding: '12px 16px',
            textAlign: 'left',
            background: activeTab === item.id ? '#1f2937' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            color: activeTab === item.id ? '#eef0f7' : '#8b90a8',
            cursor: 'pointer',
            marginBottom: '4px',
            fontSize: '14px',
          }}
        >
          {item.label}
        </button>
      ))}
      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #1a1e2e', color: '#5c6178', fontSize: '12px' }}>
        Plan: <span style={{ color: '#eef0f7', fontWeight: 'bold' }}>{plan}</span>
      </div>
    </div>
  );
};

export default Sidebar;