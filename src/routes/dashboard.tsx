import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardComponent from '../components/Dashboard';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('luarmen_user');
    if (!stored) {
      navigate('/');
      return;
    }
    setUser(JSON.parse(stored));
  }, []);

  if (!user) return <div>Loading...</div>;

  return <DashboardComponent user={user} />;
}