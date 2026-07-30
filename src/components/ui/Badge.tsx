import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, color = '#e8c468' }) => {
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '20px', background: color, color: '#0a0c14', fontSize: '12px', fontWeight: 'bold' }}>
      {children}
    </span>
  );
};