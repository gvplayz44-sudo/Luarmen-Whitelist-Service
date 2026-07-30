import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#11141f', border: '1px solid #1a1e2e', borderRadius: '16px', padding: '24px', maxWidth: '500px', width: '100%' }}>
        {children}
        <button onClick={onClose} style={{ marginTop: '16px', padding: '8px 16px', background: '#ff6b6b', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>Close</button>
      </div>
    </div>
  );
};