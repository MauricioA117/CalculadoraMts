import React from 'react';
import { MousePointerClick, Droplets } from 'lucide-react';
import { JUEGOS_TINTAS, JuegoTintas, ResultadoClicks } from '../types/calculadora';

interface ClicksCalculatorProps {
  juego: JuegoTintas;
  onJuegoChange: (juego: JuegoTintas) => void;
  llevaBlanco: boolean;
  onLlevaBlancoChange: (lleva: boolean) => void;
  clicks: ResultadoClicks;
  piezasPorFrame: number;
  totalPiezas: number;
}

const fmt = (n: number) => n.toLocaleString('es-MX');

const PESTANA_ACTIVA = 'px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white shadow-xs';
const PESTANA_INACTIVA = 'px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100';

export const ClicksCalculator: React.FC<ClicksCalculatorProps> = ({
  juego,
  onJuegoChange,
  llevaBlanco,
  onLlevaBlancoChange,
  clicks,
  piezasPorFrame,
  totalPiezas,
}) => {
  const { framesAOcupar, tintas, numeroTintas, clicksTotales } = clicks;

  return (
    <section id="clicks-calculator-container" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <span className="meta-label text-blue-700">Consumo de prensa</span>
          <h3 className="font-display text-sm text-slate-900 font-bold flex items-center gap-1.5">
            <MousePointerClick className="w-4 h-4 text-blue-600" />
            Frames y clicks HP Indigo
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Cada frame es 1 click por cada tinta que lleva el trabajo.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Configuración de tintas */}
        <div className="space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-600">Juego de tintas</span>
            <div data-magnifica role="group" aria-label="Juego de tintas" className="flex flex-wrap items-center gap-1.5">
              {JUEGOS_TINTAS.map((j) => (
                <button
                  key={j}
                  type="button"
                  aria-pressed={juego === j}
                  onClick={() => onJuegoChange(j)}
                  className={`font-mono cursor-pointer transition-colors ${juego === j ? PESTANA_ACTIVA : PESTANA_INACTIVA}`}
                >
                  {j}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-600">Blanco (W)</span>
            <div role="group" aria-label="Lleva blanco" className="flex items-center gap-1.5">
              {[
                { valor: false, label: 'No lleva' },
                { valor: true, label: 'Lleva blanco' },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  aria-pressed={llevaBlanco === o.valor}
                  onClick={() => onLlevaBlancoChange(o.valor)}
                  className={`cursor-pointer transition-colors ${llevaBlanco === o.valor ? PESTANA_ACTIVA : PESTANA_INACTIVA}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5" /> Tintas en el trabajo ({numeroTintas})
            </span>
            <ul className="flex flex-wrap gap-1.5">
              {tintas.map((t) => (
                <li key={t.letra} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                  <span
                    data-sin-invertir
                    className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0"
                    style={{ background: t.color }}
                    aria-hidden="true"
                  />
                  <span className="font-mono font-bold text-slate-900">{t.letra}</span>
                  <span className="text-slate-500">{t.nombre}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Resultados */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-xs font-semibold text-slate-600">Frames a ocupar</span>
              <div className="font-display text-2xl font-extrabold text-slate-900 tabular-nums">{fmt(framesAOcupar)}</div>
              <span className="text-xs text-slate-500">{fmt(piezasPorFrame)} pzas/frame</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-xs font-semibold text-slate-600">Clicks por frame</span>
              <div className="font-display text-2xl font-extrabold text-slate-900 tabular-nums">{numeroTintas}</div>
              <span className="text-xs text-slate-500">1 por tinta</span>
            </div>
            <div className="rounded-xl border border-blue-600/40 bg-blue-50 px-4 py-3">
              <span className="text-xs font-semibold text-blue-700">Clicks totales</span>
              <div className="font-display text-2xl font-extrabold text-blue-700 tabular-nums">{fmt(clicksTotales)}</div>
              <span className="text-xs text-slate-500">{juego}{llevaBlanco ? ' + W' : ''}</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs text-slate-700 space-y-1">
            <div>
              Frames = ⌈ {fmt(totalPiezas)} pzas ÷ {fmt(piezasPorFrame)} pzas/frame ⌉ = <strong className="text-slate-900">{fmt(framesAOcupar)}</strong>
            </div>
            <div>
              Clicks = {fmt(framesAOcupar)} frames × {numeroTintas} tintas = <strong className="text-blue-700">{fmt(clicksTotales)}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
