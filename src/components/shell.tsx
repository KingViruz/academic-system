'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Activity, BookOpen, Building2, CalendarDays, CalendarRange, ClipboardCheck, ClipboardList, FileClock, GraduationCap, Home,
  KeyRound, LayoutGrid, LogOut, Menu, Radio, ScrollText, Siren, Users, UserCog, UserSquare2, X, PencilLine, NotebookPen, Landmark,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { INICIO, ROL_NOMBRE } from '@/lib/format';
import type { Rol } from '@/lib/types';
import { Marca } from './marca';
import { cx } from './ui';

type Item = { href: string; label: string; icono: React.ComponentType<{ className?: string }> };
type Grupo = { titulo?: string; items: Item[] };

const NAV: Record<Rol, Grupo[]> = {
  ADMIN: [
    { items: [{ href: '/admin', label: 'Inicio', icono: Home }] },
    { titulo: 'Estructura', items: [
      { href: '/admin/facultades', label: 'Facultades', icono: Landmark },
      { href: '/admin/programas', label: 'Programas', icono: GraduationCap },
      { href: '/admin/materias', label: 'Materias', icono: BookOpen },
      { href: '/admin/sedes', label: 'Sedes y aulas', icono: Building2 },
      { href: '/admin/periodos', label: 'Periodos', icono: CalendarRange },
    ] },
    { titulo: 'Personas', items: [
      { href: '/admin/usuarios', label: 'Usuarios y roles', icono: UserCog },
      { href: '/admin/coordinadores', label: 'Coordinadores', icono: UserSquare2 },
      { href: '/admin/docentes', label: 'Docentes', icono: Users },
      { href: '/admin/estudiantes', label: 'Estudiantes', icono: GraduationCap },
    ] },
    { titulo: 'Operación', items: [
      { href: '/admin/sensores', label: 'Sensores', icono: Radio },
      { href: '/admin/auditoria', label: 'Auditoría', icono: ScrollText },
    ] },
  ],
  COORDINADOR: [
    { items: [{ href: '/coordinador', label: 'Inicio', icono: Home }] },
    { titulo: 'Programación', items: [
      { href: '/coordinador/carga', label: 'Carga académica', icono: LayoutGrid },
      { href: '/coordinador/horarios', label: 'Consultar horarios', icono: CalendarDays },
    ] },
    { titulo: 'Microcurrículo', items: [
      { href: '/coordinador/microcurriculos', label: 'Microcurrículos', icono: NotebookPen },
      { href: '/coordinador/planes', label: 'Seguimiento de planes', icono: Activity },
    ] },
    { titulo: 'Estudiantes', items: [
      { href: '/coordinador/estudiantes', label: 'Estudiantes', icono: GraduationCap },
      { href: '/coordinador/alertas', label: 'Alertas', icono: Siren },
      { href: '/coordinador/solicitudes', label: 'Cambios de nota', icono: FileClock },
    ] },
  ],
  DOCENTE: [
    { items: [
      { href: '/docente', label: 'Inicio', icono: Home },
      { href: '/docente/horario', label: 'Mi horario', icono: CalendarDays },
      { href: '/docente/grupos', label: 'Mis grupos', icono: ClipboardList },
      { href: '/docente/solicitudes', label: 'Cambios de nota', icono: FileClock },
    ] },
  ],
  ESTUDIANTE: [
    { items: [
      { href: '/estudiante', label: 'Inicio', icono: Home },
      { href: '/estudiante/inscripcion', label: 'Inscripción', icono: PencilLine },
      { href: '/estudiante/horario', label: 'Mi horario', icono: CalendarDays },
      { href: '/estudiante/asistencia', label: 'Asistencia', icono: ClipboardCheck },
      { href: '/estudiante/notas', label: 'Notas', icono: BookOpen },
    ] },
  ],
};

function activo(path: string, href: string) {
  return href.split('/').length === 2 ? path === href : path === href || path.startsWith(href + '/');
}

function Navegacion({ rol, onNavegar }: { rol: Rol; onNavegar?: () => void }) {
  const path = usePathname();
  return (
    <nav aria-label="Principal" className="flex-1 overflow-y-auto px-3 py-4">
      {NAV[rol].map((g, i) => (
        <div key={i} className="mb-5">
          {g.titulo && <p className="mb-1.5 px-3 text-[12px] font-semibold text-white/45">{g.titulo}</p>}
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const on = activo(path, it.href);
              return (
                <li key={it.href}>
                  <Link href={it.href} onClick={onNavegar} aria-current={on ? 'page' : undefined}
                    className={cx('relative flex items-center gap-3 rounded-sm px-3 py-2 text-[14px] font-medium transition-colors',
                      on ? 'bg-white/[.09] text-white' : 'text-white/70 hover:bg-white/[.05] hover:text-white')}>
                    {on && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-sun" aria-hidden />}
                    <it.icono className={cx('size-[18px] shrink-0', on ? 'text-sun' : 'text-white/50')} />
                    {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function PieUsuario() {
  const { usuario, salir } = useAuth();
  if (!usuario) return null;
  return (
    <div className="border-t border-white/10 px-3 py-3">
      <div className="px-3 pb-2">
        <p className="truncate text-[14px] font-semibold text-white">{usuario.nombre}</p>
        <p className="text-[12.5px] text-white/55">{ROL_NOMBRE[usuario.rol]}</p>
      </div>
      <Link href="/cuenta" className="flex items-center gap-3 rounded-sm px-3 py-2 text-[14px] text-white/70 hover:bg-white/[.05] hover:text-white"><KeyRound className="size-[18px] text-white/50" />Mi cuenta</Link>
      <button onClick={salir} className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-[14px] text-white/70 hover:bg-white/[.05] hover:text-white"><LogOut className="size-[18px] text-white/50" />Cerrar sesión</button>
    </div>
  );
}

/** Marco de la aplicación: exige sesión y que la ruta pertenezca al rol del usuario. */
export function Shell({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  const router = useRouter();
  const path = usePathname();
  const [menu, setMenu] = useState(false);

  const fueraDeRol = usuario && !path.startsWith('/cuenta') && !path.startsWith(INICIO[usuario.rol]);
  useEffect(() => {
    if (!usuario) router.replace('/login');
    else if (fueraDeRol) router.replace(INICIO[usuario.rol]);
  }, [usuario, fueraDeRol, router]);

  if (!usuario || fueraDeRol) return null;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_1fr]">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-sm focus:bg-white focus:px-3 focus:py-2">Saltar al contenido</a>
      <div className="hidden bg-night lg:block">
        <aside className="sticky top-0 flex h-screen flex-col">
          <div className="px-6 pt-6 pb-4"><Link href={INICIO[usuario.rol]}><Marca /></Link></div>
          <Navegacion rol={usuario.rol} />
          <PieUsuario />
        </aside>
      </div>

      <div className="flex items-center justify-between bg-night px-4 py-3 lg:hidden">
        <Marca compacta />
        <button onClick={() => setMenu(true)} className="rounded-sm p-2 text-white" aria-label="Abrir menú"><Menu className="size-6" /></button>
      </div>
      {menu && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-night/60" onClick={() => setMenu(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-night">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <Marca compacta />
              <button onClick={() => setMenu(false)} className="rounded-sm p-1.5 text-white" aria-label="Cerrar menú"><X className="size-5" /></button>
            </div>
            <Navegacion rol={usuario.rol} onNavegar={() => setMenu(false)} />
            <PieUsuario />
          </aside>
        </div>
      )}

      <main id="contenido" className="min-w-0 px-4 py-7 sm:px-8 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-[1180px]">{children}</div>
      </main>
    </div>
  );
}
