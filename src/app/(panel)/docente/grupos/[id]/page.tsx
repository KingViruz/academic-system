'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Download, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { AbrirAsistencia } from '@/components/abrir-asistencia';
import { PlanDetalle } from '@/components/plan-detalle';
import { Aviso, Boton, Cargando, Encabezado, Entrada, Etiqueta, Modal, Pestanas, Tabla, Vacio, cx } from '@/components/ui';
import { api, mensajeDe } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { DIAS_CORTOS, fecha, hora, nota } from '@/lib/format';
import type { Asistencia, Carga, Plan } from '@/lib/types';

type Tab = 'asistencia' | 'notas' | 'plan' | 'consolidado';

interface Notas {
  grupo: { materia: string; grupo: string }; porcentajes: [number, number, number] | null; ultimoCorteCerrado: number;
  filas: { inscripcionId: number; codigoCarne: string; nombre: string; definitiva: number | null; notas: { corte: number; calificacionId: number | null; nota: number | null; solicitudPendiente: boolean }[] }[];
}
interface Consolidado { sesiones: number; umbral: number; filas: { estudianteId: number; codigoCarne: string; nombre: string; presentes: number; tardes: number; ausencias: number; excusas: number; porcentajeFallas: number; enRiesgo: boolean }[] }

function Sesiones({ carga }: { carga: Carga }) {
  const { data, cargando } = useApi<Asistencia[]>(`/asistencias/grupo/${carga.id}`);
  const abierta = data?.find((a) => a.estado === 'ABIERTA');
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-mute">{data?.filter((a) => a.estado === 'CERRADA').length ?? 0} sesiones cerradas</p>
        {abierta ? <Link href={`/docente/asistencia/${abierta.id}`}><Boton>Continuar asistencia abierta</Boton></Link> : <AbrirAsistencia cargaId={carga.id} etiqueta="Abrir asistencia" />}
      </div>
      <Tabla filas={data} cargando={cargando} clave={(a) => a.id} vacio="Todavía no has tomado asistencia en este grupo." columnas={[
        { titulo: 'Fecha', celda: (a) => <Link href={`/docente/asistencia/${a.id}`} className="font-semibold tabular hover:underline">{fecha(a.fecha)}</Link> },
        { titulo: 'Tema', celda: (a) => a.tema },
        { titulo: 'Apertura', celda: (a) => <span className="tabular">{hora(a.horaApertura)}</span> },
        { titulo: 'Aula', celda: (a) => a.aula?.codigo },
        { titulo: 'Estado', celda: (a) => a.estado === 'ABIERTA' ? <Etiqueta tono="aviso">Abierta</Etiqueta> : <span className="text-mute">Cerrada</span> },
      ]} />
    </div>
  );
}

const normalizar = (v: string) => v.replace(',', '.').trim();
const valida = (v: string) => v === '' || (/^\d(\.\d)?$/.test(normalizar(v)) && Number(normalizar(v)) <= 5);

function NotasGrupo({ carga }: { carga: Carga }) {
  const { data, error, recargar } = useApi<Notas>(`/calificaciones/grupo/${carga.id}`);
  const [edit, setEdit] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [sol, setSol] = useState<{ calificacionId: number; nombre: string; corte: number; actual: number } | null>(null);
  const [solF, setSolF] = useState({ nota: '', motivo: '' });
  if (error) return <Aviso>{error}</Aviso>;
  if (!data) return <Cargando />;
  if (!data.porcentajes) return <Aviso tono="aviso">La materia no tiene microcurrículo publicado. Sin él no hay porcentajes para calcular la nota: pide al coordinador que lo publique.</Aviso>;
  const abierto = (c: number) => c > data.ultimoCorteCerrado;
  const clave = (i: number, c: number) => `${i}-${c}`;
  const cambios = Object.entries(edit).filter(([k, v]) => {
    const [i, c] = k.split('-').map(Number);
    const actual = data.filas.find((f) => f.inscripcionId === i)?.notas[c - 1].nota;
    return v !== '' && Number(normalizar(v)) !== actual;
  });
  const invalidas = Object.values(edit).filter((v) => !valida(v)).length;

  async function guardar() {
    setGuardando(true);
    try {
      const porCorte = new Map<number, { inscripcionId: number; nota: number }[]>();
      cambios.forEach(([k, v]) => { const [i, c] = k.split('-').map(Number); porCorte.set(c, [...(porCorte.get(c) ?? []), { inscripcionId: i, nota: Number(normalizar(v)) }]); });
      for (const [corte, notas] of porCorte) await api(`/calificaciones/grupo/${carga.id}`, { method: 'PUT', body: { corte, notas } });
      toast.success(`${cambios.length} nota(s) guardadas`); setEdit({}); recargar();
    } catch (e) { toast.error(mensajeDe(e)); } finally { setGuardando(false); }
  }
  async function cerrar() {
    const c = data!.ultimoCorteCerrado + 1;
    if (!confirm(`Al cerrar el corte ${c} ya no podrás editar sus notas; cualquier cambio necesitará aprobación del coordinador. ¿Cerrar el corte ${c}?`)) return;
    try { await api(`/calificaciones/grupo/${carga.id}/cerrar-corte`, { body: { corte: c } }); toast.success(`Corte ${c} cerrado`); recargar(); } catch (e) { toast.error(mensajeDe(e)); }
  }
  async function solicitar(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/solicitudes-nota', { body: { calificacionId: sol!.calificacionId, notaNueva: Number(normalizar(solF.nota)), motivo: solF.motivo } });
      toast.success('Solicitud enviada al coordinador'); setSol(null); recargar();
    } catch (err) { toast.error(mensajeDe(err)); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-mute">Peso de los cortes: {data.porcentajes.join(' / ')} % · notas de 0,0 a 5,0 con un decimal</p>
        <div className="flex gap-2">
          {data.ultimoCorteCerrado < 3 && <Boton variante="secundario" onClick={cerrar} disabled={cambios.length > 0}><Lock className="size-4" />Cerrar corte {data.ultimoCorteCerrado + 1}</Boton>}
          <Boton onClick={guardar} cargando={guardando} disabled={!cambios.length || invalidas > 0}>Guardar {cambios.length || ''} nota(s)</Boton>
        </div>
      </div>
      {invalidas > 0 && <Aviso>Hay {invalidas} nota(s) con formato inválido. Usa valores entre 0,0 y 5,0 con un decimal.</Aviso>}
      <Tabla filas={data.filas} clave={(f) => f.inscripcionId} vacio="No hay estudiantes inscritos." columnas={[
        { titulo: 'Estudiante', celda: (f) => <><p className="font-semibold">{f.nombre}</p><p className="text-[12.5px] text-mute tabular">{f.codigoCarne}</p></> },
        ...[1, 2, 3].map((c) => ({
          titulo: `Corte ${c} · ${data.porcentajes![c - 1]} %${abierto(c) ? '' : ' (cerrado)'}`, alinear: 'centro' as const,
          celda: (f: Notas['filas'][number]) => {
            const n = f.notas[c - 1];
            if (abierto(c)) {
              const v = edit[clave(f.inscripcionId, c)] ?? (n.nota !== null ? n.nota.toFixed(1) : '');
              return <input aria-label={`Corte ${c} de ${f.nombre}`} inputMode="decimal" value={v} onChange={(e) => setEdit({ ...edit, [clave(f.inscripcionId, c)]: e.target.value })}
                className={cx('field h-9 w-20 text-center tabular', !valida(v) && 'border-bad bg-bad-tint', n.nota !== null && Number(v) < 3 && valida(v) && v !== '' && 'text-bad')} />;
            }
            return (
              <div className="flex items-center justify-center gap-2">
                <span className={cx('tabular font-semibold', (n.nota ?? 5) < 3 && 'text-bad')}>{nota(n.nota)}</span>
                {n.calificacionId && (n.solicitudPendiente ? <Etiqueta tono="aviso">en revisión</Etiqueta>
                  : <button className="text-[12.5px] font-semibold text-ember-dark hover:underline" onClick={() => { setSol({ calificacionId: n.calificacionId!, nombre: f.nombre, corte: c, actual: n.nota! }); setSolF({ nota: '', motivo: '' }); }}>cambiar</button>)}
              </div>
            );
          },
        })),
        { titulo: 'Definitiva', alinear: 'centro', celda: (f) => <span className={cx('display text-[16px] font-[800] tabular', f.definitiva !== null && f.definitiva < 3 && 'text-bad')}>{nota(f.definitiva)}</span> },
      ]} />
      <Modal abierto={!!sol} onCerrar={() => setSol(null)} titulo="Solicitar cambio de nota"
        pie={<><Boton variante="secundario" onClick={() => setSol(null)}>Cancelar</Boton><Boton form="f-sol" type="submit" disabled={!valida(solF.nota) || !solF.nota || solF.motivo.trim().length < 5}>Enviar solicitud</Boton></>}>
        {sol && (
          <form id="f-sol" onSubmit={solicitar} className="space-y-4">
            <p className="text-[14px]">{sol.nombre} · corte {sol.corte}. Nota actual <b className="tabular">{nota(sol.actual)}</b>. El coordinador del programa debe aprobar el cambio.</p>
            <Entrada label="Nota nueva" inputMode="decimal" value={solF.nota} onChange={(e) => setSolF({ ...solF, nota: e.target.value })} error={solF.nota && !valida(solF.nota) ? 'Usa un valor entre 0,0 y 5,0' : undefined} />
            <Entrada label="Motivo" value={solF.motivo} onChange={(e) => setSolF({ ...solF, motivo: e.target.value })} placeholder="Ej.: error de digitación, adjunto acta" />
          </form>
        )}
      </Modal>
    </div>
  );
}

function PlanGrupo({ carga }: { carga: Carga }) {
  const { data, cargando, recargar } = useApi<Plan | null>(`/planes/carga/${carga.id}`);
  if (cargando && data === undefined) return <Cargando />;
  if (!data) return <Vacio titulo="Este grupo aún no tiene plan de microcurrículo">El coordinador lo crea a partir del microcurrículo publicado.</Vacio>;
  return <PlanDetalle plan={data} modo="docente" onCambio={recargar} />;
}

function ConsolidadoGrupo({ carga }: { carga: Carga }) {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const { data, cargando } = useApi<Consolidado>(`/asistencias/consolidado/${carga.id}?${new URLSearchParams({ ...(desde && { desde }), ...(hasta && { hasta }) })}`);
  function exportar() {
    if (!data) return;
    const enc = ['Carné', 'Estudiante', 'Presentes', 'Tardes', 'Ausencias', 'Excusas', '% fallas'];
    const filas = data.filas.map((f) => [f.codigoCarne, f.nombre, f.presentes, f.tardes, f.ausencias, f.excusas, String(f.porcentajeFallas).replace('.', ',')]);
    const csv = '﻿' + [enc, ...filas].map((r) => r.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(';')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `asistencia_${carga.materia.codigo}_${carga.grupo}.csv`; a.click();
  }
  const filas = useMemo(() => [...(data?.filas ?? [])].sort((a, b) => b.porcentajeFallas - a.porcentajeFallas), [data]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Entrada label="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        <Entrada label="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        <Boton variante="secundario" onClick={exportar} disabled={!data?.filas.length}><Download className="size-4" />Exportar a Excel (CSV)</Boton>
        {data && <p className="pb-2 text-[14px] text-mute">{data.sesiones} sesiones · umbral de alerta {data.umbral} %</p>}
      </div>
      <Tabla filas={filas} cargando={cargando} clave={(f) => f.estudianteId} columnas={[
        { titulo: 'Estudiante', celda: (f) => <span className="font-semibold">{f.nombre}</span> },
        { titulo: 'Presente', alinear: 'der', celda: (f) => f.presentes },
        { titulo: 'Tarde', alinear: 'der', celda: (f) => f.tardes },
        { titulo: 'Ausente', alinear: 'der', celda: (f) => f.ausencias },
        { titulo: 'Excusa', alinear: 'der', celda: (f) => f.excusas },
        { titulo: '% fallas', alinear: 'der', celda: (f) => <span className={cx('font-semibold', f.enRiesgo && 'text-bad')}>{f.porcentajeFallas} %</span> },
      ]} />
    </div>
  );
}

export default function GrupoDocente() {
  const { id } = useParams<{ id: string }>();
  const { data: carga, error } = useApi<Carga>(`/carga/${id}`);
  const [tab, setTab] = useState<Tab>('asistencia');
  if (error) return <Aviso>{error}</Aviso>;
  if (!carga) return <Cargando />;
  return (
    <>
      <Link href="/docente/grupos" className="mb-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink-soft hover:text-ink"><ArrowLeft className="size-4" />Mis grupos</Link>
      <Encabezado titulo={`${carga.materia.nombre} · grupo ${carga.grupo}`}
        descripcion={`${carga.inscritos} estudiantes · ${carga.horarios.map((h) => `${DIAS_CORTOS[h.dia]} ${h.horaInicio.slice(0, 5)}–${h.horaFin.slice(0, 5)} aula ${h.aula?.codigo}`).join(' · ')}`} />
      <Pestanas valor={tab} onCambio={setTab} opciones={[{ valor: 'asistencia', label: 'Asistencia' }, { valor: 'notas', label: 'Notas' }, { valor: 'plan', label: 'Plan del periodo' }, { valor: 'consolidado', label: 'Consolidado de asistencia' }]} />
      {tab === 'asistencia' && <Sesiones carga={carga} />}
      {tab === 'notas' && <NotasGrupo carga={carga} />}
      {tab === 'plan' && <PlanGrupo carga={carga} />}
      {tab === 'consolidado' && <ConsolidadoGrupo carga={carga} />}
    </>
  );
}
