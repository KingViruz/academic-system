'use client';
import Link from 'next/link';
import { MarcarQr } from '@/components/marcar-qr';
import { Aviso, Cargando, Cifras, Encabezado, Seccion, cx } from '@/components/ui';
import { useApi } from '@/lib/use-api';
import { useAuth } from '@/lib/auth';
import type { Sesion } from '@/lib/types';

interface Resumen {
  creditos: number; limiteCreditos: number; clasesHoy: Sesion[]; materiasEnRiesgo: number;
  asistencias: { cargaId: number; materia: string; grupo: string; sesiones: number; ausencias: number; porcentajeFallas: number; umbral: number; enRiesgo: boolean }[];
}

export default function InicioEstudiante() {
  const { usuario } = useAuth();
  const { data, error } = useApi<Resumen>('/dashboard');
  if (error) return <Aviso>{error}</Aviso>;
  if (!data) return <Cargando />;
  return (
    <>
      <Encabezado titulo={`Hola, ${usuario?.nombre.split(' ')[0]}`} descripcion="Tus clases de hoy y cómo vas en asistencia." />
      <div className="space-y-6">
        {data.materiasEnRiesgo > 0 && <Aviso tono="aviso">Te estás acercando al límite de fallas en {data.materiasEnRiesgo} materia(s). <Link href="/estudiante/asistencia" className="font-semibold underline">Revisa tu asistencia</Link>.</Aviso>}
        <Seccion titulo="Clases de hoy">
          {data.clasesHoy.length === 0 ? <p className="text-[14px] text-mute">Hoy no tienes clases.</p> : (
            <ul className="divide-y divide-line-soft">
              {data.clasesHoy.map((s) => (
                <li key={s.horarioId} className="flex items-center gap-4 py-3">
                  <span className="display w-28 text-[17px] font-[800] tabular">{s.horaInicio}–{s.horaFin}</span>
                  <div><p className="font-semibold">{s.materia}</p><p className="text-[13px] text-mute">Aula {s.aula} · {s.docente}</p></div>
                </li>
              ))}
            </ul>
          )}
        </Seccion>
        <Cifras items={[
          { label: 'Créditos inscritos', valor: `${data.creditos} de ${data.limiteCreditos}` },
          { label: 'Materias', valor: data.asistencias.length },
          { label: 'Materias cerca del límite de fallas', valor: data.materiasEnRiesgo, tono: data.materiasEnRiesgo ? 'aviso' : 'ok' },
        ]} />
        <div className="grid gap-6 lg:grid-cols-2">
          <Seccion titulo="Fallas por materia" acciones={<Link href="/estudiante/asistencia" className="text-[14px] font-semibold text-ember-dark hover:underline">Ver detalle</Link>}>
            {data.asistencias.length === 0 ? <p className="text-[14px] text-mute">No tienes materias inscritas. <Link href="/estudiante/inscripcion" className="font-semibold text-ember-dark underline">Inscribe tu horario</Link>.</p> : (
              <ul className="space-y-3">
                {data.asistencias.map((m) => (
                  <li key={m.cargaId}>
                    <div className="flex justify-between text-[14px]"><span>{m.materia}</span><span className={cx('font-semibold tabular', m.enRiesgo && 'text-bad')}>{m.sesiones ? `${String(m.porcentajeFallas).replace('.', ',')} %` : 'Sin clases aún'}</span></div>
                    <div className="relative mt-1 h-1.5 rounded-full bg-line-soft">
                      <div className={cx('h-1.5 rounded-full', m.enRiesgo ? 'bg-bad' : 'bg-ok')} style={{ width: `${Math.min(100, (m.porcentajeFallas / m.umbral) * 100)}%` }} />
                    </div>
                    <p className="mt-0.5 text-[12px] text-mute">{m.ausencias} falla(s) en {m.sesiones} clases · límite {m.umbral} %</p>
                  </li>
                ))}
              </ul>
            )}
          </Seccion>
          <Seccion titulo="Registrar asistencia con código"><MarcarQr /></Seccion>
        </div>
      </div>
    </>
  );
}
