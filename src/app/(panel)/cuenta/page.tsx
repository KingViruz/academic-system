'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Aviso, Boton, Encabezado, Entrada, Seccion } from '@/components/ui';
import { api, mensajeDe } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ROL_NOMBRE } from '@/lib/format';

export default function Cuenta() {
  const { usuario } = useAuth();
  const [f, setF] = useState({ actual: '', nueva: '', repetir: '' });
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  async function cambiar(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    if (f.nueva !== f.repetir) { setError('Las contraseñas nuevas no coinciden'); return; }
    setGuardando(true);
    try { await api('/auth/cambiar-password', { body: { actual: f.actual, nueva: f.nueva } }); toast.success('Contraseña actualizada'); setF({ actual: '', nueva: '', repetir: '' }); }
    catch (err) { setError(mensajeDe(err)); } finally { setGuardando(false); }
  }
  return (
    <>
      <Encabezado titulo="Mi cuenta" descripcion={`${usuario?.nombre} · ${usuario?.email} · ${ROL_NOMBRE[usuario?.rol ?? '']}`} />
      <div className="max-w-md">
        <Seccion titulo="Cambiar contraseña">
          <form onSubmit={cambiar} className="space-y-4">
            {error && <Aviso>{error}</Aviso>}
            <Entrada label="Contraseña actual" type="password" autoComplete="current-password" value={f.actual} onChange={(e) => setF({ ...f, actual: e.target.value })} />
            <Entrada label="Contraseña nueva" type="password" autoComplete="new-password" value={f.nueva} onChange={(e) => setF({ ...f, nueva: e.target.value })} ayuda="Mínimo 8 caracteres." />
            <Entrada label="Repite la contraseña nueva" type="password" autoComplete="new-password" value={f.repetir} onChange={(e) => setF({ ...f, repetir: e.target.value })} />
            <Boton type="submit" cargando={guardando} disabled={!f.actual || f.nueva.length < 8}>Cambiar contraseña</Boton>
          </form>
        </Seccion>
      </div>
    </>
  );
}
