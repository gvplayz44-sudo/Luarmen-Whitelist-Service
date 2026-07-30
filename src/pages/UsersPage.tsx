import React from 'react';
import { useUsers } from '../hooks/useUsers';
import UserCard from '../components/UserCard';

export default function UsersPage({ apiKey }: { apiKey: string }) {
  const { users, loading, refetch } = useUsers(apiKey);
  if (loading) return <div>Loading...</div>;
  return (
    <div>
      <h2>All Users</h2>
      <div style={{ marginTop: '16px' }}>
        {users.map((user: any) => (
          <UserCard key={user.id} user={user} onUpdate={refetch} />
        ))}
      </div>
    </div>
  );
}