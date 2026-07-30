import React, { useState } from 'react';
import PlanBadge from './PlanBadge';

interface UserCardProps {
  user: any;
  onUpdate?: () => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onUpdate }) => {
  const [plan, setPlan] = useState(user.plan || 'free');
  const [isUpdating, setIsUpdating] = useState(false);
  const isOwner = user.plan === 'owner' || user.username === 'yathush';

  const handlePlanChange = async (newPlan: string) => {
    if (isOwner) {
      alert('Cannot modify owner');
      return;
    }
    setIsUpdating(true);
    try {
      const userData = JSON.parse(localStorage.getItem('luarmen_user') || '{}');
      const res = await fetch('/api/update-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: userData.api_key,
          user_id: user.id,
          new_plan: newPlan,
        }),
      });
      if (res.ok) {
        setPlan(newPlan);
        alert('Plan updated');
        onUpdate?.();
      } else {
        alert('Failed to update plan');
      }
    } catch (e) {
      alert('Error');
    }
    setIsUpdating(false);
  };

  const handleWhitelist = async () => {
    const days = prompt('Days to whitelist (leave blank for permanent)');
    const duration = days ? parseInt(days) : 0;
    if (days && isNaN(duration)) return;
    try {
      const userData = JSON.parse(localStorage.getItem('luarmen_user') || '{}');
      const res = await fetch('/api/owner/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: userData.api_key,
          user_id: user.id,
          plan: 'premium',
          duration_days: duration,
        }),
      });
      if (res.ok) {
        alert('Whitelisted');
        onUpdate?.();
      } else {
        alert('Failed');
      }
    } catch (e) {
      alert('Error');
    }
  };

  const handleBlacklist = async () => {
    const reason = prompt('Reason for blacklist');
    if (reason === null) return;
    try {
      const userData = JSON.parse(localStorage.getItem('luarmen_user') || '{}');
      const res = await fetch('/api/owner/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: userData.api_key,
          user_id: user.id,
          reason: reason || 'No reason',
        }),
      });
      if (res.ok) {
        alert('Blacklisted');
        onUpdate?.();
      } else {
        alert('Failed');
      }
    } catch (e) {
      alert('Error');
    }
  };

  const handleUnblacklist = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('luarmen_user') || '{}');
      const res = await fetch(`/api/owner/blacklist?api_key=${userData.api_key}&user_id=${user.id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Unblacklisted');
        onUpdate?.();
      } else {
        alert('Failed');
      }
    } catch (e) {
      alert('Error');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete user? This cannot be undone.')) return;
    try {
      const userData = JSON.parse(localStorage.getItem('luarmen_user') || '{}');
      const res = await fetch(`/api/owner/delete-user?api_key=${userData.api_key}&user_id=${user.id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Deleted');
        onUpdate?.();
      } else {
        alert('Failed');
      }
    } catch (e) {
      alert('Error');
    }
  };

  return (
    <div style={{ background: '#11141f', border: '1px solid #1a1e2e', borderRadius: '12px', padding: '16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#eef0f7', fontWeight: 'bold' }}>{user.username}</span>
          <PlanBadge plan={plan} />
          {isOwner && <span style={{ fontSize: '12px', background: '#e8c468', color: '#000', padding: '2px 8px', borderRadius: '4px' }}>👑 OWNER</span>}
        </div>
        {user.blacklisted && <div style={{ color: '#ff6b6b', fontSize: '12px' }}>🚫 Blacklisted: {user.blacklist_reason || 'No reason'}</div>}
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {!isOwner && (
          <>
            <select
              value={plan}
              onChange={(e) => handlePlanChange(e.target.value)}
              disabled={isUpdating}
              style={{ background: '#1f2937', color: '#eef0f7', border: '1px solid #1a1e2e', borderRadius: '6px', padding: '4px 8px', fontSize: '12px' }}
            >
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="pro">Pro</option>
            </select>
            {!user.whitelisted && !user.blacklisted && (
              <button onClick={handleWhitelist} style={{ padding: '4px 12px', background: '#3ddc84', border: 'none', borderRadius: '6px', color: '#000', cursor: 'pointer', fontSize: '12px' }}>
                ✅ Whitelist
              </button>
            )}
            {user.blacklisted ? (
              <button onClick={handleUnblacklist} style={{ padding: '4px 12px', background: '#3ddc84', border: 'none', borderRadius: '6px', color: '#000', cursor: 'pointer', fontSize: '12px' }}>
                🔓 Unblacklist
              </button>
            ) : (
              <button onClick={handleBlacklist} style={{ padding: '4px 12px', background: '#ff6b6b', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>
                🚫 Blacklist
              </button>
            )}
            <button onClick={handleDelete} style={{ padding: '4px 12px', background: '#ff6b6b', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>
              🗑 Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default UserCard;