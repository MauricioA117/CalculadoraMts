import React from 'react';
import { ResultadoBobinaIndividual } from '../types/calculadora';
import { Calculator, Ruler, Weight, Layers } from 'lucide-react';

interface SingleRollResultProps {
  resultado: ResultadoBobinaIndividual;
  anchoBobina: number;
  kilos: number;
}

export const SingleRollResult: React.FC<SingleRollResultProps> = ({
  resultado,
  anchoBobina,
  kilos
}) => {
  const { metrosLineales, gramajeTotal } = resultado;

  return (
    <div
      id="single-roll-result-card"
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <span className="meta-label text-blue-700">Salida de Bobina Individual</span>
          <h3 className="font-display text-base font-bold text-slate-900">
            Metros Lineales Resultantes
          </h3>
          <span className="text-xs text-slate-500">
            Cálculo directo por ancho físico sin tolerancia (+0%)
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs bg-slate-50 px-3 py-1.5 border border-slate-200 rounded">
          <span className="text-slate-500">Tolerancia:</span>
          <span className="font-bold text-slate-900">0% (kilos exactos)</span>
        </div>
      </div>

      {/* Main Hero Result */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden bg-blue-600/[0.07]">
        <div className="absolute top-3 right-4 font-mono text-xs text-slate-500 ">
          Conversión directa
        </div>
        
        <span className="meta-label text-blue-700">
          Metros Lineales Requeridos
        </span>
        
        <div className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 flex items-baseline gap-2">
          <span>{metrosLineales.toLocaleString()}</span>
          <span className="text-2xl sm:text-3xl text-blue-700 font-mono">ML</span>
        </div>

        <p className="text-xs text-slate-600 max-w-md pt-1">
          {kilos} kg de material con ancho de {anchoBobina} cm equivalen exactamente a {metrosLineales.toLocaleString()} metros lineales continuos.
        </p>
      </div>

      {/* Quick Spec Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1">
            <Ruler className="w-3.5 h-3.5 text-blue-700" />
            <span>Ancho de Bobina</span>
          </div>
          <span className="font-display text-xl font-bold text-slate-900">{anchoBobina} cm</span>
          <span className="block text-xs text-slate-500">({(anchoBobina / 100).toFixed(3)} m)</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1">
            <Weight className="w-3.5 h-3.5 text-blue-700" />
            <span>Kilos de Bobina</span>
          </div>
          <span className="font-display text-xl font-bold text-blue-700">{kilos} kg</span>
          <span className="block text-xs text-slate-500">Sin margen adicional</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1">
            <Layers className="w-3.5 h-3.5 text-blue-700" />
            <span>Gramaje Estructura</span>
          </div>
          <span className="font-display text-xl font-bold text-slate-900">{gramajeTotal.toFixed(2)} g/m²</span>
          <span className="block text-xs text-slate-500">
            {resultado.tipoEstructura} • Tinta: {resultado.tinta.gramaje.toFixed(1)} g/m² {resultado.adhesivo.numeroUniones > 0 ? `• Adhesivo: ${resultado.adhesivo.gramajeTotal.toFixed(1)} g/m²` : '• Sin adhesivo'}
          </span>
        </div>
      </div>

      {/* Formula & Breakdown Note */}
      <div className="p-4 rounded bg-slate-50 border border-slate-200 font-mono text-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Fórmula Matemática Aplicada:</span>
          <span className="text-blue-700">ML = (Kg × 1000) / [ Gramaje (g/m²) × (Ancho cm / 100) ]</span>
        </div>
        <div className="text-xs text-slate-600">
          = ({kilos} × 1000) / [ {gramajeTotal.toFixed(2)} × {(anchoBobina / 100).toFixed(3)} ] = <strong className="text-slate-900 font-bold">{metrosLineales.toLocaleString()} ML</strong>
        </div>
      </div>
    </div>
  );
};
