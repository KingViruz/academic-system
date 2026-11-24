'use client';
import { useMemo, useState } from 'react';
import { HorarioSemanal } from '@/components/horario-semanal';
import { Buscador, Cargando, Encabezado, Modal, Tabla, Vacio } from '@/components/ui';
import { useApi } from '@/lib/use-api';
import { fecha } from '@/lib/format';
import type { Estudiante, Sesion } from '@/lib/types';

function Ficha({ e, onCerrar }: { e: Estudiante; onCerrar: () => void }) {
  const { data: horario, cargando } = useApi<Sesion[]>(`/horarios/estudiante/${e.id}`);
  const datos: [string, React.ReactNode][] = [
    ['Documento', `${e.usuario.tipoIdentificacion} ${e.usuario.identificacion}`], ['Carné', e.codigoCarne], ['Correo', e.usuario.email], ['Celular', e.usuario.celular ?? '—'],
    ['Semestre', e.semestre], ['Nacimiento', fecha(e.fechaNacimiento)], ['Acudiente', e.acudienteNombre ? `${e.acudienteNombre} · ${e.acudienteTelefono}` : '—'],
    ['ICFES', e.puntajeIcfes ?? '—'], ['SISBEN', e.sisben ?? '—'],
  ];
  return (
    <Modal abierto onCerrar={onCerrar} titulo={`${e.usuario.nombres} ${e.usuario.apellidos}`} ancho="xl">
      <dl className="mb-6 grid gap-x-6 gap-y-3 text-[14px] sm:grid-cols-3">{datos.map(([k, v]) => <div key={k}><dt className="text-[12.5px] text-mute">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl>
      <p className="mb-2 text-[14px] font-bold">Horario del periodo</p>
      {cargando ? <Cargando /> : <HorarioSemanal sesiones={horario ?? []} vacio={<p className="text-[14px] text-mute">No tiene materias inscritas.</p>} />}
    </Modal>
  );
}

export default function EstudiantesPrograma() {
  const { data, cargando } = useApi<Estudiante[]>('/estudiantes');
  const [q, setQ] = useState('');
  const [ver, setVer] = useState<Estudiante | null>(null);
  const filas = useMemo(() => data?.filter((e) => `${e.usuario.nombres} ${e.usuario.apellidos} ${e.usuario.identificacion} ${e.codigoCarne}`.toLowerCase().includes(q.toLowerCase())), [data, q]);
  return (
    <>
      <Encabezado titulo="Estudiantes del programa" descripcion="Consulta la ficha y el horario de los estudiantes de tu programa. El registro lo hace el administrador." />
      <div className="mb-4"><Buscador valor={q} onCambio={setQ} placeholder="Buscar por nombre, documento o carné" /></div>
      {!cargando && !data?.length ? <Vacio titulo="No hay estudiantes en tu programa" /> : (
        <Tabla filas={filas} cargando={cargando} clave={(e) => e.id} onFila={setVer} columnas={[
          { titulo: 'Nombre', celda: (e) => <span className="font-semibold">{e.usuario.apellidos} {e.usuario.nombres}</span> },
          { titulo: 'Carné', celda: (e) => <span className="tabular">{e.codigoCarne}</span> },
          { titulo: 'Documento', celda: (e) => <span className="tabular">{e.usuario.identificacion}</span> },
          { titulo: 'Semestre', alinear: 'der', celda: (e) => e.semestre },
          { titulo: 'Correo', celda: (e) => e.usuario.email },
        ]} />
      )}
      {ver && <Ficha e={ver} onCerrar={() => setVer(null)} />}
    </>
  );
}
