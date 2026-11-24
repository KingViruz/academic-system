'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PlanDetalle } from '@/components/plan-detalle';
import { Aviso, Cargando, Encabezado } from '@/components/ui';
import { useApi } from '@/lib/use-api';
import { nombre } from '@/lib/format';
import type { Plan } from '@/lib/types';

export default function PlanCoordinador() {
  const { id } = useParams<{ id: string }>();
  const { data: plan, error, recargar } = useApi<Plan>(`/planes/${id}`);
  if (error) return <Aviso>{error}</Aviso>;
  if (!plan) return <Cargando />;
  return (
    <>
      <Link href="/coordinador/planes" className="mb-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink-soft hover:text-ink"><ArrowLeft className="size-4" />Seguimiento de planes</Link>
      <Encabezado titulo={`${plan.carga.materia.nombre} · grupo ${plan.carga.grupo}`} descripcion={`Docente ${nombre(plan.carga.docente.usuario)} · periodo ${plan.carga.periodo?.codigo ?? ''}`} />
      <PlanDetalle plan={plan} modo="coordinador" onCambio={recargar} />
    </>
  );
}
