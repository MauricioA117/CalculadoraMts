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
      return `  • ${d.nombre} ${rol} -> ${d.kilosRequeridos} kg (${(d.porcentaje * 100).toFixed(2)}%) | Gr: ${d.gramajeTotalCapa} g/m² | Merma: ${mermaCapa?.kgMerma.toFixed(2) || '0.00'} kg`;
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
  • Frame Útil: ${acomodo.anchoFrame || 74.6} cm ancho × ${acomodo.altoFrame || 112.0} cm desarrollo
  • Pistas (Eje): ${acomodo.repEje}
  • Filas (Desarrollo): ${acomodo.repDesarrollo}
  • Piezas por Frame: ${acomodo.piezasPorFrame} pzas
  • Medida de Bobina Impresa: ${acomodo.medidaBobinaImpresa} cm
  • Bobina Entrada: ${merma.anchoBobinaNatural} cm

🗑️ REFILE Y MERMA LATERAL:
  • Refile Lateral: ${merma.sobranteAnchoCm} cm (${merma.sobranteAnchoPct}%)
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
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-white/10">
        <div>
          <span className="meta-label text-accent-ink">
            Resultados de Producción
          </span>
          <h3 className="font-display text-sm text-white font-bold">
            Métricas de Ingeniería & Tiraje HP Indigo
          </h3>
        </div>

        <button
          type="button"
          id="copy-ticket-btn"
          onClick={handleCopyTicket}
          className="btn-dark-secondary px-3.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer hover:border-accent"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copiado' : 'Copiar orden técnica'}</span>
        </button>
      </div>

      {/* Main KPI Cards Grid (Hero Stats in Variation 2 Syne Typography) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* HERO CARD: METROS LINEALES (ML) */}
        <div className="card-dark p-5 relative overflow-hidden flex flex-col justify-between bg-accent/[0.07]">
          <div>
            <div className="flex items-center justify-between">
              <span className="meta-label text-accent-ink">
                Metros Lineales
              </span>
              <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-accent text-white ">
                Prensa
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white">
                {metrosLineales.toLocaleString()}
              </h2>
              <span className="font-mono text-sm font-bold text-accent-ink ">
                ML
              </span>
            </div>
          </div>
          <p className="font-mono text-xs text-white/62 mt-3 pt-2 border-t border-white/10">
            Sustrato BOPP: <strong className="text-white">{detalleImpresion?.kilosRequeridos || 0} kg</strong>
          </p>
        </div>

        {/* UNIDADES TOTALES */}
        <div className="card-dark p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="meta-label">
                Total Unidades
              </span>
              <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/80">
                {acomodo.piezasPorFrame} / Frame
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
                {totalPiezas.toLocaleString()}
              </h2>
              <span className="font-mono text-sm font-bold text-white/55 ">
                pzas
              </span>
            </div>
          </div>
          <p className="font-mono text-xs text-white/62 mt-3 pt-2 border-t border-white/10">
            Acomodo: <strong className="text-white">{acomodo.repEje} pistas</strong> × <strong className="text-white">{acomodo.repDesarrollo} rep</strong>
          </p>
        </div>

        {/* KILOS NETOS */}
        <div className="card-dark p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="meta-label">
                Kilos Netos
              </span>
              <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/80">
                +{(tolerancia * 100).toFixed(0)}% tol
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
                {totalKilos.toFixed(1)}
              </h2>
              <span className="font-mono text-sm font-bold text-white/55 ">
                kg
              </span>
            </div>
          </div>
          <p className="font-mono text-xs text-white/62 mt-3 pt-2 border-t border-white/10">
            Base solicitada: <strong className="text-white">{kilosSolicitados} kg</strong>
          </p>
        </div>

        {/* MERMA BOBINA */}
        <div className="card-dark p-5 flex flex-col justify-between border-l-2 border-l-red-500/80 bg-red-950/10">
          <div>
            <div className="flex items-center justify-between">
              <span className="meta-label text-red-400">
                Merma Refile ({merma.anchoBobinaNatural}cm)
              </span>
              <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                {merma.sobranteAnchoCm} cm
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-red-400 tracking-tight">
                {merma.kgDesperdicioEstructura.toFixed(2)}
              </h2>
              <span className="font-mono text-sm font-bold text-red-400/60 ">
                kg
              </span>
            </div>
          </div>
          <p className="font-mono text-xs text-red-400/80 mt-3 pt-2 border-t border-red-500/20">
            Bruto Bobina: <strong className="text-white">{merma.kgTotalesBobina76} kg</strong> ({merma.sobranteAnchoPct}% merma)
          </p>
        </div>
      </div>

      {/* Engineering Parameters Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 card-dark p-3.5 font-mono text-xs">
        <div>
          <span className="text-xs text-white/55 font-bold block">Peso por Empaque</span>
          <span className="font-display text-base font-bold text-white">{pesoPorPiezaGramos.toFixed(2)} g</span>
        </div>
        <div>
          <span className="text-xs text-white/55 font-bold block">Rendimiento Lineal</span>
          <span className="font-display text-base font-bold text-white">{piezasPorMetro.toFixed(1)} pzas/ML</span>
        </div>
        <div>
          <span className="text-xs text-white/55 font-bold block">Gramaje Estructura</span>
          <span className="font-display text-base font-bold text-white">{(produccion.gramajeTotal ?? 0).toFixed(1)} g/m²</span>
        </div>
        <div>
          <span className="text-xs text-white/55 font-bold block">Bobina Impresa</span>
          <span className="font-display text-base font-bold text-accent-ink">{acomodo.medidaBobinaImpresa} cm</span>
        </div>
      </div>

      {/* DETAILED MATERIAL BREAKDOWN TABLE IN PHYSICAL PRODUCTION ORDER */}
      <div className="card-dark overflow-hidden">
        <div className="px-5 py-3 bg-white/[0.03] border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="meta-label text-accent-ink">Secuencia Física del Laminado</span>
            <span className="text-xs text-white/70">
              Desglose de materia prima en orden de proceso
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-white/80 bg-white/10 px-2 py-0.5 rounded">
            {desgloseMateriales.length} Capas Físicas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-xs text-white/55">
                <th className="py-2.5 px-4 font-bold">#</th>
                <th className="py-2.5 px-4 font-bold">Capa / Función</th>
                <th className="py-2.5 px-4 font-bold">Tipo</th>
                <th className="py-2.5 px-4 font-bold text-right">Gramaje Total</th>
                <th className="py-2.5 px-4 font-bold text-right">% Estructura</th>
                <th className="py-2.5 px-4 font-bold text-right">Kilos Requeridos</th>
                <th className="py-2.5 px-4 font-bold text-right">Metros Lineales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {desgloseMateriales.map((item, idx) => {
                const origCapa = params.capas.find(c => c.id === item.idMaterial);
                const isImpresion = origCapa?.esImpresion && !item.esTinta && !item.esAdhesivo;
                const layerML = (item.metrosLineales !== undefined ? item.metrosLineales : metrosLineales);

                return (
                  <tr
                    key={`${item.idMaterial}-${idx}`}
                    className={`hover:bg-white/[0.03] transition-colors ${
                      isImpresion ? 'bg-accent/[0.06]' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-white/70">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-xs text-white">
                          {item.nombre}
                        </span>
                        {isImpresion && (
                          <span className="bg-accent text-white font-mono text-xs font-bold px-1.5 py-0.2 rounded ">
                            Rige ML
                          </span>
                        )}
                        {item.esTinta && (
                          <span className="bg-accent/20 text-accent-ink border border-accent/40 font-mono text-xs font-bold px-1.5 py-0.2 rounded ">
                            Tinta {item.gramajeTotalCapa.toFixed(1)}g
                          </span>
                        )}
                        {item.esAdhesivo && (
                          <span className="bg-white/10 text-white/70 font-mono text-xs font-bold px-1.5 py-0.2 rounded ">
                            Unión
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-xs text-white/62 ">
                      {isImpresion ? 'Sustrato Impresión' : item.esTinta ? 'Tinta Digital' : item.esAdhesivo ? 'Adhesivo Laminación' : 'Sustrato Laminación'}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {item.gramajeTotalCapa.toFixed(1)} <span className="text-xs text-white/55 font-normal">g/m²</span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-white/80">
                      {(item.porcentaje * 100).toFixed(2)}%
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {item.kilosRequeridos.toFixed(2)} <span className="text-xs text-white/55 font-normal">kg</span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {isImpresion ? (
                        <span className="text-accent-ink font-bold">{layerML.toLocaleString()} ML</span>
                      ) : (
                        <span className="text-white/70">{layerML.toLocaleString()} ML</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/10 bg-white/[0.02] font-mono font-bold text-xs">
                <td colSpan={3} className="py-3 px-4 text-white/70">
                  Totales Estructura
                </td>
                <td className="py-3 px-4 text-right text-white">
                  {(produccion.gramajeTotal ?? 0).toFixed(1)} g/m²
                </td>
                <td className="py-3 px-4 text-right text-white/70">
                  100.00%
                </td>
                <td className="py-3 px-4 text-right text-white">
                  {totalKilos.toFixed(2)} kg
                </td>
                <td className="py-3 px-4 text-right text-accent-ink">
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
