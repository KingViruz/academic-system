'use client';
import { DIAS } from '@/lib/format';
import type { Sesion } from '@/lib/types';
import { cx } from './ui';

const INICIO = 7 * 60, FIN = 21 * 60, PX = 1.05; // px por minuto
const TONOS = [
  'bg-ink text-white', 'bg-ember text-white', 'bg-[#2c6e83] text-white', 'bg-[#6b4ea0] text-white',
  'bg-[#8a5a12] text-white', 'bg-[#2f7a4b] text-white', 'bg-[#a23b5a] text-white', 'bg-ink-soft text-white',
];
const min = (h: string) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };

/**
 * Grilla semanal: el elemento central de docentes y estudiantes.
 * El día de hoy se marca con el dorado del escudo; cada materia conserva su color en toda la semana.
 */
export function HorarioSemanal({ sesiones, mostrarDocente = false, vacio }: { sesiones: Sesion[]; mostrarDocente?: boolean; vacio?: React.ReactNode }) {
  const hoy = new Date().getDay();
  const materias = [...new Set(sesiones.map((s) => s.materiaCodigo))];
  const tono = (c: string) => TONOS[materias.indexOf(c) % TONOS.length];
  const dias = sesiones.some((s) => s.dia === 6) ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
  const desde = Math.min(INICIO, ...sesiones.map((s) => Math.floor(min(s.horaInicio) / 60) * 60));
  const hasta = Math.max(desde + 8 * 60, Math.min(FIN, Math.max(...sesiones.map((s) => Math.ceil(min(s.horaFin) / 60) * 60), 0)));
  const horas = Array.from({ length: (hasta - desde) / 60 + 1 }, (_, i) => desde / 60 + i);

  if (!sesiones.length) return <>{vacio}</>;

  return (
    <>
      {/* Escritorio: grilla */}
      <div className="hidden overflow-x-auto rounded-md border border-line bg-card md:block">
        <div className="grid min-w-[760px]" style={{ gridTemplateColumns: `56px repeat(${dias.length}, 1fr)` }}>
          <div className="border-b border-line" />
          {dias.map((d) => (
            <div key={d} className={cx('border-b border-l border-line px-3 py-2.5 text-[13px] font-bold', d === hoy ? 'bg-sun-tint text-ink' : 'text-ink-soft')}>
              {DIAS[d]}{d === hoy && <span className="ml-2 font-semibold text-warn">hoy</span>}
            </div>
          ))}
          <div className="relative" style={{ height: (hasta - desde) * PX }}>
            {horas.slice(0, -1).map((h) => (
              <span key={h} className="absolute right-2 -translate-y-1/2 text-[11.5px] text-mute tabular" style={{ top: (h * 60 - desde) * PX }}>{String(h).padStart(2, '0')}:00</span>
            ))}
          </div>
          {dias.map((d) => (
            <div key={d} className={cx('relative border-l border-line', d === hoy && 'bg-sun-tint/40')} style={{ height: (hasta - desde) * PX }}>
              {horas.slice(1, -1).map((h) => <div key={h} className="absolute inset-x-0 border-t border-line-soft" style={{ top: (h * 60 - desde) * PX }} />)}
              {sesiones.filter((s) => s.dia === d).map((s) => {
                const top = (min(s.horaInicio) - desde) * PX, alto = (min(s.horaFin) - min(s.horaInicio)) * PX;
                return (
                  <div key={s.horarioId} className={cx('absolute inset-x-1 overflow-hidden rounded-sm px-2.5 py-1.5', tono(s.materiaCodigo))} style={{ top: top + 1, height: alto - 2 }}
                    title={`${s.materia} · grupo ${s.grupo} · ${s.horaInicio}–${s.horaFin} · aula ${s.aula}`}>
                    <p className="text-[13px] leading-tight font-bold">{s.materia}</p>
                    <p className="mt-0.5 text-[12px] opacity-85 tabular">{s.horaInicio}–{s.horaFin} · {s.aula}</p>
                    {alto > 70 && <p className="text-[12px] opacity-75">Grupo {s.grupo}{mostrarDocente ? ` · ${s.docente}` : ''}</p>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Móvil: lista por día */}
      <div className="space-y-4 md:hidden">
        {dias.filter((d) => sesiones.some((s) => s.dia === d)).map((d) => (
          <div key={d}>
            <p className={cx('mb-2 text-[13px] font-bold', d === hoy ? 'text-warn' : 'text-ink-soft')}>{DIAS[d]}{d === hoy ? ' · hoy' : ''}</p>
            <ul className="space-y-2">
              {sesiones.filter((s) => s.dia === d).map((s) => (
                <li key={s.horarioId} className="flex overflow-hidden rounded-sm border border-line bg-card">
                  <span className={cx('w-1.5 shrink-0', tono(s.materiaCodigo).split(' ')[0])} />
                  <div className="px-3 py-2">
                    <p className="font-semibold">{s.materia}</p>
                    <p className="text-[13px] text-mute tabular">{s.horaInicio}–{s.horaFin} · Aula {s.aula} · Grupo {s.grupo}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
