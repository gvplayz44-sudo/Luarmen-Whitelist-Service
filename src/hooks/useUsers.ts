import { useState, useEffect } from 'react';

export function useUsers(apiKey: string) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    if (!apiKey) return;
    try {
      const res = await fetch(`/api/owner/all-users?api_key=${apiKey}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [apiKey]);

  return { users, loading, refetch: fetchUsers };
}