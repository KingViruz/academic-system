'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Boton, Encabezado, Entrada, Etiqueta, Modal, Pestanas, Tabla } from '@/components/ui';
import { api, mensajeDe } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { ESTADO_SOL, fechaHora, nota } from '@/lib/format';
import type { Solicitud } from '@/lib/types';


export default function Solicitudes() {
  const [vista, setVista] = useState<'PENDIENTE' | ''>('PENDIENTE');
  const { data, cargando, recargar } = useApi<Solicitud[]>(`/solicitudes-nota${vista ? `?estado=${vista}` : ''}`);
  const [resolver, setResolver] = useState<{ s: Solicitud; aprobar: boolean } | null>(null);
  const [comentario, setComentario] = useState('');
  async function confirmar() {
    try {
      await api(`/solicitudes-nota/${resolver!.s.id}/${resolver!.aprobar ? 'aprobar' : 'rechazar'}`, { body: { comentario: comentario || undefined } });
      toast.success(resolver!.aprobar ? 'Cambio aprobado: la nota quedó actualizada' : 'Solicitud rechazada');
      setResolver(null); setComentario(''); recargar();
    } catch (e) { toast.error(mensajeDe(e)); }
  }
  return (
    <>
      <Encabezado titulo="Cambios de nota" descripcion="Después de cerrar un corte, el docente no puede editar notas directamente: solicita el cambio y tú lo apruebas o rechazas. Todo queda en la auditoría." />
      <Pestanas valor={vista} onCambio={setVista} opciones={[{ valor: 'PENDIENTE', label: 'Pendientes' }, { valor: '', label: 'Todas' }]} />
      <Tabla filas={data} cargando={cargando} clave={(s) => s.id} vacio="No hay solicitudes." columnas={[
        { titulo: 'Estudiante', celda: (s) => <><p className="font-semibold">{s.estudiante}</p><p className="text-[12.5px] text-mute">{s.materia} · grupo {s.grupo} · corte {s.corte}</p></> },
        { titulo: 'Cambio', celda: (s) => <span className="tabular font-semibold">{nota(s.notaAnterior)} → {nota(s.notaNueva)}</span> },
        { titulo: 'Motivo', celda: (s) => <span className="text-[14px]">{s.motivo}</span> },
        { titulo: 'Solicitó', celda: (s) => <><p className="text-[14px]">{s.solicitante}</p><p className="text-[12.5px] text-mute tabular">{fechaHora(s.createdAt)}</p></> },
        { titulo: 'Estado', celda: (s) => <Etiqueta tono={ESTADO_SOL[s.estado].tono}>{ESTADO_SOL[s.estado].label}</Etiqueta> },
        { titulo: 'Acciones', alinear: 'der', celda: (s) => s.estado === 'PENDIENTE' ? (
          <div className="flex justify-end gap-1.5">
            <Boton tamano="sm" variante="peligro" onClick={() => setResolver({ s, aprobar: false })}>Rechazar</Boton>
            <Boton tamano="sm" onClick={() => setResolver({ s, aprobar: true })}>Aprobar</Boton>
          </div>
        ) : <span className="text-[12.5px] text-mute">{s.aprobador}</span> },
      ]} />
      <Modal abierto={!!resolver} onCerrar={() => setResolver(null)} titulo={resolver?.aprobar ? 'Aprobar cambio de nota' : 'Rechazar solicitud'}
        pie={<><Boton variante="secundario" onClick={() => setResolver(null)}>Cancelar</Boton><Boton variante={resolver?.aprobar ? 'primario' : 'peligro'} onClick={confirmar}>{resolver?.aprobar ? 'Aprobar cambio' : 'Rechazar solicitud'}</Boton></>}>
        {resolver && <p className="mb-4 text-[14px]">{resolver.s.estudiante} · {resolver.s.materia}, corte {resolver.s.corte}: <span className="font-semibold tabular">{nota(resolver.s.notaAnterior)} → {nota(resolver.s.notaNueva)}</span></p>}
        <Entrada label="Comentario (opcional)" value={comentario} onChange={(e) => setComentario(e.target.value)} />
      </Modal>
    </>
  );
}
