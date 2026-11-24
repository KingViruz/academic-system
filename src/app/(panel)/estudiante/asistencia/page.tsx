'use client';
import { MarcarQr } from '@/components/marcar-qr';
import { Aviso, Cargando, Encabezado, Seccion, Vacio, cx } from '@/components/ui';
import { useApi } from '@/lib/use-api';
import { fecha } from '@/lib/format';
import type { EstadoAsistente } from '@/lib/types';

interface Mia { cargaId: number; materia: string; grupo: string; sesiones: number; presentes: number; tardes: number; ausencias: number; excusas: number; porcentajeFallas: number; umbral: number; enRiesgo: boolean; historial: { fecha: string; tema: string; estado: EstadoAsistente | null }[] }
const COLOR: Record<string, string> = { PRESENTE: 'bg-ok', TARDE: 'bg-sun', AUSENTE: 'bg-bad', EXCUSADO: 'bg-ink-soft' };

export default function MiAsistencia() {
  const { data, error, recargar } = useApi<Mia[]>('/asistencias/mias');
  if (error) return <Aviso>{error}</Aviso>;
  if (!data) return <Cargando />;
  return (
    <>
      <Encabezado titulo="Mi asistencia" descripcion="Porcentaje de fallas = ausencias ÷ clases dictadas. Las llegadas tarde y las excusas no cuentan como falla." />
      <div className="mb-6"><Seccion titulo="Registrar asistencia con código"><MarcarQr onHecho={recargar} /></Seccion></div>
      {data.length === 0 ? <Vacio titulo="No tienes materias inscritas" /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((m) => (
            <section key={m.cargaId} className={cx('rounded-md border bg-card p-5', m.enRiesgo ? 'border-bad/40' : 'border-line')}>
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="text-[16px] font-bold">{m.materia}</h2><p className="text-[13px] text-mute">Grupo {m.grupo} · {m.sesiones} clases dictadas</p></div>
                {m.sesiones === 0 ? <p className="text-[13px] text-mute">Sin clases aún</p> : <p className={cx('display text-[28px] font-[850] tabular leading-none', m.enRiesgo ? 'text-bad' : 'text-ink')}>{String(m.porcentajeFallas).replace('.', ',')}<span className="text-[15px]"> % fallas</span></p>}
              </div>
              {m.sesiones > 0 && <p className="mt-2 text-[13px] text-ink-soft">{m.presentes} presente · {m.tardes} tarde · {m.ausencias} ausente · {m.excusas} excusa · límite {m.umbral} %</p>}
              {m.enRiesgo && <p className="mt-1 text-[13px] font-semibold text-bad">Estás cerca del límite de fallas.</p>}
              {m.historial.length > 0 && (
                <ol className="mt-4 flex flex-wrap gap-1" aria-label="Historial de clases">
                  {m.historial.slice().reverse().map((h, i) => (
                    <li key={i} title={`${fecha(h.fecha)} · ${h.tema} · ${h.estado ?? 'sin registro'}`} className={cx('size-4 rounded-[3px]', h.estado ? COLOR[h.estado] : 'bg-line')}><span className="sr-only">{fecha(h.fecha)}: {h.estado ?? 'sin registro'}</span></li>
                  ))}
                </ol>
              )}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
