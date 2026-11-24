'use client';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Boton, Buscador, Encabezado, Etiqueta, Modal, Selector, Tabla, Aviso } from '@/components/ui';
import { api, mensajeDe } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { useAuth } from '@/lib/auth';
import { fechaHora, ROL_NOMBRE } from '@/lib/format';
import type { Rol, Usuario } from '@/lib/types';

const ROLES: Rol[] = ['ADMIN', 'COORDINADOR', 'DOCENTE', 'ESTUDIANTE'];

export default function Usuarios() {
  const { usuario: yo } = useAuth();
  const [rol, setRol] = useState('');
  const [q, setQ] = useState('');
  const { data, cargando, error, recargar } = useApi<Usuario[]>(`/usuarios${rol ? `?rol=${rol}` : ''}`);
  const [cambio, setCambio] = useState<Usuario | null>(null);
  const [nuevoRol, setNuevoRol] = useState<Rol>('DOCENTE');
  const filas = useMemo(() => data?.filter((u) => `${u.nombres} ${u.apellidos} ${u.email} ${u.identificacion}`.toLowerCase().includes(q.toLowerCase())), [data, q]);

  async function accion(fn: () => Promise<unknown>, ok: string) {
    try { await fn(); toast.success(ok); recargar(); } catch (e) { toast.error(mensajeDe(e)); }
  }
  const bloqueado = (u: Usuario) => !!u.bloqueadoHasta && new Date(u.bloqueadoHasta) > new Date();

  return (
    <>
      <Encabezado titulo="Usuarios y roles" descripcion="Activa o inactiva cuentas, cambia roles, desbloquea cuentas y restablece contraseñas. Los cambios de rol aplican en el siguiente inicio de sesión." />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Buscador valor={q} onCambio={setQ} placeholder="Buscar por nombre, correo o documento" />
        <select value={rol} onChange={(e) => setRol(e.target.value)} className="field h-10 w-48" aria-label="Filtrar por rol">
          <option value="">Todos los roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{ROL_NOMBRE[r]}</option>)}
        </select>
      </div>
      {error && <div className="mb-4"><Aviso>{error}</Aviso></div>}
      <Tabla filas={filas} cargando={cargando} clave={(u) => u.id} columnas={[
        { titulo: 'Nombre', celda: (u) => <span className="font-semibold">{u.apellidos} {u.nombres}</span> },
        { titulo: 'Correo', celda: (u) => u.email },
        { titulo: 'Rol', celda: (u) => <Etiqueta tono={u.rol === 'ADMIN' ? 'tinta' : 'neutro'}>{ROL_NOMBRE[u.rol]}</Etiqueta> },
        { titulo: 'Estado', celda: (u) => bloqueado(u) ? <Etiqueta tono="mal">Bloqueada</Etiqueta> : u.activo ? <span className="font-semibold text-ok">Activa</span> : <span className="text-mute">Inactiva</span> },
        { titulo: 'Último acceso', celda: (u) => <span className="text-[13px] text-mute">{fechaHora(u.ultimoAcceso)}</span> },
        { titulo: 'Acciones', alinear: 'der', celda: (u) => (
          <div className="flex justify-end gap-1.5">
            {bloqueado(u) && <Boton tamano="sm" variante="secundario" onClick={() => accion(() => api(`/usuarios/${u.id}/desbloquear`, { body: {} }), 'Cuenta desbloqueada')}>Desbloquear</Boton>}
            {u.id !== yo?.sub && <Boton tamano="sm" variante="secundario" onClick={() => { setCambio(u); setNuevoRol(u.rol); }}>Rol</Boton>}
            <Boton tamano="sm" variante="fantasma" onClick={() => confirm(`La contraseña de ${u.nombres} quedará igual a su número de documento. ¿Continuar?`) && accion(() => api(`/usuarios/${u.id}/restablecer-password`, { body: {} }), 'Contraseña restablecida al número de documento')}>Restablecer clave</Boton>
            {u.id !== yo?.sub && (u.activo
              ? <Boton tamano="sm" variante="peligro" onClick={() => accion(() => api(`/usuarios/${u.id}`, { method: 'PATCH', body: { activo: false } }), 'Cuenta inactivada')}>Inactivar</Boton>
              : <Boton tamano="sm" variante="secundario" onClick={() => accion(() => api(`/usuarios/${u.id}`, { method: 'PATCH', body: { activo: true } }), 'Cuenta activada')}>Activar</Boton>)}
          </div>
        ) },
      ]} />
      <Modal abierto={!!cambio} onCerrar={() => setCambio(null)} titulo="Cambiar rol"
        pie={<><Boton variante="secundario" onClick={() => setCambio(null)}>Cancelar</Boton><Boton onClick={() => { accion(() => api(`/usuarios/${cambio!.id}`, { method: 'PATCH', body: { rol: nuevoRol } }), 'Rol actualizado'); setCambio(null); }}>Guardar rol</Boton></>}>
        <p className="mb-4 text-[14px] text-mute">Para asignar Docente, Estudiante o Coordinador, la persona debe estar registrada en ese módulo.</p>
        <Selector label={`Rol de ${cambio?.nombres ?? ''}`} value={nuevoRol} onChange={(e) => setNuevoRol(e.target.value as Rol)} opciones={ROLES.map((r) => ({ value: r, label: ROL_NOMBRE[r] }))} />
      </Modal>
    </>
  );
}
