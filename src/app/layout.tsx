import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Toaster } from 'sonner';
import { Providers } from '@/components/providers';
import { Cargador } from '@/components/marca';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Sistema Académico · CUL', template: '%s · Sistema Académico CUL' },
  description: 'Gestión académica de la Corporación Universitaria Latinoamericana',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO">
      <body>
        <Suspense fallback={<Cargador />}>
          <Providers>{children}</Providers>
        </Suspense>
        <Toaster position="top-right" richColors closeButton toastOptions={{ style: { fontFamily: 'var(--font-sans)' } }} />
      </body>
    </html>
  );
}
