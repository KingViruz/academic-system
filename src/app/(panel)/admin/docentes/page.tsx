'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { PaginaCrud } from '@/components/crud';
import { aPersona, camposPersona } from '@/components/personas';
import { Boton, Buscador, Casilla, Modal } from '@/components/ui';
import { api, mensajeDe } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { nombre } from '@/lib/format';
import type { Docente, Materia } from '@/lib/types';

function MateriasDocente({ docente, onCerrar }: { docente: Docente; onCerrar: (cambio: boolean) => void }) {
  const { data: materias } = useApi<Materia[]>('/materias');
  const [sel, setSel] = useState<Set<number>>(new Set(docente.materias.map((m) => m.id)));
  const [q, setQ] = useState('');
  const [guardando, setGuardando] = useState(false);
  const lista = (materias ?? []).filter((m) => (m.activo || sel.has(m.id)) && `${m.codigo} ${m.nombre}`.toLowerCase().includes(q.toLowerCase()));
  async function guardar() {
    setGuardando(true);
    try {
      await api(`/docentes/${docente.id}/materias`, { method: 'PUT', body: { materiaIds: [...sel] } });
      toast.success('Materias habilitadas actualizadas');
      onCerrar(true);
    } catch (e) { toast.error(mensajeDe(e)); } finally { setGuardando(false); }
  }
  return (
    <Modal abierto onCerrar={() => onCerrar(false)} titulo={`Materias que puede dictar ${nombre(docente.usuario)}`} ancho="lg"
      pie={<><Boton variante="secundario" onClick={() => onCerrar(false)}>Cancelar</Boton><Boton onClick={guardar} cargando={guardando}>Guardar {sel.size} materia(s)</Boton></>}>
      <p className="mb-3 text-[14px] text-mute">La carga académica solo ofrecerá a este docente para las materias marcadas.</p>
      <Buscador valor={q} onCambio={setQ} placeholder="Buscar materia" />
      <ul className="mt-3 grid max-h-80 gap-1 overflow-y-auto sm:grid-cols-2">
        {lista.map((m) => (
          <li key={m.id} className="rounded-sm px-2 py-1.5 hover:bg-paper">
            <Casilla label={`${m.codigo} · ${m.nombre}`} checked={sel.has(m.id)} onChange={(e) => { const s = new Set(sel); if (e.target.checked) s.add(m.id); else s.delete(m.id); setSel(s); }} />
          </li>
        ))}
      </ul>
    </Modal>
  );
}

export default function Docentes() {
  const [materias, setMaterias] = useState<{ d: Docente; recargar: () => void } | null>(null);
  return (
    <>
      <PaginaCrud<Docente>
        titulo="Docentes" nombreItem="Docente" ruta="/docentes"
        descripcion="Registra a los docentes y define qué materias está habilitado para dictar cada uno."
        buscar={(d) => `${nombre(d.usuario)} ${d.usuario.identificacion} ${d.materias.map((m) => m.nombre).join(' ')}`}
        columnas={[
          { titulo: 'Nombre', celda: (d) => <span className="font-semibold">{nombre(d.usuario)}</span> },
          { titulo: 'Documento', celda: (d) => <span className="tabular">{d.usuario.identificacion}</span> },
          { titulo: 'Correo', celda: (d) => d.usuario.email },
          { titulo: 'Materias habilitadas', celda: (d) => (d.materias.length ? <span className="text-[13px]">{d.materias.map((m) => m.nombre).join(', ')}</span> : <span className="text-warn">Ninguna</span>) },
        ]}
        campos={[...camposPersona, { nombre: 'profesion', label: 'Profesión' }, { nombre: 'fechaNacimiento', label: 'Fecha de nacimiento', tipo: 'date' }, { nombre: 'direccion', label: 'Dirección', ancho: 'completo' }]}
        aFormulario={(d) => ({ ...aPersona(d.usuario), profesion: d.profesion ?? '', fechaNacimiento: d.fechaNacimiento ?? '', direccion: d.direccion ?? '' })}
        accionesExtra={(d, recargar) => <Boton tamano="sm" variante="secundario" onClick={() => setMaterias({ d, recargar })}>Materias</Boton>}
      />
      {materias && <MateriasDocente docente={materias.d} onCerrar={(c) => { if (c) materias.recargar(); setMaterias(null); }} />}
    </>
  );
}
