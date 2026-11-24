'use client';
import Link from 'next/link';
import { AbrirAsistencia } from '@/components/abrir-asistencia';
import { Semaforo } from '@/components/semaforo';
import { Aviso, Boton, Cargando, Cifras, Encabezado, Seccion, Vacio } from '@/components/ui';
import { useApi } from '@/lib/use-api';
import { useAuth } from '@/lib/auth';
import { hora } from '@/lib/format';
import type { Asistencia, PlanResumen, Sesion } from '@/lib/types';

interface Resumen {
  grupos: { id: number; materia: string; grupo: string; inscritos: number; ultimoCorteCerrado: number }[];
  clasesHoy: Sesion[]; asistenciasAbiertas: (Asistencia & { carga: { materia: { nombre: string } } })[]; planes: PlanResumen[]; temasAtrasados: number;
}

export default function InicioDocente() {
  const { usuario } = useAuth();
  const { data, error } = useApi<Resumen>('/dashboard');
  if (error) return <Aviso>{error}</Aviso>;
  if (!data) return <Cargando />;
  const ahora = new Date().getHours() * 60 + new Date().getMinutes();
  const min = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));
  return (
    <>
      <Encabezado titulo={`Hola, ${usuario?.nombre.split(' ')[0]}`} descripcion="Tus clases de hoy, las asistencias abiertas y cómo van tus planes." />
      <div className="space-y-6">
        {data.asistenciasAbiertas.map((a) => (
          <Aviso key={a.id} tono="aviso">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>La asistencia de <b>{a.carga.materia.nombre}</b> sigue abierta desde las {hora(a.horaApertura)}.</span>
              <Link href={`/docente/asistencia/${a.id}`}><Boton tamano="sm">Ir a la asistencia</Boton></Link>
            </div>
          </Aviso>
        ))}
        <Seccion titulo="Clases de hoy">
          {data.clasesHoy.length === 0 ? <p className="text-[14px] text-mute">Hoy no tienes clases programadas.</p> : (
            <ul className="divide-y divide-line-soft">
              {data.clasesHoy.map((s) => {
                const enCurso = ahora >= min(s.horaInicio) - 15 && ahora <= min(s.horaFin);
                const abierta = data.asistenciasAbiertas.find((a) => a.cargaId === s.cargaId);
                return (
                  <li key={s.horarioId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-4">
                      <span className="display w-28 text-[17px] font-[800] tabular">{s.horaInicio}–{s.horaFin}</span>
                      <div><p className="font-semibold">{s.materia} · grupo {s.grupo}</p><p className="text-[13px] text-mute">Aula {s.aula} · {s.sede}{enCurso && <span className="ml-2 font-semibold text-warn">en curso</span>}</p></div>
                    </div>
                    {abierta ? <Link href={`/docente/asistencia/${abierta.id}`}><Boton tamano="sm" variante="secundario">Ver asistencia</Boton></Link> : <AbrirAsistencia cargaId={s.cargaId} etiqueta="Tomar asistencia" tamano="sm" />}
                  </li>
                );
              })}
            </ul>
          )}
        </Seccion>
        <Cifras items={[
          { label: 'Grupos a cargo', valor: data.grupos.length },
          { label: 'Estudiantes', valor: data.grupos.reduce((s, g) => s + g.inscritos, 0) },
          { label: 'Temas atrasados del plan', valor: data.temasAtrasados, tono: data.temasAtrasados ? 'mal' : 'ok' },
        ]} />
        <Seccion titulo="Mis grupos">
          {data.grupos.length === 0 ? <Vacio titulo="No tienes grupos asignados en el periodo" /> : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {data.grupos.map((g) => {
                const plan = data.planes.find((p) => p.cargaId === g.id);
                return (
                  <li key={g.id}>
                    <Link href={`/docente/grupos/${g.id}`} className="block rounded-sm border border-line px-4 py-3 hover:border-ink">
                      <p className="font-semibold">{g.materia} · {g.grupo}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[13px] text-mute">{g.inscritos} estudiantes · {g.ultimoCorteCerrado ? `corte ${g.ultimoCorteCerrado} cerrado` : 'sin cortes cerrados'}{plan && <Semaforo estado={plan.avance.semaforo} />}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Seccion>
      </div>
    </>
  );
}
