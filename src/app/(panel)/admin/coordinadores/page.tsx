'use client';
import { PaginaCrud } from '@/components/crud';
import { aPersona, camposPersona } from '@/components/personas';
import { useApi } from '@/lib/use-api';
import { nombre } from '@/lib/format';
import type { Coordinador, Programa } from '@/lib/types';

export default function Coordinadores() {
  const { data: programas } = useApi<Programa[]>('/programas');
  return (
    <PaginaCrud<Coordinador>
      titulo="Coordinadores" nombreItem="Coordinador" ruta="/coordinadores"
      descripcion="Cada programa tiene un único coordinador, que solo ve y gestiona la información de su programa."
      buscar={(c) => `${nombre(c.usuario)} ${c.usuario.identificacion} ${c.programa.nombre}`}
      columnas={[
        { titulo: 'Nombre', celda: (c) => <span className="font-semibold">{nombre(c.usuario)}</span> },
        { titulo: 'Documento', celda: (c) => <span className="tabular">{c.usuario.identificacion}</span> },
        { titulo: 'Correo', celda: (c) => c.usuario.email },
        { titulo: 'Programa', celda: (c) => c.programa.nombre },
      ]}
      campos={[...camposPersona, { nombre: 'programaId', label: 'Programa a cargo', tipo: 'select', requerido: true, opciones: (programas ?? []).filter((p) => p.activo).map((p) => ({ value: p.id, label: p.nombre })) }]}
      aFormulario={(c) => ({ ...aPersona(c.usuario), programaId: String(c.programaId) })}
    />
  );
}
