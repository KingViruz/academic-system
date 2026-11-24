export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace(/\/$/, '');
const TOKEN = 'cul.token';

export class ApiError extends Error {
  constructor(public status: number, message: string, public errores: { campo: string; mensaje: string }[] = [], public datos?: unknown) {
    super(message);
  }
}

export const sesion = {
  token: () => { try { return localStorage.getItem(TOKEN); } catch { return null; } },
  guardar: (t: string) => { try { localStorage.setItem(TOKEN, t); } catch { /* modo privado */ } },
  borrar: () => { try { localStorage.removeItem(TOKEN); localStorage.removeItem('cul.user'); } catch { /* */ } },
};

interface Opciones { method?: string; body?: unknown; form?: FormData; raw?: boolean }

/** Llama a la API con el token de la sesión y convierte los errores en mensajes legibles. */
export async function api<T = unknown>(path: string, o: Opciones = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = sesion.token();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (o.body !== undefined) headers['Content-Type'] = 'application/json';
  let r: Response;
  try {
    r = await fetch(API_URL + path, { method: o.method ?? (o.body !== undefined || o.form ? 'POST' : 'GET'), headers, body: o.form ?? (o.body !== undefined ? JSON.stringify(o.body) : undefined) });
  } catch {
    throw new ApiError(0, 'No hay conexión con el servidor. Revisa que la API esté encendida.');
  }
  if (o.raw && r.ok) return (await r.text()) as T;
  const texto = await r.text();
  let datos: unknown = null;
  try { datos = texto ? JSON.parse(texto) : null; } catch { datos = texto; }
  if (!r.ok) {
    const d = (datos ?? {}) as { message?: string | string[]; errores?: { campo: string; mensaje: string }[] };
    const msg = Array.isArray(d.message) ? d.message[0] : d.message;
    if (r.status === 401 && !path.startsWith('/auth/login')) {
      sesion.borrar();
      window.dispatchEvent(new Event('cul:sesion-expirada'));
    }
    throw new ApiError(r.status, msg || `Error ${r.status}`, d.errores ?? [], datos);
  }
  return datos as T;
}

export const mensajeDe = (e: unknown) => (e instanceof Error ? e.message : 'Ocurrió un error inesperado');
