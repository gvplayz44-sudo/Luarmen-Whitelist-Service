import React from 'react';

interface ToggleProps {
  enabled: boolean;
  onChange: () => void;
}

export const Toggle: React.FC<ToggleProps> = ({ enabled, onChange }) => {
  return (
    <div
      onClick={onChange}
      style={{ width: '48px', height: '26px', background: enabled ? '#3ddc84' : '#4a4a4a', borderRadius: '13px', cursor: 'pointer', transition: 'background 0.2s', position: 'relative' }}
    >
      <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', left: enabled ? '25px' : '3px', transition: 'left 0.2s' }} />
    </div>
  );
};