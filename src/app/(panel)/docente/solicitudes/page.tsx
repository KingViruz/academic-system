'use client';
import { Encabezado, Etiqueta, Tabla } from '@/components/ui';
import { useApi } from '@/lib/use-api';
import { ESTADO_SOL, fechaHora, nota } from '@/lib/format';
import type { Solicitud } from '@/lib/types';

export default function MisSolicitudes() {
  const { data, cargando } = useApi<Solicitud[]>('/solicitudes-nota');
  return (
    <>
      <Encabezado titulo="Cambios de nota" descripcion="Solicitudes que enviaste para notas de cortes ya cerrados. Las crea desde la pestaña Notas de cada grupo." />
      <Tabla filas={data} cargando={cargando} clave={(s) => s.id} vacio="No has enviado solicitudes de cambio." columnas={[
        { titulo: 'Estudiante', celda: (s) => <><p className="font-semibold">{s.estudiante}</p><p className="text-[12.5px] text-mute">{s.materia} · grupo {s.grupo} · corte {s.corte}</p></> },
        { titulo: 'Cambio', celda: (s) => <span className="tabular font-semibold">{nota(s.notaAnterior)} → {nota(s.notaNueva)}</span> },
        { titulo: 'Motivo', celda: (s) => s.motivo },
        { titulo: 'Enviada', celda: (s) => <span className="text-[13px] text-mute tabular">{fechaHora(s.createdAt)}</span> },
        { titulo: 'Estado', celda: (s) => <><Etiqueta tono={ESTADO_SOL[s.estado].tono}>{ESTADO_SOL[s.estado].label}</Etiqueta>{s.comentario && <p className="mt-1 text-[12.5px] text-mute">{s.comentario}</p>}</> },
      ]} />
    </>
  );
}
