'use client';
import { PaginaCrud } from '@/components/crud';
import { Etiqueta } from '@/components/ui';
import { fecha } from '@/lib/format';
import type { Periodo } from '@/lib/types';

export default function Periodos() {
  return (
    <PaginaCrud<Periodo>
      titulo="Periodos académicos" nombreItem="Periodo" ruta="/periodos"
      descripcion="Solo un periodo puede estar marcado como actual: es el que se programa, se inscribe y se califica."
      columnas={[
        { titulo: 'Periodo', celda: (p) => <span className="font-semibold tabular">{p.codigo}</span> },
        { titulo: 'Inicio', celda: (p) => fecha(p.fechaInicio) },
        { titulo: 'Fin', celda: (p) => fecha(p.fechaFin) },
        { titulo: 'Límite de créditos', alinear: 'der', celda: (p) => p.limiteCreditos },
        { titulo: 'Estado', celda: (p) => (p.actual ? <Etiqueta tono="marca">Actual</Etiqueta> : <span className="text-mute">—</span>) },
      ]}
      campos={[
        { nombre: 'codigo', label: 'Código', requerido: true, placeholder: '2027-1' },
        { nombre: 'limiteCreditos', label: 'Límite de créditos por estudiante', tipo: 'number', requerido: true },
        { nombre: 'fechaInicio', label: 'Fecha de inicio', tipo: 'date', requerido: true },
        { nombre: 'fechaFin', label: 'Fecha de fin', tipo: 'date', requerido: true },
        { nombre: 'actual', label: 'Marcar como periodo actual', tipo: 'checkbox' },
      ]}
      aFormulario={(p) => ({ codigo: p.codigo, limiteCreditos: String(p.limiteCreditos), fechaInicio: p.fechaInicio, fechaFin: p.fechaFin, actual: p.actual })}
    />
  );
}
