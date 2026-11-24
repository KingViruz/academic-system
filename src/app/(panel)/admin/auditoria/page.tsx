'use client';
import { useState } from 'react';
import { Boton, Encabezado, Modal, Tabla } from '@/components/ui';
import { useApi } from '@/lib/use-api';
import { fechaHora } from '@/lib/format';
import type { Auditoria as A } from '@/lib/types';

const ENTIDADES = ['', 'usuario', 'facultad', 'programa', 'materia', 'aula', 'periodo', 'coordinador', 'docente', 'estudiante', 'carga_academica', 'inscripcion', 'microcurriculo', 'plan_microcurriculo', 'detalle_plan', 'asistencia', 'detalle_asistencia', 'calificacion', 'solicitud_cambio_nota', 'sensor'];

export default function Auditoria() {
  const [entidad, setEntidad] = useState('');
  const [pagina, setPagina] = useState(1);
  const [ver, setVer] = useState<A | null>(null);
  const { data, cargando } = useApi<{ items: A[]; total: number; porPagina: number }>(`/auditoria?pagina=${pagina}${entidad ? `&entidad=${entidad}` : ''}`);
  const paginas = data ? Math.max(1, Math.ceil(data.total / data.porPagina)) : 1;
  return (
    <>
      <Encabezado titulo="Auditoría" descripcion="Quién creó o modificó cada dato y cuándo, con el valor anterior y el nuevo. Este registro no se puede editar ni borrar." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select value={entidad} onChange={(e) => { setEntidad(e.target.value); setPagina(1); }} className="field h-10 w-56" aria-label="Filtrar por entidad">
          {ENTIDADES.map((e) => <option key={e} value={e}>{e ? e.replaceAll('_', ' ') : 'Todas las entidades'}</option>)}
        </select>
        {data && <span className="text-[13px] text-mute tabular">{data.total} registros</span>}
      </div>
      <Tabla filas={data?.items} cargando={cargando} clave={(a) => a.id} onFila={setVer} columnas={[
        { titulo: 'Fecha', celda: (a) => <span className="tabular text-[13px]">{fechaHora(a.createdAt)}</span> },
        { titulo: 'Acción', celda: (a) => <span className="font-semibold">{a.accion.replaceAll('_', ' ').toLowerCase()}</span> },
        { titulo: 'Entidad', celda: (a) => a.entidad.replaceAll('_', ' ') },
        { titulo: 'Registro', celda: (a) => a.entidadId ?? '—' },
        { titulo: 'Usuario', celda: (a) => a.usuarioId ?? 'Sistema' },
        { titulo: 'IP', celda: (a) => <span className="text-[13px] text-mute">{a.ip ?? '—'}</span> },
      ]} />
      <div className="mt-4 flex items-center justify-end gap-2">
        <Boton tamano="sm" variante="secundario" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>Anterior</Boton>
        <span className="text-[13px] text-mute tabular">Página {pagina} de {paginas}</span>
        <Boton tamano="sm" variante="secundario" disabled={pagina >= paginas} onClick={() => setPagina(pagina + 1)}>Siguiente</Boton>
      </div>
      <Modal abierto={!!ver} onCerrar={() => setVer(null)} titulo="Detalle del cambio" ancho="xl">
        {ver && (
          <div className="grid gap-4 md:grid-cols-2">
            {(['valorAnterior', 'valorNuevo'] as const).map((k) => (
              <div key={k}>
                <p className="mb-1.5 text-[13px] font-semibold text-mute">{k === 'valorAnterior' ? 'Valor anterior' : 'Valor nuevo'}</p>
                <pre className="max-h-96 overflow-auto rounded-sm border border-line bg-paper p-3 text-[12px] leading-relaxed">{ver[k] ? JSON.stringify(typeof ver[k] === 'string' ? JSON.parse(ver[k] as string) : ver[k], null, 2) : '—'}</pre>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
