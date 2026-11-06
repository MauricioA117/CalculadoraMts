import React, { useState } from 'react';
import { 
  FRAME_MAX_ALTO, 
  FRAME_MAX_ANCHO, 
  ANCHO_BOBINA_NATURAL_DEFAULT, 
  ResultadoCotizacion,
  PRESETS_FRAME 
} from '../types/calculadora';
import { Eye, Sliders, RotateCcw, Maximize2, Layers } from 'lucide-react';

interface FrameVisualizerProps {
  anchoEmpaque: number;
  altoEmpaque: number;
  anchoBobinaNatural?: number;
  onAnchoBobinaNaturalChange?: (ancho: number) => void;
  anchoFrame?: number;
  altoFrame?: number;
  onAnchoFrameChange?: (ancho: number) => void;
  onAltoFrameChange?: (alto: number) => void;
  resultado: ResultadoCotizacion;
}

export const FrameVisualizer: React.FC<FrameVisualizerProps> = ({
  anchoEmpaque,
  altoEmpaque,
  anchoBobinaNatural = ANCHO_BOBINA_NATURAL_DEFAULT,
  onAnchoBobinaNaturalChange,
  anchoFrame,
  altoFrame,
  onAnchoFrameChange,
  onAltoFrameChange,
  resultado
}) => {
  const [showGuides, setShowGuides] = useState<boolean>(true);

  const { repEje, repDesarrollo, piezasPorFrame, medidaBobinaImpresa, separacionCarrilCm } = resultado.acomodo;
  const { merma } = resultado;

  const anchoFrameMax = (typeof anchoFrame === 'number' && anchoFrame > 0) 
    ? anchoFrame 
    : (resultado.acomodo.anchoFrame || FRAME_MAX_ANCHO);
  const altoFrameMax = (typeof altoFrame === 'number' && altoFrame > 0) 
    ? altoFrame 
    : (resultado.acomodo.altoFrame || FRAME_MAX_ALTO);
  const bobinaNatural = (typeof anchoBobinaNatural === 'number' && anchoBobinaNatural > 0) 
    ? anchoBobinaNatural 
    : ANCHO_BOBINA_NATURAL_DEFAULT;

  // Efficiency calculations
  const anchoAprovechadoPct = bobinaNatural > 0 ? (medidaBobinaImpresa / bobinaNatural) * 100 : 0;
  const altoAprovechadoCm = repDesarrollo * altoEmpaque;
  const altoAprovechadoPct = altoFrameMax > 0 ? (altoAprovechadoCm / altoFrameMax) * 100 : 0;

  const areaTotalFrame = anchoFrameMax * altoFrameMax;
  const areaUtilPzas = piezasPorFrame * anchoEmpaque * altoEmpaque;
  const areaEficienciaPct = areaTotalFrame > 0 ? (areaUtilPzas / areaTotalFrame) * 100 : 0;

  // Waste calculations: banda centrada, refile repartido en ambas orillas
  const sobranteBobinaNatural = merma.sobranteAnchoCm;
  const refilePorLado = merma.refilePorLadoCm;

  // SVG dimensions for responsive canvas based on raw roll width & frame height
  const svgWidth = 340;
  const svgHeight = Math.max(200, Math.min(440, (svgWidth * altoFrameMax) / Math.max(10, bobinaNatural)));

  const scaleX = svgWidth / Math.max(1, bobinaNatural);
  const scaleY = svgHeight / Math.max(1, altoFrameMax);

  // Posiciones X centradas sobre la bobina
  const bandaX = 20 + refilePorLado * scaleX;
  const frameX = 20 + Math.max(0, (bobinaNatural - anchoFrameMax) / 2) * scaleX;
  const refileW = refilePorLado * scaleX;

  return (
    <div id="frame-visualizer-container" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <span className="meta-label text-blue-700">
            Imposición y Merma de Bobina
          </span>
          <h3 className="font-display text-sm text-slate-900 font-bold flex items-center gap-2">
            Frame de Impresión ({anchoFrameMax.toFixed(1)} × {altoFrameMax.toFixed(1)} cm)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">
            Bobina Base: <strong className="text-slate-900">{bobinaNatural} cm</strong> | Ancho Impreso: <strong className="text-blue-700">{medidaBobinaImpresa} cm</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick reset to standard 74.5 x 112.5 cm */}
          {(onAnchoFrameChange || onAltoFrameChange) && (
            <button
              type="button"
              onClick={() => {
                onAnchoFrameChange?.(FRAME_MAX_ANCHO);
                onAltoFrameChange?.(FRAME_MAX_ALTO);
              }}
              className="p-1.5 rounded bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs flex items-center gap-1 cursor-pointer"
              title={`Restablecer Frame a HP Indigo 20000/25K (${FRAME_MAX_ANCHO} × ${FRAME_MAX_ALTO} cm)`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-xs hidden sm:inline">HP Indigo Std</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowGuides(!showGuides)}
            className="p-1.5 rounded bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs flex items-center gap-1 cursor-pointer"
            title="Alternar guías de coordenadas"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="text-xs">{showGuides ? 'Guías activadas' : 'Guías desactivadas'}</span>
          </button>
        </div>
      </div>

      {/* Frame Dimensions Control Bar */}
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-blue-700" />
            <span className="text-xs font-bold text-slate-900 ">
              Ajuste de Dimensiones del Frame
            </span>
          </div>

          {/* Quick Presets for Frame */}
          {(onAnchoFrameChange && onAltoFrameChange) && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500 mr-1">Presets Prensa:</span>
              {PRESETS_FRAME.map(preset => {
                const isSelected = Math.abs(anchoFrameMax - preset.ancho) < 0.05 && Math.abs(altoFrameMax - preset.alto) < 0.05;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onAnchoFrameChange(preset.ancho);
                      onAltoFrameChange(preset.alto);
                    }}
                    className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                    }`}
                    title={preset.descripcion}
                  >
                    {preset.nombre}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Inputs Grid: Ancho Frame, Alto Frame, Bobina Base */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          {/* Ancho Útil del Frame */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded px-3 py-2">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Ancho Útil Frame</span>
              <span className="text-xs text-slate-500">Eje de bobina</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                id="input-frame-ancho"
                step="0.1"
                min="5"
                max="200"
                value={anchoFrameMax ?? ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onAnchoFrameChange?.(isNaN(val) ? 1 : Math.max(1, val));
                }}
                className="w-16 bg-slate-100 border border-slate-300 rounded px-1.5 py-1 text-center font-mono font-bold text-slate-900 text-xs focus:outline-none focus:border-blue-600"
              />
              <span className="text-xs text-blue-700 font-mono font-bold">cm</span>
            </div>
          </div>

          {/* Alto / Desarrollo del Frame */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded px-3 py-2">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Desarrollo / Alto</span>
              <span className="text-xs text-slate-500">Avance de cilindro</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                id="input-frame-alto"
                step="0.1"
                min="5"
                max="300"
                value={altoFrameMax ?? ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onAltoFrameChange?.(isNaN(val) ? 1 : Math.max(1, val));
                }}
                className="w-16 bg-slate-100 border border-slate-300 rounded px-1.5 py-1 text-center font-mono font-bold text-slate-900 text-xs focus:outline-none focus:border-blue-600"
              />
              <span className="text-xs text-blue-700 font-mono font-bold">cm</span>
            </div>
          </div>

          {/* Bobina Base Natural */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded px-3 py-2">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Bobina Base Entrada</span>
              <span className="text-xs text-slate-500">Rollo virgen</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                id="input-bobina-natural"
                step="0.5"
                min={medidaBobinaImpresa || 10}
                max={250}
                value={bobinaNatural ?? ''}
                onChange={(e) => onAnchoBobinaNaturalChange?.(parseFloat(e.target.value) || ANCHO_BOBINA_NATURAL_DEFAULT)}
                className="w-16 bg-slate-100 border border-slate-300 rounded px-1.5 py-1 text-center font-mono font-bold text-slate-900 text-xs focus:outline-none focus:border-blue-600"
              />
              <span className="text-xs text-slate-500 font-bold">cm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visualizer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left SVG Interactive Canvas (Dark technical frame) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 rounded bg-slate-50 border border-slate-200 relative">
          <div className="w-full flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Bobina de entrada: {bobinaNatural} cm</span>
            <span>Frame Indigo: {altoFrameMax.toFixed(1)} cm</span>
          </div>

          <div className="relative w-full flex justify-center py-2 overflow-hidden">
            <svg
              width="100%"
              height="380"
              viewBox={`0 0 ${svgWidth + 40} ${svgHeight + 30}`}
              className="max-h-[420px] select-none"
            >
              <defs>
                <pattern id="diagonalHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="8" stroke="var(--c-bad-500)" strokeWidth="1.5" strokeOpacity="0.4" />
                </pattern>
                <pattern id="gridPattern" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="color-mix(in srgb, var(--c-ink) 5%, transparent)" strokeWidth="0.5" />
                </pattern>
              </defs>

              {/* Background roll surface */}
              <rect
                x="20"
                y="15"
                width={svgWidth}
                height={svgHeight}
                fill="var(--c-surface)"
                stroke="color-mix(in srgb, var(--c-ink) 15%, transparent)"
                strokeWidth="1"
              />
              <rect
                x="20"
                y="15"
                width={svgWidth}
                height={svgHeight}
                fill="url(#gridPattern)"
              />

              {/* Max printable printable window boundary */}
              <rect
                x={frameX}
                y="15"
                width={anchoFrameMax * scaleX}
                height={altoFrameMax * scaleY}
                fill="none"
                stroke="color-mix(in srgb, var(--c-accent) 40%, transparent)"
                strokeWidth="1"
                strokeDasharray="4 2"
              />

              {/* Active Printed Area */}
              <rect
                x={bandaX}
                y="15"
                width={medidaBobinaImpresa * scaleX}
                height={altoAprovechadoCm * scaleY}
                fill="color-mix(in srgb, var(--c-accent) 15%, transparent)"
                stroke="var(--c-accent-ink)"
                strokeWidth="1.5"
              />

              {/* Repetitions grid rendering */}
              {Array.from({ length: repEje }).map((_, i) =>
                Array.from({ length: repDesarrollo }).map((_, j) => {
                  const pX = bandaX + i * ((anchoEmpaque + separacionCarrilCm) * scaleX);
                  const pY = 15 + j * (altoEmpaque * scaleY);
                  const pW = anchoEmpaque * scaleX;
                  const pH = altoEmpaque * scaleY;

                  return (
                    <g key={`pza-${i}-${j}`}>
                      <rect
                        x={pX}
                        y={pY}
                        width={pW}
                        height={pH}
                        fill="color-mix(in srgb, var(--c-ink) 3%, transparent)"
                        stroke="var(--c-accent-ink)"
                        strokeWidth="0.75"
                        strokeOpacity="0.8"
                      />
                      {showGuides && (
                        <text
                          x={pX + pW / 2}
                          y={pY + pH / 2 + 3}
                          fill="color-mix(in srgb, var(--c-ink) 50%, transparent)"
                          fontSize="8"
                          fontFamily="JetBrains Mono, monospace"
                          textAnchor="middle"
                        >
                          {i + 1},{j + 1}
                        </text>
                      )}
                    </g>
                  );
                })
              )}

              {/* Lateral Raw Roll Slit Waste Area */}
              {refilePorLado > 0 && [20, bandaX + medidaBobinaImpresa * scaleX].map((x, k) => (
                <g key={`refile-${k}`}>
                  <rect
                    x={x}
                    y="15"
                    width={refileW}
                    height={svgHeight}
                    fill="url(#diagonalHatch)"
                    stroke="var(--c-bad-500)"
                    strokeWidth="1"
                    strokeDasharray="3 2"
                  />
                  <text
                    x={x + refileW / 2 + 3}
                    y={svgHeight / 2 + 15}
                    fill="var(--c-bad-500)"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                    transform={`rotate(-90 ${x + refileW / 2 + 3} ${svgHeight / 2 + 15})`}
                  >
                    REFILE: {refilePorLado} CM
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="w-full flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600"></span>
              <span>{repEje} Pistas × {repDesarrollo} Filas</span>
            </span>
            <span className="flex items-center gap-1.5 text-red-700">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500/40 border border-red-500"></span>
              <span>Refile: {refilePorLado} cm × 2 lados ({merma.sobranteAnchoPct}% merma)</span>
            </span>
          </div>
        </div>

        {/* Right Stats & Efficiency Metrics (Variation 2 dark card list) */}
        <div className="lg:col-span-6 space-y-3 font-mono">
          
          {/* Imposition Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="meta-label text-blue-700">Acomodo en Prensa</span>
              <span className="font-display text-sm font-bold text-slate-900">
                {piezasPorFrame} Piezas / Frame
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 block">Repeticiones en Eje</span>
                <span className="font-display text-lg font-bold text-slate-900">{repEje} pistas</span>
                <span className="text-xs text-slate-500 block">({medidaBobinaImpresa} cm ancho, sep. {separacionCarrilCm} cm)</span>
              </div>

              <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 block">Repeticiones Desarrollo</span>
                <span className="font-display text-lg font-bold text-slate-900">{repDesarrollo} filas</span>
                <span className="text-xs text-slate-500 block">({altoAprovechadoCm.toFixed(1)} cm alto)</span>
              </div>
            </div>
          </div>

          {/* Efficiency Meters */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
            <span className="meta-label">Aprovechamiento Técnico del Ancho</span>
            
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-slate-700 mb-1">
                  <span>Ancho Útil ({medidaBobinaImpresa} cm / {bobinaNatural} cm):</span>
                  <strong className="text-blue-700">{anchoAprovechadoPct.toFixed(1)}%</strong>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
                  <div className="bg-blue-600 h-full" style={{ width: `${Math.min(100, anchoAprovechadoPct)}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-700 mb-1">
                  <span>Desarrollo Útil ({altoAprovechadoCm.toFixed(1)} cm / {altoFrameMax} cm):</span>
                  <strong className="text-slate-900">{altoAprovechadoPct.toFixed(1)}%</strong>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
                  <div className="bg-slate-400 h-full" style={{ width: `${Math.min(100, altoAprovechadoPct)}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Waste Breakdown Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 border-l-2 border-l-red-500 bg-red-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="meta-label text-red-700">Merma de Refile Lateral</span>
              <span className="font-mono text-xs font-bold text-red-700">
                {merma.sobranteAnchoPct}% Desperdicio
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-xs text-red-700/60 block">Área Desperdiciada</span>
                <span className="font-display text-base font-bold text-red-700">{merma.areaDesperdicioM2.toLocaleString()} m²</span>
              </div>
              <div>
                <span className="text-xs text-red-700/60 block">Kilos de Merma</span>
                <span className="font-display text-base font-bold text-red-700">{merma.kgDesperdicioEstructura.toFixed(2)} kg</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
