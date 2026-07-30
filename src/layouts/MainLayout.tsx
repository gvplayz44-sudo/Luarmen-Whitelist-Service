import React from 'react';
import Sidebar from '../components/Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  plan: string;
  isOwner: boolean;
}

export default function MainLayout({ children, activeTab, setActiveTab, plan, isOwner }: MainLayoutProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0c14', color: '#eef0f7' }}>
      <Sidebar plan={plan} activeTab={activeTab} setActiveTab={setActiveTab} isOwner={isOwner} />
      <div style={{ flex: 1, padding: '24px 32px' }}>
        {children}
      </div>
    </div>
  );
}