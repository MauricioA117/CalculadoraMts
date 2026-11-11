import React, { useState } from 'react';
import { CapaMaterial, ParametrosCotizacion, ResultadoCotizacion } from '../types/calculadora';
import { 
  Printer, 
  Copy, 
  Check, 
  Layers, 
  Trash2,
  ArrowRight,
  TrendingDown,
  Sparkles
} from 'lucide-react';

interface ResultsDashboardProps {
  params: ParametrosCotizacion;
  resultado: ResultadoCotizacion;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ params, resultado }) => {
  const [copied, setCopied] = useState<boolean>(false);

  const { produccion, acomodo, desgloseMateriales, merma } = resultado;
  const { metrosLineales, totalPiezas, totalKilos } = produccion;
  const { anchoEmpaque, altoEmpaque, kilosSolicitados, tolerancia, capas } = params;

  // Derived engineering metrics
  const pesoPorPiezaGramos = totalPiezas > 0 ? (totalKilos * 1000) / totalPiezas : 0;
  const piezasPorMetro = metrosLineales > 0 ? totalPiezas / metrosLineales : 0;

  const capaImpresion = capas.find(c => c.esImpresion);
  const detalleImpresion = desgloseMateriales.find(d => {
    const orig = capas.find(c => c.id === d.idMaterial);
    return orig?.esImpresion && !d.esTinta && !d.esAdhesivo;
  });
  const detalleTinta = desgloseMateriales.find(d => d.esTinta);

  const handleCopyTicket = () => {
    const gramajeTintaActual = resultado.tinta.gramaje.toFixed(1);
    const estructuraTexto = desgloseMateriales.map((d, idx) => {
      const orig = capas.find(c => c.id === d.idMaterial);
      const rol = d.esTinta 
        ? `[TINTA DIGITAL ${d.gramajeTotalCapa.toFixed(1)} g/m²]` 
        : d.esAdhesivo
          ? `[ADHESIVO LAMINACIÓN FIJO ${d.gramajeTotalCapa} g/m²]`
          : orig?.esImpresion 
            ? '[SUSTRATO IMPRESIÓN - RIGE ML]' 
            : '[SUSTRATO LAMINACIÓN]';
      const mermaCapa = merma?.desgloseMermaPorCapa.find(m => m.idMaterial === d.idMaterial);
      return `  • ${d.nombre} ${rol} -> Neto: ${d.kilosRequeridos} kg | Bruto: ${(d.kilosBrutos ?? 0).toFixed(2)} kg (${(d.porcentaje * 100).toFixed(2)}%) | Gr: ${d.gramajeTotalCapa} g/m² | Merma: ${mermaCapa?.kgMerma.toFixed(2) || '0.00'} kg`;
    }).join('\n');

    const ticket = `=========================================
🏷️ ORDEN TÉCNICA DE PRODUCCIÓN - EMPAQUE DIGITAL
   HP Indigo 20000 / 25K (Ingeniería de Empaque)
=========================================
📦 ESTRUCTURA: ${produccion.tipoEstructura.toUpperCase()}
   (Tinta ${gramajeTintaActual} g/m² • Adhesivo 2.0 g/m² por unión)

📐 ESPECIFICACIÓN DEL EMPAQUE:
  • Dimensiones: ${anchoEmpaque} cm ancho × ${altoEmpaque} cm alto
  • Kilos Solicitados: ${kilosSolicitados} kg
  • Tolerancia: ${(tolerancia * 100).toFixed(0)}%
  • Total Kilos Netos: ${totalKilos.toLocaleString()} kg

🖨️ ACOMODO EN PRENSA (HP Indigo):
  • Frame Útil: ${acomodo.anchoFrame} cm ancho × ${acomodo.altoFrame} cm desarrollo
  • Pistas (Eje): ${acomodo.repEje}
  • Filas (Desarrollo): ${acomodo.repDesarrollo}
  • Piezas por Frame: ${acomodo.piezasPorFrame} pzas
  • Separación entre Carriles: ${acomodo.separacionCarrilCm} cm
  • Medida de Bobina Impresa: ${acomodo.medidaBobinaImpresa} cm (centrada)
  • Bobina Entrada: ${merma.anchoBobinaNatural} cm

🗑️ REFILE Y MERMA LATERAL:
  • Refile por Lado: ${merma.refilePorLadoCm} cm × 2 orillas
  • Merma Total de Ancho: ${merma.sobranteAnchoCm} cm (${merma.sobranteAnchoPct}%, incluye separaciones)
  • Desperdicio Total en KG: ${merma.kgDesperdicioEstructura} kg
  • Kilos Brutos Bobina ${merma.anchoBobinaNatural}cm: ${merma.kgTotalesBobina76} kg

🚀 SALIDA ESTIMADA:
  • METROS LINEALES: ${metrosLineales.toLocaleString()} ML
  • TOTAL DE PIEZAS: ${totalPiezas.toLocaleString()} pzas
  • Rendimiento: ${piezasPorMetro.toFixed(1)} piezas/metro | ${pesoPorPiezaGramos.toFixed(2)} g/pieza
  • Tinta (${gramajeTintaActual} g/m²): ${detalleTinta?.kilosRequeridos.toFixed(2) || '0'} kg
  • Adhesivo Fijo: ${resultado.adhesivo.kilosRequeridos.toFixed(2)} kg

🧪 MATERIA PRIMA REQUERIDA:
${estructuraTexto}
=========================================
Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`;

    navigator.clipboard.writeText(ticket);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div id="results-dashboard-container" className="space-y-6">
      
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <span className="meta-label text-blue-700">
            Resultados de Producción
          </span>
          <h3 className="font-display text-sm text-slate-900 font-bold">
            Métricas de Ingeniería & Tiraje HP Indigo
          </h3>
        </div>

        <button
          type="button"
          id="copy-ticket-btn"
          onClick={handleCopyTicket}
          className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold transition-colors px-3.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer hover:border-blue-600"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copiado' : 'Copiar orden técnica'}</span>
        </button>
      </div>

      {/* Main KPI Cards Grid (Hero Stats in Variation 2 Syne Typography) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* HERO CARD: METROS LINEALES (ML) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden flex flex-col justify-between bg-blue-600/[0.07]">
          <div>
            <div className="flex items-center justify-between">
              <span className="meta-label text-blue-700">
                Metros Lineales
              </span>
              <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white ">
                Prensa
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
                {metrosLineales.toLocaleString()}
              </h2>
              <span className="font-mono text-sm font-bold text-blue-700 ">
                ML
              </span>
            </div>
          </div>
          <p className="font-mono text-xs text-slate-500 mt-3 pt-2 border-t border-slate-200">
            Sustrato BOPP: <strong className="text-slate-900">{detalleImpresion?.kilosRequeridos || 0} kg</strong>
          </p>
        </div>

        {/* UNIDADES TOTALES */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="meta-label">
                Total Unidades
              </span>
              <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                {acomodo.piezasPorFrame} / Frame
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
                {totalPiezas.toLocaleString()}
              </h2>
              <span className="font-mono text-sm font-bold text-slate-500 ">
                pzas
              </span>
            </div>
          </div>
          <p className="font-mono text-xs text-slate-500 mt-3 pt-2 border-t border-slate-200">
            Acomodo: <strong className="text-slate-900">{acomodo.repEje} pistas</strong> × <strong className="text-slate-900">{acomodo.repDesarrollo} rep</strong>
          </p>
        </div>

        {/* KILOS NETOS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="meta-label">
                Kilos Netos
              </span>
              <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                +{(tolerancia * 100).toFixed(0)}% tol
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
                {totalKilos.toFixed(1)}
              </h2>
              <span className="font-mono text-sm font-bold text-slate-500 ">
                kg
              </span>
            </div>
          </div>
          <p className="font-mono text-xs text-slate-500 mt-3 pt-2 border-t border-slate-200">
            Base solicitada: <strong className="text-slate-900">{kilosSolicitados} kg</strong>
          </p>
        </div>

        {/* MERMA BOBINA */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between border-l-2 border-l-red-500/80 bg-red-50">
          <div>
            <div className="flex items-center justify-between">
              <span className="meta-label text-red-700">
                Merma Refile ({merma.anchoBobinaNatural}cm)
              </span>
              <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-700 border border-red-500/30">
                {merma.sobranteAnchoCm} cm
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-red-700 tracking-tight">
                {merma.kgDesperdicioEstructura.toFixed(2)}
              </h2>
              <span className="font-mono text-sm font-bold text-red-700/60 ">
                kg
              </span>
            </div>
          </div>
          <p className="font-mono text-xs text-red-700/80 mt-3 pt-2 border-t border-red-500/20">
            Bruto Bobina: <strong className="text-slate-900">{merma.kgTotalesBobina76} kg</strong> ({merma.sobranteAnchoPct}% merma)
          </p>
        </div>
      </div>

      {/* Engineering Parameters Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 font-mono text-xs">
        <div>
          <span className="text-xs text-slate-500 font-bold block">Peso por Empaque</span>
          <span className="font-display text-base font-bold text-slate-900">{pesoPorPiezaGramos.toFixed(2)} g</span>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-bold block">Rendimiento Lineal</span>
          <span className="font-display text-base font-bold text-slate-900">{piezasPorMetro.toFixed(1)} pzas/ML</span>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-bold block">Gramaje Estructura</span>
          <span className="font-display text-base font-bold text-slate-900">{(produccion.gramajeTotal ?? 0).toFixed(1)} g/m²</span>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-bold block">Bobina Impresa</span>
          <span className="font-display text-base font-bold text-blue-700">{acomodo.medidaBobinaImpresa} cm</span>
        </div>
      </div>

      {/* DETAILED MATERIAL BREAKDOWN TABLE IN PHYSICAL PRODUCTION ORDER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="meta-label text-blue-700">Secuencia Física del Laminado</span>
            <span className="text-xs text-slate-600">
              Desglose de materia prima en orden de proceso
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            {desgloseMateriales.length} Capas Físicas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <th className="py-2.5 px-4 font-bold">#</th>
                <th className="py-2.5 px-4 font-bold">Capa / Función</th>
                <th className="py-2.5 px-4 font-bold">Tipo</th>
                <th className="py-2.5 px-4 font-bold text-right">Gramaje Total</th>
                <th className="py-2.5 px-4 font-bold text-right">% Estructura</th>
                <th className="py-2.5 px-4 font-bold text-right">Kg Netos</th>
                <th className="py-2.5 px-4 font-bold text-right">Kg Brutos</th>
                <th className="py-2.5 px-4 font-bold text-right">Metros Lineales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {desgloseMateriales.map((item, idx) => {
                const origCapa = params.capas.find(c => c.id === item.idMaterial);
                const isImpresion = origCapa?.esImpresion && !item.esTinta && !item.esAdhesivo;
                const layerML = (item.metrosLineales !== undefined ? item.metrosLineales : metrosLineales);

                return (
                  <tr
                    key={`${item.idMaterial}-${idx}`}
                    className={`hover:bg-slate-50 transition-colors ${
                      isImpresion ? 'bg-blue-600/[0.06]' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-xs text-slate-900">
                          {item.nombre}
                        </span>
                        {isImpresion && (
                          <span className="bg-blue-600 text-white font-mono text-xs font-bold px-1.5 py-0.2 rounded ">
                            Rige ML
                          </span>
                        )}
                        {item.esTinta && (
                          <span className="bg-blue-600/20 text-blue-700 border border-blue-600/40 font-mono text-xs font-bold px-1.5 py-0.2 rounded ">
                            Tinta {item.gramajeTotalCapa.toFixed(1)}g
                          </span>
                        )}
                        {item.esAdhesivo && (
                          <span className="bg-slate-100 text-slate-600 font-mono text-xs font-bold px-1.5 py-0.2 rounded ">
                            Unión
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-xs text-slate-500 ">
                      {isImpresion ? 'Sustrato Impresión' : item.esTinta ? 'Tinta Digital' : item.esAdhesivo ? 'Adhesivo Laminación' : 'Sustrato Laminación'}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {item.gramajeTotalCapa.toFixed(1)} <span className="text-xs text-slate-500 font-normal">g/m²</span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                      {(item.porcentaje * 100).toFixed(2)}%
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {item.kilosRequeridos.toFixed(2)} <span className="text-xs text-slate-500 font-normal">kg</span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">
                      {(item.kilosBrutos ?? 0).toFixed(2)} <span className="text-xs text-slate-500 font-normal">kg</span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {isImpresion ? (
                        <span className="text-blue-700 font-bold">{layerML.toLocaleString()} ML</span>
                      ) : (
                        <span className="text-slate-600">{layerML.toLocaleString()} ML</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50 font-mono font-bold text-xs">
                <td colSpan={3} className="py-3 px-4 text-slate-600">
                  Totales Estructura
                </td>
                <td className="py-3 px-4 text-right text-slate-900">
                  {(produccion.gramajeTotal ?? 0).toFixed(1)} g/m²
                </td>
                <td className="py-3 px-4 text-right text-slate-600">
                  100.00%
                </td>
                <td className="py-3 px-4 text-right text-slate-900">
                  {totalKilos.toFixed(2)} kg
                </td>
                <td className="py-3 px-4 text-right text-blue-700">
                  {merma.kgTotalesBobina76.toFixed(2)} kg
                </td>
                <td className="py-3 px-4 text-right text-blue-700">
                  {metrosLineales.toLocaleString()} ML
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
