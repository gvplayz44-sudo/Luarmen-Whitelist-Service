import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Index() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username and password required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        const res = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: apiKey || username }),
        });
        const data = await res.json();
        if (data.valid) {
          localStorage.setItem('luarmen_user', JSON.stringify({
            api_key: apiKey || username,
            plan: data.plan,
            username: data.username,
          }));
          navigate('/dashboard');
        } else {
          setError(data.message || 'Invalid credentials');
        }
      } else {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            password,
            api_key: apiKey || '',
          }),
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('luarmen_user', JSON.stringify({
            api_key: data.api_key,
            plan: data.plan,
            username: data.username,
          }));
          navigate('/dashboard');
        } else {
          setError(data.message || 'Signup failed');
        }
      }
    } catch (err) {
      setError('Connection error');
    }
    setLoading(false);
  };

  return (
    <div style={{ background: '#0a0c14', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eef0f7', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#11141f', border: '1px solid #1a1e2e', borderRadius: '16px', padding: '40px', maxWidth: '440px', width: '100%' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '28px' }}>
          <span style={{ color: '#e8c468' }}>Luar</span>men
        </h1>
        <p style={{ color: '#8b90a8', textAlign: 'center', marginBottom: '20px' }}>
          {isLogin ? 'Log in with your API key' : 'Create your account'}
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: '12px', background: '#0c0e18', border: '1px solid #1a1e2e', borderRadius: '8px', color: '#eef0f7', fontSize: '14px', marginBottom: '12px' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '12px', background: '#0c0e18', border: '1px solid #1a1e2e', borderRadius: '8px', color: '#eef0f7', fontSize: '14px', marginBottom: '12px' }}
          />
          {!isLogin && (
            <input
              type="text"
              placeholder="API Key (optional – leave blank for free)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{ width: '100%', padding: '12px', background: '#0c0e18', border: '1px solid #1a1e2e', borderRadius: '8px', color: '#eef0f7', fontSize: '14px', marginBottom: '12px' }}
            />
          )}
          {error && <p style={{ color: '#ff6b6b', fontSize: '13px', marginBottom: '10px' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '12px', background: '#e8c468', color: '#0a0c14', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>
        <p style={{ color: '#8b90a8', textAlign: 'center', marginTop: '16px', fontSize: '14px' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ color: '#e8c468', cursor: 'pointer' }}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
        </p>
      </div>
    </div>
  );
}