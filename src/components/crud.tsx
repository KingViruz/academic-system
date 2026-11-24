'use client';
import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError, mensajeDe } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { AreaTexto, Aviso, Boton, Buscador, Casilla, Columna, Encabezado, Entrada, Modal, Selector, Tabla } from './ui';

export interface CampoDef {
  nombre: string;
  label: string;
  tipo?: 'text' | 'number' | 'date' | 'email' | 'password' | 'select' | 'checkbox' | 'textarea' | 'time';
  opciones?: { value: string | number; label: string }[];
  requerido?: boolean;
  ayuda?: string;
  soloCrear?: boolean;
  soloEditar?: boolean;
  ancho?: 'completo';
  placeholder?: string;
  vacio?: string;
}

type Valores = Record<string, string | boolean>;

interface Props<T> {
  titulo: string;
  descripcion?: React.ReactNode;
  ruta: string;
  rutaLista?: string;
  columnas: Columna<T>[];
  campos: CampoDef[];
  nombreItem: string;
  aFormulario?: (f: T) => Valores;
  desdeFormulario?: (v: Valores, editando: T | null) => Record<string, unknown>;
  buscar?: (f: T) => string;
  accionesExtra?: (f: T, recargar: () => void) => React.ReactNode;
  puedeCrear?: boolean;
  encabezadoExtra?: React.ReactNode;
  clave?: (f: T) => string | number;
}

export function convertir(campos: CampoDef[], v: Valores) {
  const out: Record<string, unknown> = {};
  for (const c of campos) {
    const x = v[c.nombre];
    if (c.tipo === 'checkbox') out[c.nombre] = !!x;
    else if (x === '' || x === undefined) { if (c.tipo !== 'select' || !c.requerido) out[c.nombre] = undefined; }
    else if (c.tipo === 'number') out[c.nombre] = Number(x);
    else if (c.tipo === 'select' && typeof x === 'string' && /^\d+$/.test(x) && c.opciones?.every((o) => typeof o.value === 'number')) out[c.nombre] = Number(x);
    else out[c.nombre] = x;
  }
  return out;
}

export function FormularioCampos({ campos, valores, setValores, errores, editando }: { campos: CampoDef[]; valores: Valores; setValores: (v: Valores) => void; errores: Record<string, string>; editando: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {campos.filter((c) => !(editando && c.soloCrear) && !(!editando && c.soloEditar)).map((c) => {
        const comun = { label: c.label + (c.requerido ? '' : ' (opcional)'), error: errores[c.nombre], ayuda: c.ayuda, className: c.ancho === 'completo' || c.tipo === 'textarea' ? 'sm:col-span-2' : undefined };
        const val = valores[c.nombre];
        const set = (x: string | boolean) => setValores({ ...valores, [c.nombre]: x });
        if (c.tipo === 'checkbox') return <div key={c.nombre} className="flex items-end pb-2"><Casilla label={c.label} checked={!!val} onChange={(e) => set(e.target.checked)} /></div>;
        if (c.tipo === 'select') return <Selector key={c.nombre} {...comun} opciones={c.opciones ?? []} vacio={c.vacio ?? 'Selecciona…'} value={String(val ?? '')} onChange={(e) => set(e.target.value)} />;
        if (c.tipo === 'textarea') return <AreaTexto key={c.nombre} {...comun} value={String(val ?? '')} onChange={(e) => set(e.target.value)} placeholder={c.placeholder} />;
        return <Entrada key={c.nombre} {...comun} type={c.tipo ?? 'text'} step={c.tipo === 'number' ? 'any' : undefined} value={String(val ?? '')} onChange={(e) => set(e.target.value)} placeholder={c.placeholder} />;
      })}
    </div>
  );
}

/** Página de catálogo: lista con búsqueda y formulario de crear/editar. */
export function PaginaCrud<T extends { id: number }>(p: Props<T>) {
  const { data, error, cargando, recargar } = useApi<T[]>(p.rutaLista ?? p.ruta);
  const [q, setQ] = useState('');
  const [editando, setEditando] = useState<T | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [valores, setValores] = useState<Valores>({});
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const filas = useMemo(() => {
    if (!q || !p.buscar) return data;
    const n = q.toLowerCase();
    return data?.filter((f) => p.buscar!(f).toLowerCase().includes(n));
  }, [data, q, p.buscar]);

  function abrir(f: T | null) {
    setEditando(f);
    setErrores({}); setErrorGeneral(null);
    const base: Valores = {};
    p.campos.forEach((c) => { base[c.nombre] = c.tipo === 'checkbox' ? true : ''; });
    setValores(f ? { ...base, ...(p.aFormulario ? p.aFormulario(f) : (f as unknown as Valores)) } : base);
    setAbierto(true);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true); setErrores({}); setErrorGeneral(null);
    try {
      const cuerpo = p.desdeFormulario ? p.desdeFormulario(valores, editando) : convertir(p.campos.filter((c) => !(editando && c.soloCrear)), valores);
      if (editando) await api(`${p.ruta}/${editando.id}`, { method: 'PATCH', body: cuerpo });
      else await api(p.ruta, { body: cuerpo });
      toast.success(editando ? `${p.nombreItem} actualizado` : `${p.nombreItem} creado`);
      setAbierto(false);
      recargar();
    } catch (err) {
      if (err instanceof ApiError && err.errores.length) {
        setErrores(Object.fromEntries(err.errores.map((x) => [x.campo.split('.')[0], x.mensaje])));
        setErrorGeneral(err.message);
      } else setErrorGeneral(mensajeDe(err));
    } finally { setGuardando(false); }
  }

  const columnas: Columna<T>[] = [
    ...p.columnas,
    { titulo: 'Acciones', alinear: 'der', celda: (f) => (
      <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
        {p.accionesExtra?.(f, recargar)}
        <Boton tamano="sm" variante="secundario" onClick={() => abrir(f)}>Editar</Boton>
      </div>
    ) },
  ];

  return (
    <>
      <Encabezado titulo={p.titulo} descripcion={p.descripcion} acciones={p.puedeCrear !== false && <Boton onClick={() => abrir(null)}><Plus className="size-4" />Crear {p.nombreItem.toLowerCase()}</Boton>} />
      {p.encabezadoExtra}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {p.buscar && <Buscador valor={q} onCambio={setQ} placeholder={`Buscar ${p.titulo.toLowerCase()}`} />}
        {data && <span className="text-[13px] text-mute tabular">{filas?.length ?? 0} de {data.length}</span>}
      </div>
      {error && <div className="mb-4"><Aviso>{error}</Aviso></div>}
      <Tabla columnas={columnas} filas={filas} clave={p.clave ?? ((f) => f.id)} cargando={cargando} vacio={q ? 'Ningún resultado coincide con la búsqueda.' : `Todavía no hay ${p.titulo.toLowerCase()}. Usa “Crear ${p.nombreItem.toLowerCase()}”.`} />
      <Modal abierto={abierto} onCerrar={() => setAbierto(false)} titulo={editando ? `Editar ${p.nombreItem.toLowerCase()}` : `Crear ${p.nombreItem.toLowerCase()}`} ancho="lg"
        pie={<><Boton variante="secundario" onClick={() => setAbierto(false)}>Cancelar</Boton><Boton form="form-crud" type="submit" cargando={guardando}>{editando ? 'Guardar cambios' : `Crear ${p.nombreItem.toLowerCase()}`}</Boton></>}>
        <form id="form-crud" onSubmit={guardar} className="space-y-4">
          {errorGeneral && <Aviso>{errorGeneral}</Aviso>}
          <FormularioCampos campos={p.campos} valores={valores} setValores={setValores} errores={errores} editando={!!editando} />
        </form>
      </Modal>
    </>
  );
}

export const activoCol = <T extends { activo: boolean }>(): Columna<T> => ({
  titulo: 'Estado', celda: (f) => (f.activo ? <span className="text-ok font-semibold">Activo</span> : <span className="text-mute">Inactivo</span>),
});
