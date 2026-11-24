'use client';
import { forwardRef, useEffect, useId, useRef } from 'react';
import { Loader2, X } from 'lucide-react';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

// ---------- Botones ----------
type BtnVariant = 'primario' | 'secundario' | 'fantasma' | 'peligro';
const btnBase = 'inline-flex items-center justify-center gap-2 rounded-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 whitespace-nowrap';
const btnVar: Record<BtnVariant, string> = {
  primario: 'bg-ember text-white hover:bg-ember-dark',
  secundario: 'border border-ink/25 bg-white text-ink hover:border-ink hover:bg-paper',
  fantasma: 'text-ink-soft hover:bg-line-soft hover:text-ink',
  peligro: 'border border-bad/30 bg-white text-bad hover:bg-bad-tint',
};
export const Boton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: BtnVariant; cargando?: boolean; tamano?: 'sm' | 'md' }>(
  function Boton({ variante = 'primario', cargando, tamano = 'md', className, children, disabled, ...p }, ref) {
    return (
      <button ref={ref} className={cx(btnBase, btnVar[variante], tamano === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-10 px-4 text-sm', className)} disabled={disabled || cargando} {...p}>
        {cargando && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);

// ---------- Formularios ----------
export function Campo({ label, error, ayuda, children, className, htmlFor }: { label: string; error?: string; ayuda?: string; children: React.ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-ink">{label}</label>
      {children}
      {error ? <p className="text-[13px] text-bad" role="alert">{error}</p> : ayuda ? <p className="text-[12.5px] text-mute">{ayuda}</p> : null}
    </div>
  );
}

export function Entrada({ label, error, ayuda, className, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; ayuda?: string }) {
  const id = useId();
  return (
    <Campo label={label} error={error} ayuda={ayuda} className={className} htmlFor={id}>
      <input id={id} className={cx('field', error && 'border-bad')} aria-invalid={!!error} {...p} />
    </Campo>
  );
}

export function Selector({ label, error, ayuda, className, opciones, vacio, ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; ayuda?: string; opciones: { value: string | number; label: string }[]; vacio?: string }) {
  const id = useId();
  return (
    <Campo label={label} error={error} ayuda={ayuda} className={className} htmlFor={id}>
      <select id={id} className={cx('field pr-8', error && 'border-bad')} {...p}>
        {vacio !== undefined && <option value="">{vacio}</option>}
        {opciones.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Campo>
  );
}

export function AreaTexto({ label, error, ayuda, className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; ayuda?: string }) {
  const id = useId();
  return (
    <Campo label={label} error={error} ayuda={ayuda} className={className} htmlFor={id}>
      <textarea id={id} className={cx('field min-h-24', error && 'border-bad')} {...p} />
    </Campo>
  );
}

export function Casilla({ label, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
      <input type="checkbox" className="size-4 accent-ember" {...p} />
      {label}
    </label>
  );
}

// ---------- Estructura ----------
export function Encabezado({ titulo, descripcion, acciones }: { titulo: string; descripcion?: React.ReactNode; acciones?: React.ReactNode }) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="text-[26px] leading-tight font-[800] text-ink sm:text-[30px]">{titulo}</h1>
        {descripcion && <p className="mt-1.5 text-[15px] leading-relaxed text-mute">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </header>
  );
}

export function Seccion({ titulo, acciones, children, className, descripcion }: { titulo?: string; descripcion?: string; acciones?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cx('rounded-md border border-line bg-card', className)}>
      {(titulo || acciones) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-3.5">
          <div>
            {titulo && <h2 className="text-[15px] font-bold text-ink">{titulo}</h2>}
            {descripcion && <p className="text-[13px] text-mute">{descripcion}</p>}
          </div>
          {acciones}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

// ---------- Tabla ----------
export interface Columna<T> { titulo: string; celda: (f: T) => React.ReactNode; className?: string; alinear?: 'der' | 'centro' }
export function Tabla<T>({ columnas, filas, clave, vacio = 'No hay registros todavía.', cargando, onFila }: { columnas: Columna<T>[]; filas?: T[]; clave: (f: T) => string | number; vacio?: React.ReactNode; cargando?: boolean; onFila?: (f: T) => void }) {
  return (
    <div className="overflow-x-auto rounded-md border border-line bg-card">
      <table className="w-full min-w-[640px] border-collapse text-left text-[14px]">
        <thead>
          <tr className="border-b border-line bg-paper/70">
            {columnas.map((c) => (
              <th key={c.titulo} scope="col" className={cx('px-4 py-2.5 text-[12.5px] font-semibold text-mute', c.alinear === 'der' && 'text-right', c.alinear === 'centro' && 'text-center', c.className)}>{c.titulo}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cargando && !filas?.length ? (
            <tr><td colSpan={columnas.length} className="px-4 py-10 text-center text-mute"><Cargando /></td></tr>
          ) : !filas?.length ? (
            <tr><td colSpan={columnas.length} className="px-4 py-10 text-center text-mute">{vacio}</td></tr>
          ) : filas.map((f) => (
            <tr key={clave(f)} onClick={onFila ? () => onFila(f) : undefined} className={cx('border-b border-line-soft last:border-0', onFila && 'cursor-pointer hover:bg-paper')}>
              {columnas.map((c) => (
                <td key={c.titulo} className={cx('px-4 py-2.5 align-middle', c.alinear === 'der' && 'text-right tabular', c.alinear === 'centro' && 'text-center', c.className)}>{c.celda(f)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Etiquetas ----------
type Tono = 'neutro' | 'ok' | 'aviso' | 'mal' | 'marca' | 'tinta';
const tonos: Record<Tono, string> = {
  neutro: 'bg-line-soft text-ink-soft', ok: 'bg-ok-tint text-ok', aviso: 'bg-warn-tint text-warn',
  mal: 'bg-bad-tint text-bad', marca: 'bg-ember-tint text-ember-dark', tinta: 'bg-ink text-white',
};
export function Etiqueta({ tono = 'neutro', children, className }: { tono?: Tono; children: React.ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[12.5px] font-semibold whitespace-nowrap', tonos[tono], className)}>{children}</span>;
}

// ---------- Estados ----------
export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return <span className="inline-flex items-center gap-2 text-mute"><Loader2 className="size-4 animate-spin" aria-hidden />{texto}</span>;
}

export function Aviso({ tono = 'mal', children }: { tono?: 'mal' | 'aviso' | 'ok' | 'info'; children: React.ReactNode }) {
  const t = { mal: 'border-bad/30 bg-bad-tint text-bad', aviso: 'border-warn/30 bg-warn-tint text-warn', ok: 'border-ok/30 bg-ok-tint text-ok', info: 'border-ink/15 bg-white text-ink-soft' }[tono];
  return <div role={tono === 'mal' ? 'alert' : 'status'} className={cx('rounded-sm border px-4 py-3 text-[14px]', t)}>{children}</div>;
}

export function Vacio({ titulo, children, accion }: { titulo: string; children?: React.ReactNode; accion?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-line bg-card px-6 py-12 text-center">
      <p className="font-bold text-ink">{titulo}</p>
      {children && <p className="mx-auto mt-1 max-w-md text-[14px] text-mute">{children}</p>}
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  );
}

// ---------- Modal ----------
export function Modal({ abierto, onCerrar, titulo, children, ancho = 'md', pie }: { abierto: boolean; onCerrar: () => void; titulo: string; children: React.ReactNode; ancho?: 'md' | 'lg' | 'xl'; pie?: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const previo = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => ref.current?.querySelector<HTMLElement>('input,select,textarea,button')?.focus(), 30);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => { clearTimeout(t); document.removeEventListener('keydown', esc); document.body.style.overflow = ''; previo?.focus(); };
  }, [abierto, onCerrar]);
  if (!abierto) return null;
  const w = { md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[ancho];
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-night/55 p-4 sm:p-8" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={titulo} className={cx('w-full rounded-md bg-card shadow-[0_20px_60px_-20px_rgba(20,28,61,.45)]', w)}>
        <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
          <h2 className="text-[17px] font-bold">{titulo}</h2>
          <button onClick={onCerrar} className="rounded-sm p-1 text-mute hover:bg-line-soft hover:text-ink" aria-label="Cerrar"><X className="size-5" /></button>
        </div>
        <div className="px-5 py-5">{children}</div>
        {pie && <div className="flex justify-end gap-2 border-t border-line-soft px-5 py-3.5">{pie}</div>}
      </div>
    </div>
  );
}

// ---------- Pestañas ----------
export function Pestanas<T extends string>({ valor, onCambio, opciones }: { valor: T; onCambio: (v: T) => void; opciones: { valor: T; label: string; contador?: number }[] }) {
  return (
    <div role="tablist" className="mb-5 flex gap-1 overflow-x-auto border-b border-line">
      {opciones.map((o) => (
        <button key={o.valor} role="tab" aria-selected={valor === o.valor} onClick={() => onCambio(o.valor)}
          className={cx('-mb-px border-b-[3px] px-3.5 py-2.5 text-[14px] font-semibold whitespace-nowrap', valor === o.valor ? 'border-ember text-ink' : 'border-transparent text-mute hover:text-ink')}>
          {o.label}{o.contador !== undefined && <span className="ml-1.5 text-mute tabular">{o.contador}</span>}
        </button>
      ))}
    </div>
  );
}

// ---------- Cifras ----------
/** Fila sobria de cifras: número y etiqueta, separadas por líneas, sin tarjetas decorativas. */
export function Cifras({ items }: { items: { valor: React.ReactNode; label: string; tono?: 'mal' | 'aviso' | 'ok' }[] }) {
  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-md border border-line bg-card sm:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
      {items.map((i) => (
        <div key={i.label} className="border-b border-r border-line-soft px-5 py-4 last:border-r-0">
          <dt className="text-[13px] text-mute">{i.label}</dt>
          <dd className={cx('mt-0.5 text-[26px] font-[800] leading-none tabular display', i.tono === 'mal' ? 'text-bad' : i.tono === 'aviso' ? 'text-warn' : i.tono === 'ok' ? 'text-ok' : 'text-ink')}>{i.valor}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Buscador({ valor, onCambio, placeholder = 'Buscar' }: { valor: string; onCambio: (v: string) => void; placeholder?: string }) {
  return <input type="search" value={valor} onChange={(e) => onCambio(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="field h-10 max-w-xs" />;
}
