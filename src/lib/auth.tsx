'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, sesion } from './api';
import { INICIO } from './format';
import type { UsuarioSesion } from './types';

interface Ctx {
  usuario: UsuarioSesion | null;
  entrar: (email: string, password: string) => Promise<void>;
  salir: () => void;
}

const AuthCtx = createContext<Ctx | null>(null);

function leerUsuario(): UsuarioSesion | null {
  try {
    const u = localStorage.getItem('cul.user');
    return u && sesion.token() ? (JSON.parse(u) as UsuarioSesion) : null;
  } catch { return null; }
}

/** Debe montarse solo en el navegador (ver Providers): lee la sesión de localStorage al iniciar. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(leerUsuario);
  const router = useRouter();

  const salir = useCallback(() => {
    sesion.borrar();
    setUsuario(null);
    router.replace('/login');
  }, [router]);

  useEffect(() => {
    const fn = () => { setUsuario(null); router.replace('/login?expirada=1'); };
    window.addEventListener('cul:sesion-expirada', fn);
    return () => window.removeEventListener('cul:sesion-expirada', fn);
  }, [router]);

  const entrar = useCallback(async (email: string, password: string) => {
    const r = await api<{ token: string; usuario: UsuarioSesion }>('/auth/login', { body: { email, password } });
    sesion.guardar(r.token);
    try { localStorage.setItem('cul.user', JSON.stringify(r.usuario)); } catch { /* */ }
    setUsuario(r.usuario);
    router.replace(INICIO[r.usuario.rol]);
  }, [router]);

  return <AuthCtx.Provider value={{ usuario, entrar, salir }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const c = useContext(AuthCtx);
  if (!c) throw new Error('useAuth fuera de AuthProvider');
  return c;
}
