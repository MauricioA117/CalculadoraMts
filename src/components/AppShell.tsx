/**
 * Armazón de la app: barra lateral, encabezado con título compartido y selector de tema.
 * Los estilos de tema.css se enganchan a estas clases (aside.bg-blue-900, header.bg-white/90, main,
 * #root > .bg-slate-50): si se cambian, el tema vidrio deja de aplicarse a esa pieza.
 */
import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Layers, LogOut, Moon, Sun } from 'lucide-react';
import { activarMovimiento, volarTitulo } from '../lib/movimiento';

// ── Tema ───────────────────────────────────────────────────────────

export type Tema = 'light' | 'dark' | 'vidrio';
export type TonoVidrio = 'oscuro' | 'claro';

const SIGUIENTE_TEMA = { light: 'dark', dark: 'vidrio', vidrio: 'light' } as const;
const NOMBRE_TEMA = { light: 'claro', dark: 'oscuro', vidrio: 'vidrio' } as const;

/** Lee lo que tema-previo.html ya aplicó antes de pintar, lo mantiene en la raíz y lo recuerda. */
export function useTema() {
  const [tema, setTema] = useState<Tema>(() => {
    const raiz = document.documentElement;
    if (raiz.hasAttribute('data-vidrio')) return 'vidrio';
    return raiz.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  });
  const [tonoVidrio, setTonoVidrio] = useState<TonoVidrio>(() =>
    document.documentElement.getAttribute('data-vidrio') === 'claro' ? 'claro' : 'oscuro',
  );

  useEffect(() => {
    const raiz = document.documentElement;
    // El vidrio oscuro se apoya en la inversión del tema oscuro
    const oscuro = tema === 'dark' || (tema === 'vidrio' && tonoVidrio === 'oscuro');
    if (oscuro) raiz.setAttribute('data-theme', 'dark');
    else raiz.removeAttribute('data-theme');
    if (tema === 'vidrio') raiz.setAttribute('data-vidrio', tonoVidrio);
    else raiz.removeAttribute('data-vidrio');
    try {
      localStorage.setItem('tema_app', tema);
      localStorage.setItem('tema_vidrio', tonoVidrio);
    } catch {
      // Sin almacenamiento el tema solo dura esta sesión
    }
  }, [tema, tonoVidrio]);

  return { tema, setTema, tonoVidrio, setTonoVidrio };
}

// ── Armazón ────────────────────────────────────────────────────────

export interface OpcionMenu<T extends string> {
  id: T;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface AppShellProps<T extends string> {
  nombreApp: string;
  subtitulo?: string;
  logoUrl?: string;
  opciones: OpcionMenu<T>[];
  activa: T;
  onCambiar: (id: T) => void;
  /** Línea pequeña sobre el título (por ejemplo el rol del usuario). */
  etiqueta?: string;
  usuario?: { nombre: string; rol?: string };
  onSalir?: () => void;
  /** Botones extra del encabezado, junto al de tema. */
  acciones?: React.ReactNode;
  children: React.ReactNode;
}

const ICONO = 'w-[18px] h-[18px] shrink-0';

export function AppShell<T extends string>({ nombreApp, subtitulo, logoUrl, opciones, activa, onCambiar, etiqueta, usuario, onSalir, acciones, children }: AppShellProps<T>) {
  const { tema, setTema, tonoVidrio, setTonoVidrio } = useTema();
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const actual = opciones.find((o) => o.id === activa);
  const iniciales = (usuario?.nombre || '').split(' ').filter(Boolean).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('');

  useEffect(() => { activarMovimiento(); }, []);

  // El título vuela desde la etiqueta del menú; hay que medir antes y después del cambio, por eso flushSync
  const cambiar = (id: T, origen: HTMLElement | null) => {
    if (id === activa) return;
    const desde = origen?.getBoundingClientRect() ?? null;
    const tamano = origen ? parseFloat(getComputedStyle(origen).fontSize) : 14;
    flushSync(() => onCambiar(id));
    volarTitulo(desde, tituloRef.current, tamano);
  };

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 font-sans flex flex-col lg:flex-row">
      <aside className="bg-blue-900 text-white shrink-0 sticky top-0 lg:w-64 lg:h-dvh flex flex-col gap-3 lg:gap-7 px-3 lg:px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2.5 lg:py-7 z-40 shadow-md lg:shadow-none">
        <div className="flex items-center gap-3 px-1 lg:px-2">
          {logoUrl && (
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white rounded-lg lg:rounded-xl flex items-center justify-center p-1 lg:p-1.5 overflow-hidden shrink-0">
              <img src={logoUrl} alt="" className="w-full h-full object-contain" />
            </div>
          )}
          <div className="flex flex-col leading-tight min-w-0">
            <span className="font-display font-extrabold text-[15px] lg:text-base">{nombreApp}</span>
            {subtitulo && <span className="text-xs text-blue-200">{subtitulo}</span>}
          </div>
        </div>

        <nav data-magnifica data-fundir="main" aria-label="Secciones de la app" className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible overscroll-x-contain snap-x lg:snap-none -mx-3 px-3 lg:mx-0 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {opciones.map((o) => {
            const activo = o.id === activa;
            return (
              <button
                key={o.id}
                type="button"
                onClick={(e) => cambiar(o.id, e.currentTarget.querySelector('[data-etiqueta]') as HTMLElement | null)}
                aria-current={activo ? 'page' : undefined}
                className={`nav-mag flex items-center gap-2 lg:gap-3 h-10 lg:h-11 px-3 lg:px-3.5 rounded-lg lg:rounded-xl text-[13px] lg:text-sm whitespace-nowrap shrink-0 snap-start transition-colors cursor-pointer ${
                  activo ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-blue-200 font-medium hover:bg-white/10 hover:text-white'
                }`}
              >
                {o.icon}
                <span data-etiqueta className="lg:min-w-0 lg:truncate" title={o.label}>{o.label}</span>
                {!!o.badge && (
                  <span className={`ml-auto shrink-0 min-w-[22px] h-[22px] px-1.5 rounded-full text-xs font-bold inline-flex items-center justify-center tabular-nums ${activo ? 'bg-white text-blue-800' : 'bg-white/10 text-blue-100'}`}>
                    {o.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {usuario && (
          <div className="hidden lg:flex mt-auto items-center gap-3 p-3 rounded-xl bg-blue-800">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-sm font-bold shrink-0">{iniciales}</div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold truncate">{usuario.nombre}</span>
              {usuario.rol && <span className="text-xs text-blue-200 truncate">{usuario.rol}</span>}
            </div>
            {onSalir && (
              <button type="button" onClick={onSalir} aria-label="Cerrar sesión" title="Cerrar sesión" className="w-9 h-9 rounded-lg flex items-center justify-center text-blue-200 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white/90 backdrop-blur border-b border-slate-200 lg:sticky lg:top-0 z-30">
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-14 lg:h-16 flex items-center justify-between gap-3 lg:gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-1 h-7 rounded-full bg-blue-600 shrink-0" aria-hidden="true"></span>
              <div className="flex flex-col min-w-0">
                {etiqueta && <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-600 leading-none">{etiqueta}</span>}
                <h1 ref={tituloRef} className="text-lg sm:text-xl font-extrabold text-slate-900 truncate leading-tight mt-1">{actual?.label || nombreApp}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {tema === 'vidrio' && (
                <div role="group" aria-label="Tono del vidrio" className="flex h-10 p-1 rounded-lg border border-slate-300 text-xs font-semibold">
                  {(['claro', 'oscuro'] as const).map((tono) => (
                    <button
                      key={tono}
                      type="button"
                      onClick={() => setTonoVidrio(tono)}
                      aria-pressed={tonoVidrio === tono}
                      className={`px-2.5 rounded-md capitalize cursor-pointer transition-colors ${tonoVidrio === tono ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      {tono}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setTema(SIGUIENTE_TEMA[tema])}
                title={`Cambiar a tema ${NOMBRE_TEMA[SIGUIENTE_TEMA[tema]]}`}
                aria-label={`Cambiar a tema ${NOMBRE_TEMA[SIGUIENTE_TEMA[tema]]}`}
                className="h-10 w-10 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                {tema === 'light' ? <Moon className={ICONO} /> : tema === 'dark' ? <Layers className={ICONO} /> : <Sun className={ICONO} />}
              </button>
              {acciones}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
