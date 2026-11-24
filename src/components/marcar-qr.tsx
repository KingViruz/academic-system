'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { api, mensajeDe } from '@/lib/api';
import { Boton } from './ui';

/** Contingencia: el estudiante escribe el código que proyecta el docente. */
export function MarcarQr({ onHecho }: { onHecho?: () => void }) {
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  async function enviar(e: React.FormEvent) {
    e.preventDefault(); setEnviando(true);
    try {
      const r = await api<{ estado: string; materia: string; mensaje?: string }>('/asistencias/qr', { body: { codigo } });
      toast.success(r.mensaje ?? `Asistencia registrada en ${r.materia}: ${r.estado === 'TARDE' ? 'llegada tarde' : 'presente'}`);
      setCodigo(''); onHecho?.();
    } catch (err) { toast.error(mensajeDe(err)); } finally { setEnviando(false); }
  }
  return (
    <form onSubmit={enviar} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold">Código de la clase</span>
        <input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 6))} placeholder="ABC123" inputMode="text" autoComplete="off"
          className="field h-11 w-40 text-center text-[20px] font-bold tracking-[.2em] tabular" aria-describedby="qr-ayuda" />
      </label>
      <Boton type="submit" cargando={enviando} disabled={codigo.length !== 6} className="h-11">Registrar asistencia</Boton>
      <p id="qr-ayuda" className="w-full text-[13px] text-mute">Úsalo solo si el docente lo proyecta porque el sensor del aula no funciona.</p>
    </form>
  );
}
