'use client';
import { useState } from 'react';
import { HorarioSemanal } from '@/components/horario-semanal';
import { Aviso, Cargando, Encabezado, Pestanas, Selector, Vacio } from '@/components/ui';
import { useApi } from '@/lib/use-api';
import { nombre } from '@/lib/format';
import type { Aula, Docente, Estudiante, Sesion } from '@/lib/types';

type Tipo = 'docente' | 'estudiante' | 'aula';

export default function ConsultarHorarios() {
  const [tipo, setTipo] = useState<Tipo>('docente');
  const [id, setId] = useState('');
  const { data: docentes } = useApi<Docente[]>('/docentes');
  const { data: estudiantes } = useApi<Estudiante[]>('/estudiantes');
  const { data: aulas } = useApi<Aula[]>('/aulas');
  const { data: sesiones, cargando, error } = useApi<Sesion[]>(id ? `/horarios/${tipo}/${id}` : null);
  const opciones = tipo === 'docente' ? (docentes ?? []).map((d) => ({ value: d.id, label: nombre(d.usuario) }))
    : tipo === 'estudiante' ? (estudiantes ?? []).map((e) => ({ value: e.id, label: `${e.usuario.apellidos} ${e.usuario.nombres} · ${e.codigoCarne}` }))
    : (aulas ?? []).map((a) => ({ value: a.id, label: `${a.codigo} · ${a.sede?.nombre ?? ''}` }));
  return (
    <>
      <Encabezado titulo="Consultar horarios" descripcion="Horario semanal del periodo actual de un docente, de un estudiante de tu programa o de un aula." />
      <Pestanas valor={tipo} onCambio={(t) => { setTipo(t); setId(''); }} opciones={[{ valor: 'docente', label: 'Docente' }, { valor: 'estudiante', label: 'Estudiante' }, { valor: 'aula', label: 'Aula' }]} />
      <div className="mb-6 max-w-md"><Selector label={tipo === 'aula' ? 'Aula' : tipo === 'docente' ? 'Docente' : 'Estudiante'} value={id} onChange={(e) => setId(e.target.value)} vacio="Selecciona…" opciones={opciones} /></div>
      {error && <Aviso>{error}</Aviso>}
      {!id ? null : cargando ? <Cargando /> : <HorarioSemanal sesiones={sesiones ?? []} mostrarDocente={tipo !== 'docente'} vacio={<Vacio titulo="Sin clases programadas">No tiene franjas en el periodo actual.</Vacio>} />}
    </>
  );
}
