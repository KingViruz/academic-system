'use client';
import Link from 'next/link';
import { Aviso, Cargando, Cifras, Encabezado, Seccion, Tabla } from '@/components/ui';
import { useApi } from '@/lib/use-api';
import { fechaHora, ROL_NOMBRE } from '@/lib/format';
import type { Auditoria } from '@/lib/types';

interface Resumen {
  usuariosPorRol: Record<string, number>; totales: Record<string, number>; cuentasBloqueadas: number;
  sensores: { total: number; conectados: number; enCola: number }; actividadReciente: Auditoria[];
}

export default function InicioAdmin() {
  const { data, error } = useApi<Resumen>('/dashboard');
  if (error) return <Aviso>{error}</Aviso>;
  if (!data) return <Cargando />;
  const sinSenal = data.sensores.total - data.sensores.conectados;
  return (
    <>
      <Encabezado titulo="Administración" descripcion="Estado general de la estructura académica, las cuentas y los sensores." />
      <div className="space-y-6">
        <Cifras items={[
          { label: 'Programas activos', valor: data.totales.programas ?? 0 },
          { label: 'Materias activas', valor: data.totales.materias ?? 0 },
          { label: 'Aulas', valor: data.totales.aulas ?? 0 },
          { label: 'Cuentas bloqueadas', valor: data.cuentasBloqueadas, tono: data.cuentasBloqueadas ? 'aviso' : undefined },
          { label: 'Sensores sin señal', valor: `${sinSenal} de ${data.sensores.total}`, tono: sinSenal ? 'mal' : 'ok' },
        ]} />
        <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
          <Seccion titulo="Usuarios activos por rol">
            <ul className="divide-y divide-line-soft">
              {['ADMIN', 'COORDINADOR', 'DOCENTE', 'ESTUDIANTE'].map((r) => (
                <li key={r} className="flex justify-between py-2.5 text-[15px]"><span>{ROL_NOMBRE[r]}</span><span className="font-bold tabular">{data.usuariosPorRol[r] ?? 0}</span></li>
              ))}
            </ul>
            <Link href="/admin/usuarios" className="mt-3 inline-block text-[14px] font-semibold text-ember-dark hover:underline">Gestionar usuarios y roles</Link>
          </Seccion>
          <Seccion titulo="Actividad reciente" acciones={<Link href="/admin/auditoria" className="text-[14px] font-semibold text-ember-dark hover:underline">Ver auditoría</Link>}>
            <Tabla filas={data.actividadReciente} clave={(a) => a.id} columnas={[
              { titulo: 'Cuándo', celda: (a) => <span className="text-[13px] tabular">{fechaHora(a.createdAt)}</span> },
              { titulo: 'Acción', celda: (a) => a.accion.replaceAll('_', ' ').toLowerCase() },
              { titulo: 'Entidad', celda: (a) => a.entidad.replaceAll('_', ' ') },
            ]} />
          </Seccion>
        </div>
        {data.sensores.enCola > 0 && <Aviso tono="aviso">Hay {data.sensores.enCola} lectura(s) de sensores en cola: llegaron cuando no había una asistencia abierta en el aula. Se asignan solas cuando el docente abre la clase.</Aviso>}
      </div>
    </>
  );
}
