'use client';
import { use } from 'react';
import { browser } from 'react-dom';
import { AuthProvider } from '@/lib/auth';

/** La sesión vive en localStorage: todo lo de aquí abajo se renderiza solo en el navegador. */
export function Providers({ children }: { children: React.ReactNode }) {
  use(browser('La sesión se guarda en localStorage'));
  return <AuthProvider>{children}</AuthProvider>;
}
