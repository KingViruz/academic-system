'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { mensajeDe } from '@/lib/api';
import { INICIO } from '@/lib/format';
import { Aviso, Boton, Entrada } from '@/components/ui';

export default function Login() {
  const { usuario, entrar } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const expirada = typeof window !== 'undefined' && window.location.search.includes('expirada');

  useEffect(() => { if (usuario) router.replace(INICIO[usuario.rol]); }, [usuario, router]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try { await entrar(email, password); } catch (err) { setError(mensajeDe(err)); } finally { setEnviando(false); }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Panel institucional: los rayos del escudo como gesto principal */}
      <div className="relative hidden overflow-hidden bg-night lg:block">
        <svg className="absolute -left-40 -top-40 h-[150%] w-[150%] text-white/[.045]" viewBox="0 0 100 100" aria-hidden>
          {Array.from({ length: 16 }).map((_, i) => (
            <polygon key={i} points="50,50 51.2,0 48.8,0" fill="currentColor" transform={`rotate(${i * 22.5} 50 50)`} />
          ))}
        </svg>
        <div className="relative flex h-full flex-col justify-between p-14">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/escudo-cul.png" alt="" className="h-20 w-auto self-start" />
          <div>
            <p className="display max-w-md text-[44px] leading-[1.02] font-[850] text-white">Sistema Académico</p>
            <p className="mt-5 max-w-sm text-[16px] leading-relaxed text-white/70">Carga académica, horarios, microcurrículos, asistencia y notas de la Corporación Universitaria Latinoamericana en un solo lugar.</p>
          </div>
          <p className="text-[13px] text-white/45">Ingeniería de Software II · Barranquilla</p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-cul.png" alt="Corporación Universitaria Latinoamericana" className="mb-10 h-16 w-auto" />
          <h1 className="text-[26px] font-[800]">Inicia sesión</h1>
          <p className="mt-1 mb-7 text-[15px] text-mute">Usa tu correo institucional.</p>
          <form onSubmit={enviar} className="space-y-4" noValidate>
            {expirada && !error && <Aviso tono="aviso">Tu sesión expiró. Vuelve a iniciar sesión.</Aviso>}
            {error && <Aviso>{error}</Aviso>}
            <Entrada label="Correo institucional" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@cul.edu.co" />
            <Entrada label="Contraseña" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <Boton type="submit" cargando={enviando} className="w-full">Ingresar</Boton>
          </form>
          <p className="mt-6 text-[13px] leading-relaxed text-mute">Si olvidaste tu contraseña, pide al administrador que la restablezca. Tras cinco intentos fallidos la cuenta se bloquea 15 minutos.</p>
        </div>
      </div>
    </div>
  );
}
