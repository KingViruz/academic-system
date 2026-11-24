'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, mensajeDe } from './api';

interface Estado<T> { path: string; version: number; data?: T; error: string | null }

/**
 * Lee un endpoint y expone recarga. Con path = null no consulta.
 * El estado de carga se deriva (no se fija dentro del efecto) para evitar renders en cascada.
 */
export function useApi<T>(path: string | null) {
  const [version, setVersion] = useState(0);
  const [estado, setEstado] = useState<Estado<T> | null>(null);

  useEffect(() => {
    if (!path) return;
    let vigente = true;
    api<T>(path)
      .then((data) => { if (vigente) setEstado({ path, version, data, error: null }); })
      .catch((e) => { if (vigente) setEstado((s) => ({ path, version, data: s?.path === path ? s.data : undefined, error: mensajeDe(e) })); });
    return () => { vigente = false; };
  }, [path, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  const setData = useCallback((data: T) => setEstado((s) => (s ? { ...s, data, error: null } : s)), []);
  const mismo = !!path && estado?.path === path;
  return {
    data: mismo ? estado!.data : undefined,
    error: mismo ? estado!.error : null,
    cargando: !!path && (!mismo || estado!.version !== version),
    recargar,
    setData,
  };
}
