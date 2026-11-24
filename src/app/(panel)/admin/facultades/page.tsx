'use client';
import { PaginaCrud, activoCol } from '@/components/crud';
import type { Facultad } from '@/lib/types';

export default function Facultades() {
  return (
    <PaginaCrud<Facultad>
      titulo="Facultades" nombreItem="Facultad" ruta="/facultades"
      descripcion="Unidades que agrupan los programas. No se puede inactivar una facultad con programas activos."
      buscar={(f) => `${f.codigo} ${f.nombre}`}
      columnas={[
        { titulo: 'Código', celda: (f) => <span className="font-semibold tabular">{f.codigo}</span> },
        { titulo: 'Nombre', celda: (f) => f.nombre },
        { titulo: 'Programas activos', alinear: 'der', celda: (f) => f.numeroProgramas ?? 0 },
        activoCol<Facultad>(),
      ]}
      campos={[
        { nombre: 'codigo', label: 'Código', requerido: true, placeholder: 'FING' },
        { nombre: 'nombre', label: 'Nombre', requerido: true },
        { nombre: 'activo', label: 'Activa', tipo: 'checkbox', soloEditar: true },
      ]}
      aFormulario={(f) => ({ codigo: f.codigo, nombre: f.nombre, activo: f.activo })}
    />
  );
}
