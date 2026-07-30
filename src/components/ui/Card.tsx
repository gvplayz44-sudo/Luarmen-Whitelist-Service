import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <div className={className} style={{ background: '#11141f', border: '1px solid #1a1e2e', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
      {children}
    </div>
  );
};