'use client';
import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { PaginaCrud } from '@/components/crud';
import { aPersona, camposPersona } from '@/components/personas';
import { Aviso, Boton, Modal, Tabla } from '@/components/ui';
import { api, mensajeDe } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { nombre } from '@/lib/format';
import type { Estudiante, Programa } from '@/lib/types';

interface Resultado { total: number; creados: { fila: number; nombre: string }[]; existentes: { fila: number; identificacion: string }[]; errores: { fila: number; motivo: string }[] }

function CargaMasiva({ onCerrar }: { onCerrar: (cambio: boolean) => void }) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [res, setRes] = useState<Resultado | null>(null);
  async function plantilla() {
    try {
      const csv = await api<string>('/estudiantes/plantilla', { raw: true });
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = 'plantilla_estudiantes.csv'; a.click(); URL.revokeObjectURL(url);
    } catch (e) { toast.error(mensajeDe(e)); }
  }
  async function subir() {
    if (!archivo) return;
    setEnviando(true);
    try {
      const f = new FormData(); f.append('archivo', archivo);
      const r = await api<Resultado>('/estudiantes/carga-masiva', { form: f });
      setRes(r);
      if (r.creados.length) toast.success(`${r.creados.length} estudiante(s) creados`);
    } catch (e) { toast.error(mensajeDe(e)); } finally { setEnviando(false); }
  }
  return (
    <Modal abierto onCerrar={() => onCerrar(!!res?.creados.length)} titulo="Carga masiva de estudiantes" ancho="lg"
      pie={<><Boton variante="secundario" onClick={() => onCerrar(!!res?.creados.length)}>Cerrar</Boton><Boton onClick={subir} cargando={enviando} disabled={!archivo}><Upload className="size-4" />Cargar archivo</Boton></>}>
      <ol className="mb-4 list-decimal space-y-1 pl-5 text-[14px] text-ink-soft">
        <li>Descarga la plantilla y llénala en Excel. Guárdala como CSV.</li>
        <li>El programa se indica con su código (por ejemplo ING-SIS) y las fechas como AAAA-MM-DD.</li>
        <li>Las filas con error se reportan y no detienen la carga de las válidas. Los estudiantes que ya existen no se duplican.</li>
      </ol>
      <div className="flex flex-wrap items-center gap-3">
        <Boton variante="secundario" onClick={plantilla}><Download className="size-4" />Descargar plantilla</Boton>
        <input type="file" accept=".csv,text/csv" onChange={(e) => { setArchivo(e.target.files?.[0] ?? null); setRes(null); }} className="text-[14px] file:mr-3 file:rounded-sm file:border file:border-line file:bg-paper file:px-3 file:py-2 file:font-semibold" />
      </div>
      {res && (
        <div className="mt-5 space-y-3">
          <Aviso tono={res.errores.length ? 'aviso' : 'ok'}>De {res.total} filas: {res.creados.length} creadas, {res.existentes.length} ya existían y {res.errores.length} con error.</Aviso>
          {res.errores.length > 0 && <Tabla filas={res.errores} clave={(e) => e.fila} columnas={[{ titulo: 'Fila', celda: (e) => e.fila }, { titulo: 'Motivo', celda: (e) => e.motivo }]} />}
        </div>
      )}
    </Modal>
  );
}

export default function Estudiantes() {
  const { data: programas } = useApi<Programa[]>('/programas');
  const [masiva, setMasiva] = useState(false);
  const [k, setK] = useState(0);
  return (
    <>
      <PaginaCrud<Estudiante>
        key={k} titulo="Estudiantes" nombreItem="Estudiante" ruta="/estudiantes"
        descripcion="Si el estudiante es menor de edad, los datos del acudiente son obligatorios. El código de carné es el que lee el sensor de asistencia."
        encabezadoExtra={<div className="mb-5"><Boton variante="secundario" onClick={() => setMasiva(true)}><Upload className="size-4" />Carga masiva desde CSV</Boton></div>}
        buscar={(e) => `${nombre(e.usuario)} ${e.usuario.identificacion} ${e.codigoCarne}`}
        columnas={[
          { titulo: 'Nombre', celda: (e) => <span className="font-semibold">{e.usuario.apellidos} {e.usuario.nombres}</span> },
          { titulo: 'Carné', celda: (e) => <span className="tabular">{e.codigoCarne}</span> },
          { titulo: 'Documento', celda: (e) => <span className="tabular">{e.usuario.identificacion}</span> },
          { titulo: 'Programa', celda: (e) => e.programa?.nombre },
          { titulo: 'Semestre', alinear: 'der', celda: (e) => e.semestre },
        ]}
        campos={[
          ...camposPersona,
          { nombre: 'codigoCarne', label: 'Código de carné', requerido: true, placeholder: 'EST-0001' },
          { nombre: 'programaId', label: 'Programa', tipo: 'select', requerido: true, opciones: (programas ?? []).filter((p) => p.activo).map((p) => ({ value: p.id, label: p.nombre })) },
          { nombre: 'semestre', label: 'Semestre', tipo: 'number' },
          { nombre: 'fechaNacimiento', label: 'Fecha de nacimiento', tipo: 'date', requerido: true },
          { nombre: 'fechaExpedicion', label: 'Fecha de expedición del documento', tipo: 'date', requerido: true },
          { nombre: 'direccion', label: 'Dirección' },
          { nombre: 'acudienteNombre', label: 'Nombre del acudiente', ayuda: 'Obligatorio si es menor de edad' },
          { nombre: 'acudienteTelefono', label: 'Teléfono del acudiente' },
          { nombre: 'puntajeIcfes', label: 'Puntaje ICFES', tipo: 'number' },
          { nombre: 'sisben', label: 'Grupo SISBEN', placeholder: 'B2' },
        ]}
        aFormulario={(e) => ({
          ...aPersona(e.usuario), codigoCarne: e.codigoCarne, programaId: String(e.programaId), semestre: String(e.semestre),
          fechaNacimiento: e.fechaNacimiento ?? '', fechaExpedicion: e.fechaExpedicion ?? '', direccion: e.direccion ?? '',
          acudienteNombre: e.acudienteNombre ?? '', acudienteTelefono: e.acudienteTelefono ?? '', puntajeIcfes: e.puntajeIcfes != null ? String(e.puntajeIcfes) : '', sisben: e.sisben ?? '',
        })}
      />
      {masiva && <CargaMasiva onCerrar={(c) => { setMasiva(false); if (c) setK(k + 1); }} />}
    </>
  );
}
