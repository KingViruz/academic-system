'use client';
import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api, mensajeDe } from '@/lib/api';
import { fecha, hoyISO } from '@/lib/format';
import type { DetallePlan, Plan } from '@/lib/types';
import { BarraAvance, Semaforo } from './semaforo';
import { Aviso, Boton, Cifras, Entrada, Modal, Selector, Tabla, cx } from './ui';

type Modo = 'coordinador' | 'docente' | 'estudiante';
const vacio = { semana: '', unidadId: '', tema: '', actividad: '', horas: '4', corte: '1', fechaPlaneada: '' };

/** Plan del periodo con su detalle semanal. El coordinador lo arma, el docente reporta avance y el estudiante consulta. */
export function PlanDetalle({ plan, modo, onCambio }: { plan: Plan; modo: Modo; onCambio: () => void }) {
  const [form, setForm] = useState<{ d: DetallePlan | null; v: typeof vacio } | null>(null);
  const [obs, setObs] = useState<{ d: DetallePlan; texto: string } | null>(null);
  const hoy = hoyISO();
  const unidades = plan.microcurriculo.unidades ?? [];

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const v = form!.v;
    const body = { semana: Number(v.semana), unidadId: Number(v.unidadId), tema: v.tema, actividad: v.actividad || undefined, horas: Number(v.horas), corte: Number(v.corte), fechaPlaneada: v.fechaPlaneada };
    try {
      if (form!.d) await api(`/planes/detalle/${form!.d.id}`, { method: 'PATCH', body });
      else await api(`/planes/${plan.id}/detalle`, { body });
      toast.success('Sesión guardada'); setForm(null); onCambio();
    } catch (err) { toast.error(mensajeDe(err)); }
  }
  async function eliminar(d: DetallePlan) {
    if (!confirm(`¿Eliminar "${d.tema}"?`)) return;
    try { await api(`/planes/detalle/${d.id}`, { method: 'DELETE' }); onCambio(); } catch (e) { toast.error(mensajeDe(e)); }
  }
  async function ejecutar(d: DetallePlan, ejecutado: boolean, observaciones?: string) {
    try { await api(`/planes/detalle/${d.id}/ejecutar`, { body: { ejecutado, observaciones } }); toast.success(ejecutado ? 'Tema marcado como ejecutado' : 'Tema desmarcado'); onCambio(); } catch (e) { toast.error(mensajeDe(e)); }
  }
  const siguiente = () => {
    const ult = plan.detalles.at(-1);
    const f = ult ? new Date(ult.fechaPlaneada + 'T12:00:00') : new Date(plan.fechaInicio + 'T12:00:00');
    if (ult) f.setDate(f.getDate() + 7);
    return { ...vacio, semana: String((ult?.semana ?? 0) + 1), unidadId: String(ult?.unidadId ?? unidades[0]?.id ?? ''), corte: String(ult?.corte ?? 1), fechaPlaneada: f.toISOString().slice(0, 10) };
  };

  return (
    <div className="space-y-5">
      <Cifras items={[
        { label: 'Estado', valor: <Semaforo estado={plan.avance.semaforo} /> },
        { label: 'Previsto a hoy ejecutado', valor: `${plan.avance.porcentajeALaFecha} %`, tono: plan.avance.semaforo === 'ROJO' ? 'mal' : plan.avance.semaforo === 'AMARILLO' ? 'aviso' : undefined },
        { label: 'Avance total', valor: `${plan.avance.porcentajeTotal} %` },
        { label: 'Temas atrasados', valor: plan.avance.atrasados.length, tono: plan.avance.atrasados.length ? 'mal' : 'ok' },
      ]} />
      <div className="max-w-xl"><BarraAvance avance={plan.avance} /></div>
      {modo === 'coordinador' && !plan.horasCuadran && <Aviso tono="aviso">El detalle suma {plan.horasDetalle} h y el plan tiene {plan.totalHoras} h. Completa las sesiones para que cuadren.</Aviso>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-mute">Del {fecha(plan.fechaInicio)} al {fecha(plan.fechaFin)} · {plan.totalHoras} horas</p>
        {modo === 'coordinador' && <Boton tamano="sm" onClick={() => setForm({ d: null, v: siguiente() })}><Plus className="size-3.5" />Agregar sesión</Boton>}
      </div>
      <Tabla filas={plan.detalles} clave={(d) => d.id} vacio={modo === 'coordinador' ? 'Agrega las sesiones semana a semana.' : 'El coordinador aún no ha detallado el plan.'} columnas={[
        { titulo: 'Semana', alinear: 'centro', celda: (d) => <span className="tabular font-semibold">{d.semana}</span> },
        { titulo: 'Fecha', celda: (d) => <span className={cx('tabular text-[13px]', !d.ejecutado && d.fechaPlaneada < hoy && 'font-semibold text-bad')}>{fecha(d.fechaPlaneada)}</span> },
        { titulo: 'Tema', celda: (d) => <><p className="font-semibold">{d.tema}</p><p className="text-[12.5px] text-mute">Unidad {d.unidad?.numero ?? '—'} · corte {d.corte}{d.actividad ? ` · ${d.actividad}` : ''}</p>{d.observaciones && <p className="mt-0.5 text-[12.5px] italic text-ink-soft">{d.observaciones}</p>}</> },
        { titulo: 'Horas', alinear: 'der', celda: (d) => d.horas },
        { titulo: 'Ejecución', celda: (d) => d.ejecutado ? <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-ok"><Check className="size-4" />{fecha(d.fechaEjecucion)}</span> : d.fechaPlaneada < hoy ? <span className="text-[13px] font-semibold text-bad">Atrasado</span> : <span className="text-[13px] text-mute">Pendiente</span> },
        ...(modo === 'estudiante' ? [] : [{ titulo: 'Acciones', alinear: 'der' as const, celda: (d: DetallePlan) => (
          <div className="flex justify-end gap-1.5">
            {modo === 'docente' && (d.ejecutado
              ? <Boton tamano="sm" variante="fantasma" onClick={() => ejecutar(d, false)}>Desmarcar</Boton>
              : <Boton tamano="sm" onClick={() => setObs({ d, texto: d.observaciones ?? '' })}>Marcar ejecutado</Boton>)}
            {modo === 'coordinador' && <>
              <Boton tamano="sm" variante="secundario" onClick={() => setForm({ d, v: { semana: String(d.semana), unidadId: String(d.unidadId), tema: d.tema, actividad: d.actividad ?? '', horas: String(d.horas), corte: String(d.corte), fechaPlaneada: d.fechaPlaneada } })}>Editar</Boton>
              {!d.ejecutado && <Boton tamano="sm" variante="fantasma" onClick={() => eliminar(d)}>Eliminar</Boton>}
            </>}
          </div>
        ) }]),
      ]} />

      <Modal abierto={!!form} onCerrar={() => setForm(null)} titulo={form?.d ? 'Editar sesión' : 'Nueva sesión'} ancho="lg"
        pie={<><Boton variante="secundario" onClick={() => setForm(null)}>Cancelar</Boton><Boton form="f-det" type="submit">Guardar sesión</Boton></>}>
        {form && (
          <form id="f-det" onSubmit={guardar} className="grid gap-4 sm:grid-cols-3">
            <Entrada label="Semana" type="number" min={1} value={form.v.semana} onChange={(e) => setForm({ ...form, v: { ...form.v, semana: e.target.value } })} />
            <Entrada label="Fecha planeada" type="date" value={form.v.fechaPlaneada} onChange={(e) => setForm({ ...form, v: { ...form.v, fechaPlaneada: e.target.value } })} />
            <Selector label="Corte" value={form.v.corte} onChange={(e) => setForm({ ...form, v: { ...form.v, corte: e.target.value } })} opciones={[1, 2, 3].map((c) => ({ value: c, label: `Corte ${c}` }))} />
            <Selector className="sm:col-span-2" label="Unidad temática" value={form.v.unidadId} onChange={(e) => setForm({ ...form, v: { ...form.v, unidadId: e.target.value } })} opciones={unidades.map((u) => ({ value: u.id, label: `${u.numero}. ${u.nombre}` }))} />
            <Entrada label="Horas" type="number" min={1} value={form.v.horas} onChange={(e) => setForm({ ...form, v: { ...form.v, horas: e.target.value } })} />
            <Entrada className="sm:col-span-3" label="Tema" value={form.v.tema} onChange={(e) => setForm({ ...form, v: { ...form.v, tema: e.target.value } })} />
            <Entrada className="sm:col-span-3" label="Actividad (opcional)" value={form.v.actividad} onChange={(e) => setForm({ ...form, v: { ...form.v, actividad: e.target.value } })} />
          </form>
        )}
      </Modal>
      <Modal abierto={!!obs} onCerrar={() => setObs(null)} titulo={`Marcar "${obs?.d.tema ?? ''}" como ejecutado`}
        pie={<><Boton variante="secundario" onClick={() => setObs(null)}>Cancelar</Boton><Boton onClick={() => { ejecutar(obs!.d, true, obs!.texto || undefined); setObs(null); }}>Marcar ejecutado</Boton></>}>
        <Entrada label="Observaciones (opcional)" value={obs?.texto ?? ''} onChange={(e) => setObs(obs && { ...obs, texto: e.target.value })} placeholder="Ej.: se reforzó con taller práctico" />
        <p className="mt-2 text-[13px] text-mute">Se guarda la fecha de hoy como fecha real de ejecución.</p>
      </Modal>
    </div>
  );
}
