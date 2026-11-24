'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Boton, Encabezado, Etiqueta, Pestanas, Tabla } from '@/components/ui';
import { api, mensajeDe } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { fechaHora } from '@/lib/format';
import type { Alerta } from '@/lib/types';

const TIPO: Record<Alerta['tipo'], { label: string; tono: 'mal' | 'aviso' | 'marca' | 'tinta' }> = {
  INASISTENCIA: { label: 'Inasistencia', tono: 'aviso' }, NOTA_BAJA: { label: 'Nota baja', tono: 'mal' },
  SENSOR: { label: 'Sensor', tono: 'marca' }, SEGURIDAD: { label: 'Cambio de nota', tono: 'tinta' },
};

export default function Alertas() {
  const [vista, setVista] = useState<'abiertas' | 'atendidas'>('abiertas');
  const { data, cargando, recargar } = useApi<Alerta[]>(`/alertas?atendida=${vista === 'atendidas'}`);
  async function atender(a: Alerta) {
    try { await api(`/alertas/${a.id}/atender`, { body: {} }); toast.success('Alerta marcada como atendida'); recargar(); } catch (e) { toast.error(mensajeDe(e)); }
  }
  return (
    <>
      <Encabezado titulo="Alertas" descripcion="Avisos tempranos para actuar a tiempo: fallas por encima del umbral, cortes por debajo de 3,0, sensores sin señal y cambios de nota aprobados." />
      <Pestanas valor={vista} onCambio={setVista} opciones={[{ valor: 'abiertas', label: 'Por atender' }, { valor: 'atendidas', label: 'Atendidas' }]} />
      <Tabla filas={data} cargando={cargando} clave={(a) => a.id} vacio={vista === 'abiertas' ? 'No hay alertas por atender.' : 'Aún no se ha atendido ninguna alerta.'} columnas={[
        { titulo: 'Tipo', celda: (a) => <Etiqueta tono={TIPO[a.tipo].tono}>{TIPO[a.tipo].label}</Etiqueta> },
        { titulo: 'Detalle', celda: (a) => <span className="text-[14px]">{a.mensaje}</span> },
        { titulo: 'Generada', celda: (a) => <span className="text-[13px] text-mute tabular">{fechaHora(a.createdAt)}</span> },
        ...(vista === 'abiertas' ? [{ titulo: 'Acciones', alinear: 'der' as const, celda: (a: Alerta) => <Boton tamano="sm" variante="secundario" onClick={() => atender(a)}>Marcar atendida</Boton> }] : []),
      ]} />
    </>
  );
}
