'use client';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Aviso, Boton, Buscador, Cargando, Encabezado, Etiqueta, cx } from '@/components/ui';
import { api, mensajeDe } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { DIAS_CORTOS } from '@/lib/format';
import type { Materia, Periodo } from '@/lib/types';

interface Grupo { id: number; grupo: string; cupo: number; inscritos: number; disponibles: number; inscrito: boolean; materia: Materia; docente: string; horarios: { dia: number; horaInicio: string; horaFin: string; aula: string }[] }
interface Mias { creditos: number; limite: number; periodo: Periodo | null; inscripciones: { id: number; cargaId: number; grupo: string; materia: Materia; docente: string }[] }

export default function Inscripcion() {
  const { data: oferta, error, recargar } = useApi<{ periodo: Periodo; grupos: Grupo[] }>('/inscripciones/oferta');
  const { data: mias, recargar: recargarMias } = useApi<Mias>('/inscripciones/mias');
  const [q, setQ] = useState('');
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [fallo, setFallo] = useState<{ cargaId: number; mensaje: string } | null>(null);

  const materias = useMemo(() => {
    const m = new Map<number, { materia: Materia; grupos: Grupo[] }>();
    (oferta?.grupos ?? []).filter((g) => `${g.materia.nombre} ${g.materia.codigo} ${g.docente}`.toLowerCase().includes(q.toLowerCase()))
      .forEach((g) => { const x = m.get(g.materia.id) ?? { materia: g.materia, grupos: [] }; x.grupos.push(g); m.set(g.materia.id, x); });
    return [...m.values()];
  }, [oferta, q]);

  async function inscribir(g: Grupo) {
    setOcupado(g.id); setFallo(null);
    try { await api('/inscripciones', { body: { cargaId: g.id } }); toast.success(`Inscrito en ${g.materia.nombre} grupo ${g.grupo}`); recargar(); recargarMias(); }
    catch (e) { setFallo({ cargaId: g.id, mensaje: mensajeDe(e) }); } finally { setOcupado(null); }
  }
  async function retirar(cargaId: number, nombre: string) {
    const ins = mias?.inscripciones.find((i) => i.cargaId === cargaId);
    if (!ins || !confirm(`¿Retirar ${nombre}?`)) return;
    setOcupado(cargaId);
    try { await api(`/inscripciones/${ins.id}`, { method: 'DELETE' }); toast.success('Materia retirada'); recargar(); recargarMias(); } catch (e) { toast.error(mensajeDe(e)); } finally { setOcupado(null); }
  }

  if (error) return <Aviso>{error}</Aviso>;
  if (!oferta || !mias) return <Cargando />;
  const pct = mias.limite ? (mias.creditos / mias.limite) * 100 : 0;

  return (
    <>
      <Encabezado titulo={`Inscripción ${oferta.periodo.codigo}`} descripcion="Elige un grupo por materia. El sistema revisa cupo, límite de créditos, cruces con tu horario y prerrequisitos." />
      <div className="mb-6 rounded-md border border-line bg-card px-5 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[14px] text-mute">Créditos inscritos</p>
          <p><span className="display text-[24px] font-[850] tabular">{mias.creditos}</span><span className="text-mute tabular"> de {mias.limite}</span></p>
        </div>
        <div className="mt-2 h-2 rounded-full bg-line-soft"><div className={cx('h-2 rounded-full', pct > 90 ? 'bg-ember' : 'bg-ink')} style={{ width: `${Math.min(100, pct)}%` }} /></div>
        {mias.inscripciones.length > 0 && <p className="mt-3 text-[13px] text-ink-soft">{mias.inscripciones.map((i) => `${i.materia.nombre} (${i.grupo})`).join(' · ')}</p>}
      </div>
      <div className="mb-4"><Buscador valor={q} onCambio={setQ} placeholder="Buscar materia o docente" /></div>
      <div className="space-y-4">
        {materias.map(({ materia, grupos }) => {
          const yaTiene = grupos.some((g) => g.inscrito);
          return (
            <section key={materia.id} className="rounded-md border border-line bg-card">
              <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line-soft px-5 py-3">
                <h2 className="text-[16px] font-bold">{materia.nombre}</h2>
                <span className="text-[13px] text-mute">{materia.codigo} · {materia.creditos} créditos</span>
              </header>
              <ul className="divide-y divide-line-soft">
                {grupos.map((g) => (
                  <li key={g.id} className={cx('px-5 py-3', g.inscrito && 'bg-sun-tint/50')}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">Grupo {g.grupo} · {g.docente} {g.inscrito && <Etiqueta tono="marca" className="ml-1">Inscrito</Etiqueta>}</p>
                        <p className="text-[13px] text-mute tabular">{g.horarios.map((h) => `${DIAS_CORTOS[h.dia]} ${h.horaInicio}–${h.horaFin} · ${h.aula}`).join('  /  ')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cx('text-[13px] tabular', g.disponibles <= 3 ? 'font-semibold text-warn' : 'text-mute')}>{g.disponibles} cupo(s)</span>
                        {g.inscrito ? <Boton tamano="sm" variante="peligro" cargando={ocupado === g.id} onClick={() => retirar(g.id, materia.nombre)}>Retirar</Boton>
                          : <Boton tamano="sm" cargando={ocupado === g.id} disabled={yaTiene} onClick={() => inscribir(g)}>Inscribir</Boton>}
                      </div>
                    </div>
                    {fallo?.cargaId === g.id && <p className="mt-2 text-[13px] font-semibold text-bad" role="alert">{fallo.mensaje}</p>}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        {materias.length === 0 && <p className="text-[14px] text-mute">No hay grupos con cupo que coincidan.</p>}
      </div>
    </>
  );
}
