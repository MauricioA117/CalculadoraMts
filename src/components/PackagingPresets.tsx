import React from 'react';
import { ESTRUCTURAS_PREDEFINIDAS, EstructuraPredefinida } from '../types/calculadora';
import { ArrowRight, Layers } from 'lucide-react';

interface PackagingPresetsProps {
  onSelectPreset: (preset: EstructuraPredefinida) => void;
}

export const PackagingPresets: React.FC<PackagingPresetsProps> = ({ onSelectPreset }) => {
  return (
    <div id="packaging-presets-container" className="card-dark p-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-white/10">
        <div>
          <span className="meta-label text-accent-ink">Plantillas rápidas</span>
          <h3 className="font-display text-sm text-white font-bold">
            Estructuras Comerciales Certificadas
          </h3>
        </div>
        <span className="font-mono text-xs text-white/62 px-2 py-0.5 border border-white/10 rounded bg-white/5">
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
              className="text-left p-3.5 rounded bg-white/[0.03] border border-white/10 hover:border-accent hover:bg-white/[0.06] transition-all group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-white/10 text-white ">
                    {preset.capas.length} {preset.capas.length === 1 ? 'Capa' : 'Capas'}
                  </span>
                  <span className="font-mono text-xs text-white/70">
                    {preset.anchoSugerido} × {preset.altoSugerido} cm
                  </span>
                </div>
                <h4 className="font-display text-xs font-bold text-white group-hover:text-accent-ink transition-colors leading-tight mb-1 ">
                  {preset.nombre}
                </h4>
                <p className="text-xs text-white/62 line-clamp-2 leading-relaxed font-sans">
                  {preset.descripcion}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-white/62 text-xs">
                  Base: <strong className="text-white">{preset.kilosSugeridos} kg</strong>
                </span>
                <span className="text-accent-ink font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-xs">
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
