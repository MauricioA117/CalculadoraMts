import React, { useState, useMemo } from 'react';
import { 
  CapaSinImpresion, 
  ParametrosCalculadoraKgSinImpresion, 
  ResultadoCalculadoraKgSinImpresion, 
  calcularKgSinImpresion,
  PRESETS_SIN_IMPRESION,
  PresetSinImpresion,
  MaterialCatalogo,
  CapaMaterial
} from '../types/calculadora';
import { buscarMaterial, validarEstructura } from '../data/catalogo';
import { SelectorMaterial, AvisoValidacion } from './SelectorMaterial';
import { 
  Calculator, 
  Layers, 
  Ruler, 
  Weight, 
  Scissors, 
  Copy, 
  Check, 
  AlertTriangle, 
  Info, 
  Plus, 
  Trash2, 
  ArrowRight,
  TrendingDown,
  Percent,
  Sparkles,
  RefreshCw,
  FileText,
  Boxes,
  RotateCcw
} from 'lucide-react';

interface KgSinImpresionCalculatorProps {
  capasPrensaHp?: CapaMaterial[];
}

export const KgSinImpresionCalculator: React.FC<KgSinImpresionCalculatorProps> = ({ capasPrensaHp }) => {
  // 1. Target inputs
  const [kilosTotales, setKilosTotales] = useState<number>(200);
  const [modoKilos, setModoKilos] = useState<'kilos_utiles_objetivo' | 'kilos_totales_brutos'>('kilos_utiles_objetivo');
  const [mermaProcesoPct, setMermaProcesoPct] = useState<number>(0); // % adicional de proceso / ajuste
  const [anchoProducto, setAnchoProducto] = useState<number>(18.0); // cm
  const [anchoSustrato, setAnchoSustrato] = useState<number>(76.0); // 76 cm default
  const [separacionPistasMm, setSeparacionPistasMm] = useState<number>(0); // mm
  const [largoProducto, setLargoProducto] = useState<number>(0); // cm opcional

  // 2. Material Structure (Sin Impresión)
  const [capas, setCapas] = useState<CapaSinImpresion[]>([
    {
      id: 'capa-1',
      nombre: 'BOPP MATE',
      densidad: 0.91,
      micras: 20
    },
    {
      id: 'capa-2',
      nombre: 'BOPP MET',
      densidad: 0.91,
      micras: 20
    }
  ]);

  const [incluirAdhesivo, setIncluirAdhesivo] = useState<boolean>(true);
  const [gramajeAdhesivoPorUnion, setGramajeAdhesivoPorUnion] = useState<number>(2.0); // g/m²
  const [presetSeleccionadoId, setPresetSeleccionadoId] = useState<string>('bopp_mate_bopp_met');
  const [copied, setCopied] = useState<boolean>(false);

  // Quick Preset Handler
  const handleSelectPreset = (preset: PresetSinImpresion) => {
    setPresetSeleccionadoId(preset.id);
    setAnchoProducto(preset.anchoProductoDefault);
    setCapas(
      preset.capas.map((c, idx) => ({
        id: `capa-preset-${idx + 1}-${Date.now()}`,
        nombre: c.nombre,
        densidad: c.densidad,
        micras: c.micras
      }))
    );
  };

  // Import from HP Indigo Layer structure (without inks)
  const handleImportarCapasPrensa = () => {
    if (!capasPrensaHp || capasPrensaHp.length === 0) return;
    setPresetSeleccionadoId('hp_imported');
    setCapas(
      capasPrensaHp.map((c, idx) => ({
        id: `capa-hp-${idx + 1}-${Date.now()}`,
        nombre: c.nombre,
        densidad: c.densidad,
        micras: c.micras
      }))
    );
  };

  // Layer CRUD
  const handleAddLayer = () => {
    setPresetSeleccionadoId('custom');
    const base = buscarMaterial('BOPP NAT')!;
    const newLayer: CapaSinImpresion = {
      id: `capa-add-${Date.now()}`,
      nombre: base.codigo,
      densidad: base.densidad,
      micras: base.calibres[0]
    };
    // La capa sellante (CE, MCE, CPP) siempre va al final.
    const ultima = capas[capas.length - 1];
    if (ultima && buscarMaterial(ultima.nombre)?.soloCapaFinal) {
      setCapas([...capas.slice(0, -1), newLayer, ultima]);
    } else {
      setCapas([...capas, newLayer]);
    }
  };

  const handleRemoveLayer = (id: string) => {
    if (capas.length <= 1) return;
    setPresetSeleccionadoId('custom');
    setCapas(capas.filter(c => c.id !== id));
  };

  const handleUpdateLayer = (id: string, updates: Partial<CapaSinImpresion>) => {
    setPresetSeleccionadoId('custom');
    setCapas(capas.map(c => c.id === id ? { ...c, ...updates } : c));
  };


  // Computation
  const resultado: ResultadoCalculadoraKgSinImpresion = useMemo(() => {
    const params: ParametrosCalculadoraKgSinImpresion = {
      kilosTotales: Math.max(0, kilosTotales || 0),
      anchoProductoCm: Math.max(0.01, anchoProducto || 0.01),
      anchoSustratoCm: Math.max(0.1, anchoSustrato || 76),
      separacionPistasCm: Math.max(0, (separacionPistasMm || 0) / 10), // mm to cm
      largoProductoCm: largoProducto > 0 ? largoProducto : undefined,
      capas,
      incluirAdhesivo,
      gramajeAdhesivoPorUnion,
      modoKilos,
      mermaProcesoPct
    };
    return calcularKgSinImpresion(params);
  }, [
    kilosTotales, 
    anchoProducto, 
    anchoSustrato, 
    separacionPistasMm, 
    largoProducto, 
    capas, 
    incluirAdhesivo, 
    gramajeAdhesivoPorUnion, 
    modoKilos,
    mermaProcesoPct
  ]);

  // Copy spec ticket to clipboard
  const handleCopyTicket = () => {
    const ticket = `========================================================
📋 FICHA TÉCNICA // CALCULADORA DE KG SIN IMPRESIÓN
========================================================
ESTRUCTURA DE CONVERSIÓN (SIN IMPRESIÓN / 0 TINTA):
  • Gramaje Total: ${resultado.gramajeTotal.toFixed(2)} g/m²
  • Capas (${resultado.desgloseMateriales.length}):
${resultado.desgloseMateriales.map((m, i) => `    ${i + 1}. ${m.nombre} (${m.micras}µ | d:${m.densidad}) -> ${m.gramaje.toFixed(2)} g/m² (${m.porcentaje}%)`).join('\n')}
${resultado.desgloseAdhesivo ? `    + Adhesivo Laminación: ${resultado.desgloseAdhesivo.gramajeTotal.toFixed(2)} g/m² (${resultado.desgloseAdhesivo.porcentaje}%)\n` : ''}
DIMENSIONES DE CORTE & DISTRIBUCIÓN:
  • Ancho Sustrato (Bobina Madre): ${resultado.anchoSustratoCm} cm
  • Ancho Solicitado / Tira Útil: ${resultado.anchoProductoCm} cm
  • REPETICIONES / PISTAS AL ANCHO: ${resultado.repeticiones} pista(s)
  • Ancho Útil Total: ${resultado.anchoUtilTotalCm} cm (${resultado.porcentajeAprovechamiento.toFixed(1)}%)
  • DESPERDICIO / REFILE LATERAL: ${resultado.anchoDesperdicioRefileCm} cm (${resultado.porcentajeDesperdicio.toFixed(1)}%)
    (Refile simétrico: ${resultado.refilePorLadoCm} cm por cada lado)

BALANCE DE PRODUCCIÓN (OBJETIVO ÚTIL CUMPLIDO):
  • KILOS ÚTILES EN PRODUCTO FINAL: ${resultado.kilosUtiles.toLocaleString()} kg (EXACTO A LO REQUERIDO)
  • KILOS DE MERMA / DESPERDICIO: ${resultado.kilosDesperdicio.toLocaleString()} kg (${resultado.porcentajeMermaTotal.toFixed(1)}%)
    - Refile de cuchillas: ${resultado.kilosDesperdicioRefile.toLocaleString()} kg
    ${resultado.kilosDesperdicioProceso > 0 ? `- Merma proceso/arranque (${resultado.mermaProcesoPct}%): ${resultado.kilosDesperdicioProceso.toLocaleString()} kg\n` : ''}  • MATERIA PRIMA BRUTA A MONTAR: ${resultado.kilosTotales.toLocaleString()} kg

BALANCE DE METROS LINEALES:
  • METROS LINEALES DE CORTE (ML): ${resultado.metrosLineales.toLocaleString()} ML (${(resultado.metrosLineales / 1000).toFixed(2)} km)
  • Metros Lineales Útiles Totales: ${resultado.metrosLinealesUtilesAcumulados.toLocaleString()} ML (${resultado.metrosLineales.toLocaleString()} ML × ${resultado.repeticiones} pistas)
  • Área de Sustrato Procesado: ${resultado.areaSustratoM2.toLocaleString()} m²
  • Área Útil de Empaque: ${resultado.areaUtilM2.toLocaleString()} m²
${resultado.totalPiezas ? `  • Total de Piezas Estimadas: ${resultado.totalPiezas.toLocaleString()} u (Largo: ${largoProducto} cm)\n` : ''}
DESGLOSE DE KILOS REQUERIDOS POR CADA MATERIAL:
${resultado.desgloseMateriales.map(m => `  • ${m.nombre}:
    - Kilos Útiles en Producto: ${m.kilosUtiles.toLocaleString()} kg
    - Kilos de Merma/Scrap: ${m.kilosDesperdicio.toLocaleString()} kg
    - Kilos Brutos a Montar/Pedir: ${m.kilosTotales.toLocaleString()} kg`).join('\n')}
${resultado.desgloseAdhesivo ? `  • Adhesivo de Laminación:
    - Kilos Útiles en Producto: ${resultado.desgloseAdhesivo.kilosUtiles.toLocaleString()} kg
    - Kilos de Merma: ${resultado.desgloseAdhesivo.kilosDesperdicio.toLocaleString()} kg
    - Kilos Totales a Aplicar: ${resultado.desgloseAdhesivo.kilosTotales.toLocaleString()} kg\n` : ''}========================================================`;

    navigator.clipboard.writeText(ticket).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="card-dark p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="meta-label text-accent-ink">Conversión de Material & Corte</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                0 tinta · sin impresión
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Calculadora de KG Sin Impresión
            </h2>
            <p className="text-xs sm:text-sm text-white/70 font-mono mt-1 max-w-3xl">
              Calcula a partir de los <strong>KG totales</strong> y el <strong>ancho del producto</strong> cuántas repeticiones caben en el sustrato (base <strong>76 cm</strong>), cuánto material se usará en metros lineales, el <strong>desglose exacto de kilos de cada material</strong> y el <strong>desperdicio por refile</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyTicket}
              className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-2"
              title="Copiar Ficha Técnica al portapapeles"
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡COPIADO!' : 'COPIAR FICHA'}</span>
            </button>
          </div>
        </div>

        {/* Quick Structure Preset Buttons */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
          <span className="text-xs text-white/55 font-bold mr-1">
            Presets Rápidos:
          </span>
          {PRESETS_SIN_IMPRESION.map(preset => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`px-2.5 py-1 text-xs rounded font-mono font-medium transition-all ${
                presetSeleccionadoId === preset.id
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {preset.nombre}
            </button>
          ))}

          {capasPrensaHp && capasPrensaHp.length > 0 && (
            <button
              type="button"
              onClick={handleImportarCapasPrensa}
              className={`px-2.5 py-1 text-xs rounded font-mono font-medium transition-all flex items-center gap-1.5 ${
                presetSeleccionadoId === 'hp_imported'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30'
              }`}
              title="Importar materiales activos del módulo Prensa HP (omitiendo tintas)"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Cargar de Prensa HP ({capasPrensaHp.length} capas)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Parameters Inputs (Left) + Structure Config (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Dimensions & KG (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card-dark p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Weight className="w-4 h-4 text-accent-ink" />
                <h3 className="font-display text-sm font-bold text-white">
                  1. Parámetros de Entrada
                </h3>
              </div>
              <span className="text-xs text-white/55 ">Kilos y dimensiones</span>
            </div>

            {/* Kilos Input & Calculation Mode */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="meta-label flex items-center gap-1.5">
                  <span>{modoKilos === 'kilos_utiles_objetivo' ? 'Kilos Útiles Requeridos' : 'Kilos Brutos Disponibles'}</span>
                  {modoKilos === 'kilos_utiles_objetivo' && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      Objetivo final
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setModoKilos('kilos_utiles_objetivo')}
                    className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                      modoKilos === 'kilos_utiles_objetivo' 
                        ? 'bg-emerald-500 text-white shadow-sm' 
                        : 'bg-white/5 text-white/62 hover:text-white'
                    }`}
                    title="Garantizar que al final los kilos útiles den exactamente el número ingresado"
                  >
                    KG Útiles
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoKilos('kilos_totales_brutos')}
                    className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                      modoKilos === 'kilos_totales_brutos' 
                        ? 'bg-accent text-white shadow-sm' 
                        : 'bg-white/5 text-white/62 hover:text-white'
                    }`}
                    title="Partir de una bobina bruta disponible en almacén"
                  >
                    Bobina Bruta
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={kilosTotales ?? ''}
                  onChange={(e) => setKilosTotales(parseFloat(e.target.value) || 0)}
                  className={`input-dark w-full px-4 py-3 text-2xl font-bold font-mono text-white pl-4 pr-16 border ${
                    modoKilos === 'kilos_utiles_objetivo' 
                      ? 'border-emerald-500/40 focus:border-emerald-500' 
                      : 'border-accent/40 focus:border-accent'
                  }`}
                  placeholder="200"
                />
                <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm font-mono font-bold ${
                  modoKilos === 'kilos_utiles_objetivo' ? 'text-emerald-400' : 'text-accent-ink'
                }`}>
                  KG
                </span>
              </div>

              {/* Quick weight chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {[50, 100, 200, 350, 500, 1000].map(kg => (
                  <button
                    key={kg}
                    type="button"
                    onClick={() => setKilosTotales(kg)}
                    className={`text-xs px-2 py-0.5 rounded border transition-all ${
                      kilosTotales === kg
                        ? modoKilos === 'kilos_utiles_objetivo'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold'
                          : 'bg-accent/20 text-accent-ink border-accent/40 font-bold'
                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {kg} kg
                  </button>
                ))}
              </div>

              {/* Target Explanation Banner */}
              <div className="p-2.5 rounded bg-white/[0.03] border border-white/10 text-xs text-white/70 space-y-1">
                {modoKilos === 'kilos_utiles_objetivo' ? (
                  <>
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Garantía: Al final en kilos útiles darán exactamente {kilosTotales} KG.</span>
                    </div>
                    <p className="text-xs text-white/62">
                      La merma ({resultado.porcentajeMermaTotal}%) se refleja y se suma encima, por lo que debes montar <strong>{resultado.kilosTotales} kg brutos</strong> de bobina madre.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-white/62">
                    Partiendo de <strong>{kilosTotales} kg brutos</strong> de bobina madre, tras refilar se obtendrán <strong>{resultado.kilosUtiles} kg útiles</strong> y se perderán <strong>{resultado.kilosDesperdicio} kg</strong> de merma.
                  </p>
                )}
              </div>
            </div>

            {/* Merma Adicional de Proceso / Ajuste (Opcional) */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <label className="meta-label text-xs">Merma Adicional Proceso / Arranque</label>
                <span className="text-xs text-amber-400 font-bold">
                  {mermaProcesoPct > 0 ? `+${mermaProcesoPct}% Ajuste` : '0% (Solo Refile)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {[0, 2, 3, 5].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setMermaProcesoPct(pct)}
                    className={`text-xs px-2 py-1 rounded border flex-1 transition-all ${
                      mermaProcesoPct === pct
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                        : 'bg-white/5 text-white/62 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {pct === 0 ? '0% Solo Refile' : `+${pct}%`}
                  </button>
                ))}
                <div className="relative w-16 shrink-0">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={mermaProcesoPct || ''}
                    onChange={(e) => setMermaProcesoPct(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="input-dark w-full px-2 py-1 text-xs text-center text-white pr-4"
                    placeholder="0"
                  />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-white/55">%</span>
                </div>
              </div>
              <span className="text-xs text-white/55 block">
                Merma de calibración de máquina o empalmes sumada al refile lateral ({resultado.porcentajeDesperdicio}% refile).
              </span>
            </div>

            {/* Ancho del Producto */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <label className="meta-label">Ancho del Producto / Repetición</label>
                <span className="text-xs text-emerald-400 font-bold">Cada pista</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max={anchoSustrato}
                  value={anchoProducto ?? ''}
                  onChange={(e) => setAnchoProducto(parseFloat(e.target.value) || 0)}
                  className="input-dark w-full px-4 py-2.5 text-xl font-bold font-mono text-white pr-16"
                  placeholder="18.0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-mono text-white/62 font-bold">
                  cm
                </span>
              </div>

              {/* Quick width presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {[12, 15, 18, 20, 24, 25, 30, 36].map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setAnchoProducto(w)}
                    className={`text-xs px-2 py-0.5 rounded border ${
                      anchoProducto === w
                        ? 'bg-accent/20 text-accent-ink border-accent/40 font-bold'
                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {w} cm
                  </button>
                ))}
              </div>
              <span className="text-xs text-white/55 block">
                Ancho unitario de la bolsa, tira, manga o bobina hija cortada.
              </span>
            </div>

            {/* Ancho del Sustrato (76 cm Default) */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <label className="meta-label">Ancho de Sustrato (Bobina)</label>
                <button
                  type="button"
                  onClick={() => setAnchoSustrato(76.0)}
                  className={`text-xs px-2 py-0.5 rounded border ${
                    anchoSustrato === 76.0
                      ? 'bg-accent text-white border-accent font-bold'
                      : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                  }`}
                  title="Restablecer a estándar de 76 cm"
                >
                  Estándar 76 cm
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="5"
                  max="200"
                  value={anchoSustrato ?? ''}
                  onChange={(e) => setAnchoSustrato(parseFloat(e.target.value) || 0)}
                  className="input-dark w-full px-4 py-2.5 text-xl font-bold font-mono text-white pr-16"
                  placeholder="76.0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-mono text-accent-ink font-bold">
                  cm
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-white/55">
                <span>Ancho físico de la bobina madre o sustrato a refilar.</span>
                <span>{(anchoSustrato / 100).toFixed(3)} m</span>
              </div>
            </div>

            {/* Opciones Avanzadas: Separación y Largo opcional */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
              <div className="space-y-1">
                <span className="meta-label text-xs">Separación Cuchillas</span>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={separacionPistasMm ?? ''}
                    onChange={(e) => setSeparacionPistasMm(parseFloat(e.target.value) || 0)}
                    className="input-dark w-full px-2.5 py-1.5 text-xs font-bold text-white pr-10"
                    placeholder="0"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-white/55">
                    mm
                  </span>
                </div>
                <span className="text-xs text-white/55 block">Gap entre pistas</span>
              </div>

              <div className="space-y-1">
                <span className="meta-label text-xs">Largo Pieza (Opcional)</span>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="200"
                    value={largoProducto > 0 ? largoProducto : ''}
                    onChange={(e) => setLargoProducto(parseFloat(e.target.value) || 0)}
                    className="input-dark w-full px-2.5 py-1.5 text-xs font-bold text-white pr-10"
                    placeholder="Ej. 25"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-white/55">
                    cm
                  </span>
                </div>
                <span className="text-xs text-white/55 block">Para estimar piezas</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Layer Structure (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card-dark p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-accent-ink" />
                <h3 className="font-display text-sm font-bold text-white">
                  2. Estructura de Materiales (Sin Tintas)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-accent-ink">
                  Gramaje: {resultado.gramajeTotal.toFixed(2)} g/m²
                </span>
                <button
                  type="button"
                  onClick={handleAddLayer}
                  className="px-2.5 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-white font-mono flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Capa</span>
                </button>
              </div>
            </div>

            <AvisoValidacion errores={validarEstructura(capas).errores} />

            {/* Layers List */}
            <div className="space-y-3">
              {capas.map((capa, index) => {
                const gramajeCapa = Number((capa.densidad * capa.micras).toFixed(2));
                const pctCapa = resultado.gramajeTotal > 0 
                  ? ((gramajeCapa / resultado.gramajeTotal) * 100).toFixed(1) 
                  : '0.0';

                return (
                  <div
                    key={capa.id}
                    className="bg-sunken p-3.5 rounded border border-white/10 space-y-2 relative group hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-accent/20 text-accent-ink font-mono text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-white font-mono">
                          {capa.nombre}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-400 font-bold">
                          {gramajeCapa} g/m² <span className="text-white/55 text-xs">({pctCapa}%)</span>
                        </span>
                        {capas.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLayer(capa.id)}
                            className="p-1 rounded text-white/45 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Eliminar capa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Material y calibre del catálogo oficial */}
                    <SelectorMaterial
                      idBase={`sin-imp-capa-${index + 1}`}
                      nombre={capa.nombre}
                      micras={capa.micras}
                      onChange={(sel) => handleUpdateLayer(capa.id, sel)}
                    />
                  </div>
                );
              })}
            </div>

            {/* Adhesivo de laminación toggle (if >= 2 capas) */}
            {capas.length >= 2 ? (
              <div className="bg-white/[0.03] p-3 rounded border border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chk-adhesivo"
                    checked={incluirAdhesivo}
                    onChange={(e) => setIncluirAdhesivo(e.target.checked)}
                    className="rounded border-white/20 text-accent-ink focus:ring-accent"
                  />
                  <label htmlFor="chk-adhesivo" className="text-white cursor-pointer select-none">
                    Adhesivo de Laminación ({capas.length - 1} unión(es))
                  </label>
                </div>
                {incluirAdhesivo && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="10"
                      value={gramajeAdhesivoPorUnion}
                      onChange={(e) => setGramajeAdhesivoPorUnion(parseFloat(e.target.value) || 0)}
                      className="w-14 bg-white/10 border border-white/20 rounded px-1.5 py-0.5 text-center text-xs font-bold text-white"
                    />
                    <span className="text-white/55 text-xs">g/m² c/u</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded bg-white/[0.02] border border-white/5 text-xs text-white/55 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Estructura Monocapa pura: 1 solo sustrato sin uniones adhesivas ni tintas.</span>
              </div>
            )}

            {/* Structure Summary Bar */}
            <div className="pt-2 flex items-center justify-between text-xs text-white/70">
              <span>{capas.length === 1 ? '1 Sustrato Monocapa' : `${capas.length} Capas Laminadas`}</span>
              <span className="text-white font-bold">{resultado.gramajeTotal.toFixed(2)} g/m² Totales</span>
            </div>

          </div>
        </div>

      </div>

      {/* Warning if width doesn't fit */}
      {resultado.esAnchoInsuficiente && (
        <div className="card-dark p-4 bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <strong>Ancho insuficiente:</strong> El ancho de producto ({anchoProducto} cm) excede el ancho del sustrato ({anchoSustrato} cm). No cabe ninguna repetición completa.
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. CORE RESULTS DASHBOARD (HERO METRICS) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Kilos Útiles en Producto (HERO PRINCIPAL) */}
        <div className="card-dark p-5 relative overflow-hidden border-t-2 border-t-emerald-400 bg-emerald-500/[0.03]">
          <div className="flex items-center justify-between text-white/62 text-xs mb-2">
            <span className="flex items-center gap-1.5 font-bold text-emerald-400">
              <Weight className="w-3.5 h-3.5 text-emerald-400" />
              Kilos Útiles Finales
            </span>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
              Objetivo cumplido
            </span>
          </div>
          <div className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-emerald-400 flex items-baseline gap-2">
            <span>{resultado.kilosUtiles.toLocaleString()}</span>
            <span className="text-xl sm:text-2xl text-white/70 font-mono font-bold">KG</span>
          </div>
          <div className="mt-2 text-xs text-white/70 flex items-center justify-between">
            <span>{resultado.repeticiones} pistas de {resultado.anchoProductoCm} cm</span>
            <span className="text-emerald-400 font-bold">{resultado.areaUtilM2.toLocaleString()} m² útiles</span>
          </div>
        </div>

        {/* Metric 2: Desperdicio por Merma / Refile */}
        <div className="card-dark p-5 relative overflow-hidden border-t-2 border-t-amber-400">
          <div className="flex items-center justify-between text-white/62 text-xs mb-2">
            <span className="flex items-center gap-1.5 text-amber-300">
              <Scissors className="w-3.5 h-3.5 text-amber-400" />
              Merma Total Reflejada
            </span>
            <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
              +{resultado.porcentajeMermaTotal}% Merma
            </span>
          </div>
          <div className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-amber-400 flex items-baseline gap-2">
            <span>+{resultado.kilosDesperdicio.toLocaleString()}</span>
            <span className="text-xl sm:text-2xl text-white/70 font-mono font-bold">KG</span>
          </div>
          <div className="mt-2 text-xs text-white/70 flex items-center justify-between">
            <span>Refile: <strong>{resultado.anchoDesperdicioRefileCm} cm</strong></span>
            <span>({resultado.kilosDesperdicioRefile} kg refile {resultado.kilosDesperdicioProceso > 0 ? `+ ${resultado.kilosDesperdicioProceso} kg proc.` : ''})</span>
          </div>
        </div>

        {/* Metric 3: Materia Prima Bruta a Montar */}
        <div className="card-dark p-5 relative overflow-hidden border-t-2 border-t-accent">
          <div className="flex items-center justify-between text-white/62 text-xs mb-2">
            <span className="flex items-center gap-1.5 text-white/80">
              <Layers className="w-3.5 h-3.5 text-accent-ink" />
              Bobina Bruta Requerida
            </span>
            <span className="text-xs text-accent-ink font-bold">BASE {resultado.anchoSustratoCm} CM</span>
          </div>
          <div className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white flex items-baseline gap-2">
            <span>{resultado.kilosTotales.toLocaleString()}</span>
            <span className="text-xl sm:text-2xl text-accent-ink font-mono font-bold">KG</span>
          </div>
          <div className="mt-2 text-xs text-white/70 flex items-center justify-between">
            <span>Útiles ({resultado.kilosUtiles} kg) + Merma ({resultado.kilosDesperdicio} kg)</span>
            <span className="text-white/55">{resultado.areaSustratoM2.toLocaleString()} m²</span>
          </div>
        </div>

        {/* Metric 4: Cuánto material usaré (Metros Lineales) */}
        <div className="card-dark p-5 relative overflow-hidden border-t-2 border-t-sky-400">
          <div className="flex items-center justify-between text-white/62 text-xs mb-2">
            <span className="flex items-center gap-1.5 text-sky-300">
              <Ruler className="w-3.5 h-3.5 text-sky-400" />
              Metros Lineales a Correr
            </span>
            <span className="text-xs text-sky-400 font-bold">{resultado.repeticiones} pistas</span>
          </div>
          <div className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white flex items-baseline gap-2">
            <span>{resultado.metrosLineales.toLocaleString()}</span>
            <span className="text-xl sm:text-2xl text-sky-400 font-mono font-bold">ML</span>
          </div>
          <div className="mt-2 text-xs text-white/70 flex items-center justify-between">
            <span>{(resultado.metrosLineales / 1000).toFixed(2)} km continuos</span>
            <span className="text-sky-300 font-bold">{resultado.metrosLinealesUtilesAcumulados.toLocaleString()} ML útiles</span>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 4. VISUALIZADOR DE CORTE A ESCALA (ANCHO 76 CM) */}
      {/* ======================================================== */}
      <div className="card-dark p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div>
            <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
              <Scissors className="w-4 h-4 text-accent-ink" />
              Esquema de Corte al Ancho del Sustrato ({resultado.anchoSustratoCm} cm)
            </h3>
            <span className="text-xs text-white/62">
              Distribución transversal de las {resultado.repeticiones} repeticiones y orillas de refile
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500/80"></span>
              <span className="text-white/70">Pista Útil ({resultado.anchoProductoCm} cm)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500/80"></span>
              <span className="text-white/70">Refile ({resultado.anchoDesperdicioRefileCm} cm)</span>
            </div>
          </div>
        </div>

        {/* Scaled Bar Visualizer */}
        <div className="space-y-2">
          {/* Main Visual Roll width bar */}
          <div className="w-full h-20 bg-black/60 rounded border border-white/20 p-1 flex items-center relative overflow-hidden font-mono">
            
            {/* Left Trim / Refile Orilla Izquierda (if centered) */}
            {resultado.refilePorLadoCm > 0 && (
              <div
                style={{ width: `${(resultado.refilePorLadoCm / resultado.anchoSustratoCm) * 100}%` }}
                className="h-full bg-amber-500/25 border-r border-amber-500/50 flex flex-col items-center justify-center text-xs text-amber-300 font-bold px-1 overflow-hidden"
                title={`Refile orilla izquierda: ${resultado.refilePorLadoCm} cm`}
              >
                <span className="truncate">Refile</span>
                <span className="text-xs text-amber-400/80 truncate">{resultado.refilePorLadoCm} cm</span>
              </div>
            )}

            {/* Repetitions (Pistas útiles) */}
            {Array.from({ length: resultado.repeticiones }).map((_, idx) => (
              <div
                key={`pista-${idx}`}
                style={{ width: `${(resultado.anchoProductoCm / resultado.anchoSustratoCm) * 100}%` }}
                className="h-full bg-emerald-500/30 border-r border-emerald-400/50 flex flex-col items-center justify-center text-xs text-white font-bold px-1 relative group"
                title={`Pista #${idx + 1}: ${resultado.anchoProductoCm} cm útiles`}
              >
                <span className="text-xs text-emerald-300 ">
                  Pista #{idx + 1}
                </span>
                <span className="text-sm font-mono text-white">
                  {resultado.anchoProductoCm} cm
                </span>
                <div className="absolute bottom-1 text-xs text-emerald-400/70 font-normal">
                  Útil
                </div>
              </div>
            ))}

            {/* Right Trim / Refile Orilla Derecha (if centered) */}
            {resultado.refilePorLadoCm > 0 && (
              <div
                style={{ width: `${(resultado.refilePorLadoCm / resultado.anchoSustratoCm) * 100}%` }}
                className="h-full bg-amber-500/25 flex flex-col items-center justify-center text-xs text-amber-300 font-bold px-1 overflow-hidden ml-auto"
                title={`Refile orilla derecha: ${resultado.refilePorLadoCm} cm`}
              >
                <span className="truncate">Refile</span>
                <span className="text-xs text-amber-400/80 truncate">{resultado.refilePorLadoCm} cm</span>
              </div>
            )}

          </div>

          {/* Dimension ruler markers below */}
          <div className="flex items-center justify-between text-xs text-white/55 px-1">
            <span>0 cm</span>
            <span className="text-white/70 font-bold">
              ANCHO BOBINA: {resultado.anchoSustratoCm} cm
            </span>
            <span>{resultado.anchoSustratoCm} cm</span>
          </div>
        </div>

        {/* Breakdown explanation text */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-white/55 text-xs block font-bold">Pistas de Corte</span>
            <div className="text-white font-bold">
              {resultado.repeticiones} tiras de {resultado.anchoProductoCm} cm
            </div>
            <span className="text-white/55 text-xs block">
              = {resultado.anchoUtilTotalCm} cm ancho neto aprovechado
            </span>
          </div>

          <div className="p-3 rounded bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-amber-400/80 text-xs block font-bold">Refile Lateral Total</span>
            <div className="text-amber-400 font-bold">
              {resultado.anchoDesperdicioRefileCm} cm ({resultado.porcentajeDesperdicio}%)
            </div>
            <span className="text-white/55 text-xs block">
              Dos orillas de {resultado.refilePorLadoCm} cm c/u
            </span>
          </div>

          <div className="p-3 rounded bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-sky-400/80 text-xs block font-bold">Metros Lineales Útiles Totales</span>
            <div className="text-sky-400 font-bold">
              {resultado.metrosLinealesUtilesAcumulados.toLocaleString()} ML
            </div>
            <span className="text-white/55 text-xs block">
              {resultado.metrosLineales.toLocaleString()} ML × {resultado.repeticiones} pistas en paralelo
            </span>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 5. CUÁNTOS KG SE OCUPAN DE CADA MATERIAL (TABLA DETALLADA) */}
      {/* ======================================================== */}
      <div className="card-dark p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div>
            <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
              <Weight className="w-4 h-4 text-accent-ink" />
              Desglose de Kilos por Cada Material (Balance Útil vs Merma)
            </h3>
            <span className="text-xs text-emerald-400">
              ✓ Cada material se calcula para que al final en kilos útiles den exactamente los {resultado.kilosUtiles} KG requeridos.
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              Útil: {resultado.kilosUtiles} kg
            </span>
            <span className="text-white/55">+</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
              Merma: {resultado.kilosDesperdicio} kg
            </span>
            <span className="text-white/55">=</span>
            <span className="px-2 py-0.5 rounded bg-accent/10 text-accent-ink border border-accent/20 font-bold">
              Total Bruto: {resultado.kilosTotales} kg
            </span>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-white/55 text-xs ">
                <th className="py-2.5 px-3">Capa / Material</th>
                <th className="py-2.5 px-3">Calibre / Densidad</th>
                <th className="py-2.5 px-3">Gramaje</th>
                <th className="py-2.5 px-3">% Estructura</th>
                <th className="py-2.5 px-3 text-emerald-400 font-bold bg-emerald-500/5 border-l border-emerald-500/20">
                  KG Útiles en Producto
                </th>
                <th className="py-2.5 px-3 text-amber-400 font-bold bg-amber-500/5 border-l border-amber-500/20">
                  KG Merma (Refile / Scrap)
                </th>
                <th className="py-2.5 px-3 text-accent-ink font-bold bg-accent/5 border-l border-accent/20">
                  KG Brutos a Solicitar (76 cm)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {resultado.desgloseMateriales.map((m, index) => (
                <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-white/10 text-white/70 text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span>{m.nombre}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-white/70">
                    {m.micras} µm • {m.densidad} g/cm³
                  </td>
                  <td className="py-3 px-3 text-white font-bold">
                    {m.gramaje.toFixed(2)} g/m²
                  </td>
                  <td className="py-3 px-3 text-white/62">
                    {m.porcentaje}%
                  </td>
                  <td className="py-3 px-3 font-bold text-white bg-emerald-500/5 border-l border-emerald-500/20">
                    <span className="text-sm text-emerald-400 font-bold">{m.kilosUtiles.toLocaleString()}</span> kg
                  </td>
                  <td className="py-3 px-3 font-bold text-white bg-amber-500/5 border-l border-amber-500/20">
                    <span className="text-sm text-amber-400 font-bold">+{m.kilosDesperdicio.toLocaleString()}</span> kg
                  </td>
                  <td className="py-3 px-3 font-bold text-white bg-accent/5 border-l border-accent/20">
                    <span className="text-sm text-accent-ink font-bold">{m.kilosTotales.toLocaleString()}</span> kg
                  </td>
                </tr>
              ))}

              {/* Adhesivo row if exists */}
              {resultado.desgloseAdhesivo && (
                <tr className="hover:bg-white/[0.02] transition-colors bg-white/[0.01]">
                  <td className="py-3 px-3">
                    <div className="font-bold text-white/80 flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 text-xs flex items-center justify-center">
                        +
                      </span>
                      <span>Adhesivo de Laminación</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-white/55">
                    Solventless
                  </td>
                  <td className="py-3 px-3 text-white font-bold">
                    {resultado.desgloseAdhesivo.gramajeTotal.toFixed(2)} g/m²
                  </td>
                  <td className="py-3 px-3 text-white/62">
                    {resultado.desgloseAdhesivo.porcentaje}%
                  </td>
                  <td className="py-3 px-3 font-bold text-white bg-emerald-500/5 border-l border-emerald-500/20">
                    <span className="text-sm text-emerald-400 font-bold">{resultado.desgloseAdhesivo.kilosUtiles.toLocaleString()}</span> kg
                  </td>
                  <td className="py-3 px-3 font-bold text-white bg-amber-500/5 border-l border-amber-500/20">
                    <span className="text-sm text-amber-400 font-bold">+{resultado.desgloseAdhesivo.kilosDesperdicio.toLocaleString()}</span> kg
                  </td>
                  <td className="py-3 px-3 font-bold text-white bg-accent/5 border-l border-accent/20">
                    <span className="text-sm text-accent-ink font-bold">{resultado.desgloseAdhesivo.kilosTotales.toLocaleString()}</span> kg
                  </td>
                </tr>
              )}

              {/* Total Footer Row */}
              <tr className="border-t-2 border-white/20 bg-white/[0.04] font-bold">
                <td className="py-3 px-3 text-white " colSpan={2}>
                  <div className="flex flex-col">
                    <span>Balance total de materiales</span>
                    <span className="text-xs text-emerald-400 font-normal">
                      Kilos útiles dan exactamente {resultado.kilosUtiles} kg
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3 text-white">
                  {resultado.gramajeTotal.toFixed(2)} g/m²
                </td>
                <td className="py-3 px-3 text-white">
                  100%
                </td>
                <td className="py-3 px-3 text-emerald-400 bg-emerald-500/10 border-l border-emerald-500/30 text-sm">
                  {resultado.kilosUtiles.toLocaleString()} kg
                </td>
                <td className="py-3 px-3 text-amber-400 bg-amber-500/10 border-l border-amber-500/30 text-sm">
                  +{resultado.kilosDesperdicio.toLocaleString()} kg
                </td>
                <td className="py-3 px-3 text-accent-ink bg-accent/10 border-l border-accent/30 text-sm">
                  ={resultado.kilosTotales.toLocaleString()} kg
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Optional Total Pieces Callout */}
        {resultado.totalPiezas && (
          <div className="p-3 rounded bg-white/[0.02] border border-white/10 flex items-center justify-between text-xs">
            <span className="text-white/70">
              Con un largo de <strong>{largoProducto} cm</strong> por empaque / bolsa:
            </span>
            <span className="text-sm font-bold text-white">
              ≈ {resultado.totalPiezas.toLocaleString()} unidades totales
            </span>
          </div>
        )}
      </div>

    </div>
  );
};
