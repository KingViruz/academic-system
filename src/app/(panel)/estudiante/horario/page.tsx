'use client';
import Link from 'next/link';
import { HorarioSemanal } from '@/components/horario-semanal';
import { Aviso, Boton, Cargando, Encabezado, Vacio } from '@/components/ui';
import { useApi } from '@/lib/use-api';
import type { Sesion } from '@/lib/types';

export default function HorarioEstudiante() {
  const { data, error } = useApi<Sesion[]>('/horarios/mio');
  function descargar() {
    if (!data) return;
    const dias = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const csv = '﻿' + [['Día', 'Inicio', 'Fin', 'Materia', 'Grupo', 'Aula', 'Sede', 'Docente'], ...data.map((s) => [dias[s.dia], s.horaInicio, s.horaFin, s.materia, s.grupo, s.aula, s.sede, s.docente])].map((r) => r.map((x) => `"${x}"`).join(';')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'mi_horario.csv'; a.click();
  }
  return (
    <>
      <Encabezado titulo="Mi horario" descripcion="Materia, grupo, aula y docente de cada clase de la semana." acciones={data?.length ? <><Boton variante="secundario" onClick={descargar}>Descargar</Boton><Boton variante="secundario" onClick={() => window.print()}>Imprimir</Boton></> : undefined} />
      {error ? <Aviso>{error}</Aviso> : !data ? <Cargando /> : (
        <HorarioSemanal sesiones={data} mostrarDocente vacio={<Vacio titulo="Aún no tienes materias inscritas" accion={<Link href="/estudiante/inscripcion"><Boton>Inscribir horario</Boton></Link>}>Tu horario se arma al inscribir los grupos.</Vacio>} />
      )}
    </>
  );
}
