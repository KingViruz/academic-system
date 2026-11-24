'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Radio } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { Aviso, Boton, Cargando, Encabezado, Entrada, Etiqueta, Modal, Seccion, Selector, cx } from '@/components/ui';
import { api, mensajeDe } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { fecha, fechaHora, hora } from '@/lib/format';
import type { AsistenciaDetalle, EstadoAsistente } from '@/lib/types';

const ESTADOS: { v: EstadoAsistente; label: string; on: string }[] = [
  { v: 'PRESENTE', label: 'Presente', on: 'bg-ok text-white border-ok' },
  { v: 'TARDE', label: 'Tarde', on: 'bg-sun text-ink border-sun' },
  { v: 'AUSENTE', label: 'Ausente', on: 'bg-bad text-white border-bad' },
  { v: 'EXCUSADO', label: 'Excusa', on: 'bg-ink-soft text-white border-ink-soft' },
];
const ORIGEN: Record<string, string> = { SENSOR: 'sensor', MANUAL: 'manual', QR: 'QR', SISTEMA: 'cierre' };

function PanelQr({ id }: { id: number }) {
  const [qr, setQr] = useState<{ codigo: string; venceEn: string } | null>(null);
  useEffect(() => {
    let vivo = true;
    const cargar = () => api<{ codigo: string; venceEn: string }>(`/asistencias/${id}/qr`).then((r) => vivo && setQr(r)).catch(() => undefined);
    cargar();
    const t = setInterval(cargar, 30000);
    return () => { vivo = false; clearInterval(t); };
  }, [id]);
  return (
    <Seccion titulo="Registro por QR" descripcion="Si el sensor falla, proyecta este código. El estudiante lo escribe en su app.">
      {!qr ? <Cargando /> : (
        <div className="flex flex-col items-center gap-3">
          <QRCodeSVG value={qr.codigo} size={168} fgColor="#1f2b57" />
          <p className="display text-[38px] font-[850] tracking-[.18em] tabular">{qr.codigo}</p>
          <p className="text-[13px] text-mute">Cambia cada 5 minutos · vence a las {hora(qr.venceEn)}</p>
        </div>
      )}
    </Seccion>
  );
}

export default function SesionAsistencia() {
  const { id } = useParams<{ id: string }>();
  const { data: a, error, recargar, setData } = useApi<AsistenciaDetalle>(`/asistencias/${id}`);
  const [cerrando, setCerrando] = useState(false);
  const [corr, setCorr] = useState<{ detalleId: number; nombre: string; estado: EstadoAsistente; motivo: string } | null>(null);

  // Mientras la sesión está abierta se refresca para ver llegar las lecturas del sensor.
  useEffect(() => {
    if (a?.estado !== 'ABIERTA') return;
    const t = setInterval(recargar, 8000);
    return () => clearInterval(t);
  }, [a?.estado, recargar]);

  if (error) return <Aviso>{error}</Aviso>;
  if (!a) return <Cargando />;
  const abierta = a.estado === 'ABIERTA';

  async function marcar(estudianteId: number, estado: EstadoAsistente) {
    try { setData(await api<AsistenciaDetalle>(`/asistencias/${id}/manual`, { body: { estudianteId, estado } })); } catch (e) { toast.error(mensajeDe(e)); }
  }
  async function cerrar() {
    const sin = a!.conteo.SIN_REGISTRO;
    if (!confirm(sin ? `${sin} estudiante(s) sin registro quedarán como ausentes. ¿Cerrar la asistencia?` : '¿Cerrar la asistencia?')) return;
    setCerrando(true);
    try { setData(await api<AsistenciaDetalle>(`/asistencias/${id}/cerrar`, { body: {} })); toast.success('Asistencia cerrada'); } catch (e) { toast.error(mensajeDe(e)); } finally { setCerrando(false); }
  }
  async function corregir(e: React.FormEvent) {
    e.preventDefault();
    try { await api(`/asistencias/detalle/${corr!.detalleId}`, { method: 'PATCH', body: { estado: corr!.estado, motivo: corr!.motivo } }); toast.success('Registro corregido'); setCorr(null); recargar(); } catch (err) { toast.error(mensajeDe(err)); }
  }

  return (
    <>
      <Link href={`/docente/grupos/${a.cargaId}`} className="mb-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink-soft hover:text-ink"><ArrowLeft className="size-4" />Volver al grupo</Link>
      <Encabezado titulo={`${a.carga?.materia.nombre ?? 'Asistencia'} · ${a.carga?.grupo ?? ''}`}
        descripcion={<>{fecha(a.fecha)} · {a.tema} · aula {a.aula?.codigo} · abierta a las {hora(a.horaApertura)} · tolerancia {a.toleranciaMin} min</>}
        acciones={abierta ? <Boton onClick={cerrar} cargando={cerrando}>Cerrar asistencia</Boton> : <Etiqueta tono="neutro">Cerrada {fechaHora(a.cerradaEn)}</Etiqueta>} />

      <div className="mb-5 flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
        {[['PRESENTE', 'presentes', 'text-ok'], ['TARDE', 'tarde', 'text-warn'], ['AUSENTE', 'ausentes', 'text-bad'], ['EXCUSADO', 'con excusa', 'text-ink-soft'], ['SIN_REGISTRO', 'sin registro', 'text-mute']].map(([k, l, c]) => (
          <span key={k}><b className={cx('display text-[22px] font-[850] tabular', c)}>{a.conteo[k] ?? 0}</b> <span className="text-mute">{l}</span></span>
        ))}
        {abierta && <span className="inline-flex items-center gap-1.5 text-[13px] text-mute"><Radio className="size-4 animate-pulse text-ember" />Recibiendo lecturas del sensor</span>}
      </div>

      {!abierta && !a.corregible && <div className="mb-4"><Aviso tono="info">El plazo de corrección terminó el {fechaHora(a.corregibleHasta)}.</Aviso></div>}
      {!abierta && a.corregible && <div className="mb-4"><Aviso tono="info">Puedes corregir registros hasta el {fechaHora(a.corregibleHasta)}. Cada corrección pide un motivo y queda en la auditoría.</Aviso></div>}

      <div className={cx('grid gap-6', abierta && 'lg:grid-cols-[1fr_320px]')}>
        <div className="overflow-hidden rounded-md border border-line bg-card">
          <ul className="divide-y divide-line-soft">
            {a.lista.map((l) => (
              <li key={l.estudianteId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-48">
                  <p className="font-semibold">{l.nombre}</p>
                  <p className="text-[12.5px] text-mute tabular">{l.codigoCarne}{l.horaRegistro && ` · ${hora(l.horaRegistro)}`}{l.origen && ` · ${ORIGEN[l.origen]}`}{l.motivo && ` · ${l.motivo}`}</p>
                </div>
                {abierta ? (
                  <div className="flex gap-1" role="group" aria-label={`Estado de ${l.nombre}`}>
                    {ESTADOS.map((e) => (
                      <button key={e.v} onClick={() => marcar(l.estudianteId, e.v)} aria-pressed={l.estado === e.v}
                        className={cx('rounded-sm border px-2.5 py-1 text-[12.5px] font-semibold', l.estado === e.v ? e.on : 'border-line bg-white text-ink-soft hover:border-ink')}>{e.label}</button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Etiqueta tono={l.estado === 'PRESENTE' ? 'ok' : l.estado === 'TARDE' ? 'aviso' : l.estado === 'AUSENTE' ? 'mal' : 'neutro'}>{ESTADOS.find((e) => e.v === l.estado)?.label ?? '—'}</Etiqueta>
                    {a.corregible && l.detalleId && <Boton tamano="sm" variante="fantasma" onClick={() => setCorr({ detalleId: l.detalleId!, nombre: l.nombre, estado: l.estado ?? 'PRESENTE', motivo: '' })}>Corregir</Boton>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
        {abierta && (
          <div className="space-y-6">
            <PanelQr id={a.id} />
            {a.novedades.length > 0 && (
              <Seccion titulo="Lecturas rechazadas">
                <ul className="space-y-1.5 text-[13px]">{a.novedades.map((n) => <li key={n.id}><b className="tabular">{n.codigoCarne}</b> · {hora(n.leidoEn)} · {n.detalle}</li>)}</ul>
              </Seccion>
            )}
          </div>
        )}
      </div>

      <Modal abierto={!!corr} onCerrar={() => setCorr(null)} titulo={`Corregir a ${corr?.nombre ?? ''}`}
        pie={<><Boton variante="secundario" onClick={() => setCorr(null)}>Cancelar</Boton><Boton form="f-corr" type="submit" disabled={(corr?.motivo.trim().length ?? 0) < 3}>Guardar corrección</Boton></>}>
        {corr && (
          <form id="f-corr" onSubmit={corregir} className="space-y-4">
            <Selector label="Estado" value={corr.estado} onChange={(e) => setCorr({ ...corr, estado: e.target.value as EstadoAsistente })} opciones={ESTADOS.map((e) => ({ value: e.v, label: e.label }))} />
            <Entrada label="Motivo" value={corr.motivo} onChange={(e) => setCorr({ ...corr, motivo: e.target.value })} placeholder="Ej.: presentó incapacidad médica" />
          </form>
        )}
      </Modal>
    </>
  );
}
