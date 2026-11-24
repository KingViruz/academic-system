'use client';
import { useState } from 'react';
import { PaginaCrud, activoCol } from '@/components/crud';
import { Pestanas } from '@/components/ui';
import { useApi } from '@/lib/use-api';
import type { Aula, Sede } from '@/lib/types';

export default function SedesAulas() {
  const [tab, setTab] = useState<'aulas' | 'sedes'>('aulas');
  const { data: sedes } = useApi<Sede[]>('/sedes');
  const pestanas = <Pestanas valor={tab} onCambio={setTab} opciones={[{ valor: 'aulas', label: 'Aulas' }, { valor: 'sedes', label: 'Sedes', contador: sedes?.length }]} />;
  return tab === 'aulas' ? (
    <PaginaCrud<Aula>
      key="aulas" titulo="Sedes y aulas" nombreItem="Aula" ruta="/aulas" encabezadoExtra={pestanas}
      descripcion="Espacios disponibles para programar clases. El código del aula es único dentro de cada sede."
      buscar={(a) => `${a.codigo} ${a.sede?.nombre}`}
      columnas={[
        { titulo: 'Aula', celda: (a) => <span className="font-semibold">{a.codigo}</span> },
        { titulo: 'Sede', celda: (a) => a.sede?.nombre },
        { titulo: 'Capacidad', alinear: 'der', celda: (a) => a.capacidad },
        activoCol<Aula>(),
      ]}
      campos={[
        { nombre: 'sedeId', label: 'Sede', tipo: 'select', requerido: true, opciones: (sedes ?? []).map((s) => ({ value: s.id, label: s.nombre })) },
        { nombre: 'codigo', label: 'Código del aula', requerido: true, placeholder: '301' },
        { nombre: 'capacidad', label: 'Capacidad (personas)', tipo: 'number', requerido: true },
        { nombre: 'activo', label: 'Activa', tipo: 'checkbox', soloEditar: true },
      ]}
      aFormulario={(a) => ({ sedeId: String(a.sedeId), codigo: a.codigo, capacidad: String(a.capacidad), activo: a.activo })}
    />
  ) : (
    <PaginaCrud<Sede>
      key="sedes" titulo="Sedes y aulas" nombreItem="Sede" ruta="/sedes" encabezadoExtra={pestanas}
      descripcion="Sedes físicas de la institución."
      columnas={[{ titulo: 'Nombre', celda: (s) => <span className="font-semibold">{s.nombre}</span> }, { titulo: 'Dirección', celda: (s) => s.direccion ?? '—' }, activoCol<Sede>()]}
      campos={[{ nombre: 'nombre', label: 'Nombre', requerido: true }, { nombre: 'direccion', label: 'Dirección' }, { nombre: 'activo', label: 'Activa', tipo: 'checkbox', soloEditar: true }]}
      aFormulario={(s) => ({ nombre: s.nombre, direccion: s.direccion ?? '', activo: s.activo })}
    />
  );
}
