'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api, mensajeDe } from '@/lib/api';
import { Boton, Entrada, Modal } from './ui';

/** HU-30: el docente abre la sesión; el aula se toma del horario del día. */
export function AbrirAsistencia({ cargaId, etiqueta, tamano = 'md', temaSugerido = '' }: { cargaId: number; etiqueta: string; tamano?: 'sm' | 'md'; temaSugerido?: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [tema, setTema] = useState(temaSugerido);
  const [enviando, setEnviando] = useState(false);
  async function abrir(e: React.FormEvent) {
    e.preventDefault(); setEnviando(true);
    try {
      const a = await api<{ id: number; lecturasAsignadas: number }>('/asistencias', { body: { cargaId, tema } });
      toast.success(a.lecturasAsignadas ? `Asistencia abierta · ${a.lecturasAsignadas} lectura(s) del sensor asignadas` : 'Asistencia abierta');
      router.push(`/docente/asistencia/${a.id}`);
    } catch (err) { toast.error(mensajeDe(err)); setEnviando(false); }
  }
  return (
    <>
      <Boton tamano={tamano} onClick={() => setAbierto(true)}>{etiqueta}</Boton>
      <Modal abierto={abierto} onCerrar={() => setAbierto(false)} titulo="Abrir asistencia"
        pie={<><Boton variante="secundario" onClick={() => setAbierto(false)}>Cancelar</Boton><Boton form={`f-abrir-${cargaId}`} type="submit" cargando={enviando} disabled={tema.trim().length < 2}>Abrir asistencia</Boton></>}>
        <form id={`f-abrir-${cargaId}`} onSubmit={abrir}>
          <Entrada label="Tema de la clase" value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Ej.: Matriz de riesgos" />
          <p className="mt-2 text-[13px] text-mute">Desde que abras, el sensor del aula registra a los estudiantes que pasen su carné. Quien llegue después de la tolerancia queda como tarde.</p>
        </form>
      </Modal>
    </>
  );
}
