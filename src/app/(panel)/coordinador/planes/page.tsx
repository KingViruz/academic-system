'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { BarraAvance, Semaforo } from '@/components/semaforo';
import { Boton, Encabezado, Entrada, Modal, Selector, Tabla } from '@/components/ui';
import { api, mensajeDe } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { fecha } from '@/lib/format';
import type { Carga, Periodo, PlanResumen } from '@/lib/types';

export default function Planes() {
  const router = useRouter();
  const { data, cargando } = useApi<PlanResumen[]>('/planes/seguimiento');
  const { data: periodo } = useApi<Periodo>('/periodos/actual');
  const { data: cargas } = useApi<Carga[]>('/carga');
  const [nuevo, setNuevo] = useState(false);
  const [f, setF] = useState({ cargaId: '', fechaInicio: '', fechaFin: '', totalHoras: '64' });
  const sinPlan = useMemo(() => (cargas ?? []).filter((c) => !data?.some((p) => p.cargaId === c.id)), [cargas, data]);
  const orden = { ROJO: 0, AMARILLO: 1, VERDE: 2, SIN_INICIAR: 3 };
  const filas = useMemo(() => [...(data ?? [])].sort((a, b) => orden[a.avance.semaforo] - orden[b.avance.semaforo]), [data]); // eslint-disable-line react-hooks/exhaustive-deps

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    try {
      const p = await api<{ id: number }>('/planes', { body: { cargaId: Number(f.cargaId), fechaInicio: f.fechaInicio, fechaFin: f.fechaFin, totalHoras: Number(f.totalHoras) } });
      toast.success('Plan creado'); router.push(`/coordinador/planes/${p.id}`);
    } catch (err) { toast.error(mensajeDe(err)); }
  }

  return (
    <>
      <Encabezado titulo="Seguimiento de planes" descripcion="Avance de cada plan de microcurrículo frente a lo planeado a la fecha. Verde: 90 % o más; amarillo: 70 % a 89 %; rojo: menos de 70 %."
        acciones={<Boton onClick={() => { setF({ cargaId: '', fechaInicio: periodo?.fechaInicio ?? '', fechaFin: periodo?.fechaFin ?? '', totalHoras: '64' }); setNuevo(true); }}><Plus className="size-4" />Nuevo plan</Boton>} />
      <Tabla filas={filas} cargando={cargando} clave={(p) => p.id} onFila={(p) => router.push(`/coordinador/planes/${p.id}`)} vacio="No hay planes en el periodo actual." columnas={[
        { titulo: 'Materia', celda: (p) => <Link href={`/coordinador/planes/${p.id}`} className="font-semibold hover:underline">{p.materia} · {p.grupo}</Link> },
        { titulo: 'Docente', celda: (p) => p.docente },
        { titulo: 'Estado', celda: (p) => <Semaforo estado={p.avance.semaforo} /> },
        { titulo: 'Avance', className: 'w-72', celda: (p) => <BarraAvance avance={p.avance} /> },
        { titulo: 'Temas atrasados', alinear: 'der', celda: (p) => p.avance.atrasados.length ? <span className="font-semibold text-bad">{p.avance.atrasados.length}</span> : 0 },
      ]} />
      <Modal abierto={nuevo} onCerrar={() => setNuevo(false)} titulo="Nuevo plan de microcurrículo"
        pie={<><Boton variante="secundario" onClick={() => setNuevo(false)}>Cancelar</Boton><Boton form="f-plan" type="submit">Crear plan</Boton></>}>
        <form id="f-plan" onSubmit={crear} className="grid gap-4 sm:grid-cols-2">
          <Selector className="sm:col-span-2" label="Grupo" value={f.cargaId} onChange={(e) => setF({ ...f, cargaId: e.target.value })} vacio={sinPlan.length ? 'Selecciona…' : 'Todos los grupos ya tienen plan'}
            ayuda="La materia debe tener su microcurrículo publicado." opciones={sinPlan.map((c) => ({ value: c.id, label: `${c.materia.nombre} · grupo ${c.grupo}` }))} />
          <Entrada label="Fecha de inicio" type="date" value={f.fechaInicio} onChange={(e) => setF({ ...f, fechaInicio: e.target.value })} ayuda={periodo ? `El periodo va del ${fecha(periodo.fechaInicio)} al ${fecha(periodo.fechaFin)}` : undefined} />
          <Entrada label="Fecha de terminación" type="date" value={f.fechaFin} onChange={(e) => setF({ ...f, fechaFin: e.target.value })} />
          <Entrada label="Total de horas" type="number" min={1} value={f.totalHoras} onChange={(e) => setF({ ...f, totalHoras: e.target.value })} />
        </form>
      </Modal>
    </>
  );
}
