'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { INICIO } from '@/lib/format';
import { Cargador } from '@/components/marca';

export default function Raiz() {
  const { usuario } = useAuth();
  const router = useRouter();
  useEffect(() => { router.replace(usuario ? INICIO[usuario.rol] : '/login'); }, [usuario, router]);
  return <Cargador />;
}
