import React from 'react';

interface PlanBadgeProps {
  plan: string;
}

const PlanBadge: React.FC<PlanBadgeProps> = ({ plan }) => {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    owner: { bg: '#e8c468', text: '#1a1206', label: '👑 Owner' },
    pro: { bg: '#a855f7', text: '#fff', label: '⭐ Pro' },
    premium: { bg: '#3b82f6', text: '#fff', label: '💎 Premium' },
    basic: { bg: '#22c55e', text: '#fff', label: '🔰 Basic' },
    free: { bg: '#6b7280', text: '#fff', label: 'Free' },
  };
  const style = styles[plan] || styles.free;
  return (
    <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '20px', backgroundColor: style.bg, color: style.text }}>
      {style.label}
    </span>
  );
};

export default PlanBadge;