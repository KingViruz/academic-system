'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { FormularioCampos, convertir, type CampoDef } from '@/components/crud';
import { AreaTexto, Aviso, Boton, Cargando, Casilla, Encabezado, Entrada, Etiqueta, Modal, Seccion, cx } from '@/components/ui';
import { api, ApiError, mensajeDe } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import type { Materia, Microcurriculo, Unidad } from '@/lib/types';

const TEXTOS = [
  ['descripcion', 'Descripción de la asignatura'], ['objetivoGeneral', 'Objetivo general'], ['objetivosEspecificos', 'Objetivos específicos'],
  ['competenciasGenericas', 'Competencias genéricas'], ['estrategias', 'Estrategias metodológicas'], ['bibliografia', 'Bibliografía'],
] as const;

const camposUnidad: CampoDef[] = [
  { nombre: 'numero', label: 'Número', tipo: 'number', requerido: true },
  { nombre: 'nombre', label: 'Nombre de la unidad', requerido: true },
  { nombre: 'competenciaEspecifica', label: 'Competencia específica', tipo: 'textarea', requerido: true },
  { nombre: 'resultadoAprendizaje', label: 'Resultado de aprendizaje', tipo: 'textarea', requerido: true },
  { nombre: 'nivelSuperior', label: 'Nivel superior', tipo: 'textarea', requerido: true },
  { nombre: 'nivelNormal', label: 'Nivel normal', tipo: 'textarea', requerido: true },
  { nombre: 'nivelBajo', label: 'Nivel bajo', tipo: 'textarea', requerido: true },
  { nombre: 'nivelDeficiente', label: 'Nivel deficiente', tipo: 'textarea', requerido: true },
];

function formDesde(m: Microcurriculo) {
  const f: Record<string, string> = { porcentajeP1: String(m.porcentajeP1), porcentajeP2: String(m.porcentajeP2), porcentajeP3: String(m.porcentajeP3) };
  TEXTOS.forEach(([k]) => { f[k] = m[k] ?? ''; });
  return f;
}

export default function EditarMicrocurriculo() {
  const { id } = useParams<{ id: string }>();
  const { data: m, error, recargar, setData } = useApi<Microcurriculo>(`/microcurriculos/${id}`);
  if (error) return <Aviso>{error}</Aviso>;
  if (!m) return <Cargando />;
  return <Editor key={m.id} m={m} id={id} recargar={recargar} setData={setData} />;
}

function Editor({ m, id, recargar, setData }: { m: Microcurriculo; id: string; recargar: () => void; setData: (m: Microcurriculo) => void }) {
  const { data: materias } = useApi<Materia[]>('/materias');
  const [form, setForm] = useState<Record<string, string>>(() => formDesde(m));
  const [guardando, setGuardando] = useState(false);
  const [unidad, setUnidad] = useState<{ u: Unidad | null; v: Record<string, string | boolean> } | null>(null);
  const [errU, setErrU] = useState<Record<string, string>>({});
  const [prerreq, setPrerreq] = useState(false);
  const [sel, setSel] = useState<Set<number>>(() => new Set(m.prerrequisitos.map((p) => p.id)));
  const suma = ['porcentajeP1', 'porcentajeP2', 'porcentajeP3'].reduce((s, k) => s + (Number(form[k]) || 0), 0);

  async function guardar() {
    setGuardando(true);
    try {
      const body: Record<string, unknown> = { porcentajeP1: Number(form.porcentajeP1), porcentajeP2: Number(form.porcentajeP2), porcentajeP3: Number(form.porcentajeP3) };
      TEXTOS.forEach(([k]) => { body[k] = form[k]; });
      setData(await api<Microcurriculo>(`/microcurriculos/${id}`, { method: 'PATCH', body }));
      toast.success('Cambios guardados');
    } catch (e) { toast.error(mensajeDe(e)); } finally { setGuardando(false); }
  }
  async function publicar() {
    await guardar();
    try { setData(await api<Microcurriculo>(`/microcurriculos/${id}/publicar`, { body: {} })); toast.success('Microcurrículo publicado'); } catch (e) { toast.error(mensajeDe(e)); }
  }
  async function guardarUnidad(e: React.FormEvent) {
    e.preventDefault(); setErrU({});
    try {
      const body = convertir(camposUnidad, unidad!.v);
      if (unidad!.u) await api(`/unidades/${unidad!.u.id}`, { method: 'PATCH', body });
      else await api(`/microcurriculos/${id}/unidades`, { body });
      toast.success('Unidad guardada'); setUnidad(null); recargar();
    } catch (err) {
      if (err instanceof ApiError && err.errores.length) setErrU(Object.fromEntries(err.errores.map((x) => [x.campo, x.mensaje])));
      toast.error(mensajeDe(err));
    }
  }
  async function borrarUnidad(u: Unidad) {
    if (!confirm(`¿Eliminar la unidad ${u.numero}?`)) return;
    try { await api(`/unidades/${u.id}`, { method: 'DELETE' }); recargar(); } catch (e) { toast.error(mensajeDe(e)); }
  }
  async function guardarPrerreq() {
    try { setData(await api<Microcurriculo>(`/microcurriculos/${id}/prerrequisitos`, { method: 'PUT', body: { materiaIds: [...sel] } })); setPrerreq(false); toast.success('Prerrequisitos guardados'); } catch (e) { toast.error(mensajeDe(e)); }
  }

  return (
    <>
      <Link href="/coordinador/microcurriculos" className="mb-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink-soft hover:text-ink"><ArrowLeft className="size-4" />Microcurrículos</Link>
      <Encabezado titulo={m.materia.nombre} descripcion={<>{m.materia.codigo} · {m.materia.creditos} créditos · {m.estado === 'PUBLICADO' ? <Etiqueta tono="ok">Publicado</Etiqueta> : <Etiqueta tono="aviso">Borrador</Etiqueta>}</>}
        acciones={<><Boton variante="secundario" onClick={guardar} cargando={guardando}>Guardar</Boton>{m.estado === 'BORRADOR' && <Boton onClick={publicar}>Publicar</Boton>}</>} />
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Seccion titulo="Contenido">
          <div className="space-y-4">
            {TEXTOS.map(([k, label]) => <AreaTexto key={k} label={label} value={form[k] ?? ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} rows={k === 'descripcion' || k === 'bibliografia' ? 4 : 3} />)}
          </div>
        </Seccion>
        <div className="space-y-6">
          <Seccion titulo="Peso de los parciales" descripcion="Deben sumar 100 %. Con ellos se calcula la nota definitiva.">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((n) => <Entrada key={n} label={`Parcial ${n} (%)`} type="number" min={0} max={100} value={form[`porcentajeP${n}`] ?? ''} onChange={(e) => setForm({ ...form, [`porcentajeP${n}`]: e.target.value })} />)}
            </div>
            <p className={cx('mt-3 text-[14px] font-semibold tabular', suma === 100 ? 'text-ok' : 'text-bad')}>Suma: {suma} %{suma !== 100 && ` · faltan ${100 - suma} %`}</p>
          </Seccion>
          <Seccion titulo="Prerrequisitos" acciones={<Boton tamano="sm" variante="secundario" onClick={() => setPrerreq(true)}>Editar</Boton>} descripcion="Se validan cuando el estudiante inscribe la materia.">
            {m.prerrequisitos.length ? <ul className="space-y-1 text-[14px]">{m.prerrequisitos.map((p) => <li key={p.id}><span className="tabular text-mute">{p.codigo}</span> · {p.nombre}</li>)}</ul> : <p className="text-[14px] text-mute">Sin prerrequisitos.</p>}
          </Seccion>
        </div>
      </div>
      <div className="mt-6">
        <Seccion titulo="Unidades temáticas" descripcion="Cada unidad tiene su competencia específica, resultado de aprendizaje y los cuatro niveles de desempeño."
          acciones={<Boton tamano="sm" onClick={() => { setErrU({}); setUnidad({ u: null, v: { numero: String((m.unidades.at(-1)?.numero ?? 0) + 1) } }); }}><Plus className="size-3.5" />Agregar unidad</Boton>}>
          {m.unidades.length === 0 ? <p className="text-[14px] text-mute">Agrega al menos una unidad para poder publicar.</p> : (
            <ol className="divide-y divide-line-soft">
              {m.unidades.map((u) => (
                <li key={u.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="max-w-3xl">
                      <p className="font-bold"><span className="mr-2 text-ember tabular">{u.numero}</span>{u.nombre}</p>
                      <p className="mt-1 text-[14px] text-ink-soft"><span className="font-semibold">Competencia:</span> {u.competenciaEspecifica}</p>
                      <p className="mt-0.5 text-[14px] text-ink-soft"><span className="font-semibold">Resultado:</span> {u.resultadoAprendizaje}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <Boton tamano="sm" variante="secundario" onClick={() => { setErrU({}); setUnidad({ u, v: Object.fromEntries(camposUnidad.map((c) => [c.nombre, String(u[c.nombre as keyof Unidad] ?? '')])) }); }}>Editar</Boton>
                      <Boton tamano="sm" variante="fantasma" onClick={() => borrarUnidad(u)}>Eliminar</Boton>
                    </div>
                  </div>
                  <dl className="mt-3 grid gap-2 text-[13px] sm:grid-cols-4">
                    {([['Superior', u.nivelSuperior, 'border-ok'], ['Normal', u.nivelNormal, 'border-ink-soft'], ['Bajo', u.nivelBajo, 'border-sun'], ['Deficiente', u.nivelDeficiente, 'border-bad']] as const).map(([n, t, c]) => (
                      <div key={n} className={cx('border-l-[3px] pl-2.5', c)}><dt className="font-semibold">{n}</dt><dd className="text-mute">{t}</dd></div>
                    ))}
                  </dl>
                </li>
              ))}
            </ol>
          )}
        </Seccion>
      </div>

      <Modal abierto={!!unidad} onCerrar={() => setUnidad(null)} titulo={unidad?.u ? `Editar unidad ${unidad.u.numero}` : 'Nueva unidad'} ancho="lg"
        pie={<><Boton variante="secundario" onClick={() => setUnidad(null)}>Cancelar</Boton><Boton form="f-unidad" type="submit">Guardar unidad</Boton></>}>
        <form id="f-unidad" onSubmit={guardarUnidad}>{unidad && <FormularioCampos campos={camposUnidad} valores={unidad.v} setValores={(v) => setUnidad({ ...unidad, v })} errores={errU} editando={!!unidad.u} />}</form>
      </Modal>
      <Modal abierto={prerreq} onCerrar={() => setPrerreq(false)} titulo="Prerrequisitos" ancho="lg"
        pie={<><Boton variante="secundario" onClick={() => setPrerreq(false)}>Cancelar</Boton><Boton onClick={guardarPrerreq}>Guardar</Boton></>}>
        <p className="mb-3 text-[14px] text-mute">Una materia no puede ser prerrequisito de sí misma ni formar ciclos.</p>
        <ul className="grid max-h-80 gap-1 overflow-y-auto sm:grid-cols-2">
          {(materias ?? []).filter((x) => x.id !== m.materiaId).map((x) => (
            <li key={x.id} className="rounded-sm px-2 py-1.5 hover:bg-paper"><Casilla label={`${x.codigo} · ${x.nombre}`} checked={sel.has(x.id)} onChange={(e) => { const s = new Set(sel); if (e.target.checked) s.add(x.id); else s.delete(x.id); setSel(s); }} /></li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
