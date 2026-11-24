'use client';
import { toast } from 'sonner';
import { PaginaCrud, activoCol } from '@/components/crud';
import { Boton } from '@/components/ui';
import { api, mensajeDe } from '@/lib/api';
import type { Materia } from '@/lib/types';

export default function Materias() {
  return (
    <PaginaCrud<Materia>
      titulo="Materias" nombreItem="Materia" ruta="/materias"
      descripcion="Catálogo que se reutiliza en microcurrículos, carga académica y horarios. Una materia con carga académica no se elimina: se inactiva."
      buscar={(m) => `${m.codigo} ${m.nombre}`}
      columnas={[
        { titulo: 'Código', celda: (m) => <span className="font-semibold tabular">{m.codigo}</span> },
        { titulo: 'Nombre', celda: (m) => m.nombre },
        { titulo: 'Créditos', alinear: 'der', celda: (m) => m.creditos },
        activoCol<Materia>(),
      ]}
      campos={[
        { nombre: 'codigo', label: 'Código', requerido: true, placeholder: 'SIS402' },
        { nombre: 'nombre', label: 'Nombre', requerido: true },
        { nombre: 'creditos', label: 'Créditos', tipo: 'number', requerido: true },
        { nombre: 'activo', label: 'Activa', tipo: 'checkbox', soloEditar: true },
      ]}
      aFormulario={(m) => ({ codigo: m.codigo, nombre: m.nombre, creditos: String(m.creditos), activo: m.activo })}
      accionesExtra={(m, recargar) => m.activo && (
        <Boton tamano="sm" variante="peligro" onClick={async () => {
          if (!confirm(`¿Eliminar ${m.nombre}? Si tiene carga académica se inactivará.`)) return;
          try {
            const r = await api<{ eliminada: boolean; mensaje?: string }>(`/materias/${m.id}`, { method: 'DELETE' });
            toast.success(r.eliminada ? 'Materia eliminada' : r.mensaje ?? 'Materia inactivada');
            recargar();
          } catch (e) { toast.error(mensajeDe(e)); }
        }}>Eliminar</Boton>
      )}
    />
  );
}
