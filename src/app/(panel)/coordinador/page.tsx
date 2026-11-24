'use client';
import Link from 'next/link';
import { BarraAvance, Semaforo } from '@/components/semaforo';
import { Aviso, Cargando, Cifras, Encabezado, Seccion, Tabla, cx } from '@/components/ui';
import { useApi } from '@/lib/use-api';
import { nota } from '@/lib/format';
import type { PlanResumen, Semaforo as S } from '@/lib/types';

interface Resumen {
  totales: { estudiantes: number; grupos: number; docentes: number };
  asistenciaPromedio: number | null;
  asistenciaPorGrupo: { cargaId: number; materia: string; grupo: string; porcentaje: number | null }[];
  rendimiento: { materia: string; grupo: string; corte: number; promedio: number; notas: number; bajoMinimo: number }[];
  planes: { semaforo: Record<S, number>; detalle: PlanResumen[] };
  alertasAbiertas: Record<string, number>;
  solicitudesPendientes: number;
}

export default function InicioCoordinador() {
  const { data, error } = useApi<Resumen>('/dashboard');
  if (error) return <Aviso>{error}</Aviso>;
  if (!data) return <Cargando />;
  const alertas = Object.values(data.alertasAbiertas).reduce((a, b) => a + b, 0);
  const enRiesgo = data.planes.detalle.filter((p) => p.avance.semaforo === 'ROJO' || p.avance.semaforo === 'AMARILLO');
  const porGrupo = new Map<string, { materia: string; grupo: string; cortes: Record<number, { promedio: number; bajo: number }> }>();
  data.rendimiento.forEach((r) => {
    const k = `${r.materia}|${r.grupo}`;
    const x = porGrupo.get(k) ?? { materia: r.materia, grupo: r.grupo, cortes: {} };
    x.cortes[r.corte] = { promedio: r.promedio, bajo: r.bajoMinimo };
    porGrupo.set(k, x);
  });

  return (
    <>
      <Encabezado titulo="Coordinación del programa" descripcion="Asistencia, avance de los planes y rendimiento del periodo actual." />
      <div className="space-y-6">
        <Cifras items={[
          { label: 'Estudiantes', valor: data.totales.estudiantes },
          { label: 'Grupos en el periodo', valor: data.totales.grupos },
          { label: 'Asistencia promedio', valor: data.asistenciaPromedio === null ? '—' : `${data.asistenciaPromedio} %`, tono: data.asistenciaPromedio !== null && data.asistenciaPromedio < 80 ? 'aviso' : undefined },
          { label: 'Alertas por atender', valor: alertas, tono: alertas ? 'mal' : 'ok' },
          { label: 'Cambios de nota pendientes', valor: data.solicitudesPendientes, tono: data.solicitudesPendientes ? 'aviso' : undefined },
        ]} />
        {(alertas > 0 || data.solicitudesPendientes > 0) && (
          <div className="flex flex-wrap gap-4 text-[14px] font-semibold">
            {alertas > 0 && <Link href="/coordinador/alertas" className="text-ember-dark hover:underline">Revisar {alertas} alerta(s)</Link>}
            {data.solicitudesPendientes > 0 && <Link href="/coordinador/solicitudes" className="text-ember-dark hover:underline">Resolver {data.solicitudesPendientes} cambio(s) de nota</Link>}
          </div>
        )}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Seccion titulo="Planes que requieren atención" descripcion={`${data.planes.semaforo.VERDE} al día · ${data.planes.semaforo.AMARILLO} con leve atraso · ${data.planes.semaforo.ROJO} atrasados`}
            acciones={<Link href="/coordinador/planes" className="text-[14px] font-semibold text-ember-dark hover:underline">Ver todos</Link>}>
            {enRiesgo.length === 0 ? <p className="text-[14px] text-ok">Todos los planes van al día.</p> : (
              <ul className="divide-y divide-line-soft">
                {enRiesgo.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div><Link href={`/coordinador/planes/${p.id}`} className="font-semibold hover:underline">{p.materia} · {p.grupo}</Link><p className="text-[13px] text-mute">{p.docente}</p></div>
                    <div className="flex items-center gap-4"><Semaforo estado={p.avance.semaforo} /><div className="w-52"><BarraAvance avance={p.avance} /></div></div>
                  </li>
                ))}
              </ul>
            )}
          </Seccion>
          <Seccion titulo="Asistencia por grupo">
            <ul className="space-y-2.5">
              {data.asistenciaPorGrupo.map((g) => (
                <li key={g.cargaId}>
                  <div className="flex justify-between text-[14px]"><span>{g.materia} · {g.grupo}</span><span className="font-semibold tabular">{g.porcentaje === null ? 'Sin sesiones' : `${g.porcentaje} %`}</span></div>
                  {g.porcentaje !== null && <div className="mt-1 h-1.5 rounded-full bg-line-soft"><div className={cx('h-1.5 rounded-full', g.porcentaje >= 90 ? 'bg-ok' : g.porcentaje >= 80 ? 'bg-sun' : 'bg-bad')} style={{ width: `${g.porcentaje}%` }} /></div>}
                </li>
              ))}
            </ul>
          </Seccion>
        </div>
        <Seccion titulo="Rendimiento por materia" descripcion="Promedio de cada corte registrado y cuántos estudiantes quedaron por debajo de 3,0.">
          <Tabla filas={[...porGrupo.values()]} clave={(g) => `${g.materia}${g.grupo}`} vacio="Aún no hay notas registradas en el periodo." columnas={[
            { titulo: 'Materia', celda: (g) => <span className="font-semibold">{g.materia} · {g.grupo}</span> },
            ...[1, 2, 3].map((c) => ({ titulo: `Corte ${c}`, alinear: 'der' as const, celda: (g: { cortes: Record<number, { promedio: number; bajo: number }> }) => g.cortes[c]
              ? <span className="tabular"><span className={cx('font-semibold', g.cortes[c].promedio < 3 && 'text-bad')}>{nota(g.cortes[c].promedio, 2)}</span>{g.cortes[c].bajo > 0 && <span className="ml-2 text-[12.5px] text-bad">{g.cortes[c].bajo} bajo 3,0</span>}</span>
              : <span className="text-mute">—</span> })),
          ]} />
        </Seccion>
      </div>
    </>
  );
}
