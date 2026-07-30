import { useState, useEffect } from 'react';

export function useScripts(apiKey: string) {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchScripts = async () => {
    if (!apiKey) return;
    try {
      const res = await fetch(`/api/scripts?api_key=${apiKey}`);
      if (res.ok) {
        const data = await res.json();
        setScripts(data.scripts || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchScripts(); }, [apiKey]);

  return { scripts, loading, refetch: fetchScripts };
}