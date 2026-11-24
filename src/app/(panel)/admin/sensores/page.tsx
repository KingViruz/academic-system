'use client';
import { useState } from 'react';
import { Copy, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Aviso, Boton, Encabezado, Entrada, Etiqueta, Modal, Selector, Tabla } from '@/components/ui';
import { api, API_URL, mensajeDe } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { fechaHora } from '@/lib/format';
import type { Aula, Sensor } from '@/lib/types';

export default function Sensores() {
  const { data, cargando, recargar } = useApi<Sensor[]>('/sensores');
  const { data: aulas } = useApi<Aula[]>('/aulas');
  const [nuevo, setNuevo] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [aulaId, setAulaId] = useState('');
  const [token, setToken] = useState<{ codigo: string; token: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function crear(e: React.FormEvent) {
    e.preventDefault(); setGuardando(true);
    try {
      const r = await api<{ codigo: string; token: string }>('/sensores', { body: { codigo, aulaId: Number(aulaId) } });
      setNuevo(false); setToken(r); setCodigo(''); setAulaId(''); recargar();
    } catch (err) { toast.error(mensajeDe(err)); } finally { setGuardando(false); }
  }
  async function regenerar(s: Sensor) {
    if (!confirm(`El token actual de ${s.codigo} dejará de funcionar. ¿Generar uno nuevo?`)) return;
    try { setToken(await api(`/sensores/${s.id}/token`, { body: {} })); } catch (e) { toast.error(mensajeDe(e)); }
  }
  async function alternar(s: Sensor) {
    try { await api(`/sensores/${s.id}`, { method: 'PATCH', body: { activo: !s.activo } }); recargar(); } catch (e) { toast.error(mensajeDe(e)); }
  }

  return (
    <>
      <Encabezado titulo="Sensores de asistencia" descripcion="Cada sensor está asociado a un aula y se autentica con su código y un token. Si pierde la red guarda las lecturas y las reenvía al reconectar."
        acciones={<Boton onClick={() => setNuevo(true)}><Plus className="size-4" />Registrar sensor</Boton>} />
      <Tabla filas={data} cargando={cargando} clave={(s) => s.id} vacio="No hay sensores registrados." columnas={[
        { titulo: 'Sensor', celda: (s) => <span className="font-semibold">{s.codigo}</span> },
        { titulo: 'Aula', celda: (s) => `${s.aula.codigo} · ${s.aula.sede?.nombre ?? ''}` },
        { titulo: 'Conexión', celda: (s) => !s.activo ? <span className="text-mute">Desactivado</span> : s.conectado ? <Etiqueta tono="ok">Conectado</Etiqueta> : <Etiqueta tono="mal">Sin señal</Etiqueta> },
        { titulo: 'Última señal', celda: (s) => <span className="text-[13px] text-mute">{fechaHora(s.ultimaSenal)}</span> },
        { titulo: 'Lecturas en cola', alinear: 'der', celda: (s) => s.lecturasEnCola ? <span className="font-semibold text-warn">{s.lecturasEnCola}</span> : 0 },
        { titulo: 'Acciones', alinear: 'der', celda: (s) => (
          <div className="flex justify-end gap-1.5">
            <Boton tamano="sm" variante="secundario" onClick={() => regenerar(s)}>Nuevo token</Boton>
            <Boton tamano="sm" variante={s.activo ? 'peligro' : 'secundario'} onClick={() => alternar(s)}>{s.activo ? 'Desactivar' : 'Activar'}</Boton>
          </div>
        ) },
      ]} />
      <div className="mt-6 rounded-md border border-line bg-card p-5 text-[14px] text-ink-soft">
        <p className="font-semibold text-ink">Integración del dispositivo</p>
        <p className="mt-1">El sensor envía <code className="rounded-sm bg-paper px-1">POST {API_URL}/sensor/lecturas</code> con las cabeceras <code className="rounded-sm bg-paper px-1">x-sensor-codigo</code> y <code className="rounded-sm bg-paper px-1">x-sensor-token</code>, y una señal de vida cada 5 minutos a <code className="rounded-sm bg-paper px-1">/sensor/heartbeat</code>. Para probar sin hardware usa <code className="rounded-sm bg-paper px-1">npm run sensor -- EST-0001</code> en el backend.</p>
      </div>

      <Modal abierto={nuevo} onCerrar={() => setNuevo(false)} titulo="Registrar sensor"
        pie={<><Boton variante="secundario" onClick={() => setNuevo(false)}>Cancelar</Boton><Boton form="f-sensor" type="submit" cargando={guardando}>Registrar sensor</Boton></>}>
        <form id="f-sensor" onSubmit={crear} className="space-y-4">
          <Entrada label="Código del sensor" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="SENSOR-205" required />
          <Selector label="Aula" value={aulaId} onChange={(e) => setAulaId(e.target.value)} vacio="Selecciona…" opciones={(aulas ?? []).map((a) => ({ value: a.id, label: `${a.codigo} · ${a.sede?.nombre ?? ''}` }))} required />
        </form>
      </Modal>
      <Modal abierto={!!token} onCerrar={() => setToken(null)} titulo={`Token de ${token?.codigo ?? ''}`} pie={<Boton onClick={() => setToken(null)}>Ya lo guardé</Boton>}>
        <Aviso tono="aviso">Copia el token ahora: por seguridad no se vuelve a mostrar. En la base de datos solo queda su huella cifrada.</Aviso>
        <div className="mt-4 flex items-center gap-2">
          <code className="flex-1 break-all rounded-sm border border-line bg-paper px-3 py-2 text-[13px]">{token?.token}</code>
          <Boton variante="secundario" aria-label="Copiar token" onClick={() => { navigator.clipboard.writeText(token!.token); toast.success('Token copiado'); }}><Copy className="size-4" /></Boton>
        </div>
      </Modal>
    </>
  );
}
