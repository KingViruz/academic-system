'use client';
import { PaginaCrud, activoCol } from '@/components/crud';
import { useApi } from '@/lib/use-api';
import type { Facultad, Programa } from '@/lib/types';

export default function Programas() {
  const { data: facultades } = useApi<Facultad[]>('/facultades');
  return (
    <PaginaCrud<Programa>
      titulo="Programas" nombreItem="Programa" ruta="/programas"
      descripcion="Cada programa pertenece a una facultad. Estudiantes, carga académica y microcurrículos se vinculan a un programa."
      buscar={(p) => `${p.codigo} ${p.nombre} ${p.facultad?.nombre}`}
      columnas={[
        { titulo: 'Código', celda: (p) => <span className="font-semibold tabular">{p.codigo}</span> },
        { titulo: 'Nombre', celda: (p) => p.nombre },
        { titulo: 'Facultad', celda: (p) => p.facultad?.nombre },
        { titulo: 'Créditos', alinear: 'der', celda: (p) => p.creditos },
        activoCol<Programa>(),
      ]}
      campos={[
        { nombre: 'codigo', label: 'Código', requerido: true, placeholder: 'ING-SIS' },
        { nombre: 'nombre', label: 'Nombre', requerido: true },
        { nombre: 'facultadId', label: 'Facultad', tipo: 'select', requerido: true, opciones: (facultades ?? []).filter((f) => f.activo).map((f) => ({ value: f.id, label: f.nombre })) },
        { nombre: 'creditos', label: 'Créditos del programa', tipo: 'number', requerido: true },
        { nombre: 'activo', label: 'Activo', tipo: 'checkbox', soloEditar: true },
      ]}
      aFormulario={(p) => ({ codigo: p.codigo, nombre: p.nombre, facultadId: String(p.facultadId), creditos: String(p.creditos), activo: p.activo })}
    />
  );
}
