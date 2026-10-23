import React, { useState } from 'react';
import { CapaMaterial, ParametrosCotizacion, ResultadoCotizacion, FRAME_MAX_ANCHO, FRAME_MAX_ALTO } from '../types/calculadora';
import { ChevronDown, ChevronUp, Calculator, ArrowRight } from 'lucide-react';

interface FormulaExplainerProps {
  params: ParametrosCotizacion;
  resultado: ResultadoCotizacion;
}

export const FormulaExplainer: React.FC<FormulaExplainerProps> = ({ params, resultado }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const { anchoEmpaque, altoEmpaque, capas } = params;
  const { acomodo, produccion, desgloseMateriales } = resultado;

  const anchoFrameActivo = acomodo.anchoFrame || FRAME_MAX_ANCHO;
  const altoFrameActivo = acomodo.altoFrame || FRAME_MAX_ALTO;

  const capaImpresion = capas.find(c => c.esImpresion);
  const detalleImpresion = desgloseMateriales.find(d => {
    const orig = capas.find(c => c.id === d.idMaterial);
    return orig?.esImpresion && !d.esTinta;
  });

  const gramajeEstructuraTotal = desgloseMateriales.reduce((acc, d) => acc + d.gramajeTotalCapa, 0);

  return (
    <div id="formula-explainer-card" className="card-dark overflow-hidden">
      <button
        type="button"
        id="toggle-formula-explainer-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-white/10 text-white flex items-center justify-center font-bold">
            <Calculator className="w-3.5 h-3.5 text-accent-ink" />
          </div>
          <div>
            <h4 className="font-display text-sm font-bold text-white flex items-center gap-2">
              Auditoría Matemática y Fórmulas de Ingeniería
              <span className="font-mono text-xs bg-accent text-white px-1.5 py-0.2 rounded font-bold ">
                Paso a Paso
              </span>
            </h4>
            <p className="text-xs text-white/62 mt-0.5">
              Frame ({anchoFrameActivo} × {altoFrameActivo} cm) • Tinta ({resultado.tinta.gramaje.toFixed(1)} g/m²) • Adhesivo fijo (2.0 g/m²/unión)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs text-white/70">
          <span>{isOpen ? 'Ocultar' : 'Ver auditoría'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-accent-ink" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 pt-0 border-t border-white/10 space-y-4 text-xs">
          
          {/* Step 1: Acomodo */}
          <div className="bg-white/[0.02] p-4 rounded border border-white/10 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-accent-ink">
              <span>1. Imposición en Prensa</span>
            </div>
            <p className="text-white/70">
              Ancho útil del Frame: <strong className="text-white">{anchoFrameActivo} cm</strong> | Desarrollo útil: <strong className="text-white">{altoFrameActivo} cm</strong>
            </p>
            <div className="bg-white/5 p-2 rounded text-white/80 space-y-1">
              <div>Rep. Eje (Pistas) = floor(({anchoFrameActivo} + {acomodo.separacionCarrilCm}) / ({anchoEmpaque} + {acomodo.separacionCarrilCm})) = <strong className="text-white">{acomodo.repEje} pistas</strong></div>
              <div>Rep. Desarrollo (Filas) = floor({altoFrameActivo} / {altoEmpaque}) = <strong className="text-white">{acomodo.repDesarrollo} filas</strong></div>
              <div>Piezas / Frame = {acomodo.repEje} × {acomodo.repDesarrollo} = <strong className="text-accent-ink">{acomodo.piezasPorFrame} piezas</strong></div>
              <div>Bobina Impresa = {acomodo.repEje} × {anchoEmpaque} + {Math.max(0, acomodo.repEje - 1)} × {acomodo.separacionCarrilCm} = <strong className="text-white">{acomodo.medidaBobinaImpresa} cm</strong></div>
              <div>Refile por lado = ({resultado.merma.anchoBobinaNatural} − {acomodo.medidaBobinaImpresa}) / 2 = <strong className="text-white">{resultado.merma.refilePorLadoCm} cm</strong></div>
            </div>
          </div>

          {/* Step 2: Gramaje */}
          <div className="bg-white/[0.02] p-4 rounded border border-white/10 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-accent-ink">
              <span>2. Gramaje de la Estructura Multicapa</span>
            </div>
            <div className="bg-white/5 p-2 rounded text-white/80 space-y-1">
              <div>Gramaje Total = Σ(Densidad × Calibre) + Tinta ({resultado.tinta.gramaje.toFixed(1)} g/m²) + Adhesivos ({resultado.adhesivo.gramajeTotal} g/m²)</div>
              <div className="text-white font-bold">= {gramajeEstructuraTotal.toFixed(2)} g/m²</div>
            </div>
          </div>

          {/* Step 3: Metros Lineales */}
          <div className="bg-white/[0.02] p-4 rounded border border-white/10 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-accent-ink">
              <span>3. Metros Lineales (Rige Sustrato de Impresión)</span>
            </div>
            <div className="bg-white/5 p-2 rounded text-white/80 space-y-1">
              <div>ML = (Kg Sustrato Impresión × 1000) / [ Gramaje Sustrato × (Ancho Útil Producto {acomodo.anchoUtilProducto} cm / 100) ]</div>
              <div className="text-accent-ink font-bold">= {produccion.metrosLineales.toLocaleString()} ML</div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
