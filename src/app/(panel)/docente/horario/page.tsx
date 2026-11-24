'use client';
import { HorarioSemanal } from '@/components/horario-semanal';
import { Aviso, Cargando, Encabezado, Vacio } from '@/components/ui';
import { useApi } from '@/lib/use-api';
import type { Sesion } from '@/lib/types';

export default function HorarioDocente() {
  const { data, error } = useApi<Sesion[]>('/horarios/mio');
  return (
    <>
      <Encabezado titulo="Mi horario" descripcion="Se genera a partir de la carga académica: si el coordinador cambia un grupo, tu horario se actualiza solo." />
      {error ? <Aviso>{error}</Aviso> : !data ? <Cargando /> : <HorarioSemanal sesiones={data} vacio={<Vacio titulo="No tienes clases en el periodo actual" />} />}
    </>
  );
}
