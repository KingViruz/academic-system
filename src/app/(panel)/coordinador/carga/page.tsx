'use client';
import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Aviso, Boton, Buscador, Encabezado, Entrada, Modal, Selector, Tabla } from '@/components/ui';
import { api, ApiError, mensajeDe } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { DIAS, DIAS_CORTOS, nombre } from '@/lib/format';
import type { Aula, Carga, Docente, Materia, Periodo } from '@/lib/types';

interface Franja { aulaId: string; dia: string; horaInicio: string; horaFin: string }
interface Cruce { tipo: string; mensaje: string }
const franjaVacia: Franja = { aulaId: '', dia: '1', horaInicio: '08:00', horaFin: '10:00' };

function FormCarga({ periodo, carga, onCerrar }: { periodo: Periodo; carga: Carga | null; onCerrar: (ok: boolean) => void }) {
  const { data: materias } = useApi<Materia[]>('/materias?activas=true');
  const { data: aulas } = useApi<Aula[]>('/aulas');
  const [materiaId, setMateriaId] = useState(carga ? String(carga.materiaId) : '');
  const { data: docentes } = useApi<Docente[]>(materiaId ? `/docentes?materiaId=${materiaId}` : null);
  const [docenteId, setDocenteId] = useState(carga ? String(carga.docenteId) : '');
  const [grupo, setGrupo] = useState(carga?.grupo ?? 'A');
  const [cupo, setCupo] = useState(String(carga?.cupo ?? 30));
  const [franjas, setFranjas] = useState<Franja[]>(carga ? carga.horarios.map((h) => ({ aulaId: String(h.aulaId), dia: String(h.dia), horaInicio: h.horaInicio.slice(0, 5), horaFin: h.horaFin.slice(0, 5) })) : [{ ...franjaVacia }]);
  const [cruces, setCruces] = useState<Cruce[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cuerpo = () => ({
    periodoId: periodo.id, materiaId: Number(materiaId), docenteId: Number(docenteId), grupo, cupo: Number(cupo),
    horarios: franjas.map((f) => ({ aulaId: Number(f.aulaId), dia: Number(f.dia), horaInicio: f.horaInicio, horaFin: f.horaFin })),
  });
  const completo = materiaId && docenteId && grupo && cupo && franjas.every((f) => f.aulaId && f.horaInicio && f.horaFin);

  // Revisa cruces mientras se edita el horario (CP-04): el aviso aparece antes de guardar.
  useEffect(() => {
    if (!completo) return;
    const t = setTimeout(async () => {
      try {
        const r = await api<{ cruces: Cruce[] }>('/carga/validar', { body: { ...cuerpo(), excluirCargaId: carga?.id } });
        setCruces(r.cruces);
      } catch { setCruces(null); }
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materiaId, docenteId, grupo, cupo, JSON.stringify(franjas)]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault(); setGuardando(true); setError(null);
    try {
      if (carga) { const { docenteId: d, grupo: g, cupo: c, horarios } = cuerpo(); await api(`/carga/${carga.id}`, { method: 'PATCH', body: { docenteId: d, grupo: g, cupo: c, horarios } }); }
      else await api('/carga', { body: cuerpo() });
      toast.success(carga ? 'Grupo actualizado' : 'Grupo creado');
      onCerrar(true);
    } catch (err) {
      setError(mensajeDe(err));
      if (err instanceof ApiError && (err.datos as { cruces?: Cruce[] })?.cruces) setCruces((err.datos as { cruces: Cruce[] }).cruces);
    } finally { setGuardando(false); }
  }
  const crucesVisibles = completo ? cruces : null;
  const setF = (i: number, k: keyof Franja, v: string) => setFranjas(franjas.map((f, j) => (j === i ? { ...f, [k]: v } : f)));

  return (
    <Modal abierto onCerrar={() => onCerrar(false)} titulo={carga ? `Editar ${carga.materia.nombre} · grupo ${carga.grupo}` : `Nuevo grupo · periodo ${periodo.codigo}`} ancho="xl"
      pie={<><Boton variante="secundario" onClick={() => onCerrar(false)}>Cancelar</Boton><Boton form="f-carga" type="submit" cargando={guardando} disabled={!completo || !!crucesVisibles?.length}>{carga ? 'Guardar cambios' : 'Crear grupo'}</Boton></>}>
      <form id="f-carga" onSubmit={guardar} className="space-y-5">
        {error && <Aviso>{error}</Aviso>}
        <div className="grid gap-4 sm:grid-cols-4">
          <Selector className="sm:col-span-2" label="Materia" value={materiaId} disabled={!!carga} onChange={(e) => { setMateriaId(e.target.value); setDocenteId(''); }} vacio="Selecciona…" opciones={(materias ?? []).map((m) => ({ value: m.id, label: `${m.codigo} · ${m.nombre}` }))} />
          <Entrada label="Grupo" value={grupo} onChange={(e) => setGrupo(e.target.value.toUpperCase())} maxLength={10} />
          <Entrada label="Cupo" type="number" min={1} value={cupo} onChange={(e) => setCupo(e.target.value)} />
          <Selector className="sm:col-span-4" label="Docente" value={docenteId} onChange={(e) => setDocenteId(e.target.value)} disabled={!materiaId}
            vacio={!materiaId ? 'Primero elige la materia' : docentes?.length === 0 ? 'Ningún docente está habilitado para esta materia' : 'Selecciona…'}
            ayuda="Solo aparecen los docentes habilitados para dictar la materia."
            opciones={(docentes ?? []).map((d) => ({ value: d.id, label: nombre(d.usuario) }))} />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-semibold">Horario semanal</p>
            <Boton type="button" tamano="sm" variante="secundario" onClick={() => setFranjas([...franjas, { ...franjaVacia, aulaId: franjas[0]?.aulaId ?? '' }])}><Plus className="size-3.5" />Agregar franja</Boton>
          </div>
          <div className="space-y-2">
            {franjas.map((f, i) => (
              <div key={i} className="grid grid-cols-2 items-end gap-2 rounded-sm border border-line-soft bg-paper/60 p-3 sm:grid-cols-[1fr_1.3fr_.8fr_.8fr_auto]">
                <Selector label="Día" value={f.dia} onChange={(e) => setF(i, 'dia', e.target.value)} opciones={[1, 2, 3, 4, 5, 6].map((d) => ({ value: d, label: DIAS[d] }))} />
                <Selector label="Aula" value={f.aulaId} onChange={(e) => setF(i, 'aulaId', e.target.value)} vacio="Selecciona…" opciones={(aulas ?? []).filter((a) => a.activo).map((a) => ({ value: a.id, label: `${a.codigo} · cap. ${a.capacidad}` }))} />
                <Entrada label="Inicia" type="time" value={f.horaInicio} onChange={(e) => setF(i, 'horaInicio', e.target.value)} />
                <Entrada label="Termina" type="time" value={f.horaFin} onChange={(e) => setF(i, 'horaFin', e.target.value)} />
                <Boton type="button" variante="fantasma" aria-label="Quitar franja" disabled={franjas.length === 1} onClick={() => setFranjas(franjas.filter((_, j) => j !== i))}><Trash2 className="size-4" /></Boton>
              </div>
            ))}
          </div>
        </div>
        {crucesVisibles && (crucesVisibles.length ? (
          <Aviso><p className="font-semibold">El horario se cruza:</p><ul className="mt-1 list-disc pl-5">{crucesVisibles.map((c, i) => <li key={i}>{c.mensaje}</li>)}</ul></Aviso>
        ) : <Aviso tono="ok">Sin cruces: el docente y las aulas están libres en esas franjas.</Aviso>)}
      </form>
    </Modal>
  );
}

export default function CargaAcademica() {
  const { data: periodos } = useApi<Periodo[]>('/periodos');
  const [periodoId, setPeriodoId] = useState('');
  const periodo = periodos?.find((p) => String(p.id) === periodoId) ?? periodos?.find((p) => p.actual);
  const { data, cargando, error, recargar } = useApi<Carga[]>(periodo ? `/carga?periodoId=${periodo.id}` : null);
  const [form, setForm] = useState<{ carga: Carga | null } | null>(null);
  const [q, setQ] = useState('');
  const filas = useMemo(() => data?.filter((c) => `${c.materia.nombre} ${c.materia.codigo} ${nombre(c.docente.usuario)}`.toLowerCase().includes(q.toLowerCase())), [data, q]);

  async function eliminar(c: Carga) {
    if (!confirm(`¿Eliminar ${c.materia.nombre} grupo ${c.grupo}?`)) return;
    try { await api(`/carga/${c.id}`, { method: 'DELETE' }); toast.success('Grupo eliminado'); recargar(); } catch (e) { toast.error(mensajeDe(e)); }
  }

  return (
    <>
      <Encabezado titulo="Carga académica" descripcion="Grupos del periodo con su docente, aula y horario. El sistema impide guardar si el docente o el aula ya están ocupados."
        acciones={periodo && <Boton onClick={() => setForm({ carga: null })}><Plus className="size-4" />Nuevo grupo</Boton>} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select value={periodo?.id ?? ''} onChange={(e) => setPeriodoId(e.target.value)} className="field h-10 w-44" aria-label="Periodo">
          {periodos?.map((p) => <option key={p.id} value={p.id}>{p.codigo}{p.actual ? ' (actual)' : ''}</option>)}
        </select>
        <Buscador valor={q} onCambio={setQ} placeholder="Buscar materia o docente" />
      </div>
      {error && <Aviso>{error}</Aviso>}
      <Tabla filas={filas} cargando={cargando} clave={(c) => c.id} vacio="No hay grupos programados en este periodo." columnas={[
        { titulo: 'Materia', celda: (c) => <><p className="font-semibold">{c.materia.nombre}</p><p className="text-[12.5px] text-mute">{c.materia.codigo} · {c.materia.creditos} créditos</p></> },
        { titulo: 'Grupo', celda: (c) => c.grupo },
        { titulo: 'Docente', celda: (c) => nombre(c.docente.usuario) },
        { titulo: 'Horario', celda: (c) => <ul className="text-[13px] tabular">{c.horarios.map((h) => <li key={h.id}>{DIAS_CORTOS[h.dia]} {h.horaInicio.slice(0, 5)}–{h.horaFin.slice(0, 5)} · {h.aula?.codigo}</li>)}</ul> },
        { titulo: 'Inscritos', alinear: 'der', celda: (c) => <span className={c.inscritos >= c.cupo ? 'font-semibold text-bad' : ''}>{c.inscritos} / {c.cupo}</span> },
        { titulo: 'Acciones', alinear: 'der', celda: (c) => (
          <div className="flex justify-end gap-1.5">
            <Boton tamano="sm" variante="secundario" onClick={() => setForm({ carga: c })}>Editar</Boton>
            <Boton tamano="sm" variante="peligro" onClick={() => eliminar(c)} disabled={c.inscritos > 0} title={c.inscritos ? 'Tiene estudiantes inscritos' : undefined}>Eliminar</Boton>
          </div>
        ) },
      ]} />
      {form && periodo && <FormCarga periodo={periodo} carga={form.carga} onCerrar={(ok) => { setForm(null); if (ok) recargar(); }} />}
    </>
  );
}
