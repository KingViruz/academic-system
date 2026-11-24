'use client';
import Link from 'next/link';
import { Encabezado, Tabla } from '@/components/ui';
import { useApi } from '@/lib/use-api';
import { DIAS_CORTOS } from '@/lib/format';
import type { Carga } from '@/lib/types';

export default function MisGrupos() {
  const { data, cargando } = useApi<Carga[]>('/carga/mios');
  return (
    <>
      <Encabezado titulo="Mis grupos" descripcion="Toma asistencia, registra notas y reporta el avance del plan de cada grupo." />
      <Tabla filas={data} cargando={cargando} clave={(c) => c.id} vacio="No tienes grupos asignados en el periodo actual." columnas={[
        { titulo: 'Materia', celda: (c) => <Link href={`/docente/grupos/${c.id}`} className="font-semibold hover:underline">{c.materia.nombre}</Link> },
        { titulo: 'Grupo', celda: (c) => c.grupo },
        { titulo: 'Horario', celda: (c) => <span className="text-[13px] tabular">{c.horarios.map((h) => `${DIAS_CORTOS[h.dia]} ${h.horaInicio.slice(0, 5)}–${h.horaFin.slice(0, 5)} · ${h.aula?.codigo}`).join('  /  ')}</span> },
        { titulo: 'Estudiantes', alinear: 'der', celda: (c) => c.inscritos },
        { titulo: 'Cortes cerrados', alinear: 'der', celda: (c) => `${c.ultimoCorteCerrado} de 3` },
        { titulo: '', alinear: 'der', celda: (c) => <Link href={`/docente/grupos/${c.id}`} className="text-[14px] font-semibold text-ember-dark hover:underline">Abrir</Link> },
      ]} />
    </>
  );
}
