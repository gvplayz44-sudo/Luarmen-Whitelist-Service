import React from 'react';

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => {
  return (
    <input
      {...props}
      style={{ width: '100%', padding: '12px', background: '#0c0e18', border: '1px solid #1a1e2e', borderRadius: '8px', color: '#eef0f7', fontSize: '14px', ...props.style }}
    />
  );
};