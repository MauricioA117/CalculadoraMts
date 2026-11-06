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
    <div id="formula-explainer-card" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        type="button"
        id="toggle-formula-explainer-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
            <Calculator className="w-3.5 h-3.5 text-blue-700" />
          </div>
          <div>
            <h4 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
              Auditoría Matemática y Fórmulas de Ingeniería
              <span className="font-mono text-xs bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold ">
                Paso a Paso
              </span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Frame ({anchoFrameActivo} × {altoFrameActivo} cm) • Tinta ({resultado.tinta.gramaje.toFixed(1)} g/m²) • Adhesivo fijo (2.0 g/m²/unión)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600">
          <span>{isOpen ? 'Ocultar' : 'Ver auditoría'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-blue-700" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 pt-0 border-t border-slate-200 space-y-4 text-xs">
          
          {/* Step 1: Acomodo */}
          <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-blue-700">
              <span>1. Imposición en Prensa</span>
            </div>
            <p className="text-slate-600">
              Ancho útil del Frame: <strong className="text-slate-900">{anchoFrameActivo} cm</strong> | Desarrollo útil: <strong className="text-slate-900">{altoFrameActivo} cm</strong>
            </p>
            <div className="bg-slate-50 p-2 rounded text-slate-700 space-y-1">
              <div>Rep. Eje (Pistas) = floor(({anchoFrameActivo} + {acomodo.separacionCarrilCm}) / ({anchoEmpaque} + {acomodo.separacionCarrilCm})) = <strong className="text-slate-900">{acomodo.repEje} pistas</strong></div>
              <div>Rep. Desarrollo (Filas) = floor({altoFrameActivo} / {altoEmpaque}) = <strong className="text-slate-900">{acomodo.repDesarrollo} filas</strong></div>
              <div>Piezas / Frame = {acomodo.repEje} × {acomodo.repDesarrollo} = <strong className="text-blue-700">{acomodo.piezasPorFrame} piezas</strong></div>
              <div>Bobina Impresa = {acomodo.repEje} × {anchoEmpaque} + {Math.max(0, acomodo.repEje - 1)} × {acomodo.separacionCarrilCm} = <strong className="text-slate-900">{acomodo.medidaBobinaImpresa} cm</strong></div>
              <div>Refile por lado = ({resultado.merma.anchoBobinaNatural} − {acomodo.medidaBobinaImpresa}) / 2 = <strong className="text-slate-900">{resultado.merma.refilePorLadoCm} cm</strong></div>
            </div>
          </div>

          {/* Step 2: Gramaje */}
          <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-blue-700">
              <span>2. Gramaje de la Estructura Multicapa</span>
            </div>
            <div className="bg-slate-50 p-2 rounded text-slate-700 space-y-1">
              <div>Gramaje Total = Σ(Densidad × Calibre) + Tinta ({resultado.tinta.gramaje.toFixed(1)} g/m²) + Adhesivos ({resultado.adhesivo.gramajeTotal} g/m²)</div>
              <div className="text-slate-900 font-bold">= {gramajeEstructuraTotal.toFixed(2)} g/m²</div>
            </div>
          </div>

          {/* Step 3: Metros Lineales */}
          <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-blue-700">
              <span>3. Metros Lineales (Rige Sustrato de Impresión)</span>
            </div>
            <div className="bg-slate-50 p-2 rounded text-slate-700 space-y-1">
              <div>ML = (Kg Sustrato Impresión × 1000) / [ Gramaje Sustrato × (Ancho Útil Producto {acomodo.anchoUtilProducto} cm / 100) ]</div>
              <div className="text-blue-700 font-bold">= {produccion.metrosLineales.toLocaleString()} ML</div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
