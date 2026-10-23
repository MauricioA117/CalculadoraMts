import React, { useState, useMemo } from 'react';
import { 
  BobinaInventario, 
  ResultadoLoteBobinas, 
  calcularLoteBobinas,
  SUSTRATOS_NATURALES_PRESETS,
  SustratoNaturalPreset,
  ResultadoCotizacion,
  CapaMaterial,
  CATALOGO_MATERIALES,
  MaterialCatalogo
} from '../types/calculadora';
import { validarEstructura } from '../data/catalogo';
import { SelectorMaterial, AvisoValidacion } from './SelectorMaterial';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Scissors, 
  Weight, 
  Ruler, 
  RotateCcw, 
  Sparkles,
  ArrowRight,
  TrendingDown,
  Info,
  PackageCheck,
  Disc
} from 'lucide-react';

interface MultiRollBatchCalculatorProps {
  resultadoCotizacionPrensa?: ResultadoCotizacion;
  anchoBobinaNaturalGlobal?: number;
  capas?: CapaMaterial[];
}

export const MultiRollBatchCalculator: React.FC<MultiRollBatchCalculatorProps> = ({
  resultadoCotizacionPrensa,
  anchoBobinaNaturalGlobal = 76.0,
  capas
}) => {
  // 1. Order Target Parameters
  const [metrosRequeridos, setMetrosRequeridos] = useState<number>(() => {
    return resultadoCotizacionPrensa?.produccion?.metrosLineales ?? 4500;
  });
  
  const [anchoRequerido, setAnchoRequerido] = useState<number>(() => {
    return resultadoCotizacionPrensa?.acomodo?.medidaBobinaImpresa ?? 70.0;
  });

  const [anchoBaseEstandar, setAnchoBaseEstandar] = useState<number>(() => {
    return anchoBobinaNaturalGlobal ?? 76.0;
  });

  // Material & Grammage
  const [presetSeleccionado, setPresetSeleccionado] = useState<string>(() => {
    const printLayer = capas?.find(c => c.esImpresion) || capas?.[0];
    if (printLayer) {
      const match = CATALOGO_MATERIALES.find(m => m.nombre.toLowerCase() === (printLayer.nombre ?? '').toLowerCase());
      if (match) return match.nombre;
    }
    return 'BOPP MATE';
  });
  const [nombreMaterial, setNombreMaterial] = useState<string>(() => {
    const printLayer = capas?.find(c => c.esImpresion) || capas?.[0];
    return printLayer?.nombre ?? 'BOPP MATE';
  });
  const [densidad, setDensidad] = useState<number>(() => {
    const printLayer = capas?.find(c => c.esImpresion) || capas?.[0];
    return printLayer?.densidad ?? 0.91;
  });
  const [micras, setMicras] = useState<number>(() => {
    const printLayer = capas?.find(c => c.esImpresion) || capas?.[0];
    return printLayer?.micras ?? 20;
  });
  const gramaje = densidad * micras; // g/m² (sin redondear; se redondea solo al mostrar)

  // 2. Inventory Rolls State (Default starting batch of rolls around 76cm)
  const [bobinas, setBobinas] = useState<BobinaInventario[]>([
    { id: 'roll-1', codigo: 'BOB-76-01', pesoKg: 45, anchoCm: 76.0, activo: true },
    { id: 'roll-2', codigo: 'BOB-76-02', pesoKg: 38, anchoCm: 76.0, activo: true },
    { id: 'roll-3', codigo: 'BOB-75-03', pesoKg: 25, anchoCm: 75.0, activo: true },
    { id: 'roll-4', codigo: 'BOB-76-04', pesoKg: 18, anchoCm: 76.0, activo: true },
  ]);

  const [copied, setCopied] = useState<boolean>(false);

  // Sync with main production calculator
  const handleSyncFromPrensa = () => {
    if (resultadoCotizacionPrensa) {
      const ml = resultadoCotizacionPrensa.produccion?.metrosLineales ?? 4500;
      const ancho = resultadoCotizacionPrensa.acomodo?.medidaBobinaImpresa ?? 70.0;
      setMetrosRequeridos(ml);
      setAnchoRequerido(ancho);
      if (anchoBobinaNaturalGlobal) {
        setAnchoBaseEstandar(anchoBobinaNaturalGlobal);
      }
      // Try to match the substrate from capas or desgloseMateriales
      const capaImpresion = capas?.find(c => c.esImpresion) || capas?.[0];
      if (capaImpresion) {
        setNombreMaterial(capaImpresion.nombre ?? 'BOPP MATE');
        setDensidad(capaImpresion.densidad ?? 0.91);
        setMicras(capaImpresion.micras ?? 20);
        const mat = CATALOGO_MATERIALES.find(m => m.nombre.toLowerCase() === (capaImpresion.nombre ?? '').toLowerCase());
        if (mat) {
          setPresetSeleccionado(mat.nombre);
        } else {
          setPresetSeleccionado('CUSTOM');
        }
      } else {
        const mat = resultadoCotizacionPrensa.desgloseMateriales?.find(d => !d.esTinta && !d.esAdhesivo);
        if (mat) {
          setNombreMaterial(mat.nombre ?? 'BOPP MATE');
          const foundMat = CATALOGO_MATERIALES.find(m => m.nombre.toLowerCase() === (mat.nombre ?? '').toLowerCase());
          setDensidad(foundMat?.densidad ?? 0.91);
          setMicras(foundMat?.micrasTipicas ?? 20);
          if (foundMat) setPresetSeleccionado(foundMat.nombre);
        }
      }
    }
  };

  // Add new roll
  const handleAddRoll = () => {
    const nextNum = bobinas.length + 1;
    const newRoll: BobinaInventario = {
      id: `roll-${Date.now()}`,
      codigo: `BOB-${anchoBaseEstandar.toFixed(0)}-${nextNum.toString().padStart(2, '0')}`,
      pesoKg: 30,
      anchoCm: anchoBaseEstandar,
      activo: true
    };
    setBobinas([...bobinas, newRoll]);
  };

  // Duplicate roll
  const handleDuplicateRoll = (index: number) => {
    const source = bobinas[index];
    const duplicated: BobinaInventario = {
      id: `roll-${Date.now()}`,
      codigo: `${source.codigo}-COPIA`,
      pesoKg: source.pesoKg,
      anchoCm: source.anchoCm,
      activo: true
    };
    const next = [...bobinas];
    next.splice(index + 1, 0, duplicated);
    setBobinas(next);
  };

  // Remove roll
  const handleRemoveRoll = (id: string) => {
    if (bobinas.length <= 1) return;
    setBobinas(bobinas.filter(b => b.id !== id));
  };

  // Update roll field
  const handleUpdateRoll = (id: string, field: keyof BobinaInventario, value: any) => {
    setBobinas(bobinas.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  // Toggle active roll
  const handleToggleRoll = (id: string) => {
    setBobinas(bobinas.map(b => b.id === id ? { ...b, activo: !b.activo } : b));
  };

  // Quick preset loader
  const handleSelectPresetMaterial = (material: MaterialCatalogo) => {
    setPresetSeleccionado(material.nombre);
    setNombreMaterial(material.nombre);
    setDensidad(material.densidad);
    setMicras(material.micrasTipicas);
  };

  // Compute multi-roll batch results
  const resultado: ResultadoLoteBobinas = useMemo(() => {
    return calcularLoteBobinas(
      bobinas,
      metrosRequeridos,
      anchoRequerido,
      gramaje,
      anchoBaseEstandar,
      nombreMaterial
    );
  }, [bobinas, metrosRequeridos, anchoRequerido, gramaje, anchoBaseEstandar, nombreMaterial]);

  // Copy dispatch ticket
  const handleCopyDispatchTicket = () => {
    const ticket = `========================================
📦 DESPACHO DE ALMACÉN // LOTE DE BOBINAS
========================================
TRABAJO / META DE PRODUCCIÓN:
  • Material: ${resultado.nombreMaterial} (${resultado.gramaje} g/m²)
  • Metros Lineales Requeridos: ${resultado.metrosRequeridos.toLocaleString()} ML
  • Ancho Útil Requerido: ${resultado.anchoRequeridoCm.toFixed(1)} cm
  • Ancho Base Estándar: ${resultado.anchoBaseEstandarCm.toFixed(1)} cm

BALANCE DE COBERTURA:
  • Estatus: ${resultado.alcanzaMaterial ? '✅ COBERTURA COMPLETA' : '❌ MATERIAL INSUFICIENTE'}
  • Cobertura Alcanzada: ${resultado.porcentajeCobertura.toFixed(1)}%
  • Metros Totales Disponibles: ${resultado.metrosLinealesTotales.toLocaleString()} ML
  • Kilos Brutos Totales: ${resultado.kilosBrutosTotales.toLocaleString()} kg
${resultado.alcanzaMaterial 
  ? `  • Metros Sobrantes: +${resultado.metrosSobrantes.toLocaleString()} ML (~${resultado.kilosSobrantes.toFixed(1)} kg remanentes)\n  • Meta alcanzada en: Bobina #${resultado.indiceBobinaMeta + 1} (${resultado.bobinas[resultado.indiceBobinaMeta]?.codigo})`
  : `  • Metros Faltantes: -${resultado.metrosFaltantes.toLocaleString()} ML\n  • KILOS FALTANTES A SOLICITAR (Base ${resultado.anchoBaseEstandarCm}cm): ${resultado.kilosFaltantes.toFixed(1)} kg`
}

BALANCE DE MERMA POR REFILE:
  • Kilos de Merma por Refile: ${resultado.mermaRefileTotalKg.toLocaleString()} kg
  • % Merma Promedio por Refile: ${resultado.porcentajeMermaGlobal.toFixed(1)}%
  • Kilos Útiles Netos que quedan: ${resultado.kilosUtilesTotales.toLocaleString()} kg
  • Empalmes requeridos en máquina: ${resultado.empalmesEstimados} cambio(s)

DESGLOSE DE BOBINAS ASIGNADAS:
${resultado.bobinas.filter(b => b.activo).map((b, idx) => `  ${idx + 1}. [${b.codigo}] ${b.pesoKg} kg | Ancho: ${b.anchoCm}cm | Aporta: ${b.metrosLineales.toLocaleString()} ML | Merma: ${b.mermaRefileKg} kg (${b.porcentajeMerma}%) | Acumulado: ${b.metrosAcumulados.toLocaleString()} ML (${b.porcentajeCoberturaAcumulado}%)${b.esBobinaDeCorteMeta ? ' ⭐️ [META 100%]' : ''}`).join('\n')}
========================================`;

    navigator.clipboard.writeText(ticket).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div id="multi-roll-batch-view" className="space-y-6">
      
      {/* Header Banner */}
      <div className="card-dark p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent-ink text-xs font-bold">
              Bobinas surtidas y merma (base 76 cm)
            </span>
          </div>
          <h2 className="font-display text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-accent-ink" />
            Verificador de Lotes de Bobinas & Cálculo de Merma
          </h2>
          <p className="text-xs text-white/70 font-sans max-w-2xl">
            Ingresa tus bobinas de inventario de diferente medida y peso para determinar si la materia prima te alcanza para los metros lineales requeridos y cuántos kilos de merma por refile se generarán (considerando bobinas estándar de 76 cm).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {resultadoCotizacionPrensa && (
            <button
              type="button"
              onClick={handleSyncFromPrensa}
              className="px-3 py-2 rounded bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent-ink text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Importar metros lineales y ancho de la Calculadora de Prensa HP"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Importar de Prensa ({resultadoCotizacionPrensa.produccion?.metrosLineales} ML)</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyDispatchTicket}
            className="px-3.5 py-2 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Copiar Ticket de Despacho para Almacén / Producción"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">¡Ticket Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-accent-ink" />
                <span>Copiar Despacho</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Target Requirements & Substrate Bar */}
      <div className="card-dark p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div>
            <span className="meta-label text-accent-ink">Meta del Pedido & Sustrato</span>
            <h3 className="font-display text-sm text-white font-bold">
              Metros Requeridos, Ancho Útil y Película
            </h3>
          </div>
          <div className="text-xs text-white/62 bg-white/5 px-2.5 py-1 rounded border border-white/10">
            Gramaje: <strong className="text-white font-bold">{resultado.gramaje.toFixed(2)} g/m²</strong>
          </div>
        </div>

        {/* Inputs for Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Metros Lineales Requeridos */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="meta-label">Metros Req. (ML)</span>
              <span className="text-xs text-sky-400 font-bold">Meta de tirada</span>
            </div>
            <input
              type="number"
              step="100"
              min="10"
              value={metrosRequeridos ?? ''}
              onChange={(e) => setMetrosRequeridos(parseFloat(e.target.value) || 0)}
              className="input-dark w-full px-3 py-2 text-base font-bold text-sky-400 font-mono"
            />
            <span className="text-xs text-white/55 block">Longitud requerida para el tiraje</span>
          </div>

          {/* Ancho Requerido Útil */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="meta-label">Ancho Útil Requerido (cm)</span>
              <span className="text-xs text-emerald-400 font-bold">Impresión / corte</span>
            </div>
            <input
              type="number"
              step="0.5"
              min="5"
              max="200"
              value={anchoRequerido ?? ''}
              onChange={(e) => setAnchoRequerido(parseFloat(e.target.value) || 0)}
              className="input-dark w-full px-3 py-2 text-base font-bold text-emerald-400 font-mono"
            />
            <span className="text-xs text-white/55 block">Ancho final impreso o ranurado</span>
          </div>

          {/* Ancho Base Estándar (76.0 cm) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="meta-label">Ancho Estándar Almacén</span>
              <span className="text-xs text-accent-ink font-bold">Base 76 cm</span>
            </div>
            <input
              type="number"
              step="0.5"
              min="10"
              max="300"
              value={anchoBaseEstandar ?? ''}
              onChange={(e) => setAnchoBaseEstandar(parseFloat(e.target.value) || 76)}
              className="input-dark w-full px-3 py-2 text-base font-bold text-white font-mono"
            />
            <span className="text-xs text-white/55 block">Ancho nominal de compra/planta</span>
          </div>

          {/* Sustrato Rápido y Selección Catálogo */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="meta-label">Material Evaluado</span>
              <span className="text-xs text-accent-ink font-bold">Prensa HP</span>
            </div>
            <SelectorMaterial
              idBase="lote"
              nombre={nombreMaterial}
              micras={micras}
              onChange={(sel) => {
                setNombreMaterial(sel.nombre);
                setDensidad(sel.densidad);
                setMicras(sel.micras);
                setPresetSeleccionado(sel.nombre);
              }}
            />
            <div className="pt-1 text-xs text-right">
              <span className="text-white/70 font-bold">{Number(gramaje.toFixed(2))} g/m²</span>
            </div>
            <AvisoValidacion errores={validarEstructura([{ nombre: nombreMaterial, micras }]).errores} />
          </div>

        </div>
      </div>

      {/* HERO STATUS BANNER: REACHED OR DEFICIT */}
      <div className={`card-dark p-5 border-l-4 ${
        resultado.alcanzaMaterial 
          ? 'border-l-emerald-500 bg-emerald-500/[0.07]' 
          : 'border-l-rose-500 bg-rose-500/[0.07]'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-start gap-3.5">
            {resultado.alcanzaMaterial ? (
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <XCircle className="w-6 h-6 text-rose-400" />
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  resultado.alcanzaMaterial ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {resultado.alcanzaMaterial ? 'Materia prima suficiente' : 'Falta materia prima'}
                </span>
                <span className="text-xs text-white/62">
                  Cobertura: <strong className="text-white">{resultado.porcentajeCobertura.toFixed(1)}%</strong>
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-display font-bold text-white tracking-tight">
                {resultado.alcanzaMaterial ? (
                  <span>
                    El lote cubre el pedido con un excedente de <strong className="text-emerald-400">+{resultado.metrosSobrantes.toLocaleString()} ML</strong> (~{resultado.kilosSobrantes} kg)
                  </span>
                ) : (
                  <span>
                    Faltan <strong className="text-rose-400">{resultado.metrosFaltantes.toLocaleString()} ML</strong> para completar el tiraje
                  </span>
                )}
              </h3>

              <p className="text-xs text-white/70">
                {resultado.alcanzaMaterial ? (
                  resultado.indiceBobinaMeta >= 0 ? (
                    <>Meta de tiraje alcanzada en la <strong>Bobina #{resultado.indiceBobinaMeta + 1} ({resultado.bobinas[resultado.indiceBobinaMeta]?.codigo})</strong>. Se requieren {resultado.empalmesEstimados} cambio(s) de rollo.</>
                  ) : (
                    <>El material ingresado cubre exactamente el pedido.</>
                  )
                ) : (
                  <>Se requiere solicitar al almacén <strong className="text-rose-400 font-bold">{resultado.kilosFaltantes} kg adicionales</strong> de bobina estándar de {resultado.anchoBaseEstandarCm} cm.</>
                )}
              </p>
            </div>
          </div>

          {/* Quick Summary Numbers */}
          <div className="flex items-center gap-4 bg-black/40 border border-white/10 px-4 py-2.5 rounded-lg shrink-0 font-mono text-xs">
            <div>
              <span className="text-xs text-white/55 block">Total Disponible:</span>
              <strong className="text-white text-sm">{resultado.metrosLinealesTotales.toLocaleString()} ML</strong>
            </div>
            <div className="w-px h-7 bg-white/10"></div>
            <div>
              <span className="text-xs text-white/55 block">Meta Tirada:</span>
              <strong className="text-sky-400 text-sm">{resultado.metrosRequeridos.toLocaleString()} ML</strong>
            </div>
            <div className="w-px h-7 bg-white/10"></div>
            <div>
              <span className="text-xs text-white/55 block">Merma Refile:</span>
              <strong className="text-accent-ink text-sm">{resultado.mermaRefileTotalKg} kg</strong>
            </div>
          </div>

        </div>

        {/* Visual Progress Bar of Cumulative Meters vs Target */}
        <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5 font-mono text-xs">
          <div className="flex justify-between text-xs">
            <span className="text-white/70">
              Avance acumulado del lote: <strong className="text-white">{resultado.metrosLinealesTotales.toLocaleString()}</strong> de {resultado.metrosRequeridos.toLocaleString()} ML
            </span>
            <span className={resultado.alcanzaMaterial ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {resultado.porcentajeCobertura.toFixed(1)}%
            </span>
          </div>

          <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden flex border border-white/10 relative">
            {/* Target 100% threshold marker */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-white z-10 "
              style={{ left: `${Math.min(100, (100 / (resultado.porcentajeCobertura > 100 ? resultado.porcentajeCobertura : 100)) * 100)}%` }}
              title="Meta 100%"
            />

            {/* Segments for each roll */}
            {resultado.bobinas.filter(b => b.activo && b.esValidaAncho).map((b, idx) => {
              const maxScale = Math.max(resultado.metrosRequeridos, resultado.metrosLinealesTotales);
              const segmentPct = maxScale > 0 ? (b.metrosLineales / maxScale) * 100 : 0;
              return (
                <div
                  key={`progress-seg-${b.id}`}
                  className={`h-full border-r border-black/40 transition-all ${
                    idx % 2 === 0 ? 'bg-accent' : 'bg-accent/70'
                  }`}
                  style={{ width: `${segmentPct}%` }}
                  title={`${b.codigo}: ${b.metrosLineales} ML (${b.pesoKg} kg)`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* 4 KPIs Cards (Including Specific Waste from 76cm) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Merma Total por Refile */}
        <div className="card-dark p-5 space-y-1 relative overflow-hidden bg-accent/[0.07]">
          <div className="flex items-center justify-between">
            <span className="meta-label text-accent-ink">Merma por refile</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-accent/20 text-accent-ink font-bold">
              {resultado.porcentajeMermaGlobal.toFixed(1)}% refile
            </span>
          </div>
          <div className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-baseline gap-1.5">
            <span>{resultado.mermaRefileTotalKg.toLocaleString()}</span>
            <span className="text-lg font-mono text-accent-ink">KG</span>
          </div>
          <p className="text-xs text-white/70">
            Desecho de orillas al refilar cada bobina al ancho útil requerido ({resultado.anchoRequeridoCm} cm).
          </p>
        </div>

        {/* KPI 2: Kilos Útiles Que Quedan */}
        <div className="card-dark p-5 border-l-4 border-l-emerald-500 space-y-1 relative overflow-hidden bg-emerald-500/[0.07]">
          <div className="flex items-center justify-between">
            <span className="meta-label text-emerald-400">Kilos útiles netos</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              Aprovechado
            </span>
          </div>
          <div className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-baseline gap-1.5">
            <span>{resultado.kilosUtilesTotales.toLocaleString()}</span>
            <span className="text-lg font-mono text-emerald-400">KG</span>
          </div>
          <p className="text-xs text-white/70">
            Peso neto de material aprovechado para el tiraje ({100 - resultado.porcentajeMermaGlobal > 0 ? (100 - resultado.porcentajeMermaGlobal).toFixed(1) : 0}%).
          </p>
        </div>

        {/* KPI 3: Metros Lineales Disponibles */}
        <div className="card-dark p-5 border-l-4 border-l-sky-500 space-y-1 relative overflow-hidden bg-sky-500/[0.07]">
          <div className="flex items-center justify-between">
            <span className="meta-label text-sky-400">Metros disponibles</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">
              {resultado.totalBobinasValidas} bobinas
            </span>
          </div>
          <div className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-baseline gap-1.5">
            <span>{resultado.metrosLinealesTotales.toLocaleString()}</span>
            <span className="text-lg font-mono text-sky-400">ML</span>
          </div>
          <p className="text-xs text-white/70">
            {resultado.diferenciaMetros >= 0 ? `+${resultado.diferenciaMetros.toLocaleString()} ML de saldo a favor` : `-${Math.abs(resultado.diferenciaMetros).toLocaleString()} ML de déficit`}.
          </p>
        </div>

        {/* KPI 4: Kilos Faltantes o Sobrantes */}
        <div className={`card-dark p-5 border-l-4 ${resultado.alcanzaMaterial ? 'border-l-teal-500' : 'border-l-rose-500'} space-y-1 relative overflow-hidden`}>
          <div className="flex items-center justify-between">
            <span className={`meta-label ${resultado.alcanzaMaterial ? 'text-teal-400' : 'text-rose-400'}`}>
              {resultado.alcanzaMaterial ? 'Sobrante remanente' : 'Kilos por pedir'}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
              resultado.alcanzaMaterial ? 'bg-teal-500/20 text-teal-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {resultado.alcanzaMaterial ? 'En última bobina' : 'Solicitar a almacén'}
            </span>
          </div>
          <div className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-baseline gap-1.5">
            <span>{resultado.alcanzaMaterial ? resultado.kilosSobrantes : resultado.kilosFaltantes}</span>
            <span className={`text-lg font-mono ${resultado.alcanzaMaterial ? 'text-teal-400' : 'text-rose-400'}`}>KG</span>
          </div>
          <p className="text-xs text-white/70">
            {resultado.alcanzaMaterial 
              ? `Kilos no consumidos que quedarán en máquina.` 
              : `Kilos requeridos en bobina de ${resultado.anchoBaseEstandarCm}cm.`}
          </p>
        </div>

      </div>

      {/* Step 2: Inventory Rolls Interactive Table */}
      <div className="card-dark p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div>
            <span className="meta-label text-accent-ink">Lote de Bobinas de Inventario</span>
            <h3 className="font-display text-sm text-white font-bold">
              Registro de Bobinas Surtidas (Medida & Peso)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick batch presets */}
            <button
              type="button"
              onClick={() => {
                setBobinas([
                  { id: 'roll-1', codigo: 'BOB-76-A1', pesoKg: 65, anchoCm: 76.0, activo: true },
                  { id: 'roll-2', codigo: 'BOB-76-A2', pesoKg: 50, anchoCm: 76.0, activo: true },
                  { id: 'roll-3', codigo: 'BOB-76-A3', pesoKg: 40, anchoCm: 76.0, activo: true },
                ]);
              }}
              className="btn-dark-secondary px-2.5 py-1 text-xs cursor-pointer"
            >
              Lote 3×76cm
            </button>

            <button
              type="button"
              onClick={() => {
                setBobinas([
                  { id: 'roll-1', codigo: 'BOB-76-01', pesoKg: 45, anchoCm: 76.0, activo: true },
                  { id: 'roll-2', codigo: 'BOB-75-02', pesoKg: 30, anchoCm: 75.0, activo: true },
                  { id: 'roll-3', codigo: 'BOB-74-03', pesoKg: 20, anchoCm: 74.0, activo: true },
                  { id: 'roll-4', codigo: 'BOB-76-04', pesoKg: 15, anchoCm: 76.0, activo: true },
                ]);
              }}
              className="btn-dark-secondary px-2.5 py-1 text-xs cursor-pointer"
            >
              Lote Medidas Mixtas
            </button>

            <button
              type="button"
              onClick={handleAddRoll}
              className="btn-dark-primary px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Bobina</span>
            </button>
          </div>
        </div>

        {/* Warning if any rolls were rejected because ancho < anchoRequerido */}
        {resultado.totalBobinasRechazadas > 0 && (
          <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <strong>Atención:</strong> Se detectaron {resultado.totalBobinasRechazadas} bobina(s) con ancho menor a la medida requerida ({anchoRequerido} cm). Esas bobinas fueron marcadas como <strong>ANCHO INSUFICIENTE</strong> y no se sumaron a los metros lineales disponibles.
            </div>
          </div>
        )}

        {/* Rolls Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-sunken text-white/62 border-b border-white/10 text-xs">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">Uso</th>
                <th className="py-2.5 px-3"># / Código</th>
                <th className="py-2.5 px-3">Peso (kg)</th>
                <th className="py-2.5 px-3">Ancho (cm)</th>
                <th className="py-2.5 px-3">Aporte (ML)</th>
                <th className="py-2.5 px-3">
                  <div>Refile / Merma</div>
                  <span className="text-xs text-accent-ink font-normal block lowercase">
                    (vs {resultado.anchoRequeridoCm} cm útil)
                  </span>
                </th>
                <th className="py-2.5 px-3">Kilos Útiles</th>
                <th className="py-2.5 px-3">Acumulado</th>
                <th className="py-2.5 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {resultado.bobinas.map((roll, idx) => {
                const isRejected = !roll.esValidaAncho && roll.activo;
                return (
                  <tr 
                    key={roll.id}
                    className={`transition-colors ${
                      !roll.activo 
                        ? 'opacity-40 bg-white/[0.01]' 
                        : isRejected 
                          ? 'bg-rose-950/20 text-rose-200' 
                          : roll.esBobinaDeCorteMeta 
                            ? 'bg-emerald-950/30 font-bold' 
                            : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Checkbox active */}
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={Boolean(roll.activo)}
                        onChange={() => handleToggleRoll(roll.id)}
                        className="rounded border-white/20 text-accent-ink focus:ring-0 cursor-pointer"
                        title={roll.activo ? 'Desactivar bobina' : 'Activar bobina'}
                      />
                    </td>

                    {/* Code / ID */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white/55 text-xs">#{idx + 1}</span>
                        <input
                          type="text"
                          value={roll.codigo ?? ''}
                          onChange={(e) => handleUpdateRoll(roll.id, 'codigo', e.target.value)}
                          className="bg-transparent border-b border-white/10 focus:border-accent px-1 py-0.5 text-xs text-white font-mono outline-none w-28"
                        />
                        {roll.esBobinaDeCorteMeta && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 whitespace-nowrap">
                            ⭐️ META 100%
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Weight (kg) */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          min="0.1"
                          value={roll.pesoKg ?? ''}
                          onChange={(e) => handleUpdateRoll(roll.id, 'pesoKg', parseFloat(e.target.value) || 0)}
                          className="input-dark px-2 py-1 text-xs font-bold text-white font-mono w-20"
                        />
                        <span className="text-xs text-white/55">kg</span>
                      </div>
                    </td>

                    {/* Width (cm) */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="250"
                          value={roll.anchoCm ?? ''}
                          onChange={(e) => handleUpdateRoll(roll.id, 'anchoCm', parseFloat(e.target.value) || 0)}
                          className={`input-dark px-2 py-1 text-xs font-bold font-mono w-20 ${
                            isRejected ? 'border-rose-500 text-rose-300' : 'text-white'
                          }`}
                        />
                        <span className="text-xs text-white/55">cm</span>
                      </div>
                      {isRejected && (
                        <span className="text-xs text-rose-400 block pt-0.5">
                          Menor a {anchoRequerido} cm
                        </span>
                      )}
                    </td>

                    {/* Aporte en Metros Lineales */}
                    <td className="py-2.5 px-3">
                      {roll.activo && roll.esValidaAncho ? (
                        <div className="flex items-baseline gap-1">
                          <strong className="text-sky-400 font-bold text-sm">
                            {roll.metrosLineales.toLocaleString()}
                          </strong>
                          <span className="text-xs text-white/55">ML</span>
                        </div>
                      ) : (
                        <span className="text-white/45 italic">0 ML</span>
                      )}
                    </td>

                    {/* Merma por Refile */}
                    <td className="py-2.5 px-3">
                      {roll.activo && roll.esValidaAncho ? (
                        <div>
                          <div className="flex items-baseline gap-1 text-accent-ink">
                            <strong className="font-bold">{roll.mermaRefileKg}</strong>
                            <span className="text-xs">kg</span>
                            <span className="text-white/55 text-xs">({roll.porcentajeMerma}%)</span>
                          </div>
                          <span className="text-xs text-white/55 block">
                            Corte: {roll.refileCm} cm (a {resultado.anchoRequeridoCm} cm)
                          </span>
                        </div>
                      ) : (
                        <span className="text-white/45">—</span>
                      )}
                    </td>

                    {/* Kilos Útiles */}
                    <td className="py-2.5 px-3">
                      {roll.activo && roll.esValidaAncho ? (
                        <div className="flex items-baseline gap-1 text-emerald-400">
                          <strong className="font-bold">{roll.kilosUtilesKg}</strong>
                          <span className="text-xs">kg</span>
                        </div>
                      ) : (
                        <span className="text-white/45">—</span>
                      )}
                    </td>

                    {/* Acumulado */}
                    <td className="py-2.5 px-3">
                      {roll.activo && roll.esValidaAncho ? (
                        <div>
                          <div className="text-white font-bold text-xs">
                            {roll.metrosAcumulados.toLocaleString()} ML
                          </div>
                          <span className={`text-xs ${roll.porcentajeCoberturaAcumulado >= 100 ? 'text-emerald-400' : 'text-white/62'}`}>
                            {roll.porcentajeCoberturaAcumulado}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-white/45">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDuplicateRoll(idx)}
                          className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                          title="Duplicar bobina"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveRoll(roll.id)}
                          disabled={bobinas.length <= 1}
                          className="p-1 rounded bg-white/5 hover:bg-rose-500/20 text-white/70 hover:text-rose-400 transition-colors disabled:opacity-30 cursor-pointer"
                          title="Eliminar bobina"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-sunken text-white border-t border-white/10 font-bold">
              <tr>
                <td className="py-3 px-3 text-center text-white/55">∑</td>
                <td className="py-3 px-3">TOTALES ({resultado.totalBobinasValidas} válidas)</td>
                <td className="py-3 px-3 text-white">{resultado.kilosBrutosTotales} kg</td>
                <td className="py-3 px-3">
                  <div className="text-xs text-emerald-400 font-mono">Útil: {resultado.anchoRequeridoCm} cm</div>
                  <div className="text-xs text-white/55">Base: {anchoBaseEstandar} cm</div>
                </td>
                <td className="py-3 px-3 text-sky-400">{resultado.metrosLinealesTotales.toLocaleString()} ML</td>
                <td className="py-3 px-3 text-accent-ink">{resultado.mermaRefileTotalKg} kg ({resultado.porcentajeMermaGlobal.toFixed(1)}%)</td>
                <td className="py-3 px-3 text-emerald-400">{resultado.kilosUtilesTotales} kg</td>
                <td className="py-3 px-3 text-white">{resultado.porcentajeCobertura.toFixed(1)}%</td>
                <td className="py-3 px-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Engineering Calculation Formulas & Audit Card */}
      <div className="p-4 rounded bg-white/[0.02] border border-white/10 font-mono text-xs space-y-2">
        <div className="flex items-center gap-1.5 text-white/80 font-bold text-xs">
          <Info className="w-3.5 h-3.5 text-accent-ink" />
          <span>Fórmulas de Auditoría de Lotes y Merma de Refile (76 cm)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-white/70 text-xs pt-1">
          <div className="bg-black/30 p-2.5 rounded border border-white/5 space-y-1">
            <span className="text-white font-bold block">1. Aporte en Metros Lineales por Bobina:</span>
            <code>ML = (Peso_kg × 1000) / [ Gramaje (g/m²) × (Ancho_Bobina_cm / 100) ]</code>
            <p className="text-xs text-white/55 pt-0.5">
              Cada bobina se convierte con su propio ancho y peso real. Si el ancho es inferior a {resultado.anchoRequeridoCm} cm, no califica para el tiraje.
            </p>
          </div>

          <div className="bg-black/30 p-2.5 rounded border border-white/5 space-y-1">
            <span className="text-white font-bold block">2. Merma por Refile Lateral (Base {anchoBaseEstandar} cm):</span>
            <code>Merma_kg = [ ML × Gramaje × ((Ancho_Bobina - {resultado.anchoRequeridoCm}) / 100) ] / 1000</code>
            <p className="text-xs text-white/55 pt-0.5">
              Refile generado = <strong>{resultado.mermaRefileTotalKg} kg</strong> ({resultado.porcentajeMermaGlobal.toFixed(1)}% del peso bruto ingresado).
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
