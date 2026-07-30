import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ScriptCard from './ScriptCard';
import UserCard from './UserCard';
import StatsCard from './StatsCard';
import KillSwitch from './KillSwitch';
import PlanBadge from './PlanBadge';

interface DashboardProps {
  user: any;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [scripts, setScripts] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total_scripts: 0, total_users: 0, total_downloads: 0 });
  const [loading, setLoading] = useState(true);
  const [uploadName, setUploadName] = useState('');
  const [uploadCode, setUploadCode] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const isOwner = user.plan === 'owner';
  const canUpload = user.plan !== 'free';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [scriptsRes, usersRes, statsRes] = await Promise.all([
        fetch(`/api/scripts?api_key=${user.api_key}`),
        fetch(`/api/owner/all-users?api_key=${user.api_key}`),
        fetch(`/api/stats?api_key=${user.api_key}`),
      ]);
      if (scriptsRes.ok) setScripts((await scriptsRes.json()).scripts || []);
      if (usersRes.ok) setUsers((await usersRes.json()).users || []);
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (e) {
      console.error('Failed to load data', e);
    }
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!uploadName || !uploadCode) {
      alert('Please fill in both fields');
      return;
    }
    setUploading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: user.api_key,
          script_name: uploadName,
          source_code: uploadCode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Script uploaded!');
        setUploadName('');
        setUploadCode('');
        loadData();
      } else {
        alert('❌ ' + data.error);
      }
    } catch (e) {
      alert('❌ Upload failed');
    }
    setUploading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('luarmen_user');
    window.location.href = '/';
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0c14', color: '#eef0f7' }}>
      <Sidebar 
        plan={user.plan} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOwner={isOwner} 
        canUpload={canUpload}
      />
      <div style={{ flex: 1, padding: '24px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          <div>
            <PlanBadge plan={user.plan} />
            <button onClick={handleLogout} style={{ marginLeft: '16px', padding: '8px 16px', background: '#ff6b6b', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
              <StatsCard title="Scripts" value={stats.total_scripts || 0} icon="📜" />
              <StatsCard title="Users" value={stats.total_users || 0} icon="👥" />
              <StatsCard title="Downloads" value={stats.total_downloads || 0} icon="📥" />
              <StatsCard title="Plan" value={user.plan} icon="💎" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {scripts.map((script: any) => (
                <ScriptCard key={script.id} script={script} plan={user.plan} />
              ))}
            </div>
          </>
        )}

        {activeTab === 'upload' && canUpload && (
          <div style={{ maxWidth: '500px' }}>
            <h2>Upload Script</h2>
            <input
              type="text"
              placeholder="Script Name"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              style={{ width: '100%', padding: '12px', background: '#0c0e18', border: '1px solid #1a1e2e', borderRadius: '8px', color: '#eef0f7', fontSize: '14px', marginBottom: '12px' }}
            />
            <textarea
              placeholder="Paste your Lua source code..."
              value={uploadCode}
              onChange={(e) => setUploadCode(e.target.value)}
              rows={10}
              style={{ width: '100%', padding: '12px', background: '#0c0e18', border: '1px solid #1a1e2e', borderRadius: '8px', color: '#eef0f7', fontFamily: 'monospace', resize: 'vertical', marginBottom: '12px' }}
            />
            <button
              onClick={handleUpload}
              disabled={uploading}
              style={{ padding: '12px 24px', background: '#e8c468', color: '#0a0c14', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {uploading ? 'Uploading...' : '🚀 Upload Script'}
            </button>
          </div>
        )}

        {isOwner && activeTab === 'users' && (
          <div>
            <h2>User Management</h2>
            <div style={{ marginTop: '16px' }}>
              {users.map((u: any) => (
                <UserCard key={u.id} user={u} onUpdate={loadData} />
              ))}
            </div>
          </div>
        )}

        {isOwner && activeTab === 'killswitch' && <KillSwitch />}
      </div>
    </div>
  );
};

export default Dashboard;
