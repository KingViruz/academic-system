'use client';
import { useState } from 'react';
import { PlanDetalle } from '@/components/plan-detalle';
import { Aviso, Boton, Cargando, Encabezado, Modal, Vacio, cx } from '@/components/ui';
import { useApi } from '@/lib/use-api';
import { nota } from '@/lib/format';
import type { Plan } from '@/lib/types';

interface Mia { cargaId: number; materia: string; codigo: string; creditos: number; grupo: string; docente: string; porcentajes: number[] | null; ultimoCorteCerrado: number; notas: { corte: number; nota: number | null; porcentaje: number | null }[]; acumulado: number | null; definitiva: number | null }

function PlanMateria({ cargaId, materia, onCerrar }: { cargaId: number; materia: string; onCerrar: () => void }) {
  const { data, cargando, recargar } = useApi<Plan | null>(`/planes/carga/${cargaId}`);
  return (
    <Modal abierto onCerrar={onCerrar} titulo={`Plan de ${materia}`} ancho="xl">
      {cargando && data === undefined ? <Cargando /> : !data ? <p className="text-[14px] text-mute">Esta materia aún no tiene plan publicado.</p> : <PlanDetalle plan={data} modo="estudiante" onCambio={recargar} />}
    </Modal>
  );
}

export default function MisNotas() {
  const { data, error } = useApi<Mia[]>('/calificaciones/mias');
  const [plan, setPlan] = useState<Mia | null>(null);
  if (error) return <Aviso>{error}</Aviso>;
  if (!data) return <Cargando />;
  return (
    <>
      <Encabezado titulo="Mis notas" descripcion="Nota de cada corte con su porcentaje. La definitiva aparece cuando están los tres cortes; mientras tanto ves lo acumulado." />
      {data.length === 0 ? <Vacio titulo="No tienes materias inscritas" /> : (
        <div className="overflow-x-auto rounded-md border border-line bg-card">
          <table className="w-full min-w-[720px] text-left text-[14px]">
            <thead><tr className="border-b border-line bg-paper/70 text-[12.5px] text-mute">
              <th className="px-4 py-2.5 font-semibold">Materia</th>
              {[1, 2, 3].map((c) => <th key={c} className="px-4 py-2.5 text-center font-semibold">Corte {c}</th>)}
              <th className="px-4 py-2.5 text-center font-semibold">Acumulado</th><th className="px-4 py-2.5 text-center font-semibold">Definitiva</th><th />
            </tr></thead>
            <tbody>
              {data.map((m) => (
                <tr key={m.cargaId} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-3"><p className="font-semibold">{m.materia}</p><p className="text-[12.5px] text-mute">{m.codigo} · grupo {m.grupo} · {m.docente}</p></td>
                  {m.notas.map((n) => (
                    <td key={n.corte} className="px-4 py-3 text-center">
                      <span className={cx('tabular font-semibold', n.nota !== null && n.nota < 3 && 'text-bad')}>{nota(n.nota)}</span>
                      {n.porcentaje !== null && <span className="block text-[12px] text-mute">{n.porcentaje} %</span>}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center tabular">{nota(m.acumulado, 2)}</td>
                  <td className="px-4 py-3 text-center"><span className={cx('display text-[18px] font-[850] tabular', m.definitiva !== null && m.definitiva < 3 && 'text-bad')}>{nota(m.definitiva)}</span></td>
                  <td className="px-4 py-3 text-right"><Boton tamano="sm" variante="fantasma" onClick={() => setPlan(m)}>Ver plan</Boton></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {plan && <PlanMateria cargaId={plan.cargaId} materia={plan.materia} onCerrar={() => setPlan(null)} />}
    </>
  );
}
