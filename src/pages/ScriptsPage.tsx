import React from 'react';
import { useScripts } from '../hooks/useScripts';
import ScriptCard from '../components/ScriptCard';

export default function ScriptsPage({ apiKey, plan }: { apiKey: string; plan: string }) {
  const { scripts, loading } = useScripts(apiKey);
  if (loading) return <div>Loading...</div>;
  return (
    <div>
      <h2>Your Scripts</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
        {scripts.map((script: any) => (
          <ScriptCard key={script.id} script={script} plan={plan} />
        ))}
      </div>
    </div>
  );
}