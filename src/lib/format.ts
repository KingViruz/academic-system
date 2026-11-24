export const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const DIAS_CORTOS = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const ROL_NOMBRE: Record<string, string> = { ADMIN: 'Administrador', COORDINADOR: 'Coordinador', DOCENTE: 'Docente', ESTUDIANTE: 'Estudiante' };
export const INICIO: Record<string, string> = { ADMIN: '/admin', COORDINADOR: '/coordinador', DOCENTE: '/docente', ESTUDIANTE: '/estudiante' };

export function fecha(v?: string | null) {
  if (!v) return '—';
  const d = v.length === 10 ? new Date(v + 'T12:00:00') : new Date(v);
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}
export function fechaHora(v?: string | null) {
  if (!v) return '—';
  return new Date(v).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
export function hora(v?: string | null) {
  if (!v) return '—';
  return new Date(v).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}
/** Notas con coma decimal, como se escriben en Colombia (4,2). */
export const nota = (n?: number | null, decimales = 1) => (n === null || n === undefined ? '—' : n.toFixed(decimales).replace('.', ','));
export const hoyISO = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
export const nombre = (u?: { nombres: string; apellidos: string } | null) => (u ? `${u.nombres} ${u.apellidos}` : '—');

export const ESTADO_SOL: Record<'PENDIENTE' | 'APROBADA' | 'RECHAZADA', { label: string; tono: 'aviso' | 'ok' | 'mal' }> = {
  PENDIENTE: { label: 'Pendiente', tono: 'aviso' }, APROBADA: { label: 'Aprobada', tono: 'ok' }, RECHAZADA: { label: 'Rechazada', tono: 'mal' },
};
