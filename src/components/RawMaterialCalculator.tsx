import React, { useState, useMemo } from 'react';
import { 
  ParametrosMateriaPrimaNatural, 
  ResultadoMateriaPrimaNatural, 
  calcularMateriaPrimaNatural,
  SUSTRATOS_NATURALES_PRESETS,
  SustratoNaturalPreset
} from '../types/calculadora';
import { validarEstructura } from '../data/catalogo';
import { SelectorMaterial, AvisoValidacion } from './SelectorMaterial';
import { 
  Scissors, 
  Ruler, 
  Weight, 
  Layers, 
  Copy, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  BarChart3, 
  FileText,
  Disc,
  ArrowRight,
  TrendingDown,
  Info
} from 'lucide-react';

export const RawMaterialCalculator: React.FC = () => {
  // 1. Material State (Natural/Virgin pure film)
  const [presetSeleccionado, setPresetSeleccionado] = useState<string>('BOPP NAT');
  const [nombreMaterial, setNombreMaterial] = useState<string>('BOPP NAT');
  const [densidad, setDensidad] = useState<number>(0.91);
  const [micras, setMicras] = useState<number>(20);

  // 2. Input Mode & Quantity State
  const [modoEntrada, setModoEntrada] = useState<'kilos' | 'metros'>('kilos');
  const [cantidadEntrada, setCantidadEntrada] = useState<number>(250); // 250 kg or 5000 m default

  // 3. Mother Roll Width & Requested Dimension State
  const [anchoBobinaMadre, setAnchoBobinaMadre] = useState<number>(76.0); // cm
  const [anchoSolicitado, setAnchoSolicitado] = useState<number>(70.0);   // cm
  const [numeroSalidas, setNumeroSalidas] = useState<number>(1);         // 1 corte / bobina hija
  const [copied, setCopied] = useState<boolean>(false);

  // Quick preset selection handler
  const handleSelectPreset = (preset: SustratoNaturalPreset) => {
    setPresetSeleccionado(preset.id);
    setNombreMaterial(preset.nombre);
    setDensidad(preset.densidad);
    setMicras(preset.micrasDefault);
  };

  // Compute results reactively
  const resultado: ResultadoMateriaPrimaNatural = useMemo(() => {
    const params: ParametrosMateriaPrimaNatural = {
      modoEntrada,
      cantidadEntrada: Math.max(0, cantidadEntrada || 0),
      anchoBobinaMadreCm: Math.max(0.1, anchoBobinaMadre || 76),
      anchoSolicitadoCm: Math.max(0.01, anchoSolicitado || 70),
      numeroSalidas: Math.max(1, numeroSalidas || 1),
      nombreMaterial,
      densidad: Math.max(0.01, densidad || 0.90),
      micras: Math.max(0.1, micras || 20)
    };
    return calcularMateriaPrimaNatural(params);
  }, [modoEntrada, cantidadEntrada, anchoBobinaMadre, anchoSolicitado, numeroSalidas, nombreMaterial, densidad, micras]);

  // Copy spec ticket to clipboard
  const handleCopyTicket = () => {
    const ticket = `========================================
📋 FICHA TÉCNICA // MATERIA PRIMA & REFILE
========================================
MATERIAL NATURAL: ${resultado.nombreMaterial}
  • Densidad: ${resultado.densidad} g/cm³
  • Calibre: ${resultado.micras} µm
  • Gramaje Puro: ${resultado.gramaje.toFixed(2)} g/m² (Sin tintas ni adhesivo)

DIMENSIONES DE CORTE & REFILE:
  • Bobina Madre / Virgen: ${resultado.anchoBobinaMadreCm.toFixed(1)} cm
  • Medida Solicitada Útil: ${resultado.anchoUtilTotalCm.toFixed(1)} cm
  • Cortes / Salidas: ${resultado.numeroSalidas} bobina(s) (${resultado.anchoPorSalidaCm.toFixed(1)} cm c/u)
  • Refile Total a Descartar: ${resultado.refileTotalCm.toFixed(1)} cm (Orillas: ${resultado.refilePorLadoCm.toFixed(1)} cm c/u)

BALANCE DE PRODUCCIÓN & CONVERSIÓN:
  • Metros Lineales Continuos: ${resultado.metrosLineales.toLocaleString()} ML (${(resultado.metrosLineales / 1000).toFixed(2)} km)
  • Kilos Brutos Bobina Madre: ${resultado.kilosMadreTotal.toLocaleString()} kg
  • KILOS ÚTILES QUE QUEDAN: ${resultado.kilosUtilesTotal.toLocaleString()} kg (${resultado.porcentajeAprovechamiento.toFixed(1)}%)
  • KILOS DE REFILE / MERMA: ${resultado.kilosRefileTotal.toLocaleString()} kg (${resultado.porcentajeRefile.toFixed(1)}%)
${resultado.numeroSalidas > 1 ? `  • Peso por Bobina Hija: ${resultado.kilosPorSalida.toLocaleString()} kg/bobina\n` : ''}
RENDIMIENTOS:
  • Rendimiento: ${resultado.rendimientoM2Kg.toFixed(1)} m²/kg
  • Área Útil Total: ${resultado.areaUtilM2.toLocaleString()} m²
  • Metros por kg en Ancho Útil: ${resultado.rendimientoMlKgUtil.toFixed(2)} m/kg
========================================`;

    navigator.clipboard.writeText(ticket).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // SVG Scaled Widths for slitting visualization
  const svgTotalWidth = 460;
  const svgHeight = 120;
  const madreSafe = Math.max(1, resultado.anchoBobinaMadreCm);
  const pxPerCm = svgTotalWidth / madreSafe;
  const refileLeftPx = resultado.refilePorLadoCm * pxPerCm;
  const refileRightPx = resultado.refilePorLadoCm * pxPerCm;
  const utilTotalPx = Math.max(0, svgTotalWidth - refileLeftPx - refileRightPx);
  const salidaWidthPx = resultado.numeroSalidas > 0 ? utilTotalPx / resultado.numeroSalidas : utilTotalPx;

  return (
    <div id="raw-material-calculator-view" className="space-y-6">
      
      {/* Header Banner */}
      <div className="card-dark p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent-ink text-xs font-bold">
              Material natural puro
            </span>
          </div>
          <h2 className="font-display text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Scissors className="w-4 h-4 text-accent-ink" />
            Calculadora de Materia Prima & Refile
          </h2>
          <p className="text-xs text-white/70 font-sans max-w-2xl">
            Ingresa las dimensiones de tu bobina natural virgen y la medida requerida para calcular con precisión industrial cuántos metros son, cuántos kilos útiles quedan tras el refile y cuántos kilos se van a merma.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyTicket}
          className="px-3.5 py-2 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          title="Copiar Ficha Técnica para Almacén / Cortadora"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">¡Ficha Copiada!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-accent-ink" />
              <span>Copiar Orden de Corte</span>
            </>
          )}
        </button>
      </div>

      {/* Overwidth Alert if Requested > Mother Roll */}
      {resultado.esAlertaSobreancho && (
        <div className="p-3.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <strong>Aviso de Sobredimensión:</strong> La medida solicitada ({anchoSolicitado} cm) supera el ancho de la bobina madre ({anchoBobinaMadre} cm). Se limitó el cálculo al ancho máximo disponible ({anchoBobinaMadre} cm) sin refile.
          </div>
        </div>
      )}

      {/* Step 1: Substrate Selection (Virgin Natural Material) */}
      <div className="card-dark p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div>
            <span className="meta-label text-accent-ink">Sustrato Virgen Natural</span>
            <h3 className="font-display text-sm text-white font-bold">
              Material Puro (Sin Tinta ni Adhesivos)
            </h3>
          </div>
          <div className="text-xs text-white/62 bg-white/5 px-2.5 py-1 rounded border border-white/10">
            Gramaje Puro: <strong className="text-white font-bold">{resultado.gramaje.toFixed(2)} g/m²</strong>
          </div>
        </div>

        {/* Common Substrates Quick Pills */}
        <div className="space-y-1.5">
          <span className="text-xs text-white/55 block">
            Material del catálogo:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SUSTRATOS_NATURALES_PRESETS.map((preset) => {
              const isSelected = presetSeleccionado === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-2.5 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-accent text-white shadow-sm'
                      : 'bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  title={`${preset.categoria} - ${preset.descripcion}`}
                >
                  <span>{preset.nombre}</span>
                  <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-white/55'}`}>
                    ({preset.calibres.join(' / ')} µm)
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Material y calibre del catálogo oficial (densidad de solo lectura) */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <span className="meta-label">Material y calibre</span>
          <SelectorMaterial
            idBase="materia-prima"
            nombre={nombreMaterial}
            micras={micras}
            onChange={(sel) => {
              setNombreMaterial(sel.nombre);
              setDensidad(sel.densidad);
              setMicras(sel.micras);
              setPresetSeleccionado(sel.nombre);
            }}
          />
          <AvisoValidacion errores={validarEstructura([{ nombre: nombreMaterial, micras }]).errores} />
          <span className="text-xs text-white/65 block">
            Gramaje = {densidad} × {micras} = {resultado.gramaje.toFixed(2)} g/m²
          </span>
        </div>
      </div>

      {/* Step 2: Input Parameters (Mother Roll & Requested Slit Size) */}
      <div className="card-dark p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div>
            <span className="meta-label text-accent-ink">Dimensiones de Entrada y Medida Solicitada</span>
            <h3 className="font-display text-sm text-white font-bold">
              Bobina Madre, Entrada y Cortes
            </h3>
          </div>

          {/* Toggle between input by Kilos vs Metros */}
          <div className="flex items-center bg-black/40 border border-white/10 rounded p-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                if (modoEntrada !== 'kilos') {
                  setModoEntrada('kilos');
                  setCantidadEntrada(resultado.kilosMadreTotal || 250);
                }
              }}
              className={`px-3 py-1 rounded transition-all cursor-pointer font-bold ${
                modoEntrada === 'kilos'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Entrada por KILOS (kg)
            </button>
            <button
              type="button"
              onClick={() => {
                if (modoEntrada !== 'metros') {
                  setModoEntrada('metros');
                  setCantidadEntrada(resultado.metrosLineales || 5000);
                }
              }}
              className={`px-3 py-1 rounded transition-all cursor-pointer font-bold ${
                modoEntrada === 'metros'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Entrada por METROS (ML)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Cantidad de Partida (Kilos o Metros) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="meta-label">
                {modoEntrada === 'kilos' ? 'Kilos Bobina Madre' : 'Metros Lineales Disponibles'}
              </span>
              <span className="text-xs text-accent-ink font-bold">
                {modoEntrada === 'kilos' ? 'KG' : 'ML'}
              </span>
            </div>
            <input
              type="number"
              step={modoEntrada === 'kilos' ? '5' : '100'}
              min="1"
              value={cantidadEntrada ?? ''}
              onChange={(e) => setCantidadEntrada(parseFloat(e.target.value) || 0)}
              className="input-dark w-full px-3 py-2 text-base font-bold text-accent-ink font-mono"
            />
            {/* Quick value presets */}
            <div className="flex flex-wrap gap-1 pt-1">
              {(modoEntrada === 'kilos' ? [50, 100, 250, 500, 1000] : [1000, 2500, 5000, 10000]).map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCantidadEntrada(val)}
                  className={`px-1.5 py-0.5 text-xs rounded border transition-colors ${
                    cantidadEntrada === val
                      ? 'bg-accent text-white border-accent'
                      : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  {val}{modoEntrada === 'kilos' ? 'k' : 'm'}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Ancho Bobina Madre / Virgen */}
          <div className="space-y-1.5">
            <span className="meta-label">Ancho Bobina Madre (cm)</span>
            <input
              type="number"
              step="0.5"
              min="5"
              max="300"
              value={anchoBobinaMadre ?? ''}
              onChange={(e) => setAnchoBobinaMadre(parseFloat(e.target.value) || 0)}
              className="input-dark w-full px-3 py-2 text-base font-bold text-white font-mono"
            />
            {/* Quick Mother Roll Widths */}
            <div className="flex flex-wrap gap-1 pt-1">
              {[60, 76, 80, 100, 120, 130, 150].map(w => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setAnchoBobinaMadre(w)}
                  className={`px-1.5 py-0.5 text-xs rounded border transition-colors ${
                    anchoBobinaMadre === w
                      ? 'bg-accent text-white border-accent'
                      : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  {w}cm
                </button>
              ))}
            </div>
          </div>

          {/* 3. Medida Solicitada Útil */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="meta-label">Medida Solicitada (cm)</span>
              <span className="text-xs text-emerald-400 font-bold">Útil total</span>
            </div>
            <input
              type="number"
              step="0.5"
              min="1"
              max={anchoBobinaMadre}
              value={anchoSolicitado ?? ''}
              onChange={(e) => setAnchoSolicitado(parseFloat(e.target.value) || 0)}
              className="input-dark w-full px-3 py-2 text-base font-bold text-emerald-400 font-mono"
            />
            {/* Quick requested widths or common trims */}
            <div className="flex flex-wrap gap-1 pt-1">
              {[
                { label: 'Exacto (0 refile)', val: anchoBobinaMadre },
                { label: '-2 cm refile', val: Math.max(1, anchoBobinaMadre - 2) },
                { label: '-4 cm refile', val: Math.max(1, anchoBobinaMadre - 4) },
                { label: '-6 cm refile', val: Math.max(1, anchoBobinaMadre - 6) },
              ].map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setAnchoSolicitado(opt.val)}
                  className={`px-1.5 py-0.5 text-xs rounded border transition-colors ${
                    anchoSolicitado === opt.val
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Número de Salidas / Cortes longitudinales */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="meta-label">Cortes / Salidas</span>
              <span className="text-xs text-white/62">Bobinas hijas</span>
            </div>
            <select
              value={numeroSalidas}
              onChange={(e) => setNumeroSalidas(parseInt(e.target.value) || 1)}
              className="input-dark w-full px-3 py-2 text-base font-bold text-white cursor-pointer font-mono"
            >
              <option value={1} className="bg-surface">1 Salida ({resultado.anchoUtilTotalCm} cm)</option>
              <option value={2} className="bg-surface">2 Salidas ({(resultado.anchoUtilTotalCm / 2).toFixed(1)} cm c/u)</option>
              <option value={3} className="bg-surface">3 Salidas ({(resultado.anchoUtilTotalCm / 3).toFixed(1)} cm c/u)</option>
              <option value={4} className="bg-surface">4 Salidas ({(resultado.anchoUtilTotalCm / 4).toFixed(1)} cm c/u)</option>
              <option value={5} className="bg-surface">5 Salidas ({(resultado.anchoUtilTotalCm / 5).toFixed(1)} cm c/u)</option>
              <option value={6} className="bg-surface">6 Salidas ({(resultado.anchoUtilTotalCm / 6).toFixed(1)} cm c/u)</option>
            </select>
            <span className="text-xs text-white/55 block">
              Refile Total: <strong className="text-accent-ink">{resultado.refileTotalCm} cm</strong> ({resultado.refilePorLadoCm} cm por orilla)
            </span>
          </div>

        </div>
      </div>

      {/* Step 3: Hero Key Performance Indicator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Kilos Útiles Que Quedan */}
        <div className="card-dark p-5 border-l-4 border-l-emerald-500 space-y-1 relative overflow-hidden bg-emerald-500/[0.07]">
          <div className="flex items-center justify-between">
            <span className="meta-label text-emerald-400">¿Cuántos kg quedan?</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              {resultado.porcentajeAprovechamiento.toFixed(1)}% ÚTIL
            </span>
          </div>
          <div className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-baseline gap-1.5">
            <span>{resultado.kilosUtilesTotal.toLocaleString()}</span>
            <span className="text-lg font-mono text-emerald-400">KG</span>
          </div>
          <p className="text-xs text-white/70">
            Kilos netos aprovechados tras cortar {resultado.refileTotalCm} cm de refile.
          </p>
        </div>

        {/* KPI 2: Kilos de Refile / Merma */}
        <div className="card-dark p-5 space-y-1 relative overflow-hidden bg-accent/[0.07]">
          <div className="flex items-center justify-between">
            <span className="meta-label text-accent-ink">Refile / merma</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-accent/20 text-accent-ink font-bold">
              {resultado.porcentajeRefile.toFixed(1)}% MERMA
            </span>
          </div>
          <div className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-baseline gap-1.5">
            <span>{resultado.kilosRefileTotal.toLocaleString()}</span>
            <span className="text-lg font-mono text-accent-ink">KG</span>
          </div>
          <p className="text-xs text-white/70">
            {resultado.refileTotalCm} cm de refile total ({resultado.refilePorLadoCm} cm por lado).
          </p>
        </div>

        {/* KPI 3: Metros Lineales Totales */}
        <div className="card-dark p-5 border-l-4 border-l-sky-500 space-y-1 relative overflow-hidden bg-sky-500/[0.07]">
          <div className="flex items-center justify-between">
            <span className="meta-label text-sky-400">¿Cuántos metros son?</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">
              Continuo
            </span>
          </div>
          <div className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-baseline gap-1.5">
            <span>{resultado.metrosLineales.toLocaleString()}</span>
            <span className="text-lg font-mono text-sky-400">ML</span>
          </div>
          <p className="text-xs text-white/70">
            Equivale a {(resultado.metrosLineales / 1000).toFixed(2)} kilómetros de longitud.
          </p>
        </div>

        {/* KPI 4: Rendimiento por Kilo */}
        <div className="card-dark p-5 border-l-4 border-l-purple-500 space-y-1 relative overflow-hidden bg-purple-500/[0.07]">
          <div className="flex items-center justify-between">
            <span className="meta-label text-purple-400">Rendimiento técnico</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
              FILM PURO
            </span>
          </div>
          <div className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-baseline gap-1.5">
            <span>{resultado.rendimientoMlKgUtil.toFixed(1)}</span>
            <span className="text-lg font-mono text-purple-400">M/KG</span>
          </div>
          <p className="text-xs text-white/70">
            {resultado.rendimientoM2Kg.toFixed(1)} m²/kg • Rendimiento a ancho refilado.
          </p>
        </div>

      </div>

      {/* Visual Slitting & Refile Diagram (SVG) */}
      <div className="card-dark p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-accent-ink" />
            <h3 className="font-display text-sm text-white font-bold">
              Visualizador de Refile y Esquema de Corte Transversal
            </h3>
          </div>
          <div className="text-xs text-white/70 flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-accent/30 border border-accent"></span>
              <span>Refile / Desperdicio</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30 border border-emerald-500"></span>
              <span>Bobina(s) Útiles</span>
            </span>
          </div>
        </div>

        {/* Slitting SVG Canvas */}
        <div className="bg-sunken border border-white/10 rounded-lg p-4 overflow-x-auto flex flex-col items-center">
          
          {/* Top dimension label: Bobina Madre Total */}
          <div className="w-full max-w-[500px] flex items-center justify-between font-mono text-xs text-white/62 mb-2 border-b border-dashed border-white/20 pb-1">
            <span>Eje de la bobina madre</span>
            <strong className="text-white font-bold">{resultado.anchoBobinaMadreCm.toFixed(1)} CM TOTAL ({resultado.kilosMadreTotal} kg)</strong>
          </div>

          <svg 
            width={svgTotalWidth} 
            height={svgHeight} 
            viewBox={`0 0 ${svgTotalWidth} ${svgHeight}`}
            className="w-full max-w-[500px] border border-white/20 rounded shadow-inner"
          >
            <defs>
              {/* Striped pattern for waste / refile */}
              <pattern id="refile-stripes" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="var(--c-accent-ink)" strokeWidth="2.5" strokeOpacity="0.4" />
              </pattern>
            </defs>

            {/* Background roll body */}
            <rect x="0" y="20" width={svgTotalWidth} height="70" fill="var(--c-sunken)" />

            {/* Left Refile Strip */}
            {refileLeftPx > 0 && (
              <g>
                <rect 
                  x="0" 
                  y="20" 
                  width={refileLeftPx} 
                  height="70" 
                  fill="url(#refile-stripes)" 
                  stroke="var(--c-accent-ink)" 
                  strokeWidth="1.5"
                />
                <text 
                  x={refileLeftPx / 2} 
                  y="58" 
                  fill="var(--c-accent-ink)" 
                  fontSize="9" 
                  fontFamily="monospace" 
                  fontWeight="bold" 
                  textAnchor="middle"
                >
                  {resultado.refilePorLadoCm > 0.5 ? `${resultado.refilePorLadoCm}cm` : ''}
                </text>
              </g>
            )}

            {/* Useful Cut Rolls (Bobinas Hijas) */}
            {Array.from({ length: resultado.numeroSalidas }).map((_, idx) => {
              const startX = refileLeftPx + (idx * salidaWidthPx);
              return (
                <g key={`salida-roll-${idx}`}>
                  <rect 
                    x={startX} 
                    y="20" 
                    width={salidaWidthPx} 
                    height="70" 
                    fill="color-mix(in srgb, var(--c-ok-500) 25%, var(--c-surface))" 
                    fillOpacity="0.35"
                    stroke="var(--c-ok-500)" 
                    strokeWidth="1.5"
                  />
                  {/* Roll Title inside */}
                  <text 
                    x={startX + (salidaWidthPx / 2)} 
                    y="48" 
                    fill="var(--c-ok-400)" 
                    fontSize="11" 
                    fontFamily="monospace" 
                    fontWeight="bold" 
                    textAnchor="middle"
                  >
                    {resultado.numeroSalidas === 1 ? 'Bobina útil' : `Salida ${idx + 1}`}
                  </text>
                  <text 
                    x={startX + (salidaWidthPx / 2)} 
                    y="64" 
                    fill="var(--c-ink)" 
                    fontSize="10" 
                    fontFamily="monospace" 
                    textAnchor="middle"
                  >
                    {resultado.anchoPorSalidaCm.toFixed(1)} cm
                  </text>
                  <text 
                    x={startX + (salidaWidthPx / 2)} 
                    y="78" 
                    fill="var(--c-ok-200)" 
                    fontSize="9" 
                    fontFamily="monospace" 
                    textAnchor="middle"
                  >
                    ~{resultado.kilosPorSalida.toFixed(1)} kg
                  </text>
                </g>
              );
            })}

            {/* Right Refile Strip */}
            {refileRightPx > 0 && (
              <g>
                <rect 
                  x={svgTotalWidth - refileRightPx} 
                  y="20" 
                  width={refileRightPx} 
                  height="70" 
                  fill="url(#refile-stripes)" 
                  stroke="var(--c-accent-ink)" 
                  strokeWidth="1.5"
                />
                <text 
                  x={svgTotalWidth - (refileRightPx / 2)} 
                  y="58" 
                  fill="var(--c-accent-ink)" 
                  fontSize="9" 
                  fontFamily="monospace" 
                  fontWeight="bold" 
                  textAnchor="middle"
                >
                  {resultado.refilePorLadoCm > 0.5 ? `${resultado.refilePorLadoCm}cm` : ''}
                </text>
              </g>
            )}

            {/* Dimension brackets and guides */}
            <line x1="0" y1="105" x2={svgTotalWidth} y2="105" stroke="var(--c-ink)" strokeOpacity="0.3" strokeWidth="1" />
            <circle cx="0" cy="105" r="2" fill="var(--c-accent-ink)" />
            <circle cx={svgTotalWidth} cy="105" r="2" fill="var(--c-accent-ink)" />
            <text x={svgTotalWidth / 2} y="117" fill="var(--c-ink)" opacity="0.7" fontSize="9" fontFamily="monospace" textAnchor="middle">
              Ancho Útil Total: {resultado.anchoUtilTotalCm.toFixed(1)} cm | Refile Total: {resultado.refileTotalCm.toFixed(1)} cm
            </text>
          </svg>

          {/* Progress bar below visualization */}
          <div className="w-full max-w-[500px] mt-4 space-y-1 font-mono text-xs">
            <div className="flex justify-between text-xs">
              <span className="text-emerald-400 font-bold">Aprovechado: {resultado.porcentajeAprovechamiento.toFixed(1)}% ({resultado.kilosUtilesTotal} kg)</span>
              <span className="text-accent-ink font-bold">Merma Refile: {resultado.porcentajeRefile.toFixed(1)}% ({resultado.kilosRefileTotal} kg)</span>
            </div>
            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden flex border border-white/10">
              <div 
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${resultado.porcentajeAprovechamiento}%` }}
              />
              <div 
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${resultado.porcentajeRefile}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Technical Conversion Specifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card 1: Balance de Masa & Geometría */}
        <div className="card-dark p-5 space-y-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-white/80 font-bold pb-2 border-b border-white/10 ">
            <Disc className="w-4 h-4 text-accent-ink" />
            <span>Balance de Masa y Dimensiones</span>
          </div>

          <div className="space-y-2 text-white/70">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/55">Material Virgen:</span>
              <span className="font-bold text-white">{resultado.nombreMaterial}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/55">Densidad & Calibre:</span>
              <span className="text-white">{resultado.densidad} g/cm³ • {resultado.micras} micras</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/55">Gramaje Resultante:</span>
              <strong className="text-white font-bold">{resultado.gramaje.toFixed(2)} g/m²</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/55">Ancho Bobina Madre:</span>
              <span className="text-white font-bold">{resultado.anchoBobinaMadreCm.toFixed(1)} cm</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/55">Ancho Útil Solicitado:</span>
              <strong className="text-emerald-400 font-bold">{resultado.anchoUtilTotalCm.toFixed(1)} cm</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/55">Refile Total a Descartar:</span>
              <strong className="text-accent-ink font-bold">{resultado.refileTotalCm.toFixed(1)} cm ({resultado.refilePorLadoCm} cm c/lado)</strong>
            </div>
            {resultado.numeroSalidas > 1 && (
              <div className="flex justify-between py-1 border-b border-white/5 text-emerald-300">
                <span>Bobinas Hijas Cortadas:</span>
                <span className="font-bold">{resultado.numeroSalidas} bobinas de {resultado.anchoPorSalidaCm.toFixed(1)} cm</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Metros, Superficie y Rendimientos */}
        <div className="card-dark p-5 space-y-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-white/80 font-bold pb-2 border-b border-white/10 ">
            <BarChart3 className="w-4 h-4 text-accent-ink" />
            <span>Rendimiento Industrial & Áreas</span>
          </div>

          <div className="space-y-2 text-white/70">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/55">Metros Lineales Continuos:</span>
              <strong className="text-sky-400 font-bold">{resultado.metrosLineales.toLocaleString()} ML</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/55">Kilos Brutos Entrada:</span>
              <span className="text-white">{resultado.kilosMadreTotal.toLocaleString()} kg</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/55">Kilos Útiles Resultantes:</span>
              <strong className="text-emerald-400 font-bold">{resultado.kilosUtilesTotal.toLocaleString()} kg</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/55">Kilos de Refile (Merma):</span>
              <strong className="text-accent-ink font-bold">{resultado.kilosRefileTotal.toLocaleString()} kg</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/55">Área Útil Total:</span>
              <span className="text-white">{resultado.areaUtilM2.toLocaleString()} m²</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/55">Área Desperdiciada en Refile:</span>
              <span className="text-accent-ink">{resultado.areaRefileM2.toLocaleString()} m²</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/55">Rendimiento por Kilo:</span>
              <span className="text-purple-300 font-bold">{resultado.rendimientoM2Kg.toFixed(1)} m²/kg</span>
            </div>
          </div>
        </div>

      </div>

      {/* Explainer Box: Exact Mathematical Formulas for Virgin Film */}
      <div className="p-4 rounded bg-white/[0.02] border border-white/10 font-mono text-xs space-y-2">
        <div className="flex items-center gap-1.5 text-white/80 font-bold text-xs">
          <Info className="w-3.5 h-3.5 text-accent-ink" />
          <span>Fórmulas de Ingeniería Aplicadas (Puro Material Natural)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-white/70 text-xs pt-1">
          <div className="bg-black/30 p-2.5 rounded border border-white/5 space-y-1">
            <span className="text-white font-bold block">1. Conversión de Kilos a Metros Lineales:</span>
            <code>ML = (Kg_Madre × 1000) / [ Gramaje (g/m²) × (Ancho_Madre_cm / 100) ]</code>
            <p className="text-xs text-white/55 pt-0.5">
              = ({resultado.kilosMadreTotal} × 1000) / [ {resultado.gramaje.toFixed(2)} × {(resultado.anchoBobinaMadreCm / 100).toFixed(3)} ] = <strong>{resultado.metrosLineales.toLocaleString()} ML</strong>
            </p>
          </div>

          <div className="bg-black/30 p-2.5 rounded border border-white/5 space-y-1">
            <span className="text-white font-bold block">2. Kilos que Quedan vs Kilos de Refile:</span>
            <code>Kg_Útiles = (ML × Gramaje × (Ancho_Útil_cm / 100)) / 1000</code>
            <p className="text-xs text-white/55 pt-0.5">
              Kg_Refile = Kg_Madre - Kg_Útiles = {resultado.kilosMadreTotal} - {resultado.kilosUtilesTotal} = <strong className="text-accent-ink">{resultado.kilosRefileTotal} kg</strong>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
