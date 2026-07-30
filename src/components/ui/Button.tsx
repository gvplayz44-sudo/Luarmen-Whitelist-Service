import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, ...props }) => {
  const colors = {
    primary: { bg: '#e8c468', color: '#0a0c14' },
    secondary: { bg: '#1f2937', color: '#eef0f7' },
    danger: { bg: '#ff6b6b', color: '#fff' },
  };
  const style = colors[variant];
  return (
    <button
      {...props}
      style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', background: style.bg, color: style.color, ...props.style }}
    >
      {children}
    </button>
  );
};