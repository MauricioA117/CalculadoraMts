import React from 'react';
import { ESTRUCTURAS_PREDEFINIDAS, EstructuraPredefinida } from '../types/calculadora';
import { ArrowRight, Layers } from 'lucide-react';

interface PackagingPresetsProps {
  onSelectPreset: (preset: EstructuraPredefinida) => void;
}

export const PackagingPresets: React.FC<PackagingPresetsProps> = ({ onSelectPreset }) => {
  return (
    <div id="packaging-presets-container" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-200">
        <div>
          <span className="meta-label text-blue-700">Plantillas rápidas</span>
          <h3 className="font-display text-sm text-slate-900 font-bold">
            Estructuras Comerciales Certificadas
          </h3>
        </div>
        <span className="font-mono text-xs text-slate-500 px-2 py-0.5 border border-slate-200 rounded bg-slate-50">
          {ESTRUCTURAS_PREDEFINIDAS.length} Formatos
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ESTRUCTURAS_PREDEFINIDAS.map((preset) => {
          return (
            <button
              key={preset.id}
              type="button"
              id={`preset-btn-${preset.id}`}
              onClick={() => onSelectPreset(preset)}
              className="text-left p-3.5 rounded bg-slate-50 border border-slate-200 hover:border-blue-600 hover:bg-slate-100 transition-all group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-900 ">
                    {preset.capas.length} {preset.capas.length === 1 ? 'Capa' : 'Capas'}
                  </span>
                  <span className="font-mono text-xs text-slate-600">
                    {preset.anchoSugerido} × {preset.altoSugerido} cm
                  </span>
                </div>
                <h4 className="font-display text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-tight mb-1 ">
                  {preset.nombre}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-sans">
                  {preset.descripcion}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-xs">
                  Base: <strong className="text-slate-900">{preset.kilosSugeridos} kg</strong>
                </span>
                <span className="text-blue-700 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-xs">
                  Cargar <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
