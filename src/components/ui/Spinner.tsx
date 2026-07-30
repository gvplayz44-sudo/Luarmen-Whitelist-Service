import React from 'react';

export const Spinner: React.FC = () => {
  return <div style={{ border: '4px solid #1a1e2e', borderTop: '4px solid #e8c468', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />;
};