'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.assign('/login');
  }

  return (
    <Button variant="ghost" size="sm" onClick={logout} disabled={loading}>
      {loading ? 'Cerrando...' : 'Cerrar sesión'}
    </Button>
  );
}
