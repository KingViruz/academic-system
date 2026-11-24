/** Escudo CUL + nombre del sistema, para fondos oscuros. */
export function Marca({ compacta }: { compacta?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/escudo-cul.png" alt="" className={compacta ? 'h-8 w-auto' : 'h-10 w-auto'} />
      <span className="leading-none">
        <span className="display block text-[19px] font-[850] tracking-wide text-white">CUL</span>
        <span className="mt-1 block text-[12px] font-medium text-white/65">Sistema Académico</span>
      </span>
    </span>
  );
}

export function Cargador() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/escudo-cul.png" alt="Cargando" className="h-14 w-auto animate-pulse" />
    </div>
  );
}
