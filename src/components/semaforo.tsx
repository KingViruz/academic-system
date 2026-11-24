import type { Avance, Semaforo as S } from '@/lib/types';
import { cx } from './ui';

const INFO: Record<S, { label: string; punto: string; texto: string; barra: string }> = {
  VERDE: { label: 'Al día', punto: 'bg-ok', texto: 'text-ok', barra: 'bg-ok' },
  AMARILLO: { label: 'Leve atraso', punto: 'bg-sun', texto: 'text-warn', barra: 'bg-sun' },
  ROJO: { label: 'Atrasado', punto: 'bg-bad', texto: 'text-bad', barra: 'bg-bad' },
  SIN_INICIAR: { label: 'Sin iniciar', punto: 'bg-line', texto: 'text-mute', barra: 'bg-line' },
};

export function Semaforo({ estado }: { estado: S }) {
  const i = INFO[estado];
  return <span className={cx('inline-flex items-center gap-1.5 text-[13px] font-semibold', i.texto)}><span className={cx('size-2.5 rounded-full', i.punto)} />{i.label}</span>;
}

/** Barra de avance: lo ejecutado frente a lo previsto a hoy (la marca vertical). */
export function BarraAvance({ avance }: { avance: Avance }) {
  const prev = avance.horasTotales ? (avance.horasPrevistasALaFecha / avance.horasTotales) * 100 : 0;
  return (
    <div className="w-full min-w-36">
      <div className="relative h-2 rounded-full bg-line-soft">
        <div className={cx('h-2 rounded-full', INFO[avance.semaforo].barra)} style={{ width: `${avance.porcentajeTotal}%` }} />
        {prev > 0 && <div className="absolute -top-1 h-4 w-0.5 bg-ink" style={{ left: `${Math.min(prev, 100)}%` }} title="Previsto a hoy" />}
      </div>
      <p className="mt-1 text-[12px] text-mute tabular">{avance.horasEjecutadas} de {avance.horasTotales} h · {avance.porcentajeALaFecha} % de lo previsto a hoy</p>
    </div>
  );
}
