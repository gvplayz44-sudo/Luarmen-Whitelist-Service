export function generateLoaderId(): string {
  return Array.from({ length: 32 }, () =>
    '0123456789abcdef'.charAt(Math.floor(Math.random() * 16))
  ).join('');
}

export function generateScriptKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 32 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}