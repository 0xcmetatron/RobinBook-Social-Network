'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { DmChat } from '@/components/dm-chat';

interface User { id: number; username: string; full_name: string | null; profile_image: string | null; isAdmin?: boolean; }

export function GlobalWidgets({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUser();
    // Auto sync token via backend if dev_wallet is set
    fetch('/api/sync-token').catch(() => {});
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) { const data = await res.json(); setUser(data); }
    } catch {}
  };

  if (pathname === '/') return <>{children}</>;

  return (
    <>
      {children}
      {user && <DmChat user={user} />}
    </>
  );
}
