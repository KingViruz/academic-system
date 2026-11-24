'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Boton, Encabezado, Etiqueta, Modal, Selector, Tabla } from '@/components/ui';
import { api, mensajeDe } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { fecha } from '@/lib/format';
import type { Materia, Microcurriculo } from '@/lib/types';

export default function Microcurriculos() {
  const router = useRouter();
  const { data, cargando } = useApi<Microcurriculo[]>('/microcurriculos');
  const { data: materias } = useApi<Materia[]>('/materias?activas=true');
  const [nuevo, setNuevo] = useState(false);
  const [materiaId, setMateriaId] = useState('');
  const disponibles = (materias ?? []).filter((m) => !data?.some((x) => x.materiaId === m.id));

  async function crear() {
    try {
      const m = await api<Microcurriculo>('/microcurriculos', { body: { materiaId: Number(materiaId), porcentajeP1: 30, porcentajeP2: 30, porcentajeP3: 40 } });
      toast.success('Microcurrículo creado en borrador');
      router.push(`/coordinador/microcurriculos/${m.id}`);
    } catch (e) { toast.error(mensajeDe(e)); }
  }

  return (
    <>
      <Encabezado titulo="Microcurrículos" descripcion="Contenido programático de cada materia del programa: objetivos, competencias, unidades con niveles de desempeño y el peso de cada parcial."
        acciones={<Boton onClick={() => setNuevo(true)}><Plus className="size-4" />Nuevo microcurrículo</Boton>} />
      <Tabla filas={data} cargando={cargando} clave={(m) => m.id} onFila={(m) => router.push(`/coordinador/microcurriculos/${m.id}`)} vacio="Aún no hay microcurrículos en el programa." columnas={[
        { titulo: 'Materia', celda: (m) => <Link href={`/coordinador/microcurriculos/${m.id}`} className="font-semibold hover:underline">{m.materia.nombre}</Link> },
        { titulo: 'Código', celda: (m) => <span className="tabular">{m.materia.codigo}</span> },
        { titulo: 'Parciales', celda: (m) => <span className="tabular">{m.porcentajeP1} / {m.porcentajeP2} / {m.porcentajeP3} %</span> },
        { titulo: 'Estado', celda: (m) => m.estado === 'PUBLICADO' ? <Etiqueta tono="ok">Publicado {fecha(m.publicadoEn)}</Etiqueta> : <Etiqueta tono="aviso">Borrador</Etiqueta> },
      ]} />
      <Modal abierto={nuevo} onCerrar={() => setNuevo(false)} titulo="Nuevo microcurrículo"
        pie={<><Boton variante="secundario" onClick={() => setNuevo(false)}>Cancelar</Boton><Boton onClick={crear} disabled={!materiaId}>Crear borrador</Boton></>}>
        <Selector label="Materia" value={materiaId} onChange={(e) => setMateriaId(e.target.value)} vacio={disponibles.length ? 'Selecciona…' : 'Todas las materias ya tienen microcurrículo'} opciones={disponibles.map((m) => ({ value: m.id, label: `${m.codigo} · ${m.nombre}` }))} />
      </Modal>
    </>
  );
}
