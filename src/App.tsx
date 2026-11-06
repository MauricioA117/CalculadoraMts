import React, { useState, useMemo } from 'react';
import { 
  CapaMaterial, 
  ParametrosCotizacion, 
  calcularIngenieriaEmpaque, 
  calcularBobinaIndividual,
  calcularClicks,
  JuegoTintas,
  ESTRUCTURAS_PREDEFINIDAS, 
  EstructuraPredefinida,
  FRAME_MAX_ANCHO,
  FRAME_MAX_ALTO,
  ANCHO_BOBINA_NATURAL_DEFAULT
} from './types/calculadora';
import { LayerManager } from './components/LayerManager';
import { FrameVisualizer } from './components/FrameVisualizer';
import { ResultsDashboard } from './components/ResultsDashboard';
import { FormulaExplainer } from './components/FormulaExplainer';
import { PackagingPresets } from './components/PackagingPresets';
import { SingleRollResult } from './components/SingleRollResult';
import { RawMaterialCalculator } from './components/RawMaterialCalculator';
import { MultiRollBatchCalculator } from './components/MultiRollBatchCalculator';
import { KgSinImpresionCalculator } from './components/KgSinImpresionCalculator';
import { LdpeMetersCalculator } from './components/LdpeMetersCalculator';
import { ClicksCalculator } from './components/ClicksCalculator';
import { AppShell } from './components/AppShell';
import {
  Printer,
  Disc,
  RotateCcw,
  Scissors,
  PackageCheck,
  Scale,
  Ruler,
  type LucideIcon
} from 'lucide-react';

type ModoCalculo = 'impresion_frame' | 'bobina_individual' | 'materia_prima_natural' | 'lote_bobinas_merma' | 'kg_sin_impresion' | 'calculadora_mts_ldpe';

interface ModuloInfo {
  id: ModoCalculo;
  navId: string;
  label: string;
  titulo: string;
  descripcion: string;
  icon: LucideIcon;
}

const MODULOS: ModuloInfo[] = [
  { id: 'impresion_frame', navId: 'nav-module-hp-btn', label: 'Producción HP', titulo: 'Producción HP', descripcion: 'Metros lineales, imposición en frame y merma para pedidos en la prensa HP Indigo.', icon: Printer },
  { id: 'bobina_individual', navId: 'nav-module-single-btn', label: 'Bobina individual', titulo: 'Bobina individual', descripcion: 'Metros lineales a partir del ancho real de la bobina, los kilos y la estructura.', icon: Disc },
  { id: 'materia_prima_natural', navId: 'nav-module-raw-btn', label: 'Materia prima y refile', titulo: 'Materia prima y refile', descripcion: 'Película virgen, conversión y refile a partir de la bobina madre.', icon: Scissors },
  { id: 'lote_bobinas_merma', navId: 'nav-module-batch-btn', label: 'Lote de bobinas y merma', titulo: 'Lote de bobinas y merma', descripcion: 'Bobinas surtidas sobre ancho base de 76 cm, con merma y programación.', icon: PackageCheck },
  { id: 'kg_sin_impresion', navId: 'nav-module-kg-no-print-btn', label: 'Kg sin impresión', titulo: 'Kg sin impresión', descripcion: 'Kilos por material, repeticiones y merma sobre sustrato base.', icon: Scale },
  { id: 'calculadora_mts_ldpe', navId: 'nav-module-ldpe-meters-btn', label: 'Metros en LDPE', titulo: 'Metros en LDPE', descripcion: 'Laminación, rendimiento y control de stock y faltantes.', icon: Ruler },
];

export default function App() {
  // Mode selection: Impresión HP Indigo (Frame / Imposición) vs Bobina Individual
  const [modo, setModo] = useState<ModoCalculo>('impresion_frame');

  // Input parameters state for HP Indigo Frame calculation
  const [anchoEmpaque, setAnchoEmpaque] = useState<number>(24.0);
  const [altoEmpaque, setAltoEmpaque] = useState<number>(14.0);
  const [kilosSolicitados, setKilosSolicitados] = useState<number>(250);
  const [tolerancia, setTolerancia] = useState<number>(0.10); // 10% default
  const [anchoBobinaNatural, setAnchoBobinaNatural] = useState<number>(76.0); // 76 cm default
  const [anchoFrame, setAnchoFrame] = useState<number>(FRAME_MAX_ANCHO); // 74.5 cm default
  const [altoFrame, setAltoFrame] = useState<number>(FRAME_MAX_ALTO);     // 112.5 cm default

  // Input parameters for Bobina Individual calculation
  const [anchoBobinaIndividual, setAnchoBobinaIndividual] = useState<number>(30.0); // cm
  const [kilosBobinaIndividual, setKilosBobinaIndividual] = useState<number>(100); // kg

  // Initial structure: BOPP Mate 18µ + PEBD 60µ
  const [capas, setCapas] = useState<CapaMaterial[]>([
    {
      id: 'layer-init-1',
      nombre: 'BOPP MATE',
      densidad: 0.91,
      micras: 20,
      gramajeTinta: 2,
      esImpresion: true
    },
    {
      id: 'layer-init-2',
      nombre: 'BOPP MET',
      densidad: 0.91,
      micras: 20,
      gramajeTinta: 0,
      esImpresion: false
    }
  ]);

  // Reactive calculation execution for HP Indigo Frame mode
  const resultado = useMemo(() => {
    const params: ParametrosCotizacion = {
      anchoEmpaque: Math.max(0.1, anchoEmpaque || 0),
      altoEmpaque: Math.max(0.1, altoEmpaque || 0),
      kilosSolicitados: Math.max(0, kilosSolicitados || 0),
      tolerancia: Math.max(0, tolerancia || 0),
      capas
    };
    return calcularIngenieriaEmpaque(params, anchoBobinaNatural, anchoFrame, altoFrame);
  }, [anchoEmpaque, altoEmpaque, kilosSolicitados, tolerancia, capas, anchoBobinaNatural, anchoFrame, altoFrame]);

  // Reactive calculation execution for Bobina Individual mode
  // Frames a ocupar y clicks (1 click por tinta en cada frame)
  const [juegoTintas, setJuegoTintas] = useState<JuegoTintas>('CMYK');
  const [llevaBlanco, setLlevaBlanco] = useState<boolean>(false);
  const clicks = useMemo(() => calcularClicks(resultado, juegoTintas, llevaBlanco), [resultado, juegoTintas, llevaBlanco]);

  const resultadoBobina = useMemo(() => {
    return calcularBobinaIndividual(anchoBobinaIndividual, kilosBobinaIndividual, capas);
  }, [anchoBobinaIndividual, kilosBobinaIndividual, capas]);

  const handleApplyPreset = (preset: EstructuraPredefinida) => {
    setAnchoEmpaque(preset.anchoSugerido);
    setAltoEmpaque(preset.altoSugerido);
    setKilosSolicitados(preset.kilosSugeridos);
    setTolerancia(preset.toleranciaSugerida);
    setAnchoBobinaIndividual(preset.anchoSugerido * 2);
    setKilosBobinaIndividual(preset.kilosSugeridos);

    const newCapas: CapaMaterial[] = preset.capas.map((c, idx) => ({
      ...c,
      id: `layer-preset-${Date.now()}-${idx}`
    }));
    setCapas(newCapas);
  };

  const handleResetDefaults = () => {
    setAnchoEmpaque(24.0);
    setAltoEmpaque(14.0);
    setKilosSolicitados(250);
    setTolerancia(0.10);
    setAnchoBobinaNatural(76.0);
    setAnchoFrame(FRAME_MAX_ANCHO);
    setAltoFrame(FRAME_MAX_ALTO);
    setAnchoBobinaIndividual(30.0);
    setKilosBobinaIndividual(100);
    setJuegoTintas('CMYK');
    setLlevaBlanco(false);
    setCapas([
      {
        id: 'layer-init-1',
        nombre: 'BOPP MATE',
        densidad: 0.91,
        micras: 20,
        gramajeTinta: 2,
        esImpresion: true
      },
      {
        id: 'layer-init-2',
        nombre: 'BOPP MET',
        densidad: 0.91,
        micras: 20,
        gramajeTinta: 0,
        esImpresion: false
      }
    ]);
  };

  const params: ParametrosCotizacion = {
    anchoEmpaque,
    altoEmpaque,
    kilosSolicitados,
    tolerancia,
    capas
  };

  return (
    <AppShell<ModoCalculo>
      nombreApp="Calculadora de MTs"
      subtitulo="Impresión Digital"
      etiqueta="HP Indigo 20K"
      opciones={MODULOS.map((m) => {
        const Icono = m.icon;
        return { id: m.id, label: m.label, icon: <Icono className="w-[18px] h-[18px] shrink-0" /> };
      })}
      activa={modo}
      onCambiar={setModo}
      acciones={
        <button
          type="button"
          onClick={handleResetDefaults}
          className="h-10 px-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
          title="Restablecer valores"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Restablecer</span>
        </button>
      }
    >
          <div className="space-y-6">
            {/* MODE 1: PRODUCCIÓN HP INDIGO (FRAME, IMPOSICIÓN, MERMA, ML) */}
            {modo === 'impresion_frame' && (
              <div className="space-y-6">
                
                {/* 1. Dimension & Quantity Inputs Grid */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    
                    {/* Ancho */}
                    <div className="space-y-1.5">
                      <span className="meta-label">Ancho del empaque (cm)</span>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max={anchoFrame}
                        value={anchoEmpaque ?? ''}
                        onChange={(e) => setAnchoEmpaque(parseFloat(e.target.value) || 0)}
                        className="bg-white border border-slate-300 rounded-lg font-mono min-h-10 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition w-full px-3 py-2 text-base font-bold text-slate-900"
                      />
                      <span className="text-xs text-slate-500 block">Eje del rollo (Máx: {anchoFrame} cm)</span>
                    </div>

                    {/* Alto */}
                    <div className="space-y-1.5">
                      <span className="meta-label">Alto del empaque (cm)</span>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max={altoFrame}
                        value={altoEmpaque ?? ''}
                        onChange={(e) => setAltoEmpaque(parseFloat(e.target.value) || 0)}
                        className="bg-white border border-slate-300 rounded-lg font-mono min-h-10 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition w-full px-3 py-2 text-base font-bold text-slate-900"
                      />
                      <span className="text-xs text-slate-500 block">Desarrollo (Máx: {altoFrame} cm)</span>
                    </div>

                    {/* Kilos Solicitados */}
                    <div className="space-y-1.5">
                      <span className="meta-label">Kilos solicitados</span>
                      <input
                        type="number"
                        step="5"
                        min="1"
                        value={kilosSolicitados ?? ''}
                        onChange={(e) => setKilosSolicitados(parseFloat(e.target.value) || 0)}
                        className="bg-white border border-slate-300 rounded-lg font-mono min-h-10 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition w-full px-3 py-2 text-base font-bold text-blue-700"
                      />
                      <span className="text-xs text-slate-500 block">Pedido base del cliente</span>
                    </div>

                    {/* Tolerancia */}
                    <div className="space-y-1.5">
                      <span className="meta-label">Tolerancia</span>
                      <select
                        value={tolerancia}
                        onChange={(e) => setTolerancia(parseFloat(e.target.value))}
                        className="bg-white border border-slate-300 rounded-lg font-mono min-h-10 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition w-full px-3 py-2 text-base font-bold text-slate-900 cursor-pointer"
                      >
                        <option value={0.00}>0% (Exacto)</option>
                        <option value={0.05}>+5% Margen</option>
                        <option value={0.10}>+10% (Estándar)</option>
                        <option value={0.15}>+15% Margen</option>
                        <option value={0.20}>+20% Margen</option>
                      </select>
                      <span className="text-xs text-slate-500 block">Margen de fabricación</span>
                    </div>

                  </div>

                  {/* Frame & Imposition Status Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded bg-white border border-slate-200 text-xs">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        <span className="text-xs text-slate-500">Frame Prensa:</span>
                        <strong className="text-slate-900 font-bold">{anchoFrame.toFixed(1)} × {altoFrame.toFixed(1)} cm</strong>
                      </div>

                      <span className="text-slate-300 hidden sm:inline">|</span>

                      <div className="text-slate-600">
                        <span className="text-xs text-slate-500">Bobina:</span>{' '}
                        <strong className="text-slate-900 font-bold">{anchoBobinaNatural.toFixed(1)} cm</strong>
                      </div>

                      <span className="text-slate-300 hidden sm:inline">|</span>

                      <div className="text-slate-600">
                        <span className="text-xs text-slate-500">Acomodo:</span>{' '}
                        <span className="text-blue-700 font-bold">{resultado.acomodo.piezasPorFrame} pzas/frame</span>{' '}
                        <span className="text-slate-500 text-xs">({resultado.acomodo.repEje} pistas × {resultado.acomodo.repDesarrollo} filas)</span>
                      </div>

                      <span className="text-slate-300 hidden sm:inline">|</span>

                      <div className="text-slate-600">
                        <span className="text-xs text-slate-500">Frames a ocupar:</span>{' '}
                        <strong className="text-slate-900 font-bold tabular-nums">{clicks.framesAOcupar.toLocaleString('es-MX')}</strong>
                      </div>

                      <span className="text-slate-300 hidden sm:inline">|</span>

                      <div className="text-slate-600">
                        <span className="text-xs text-slate-500">Clicks:</span>{' '}
                        <strong className="text-blue-700 font-bold tabular-nums">{clicks.clicksTotales.toLocaleString('es-MX')}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        document.getElementById('frame-visualizer-container')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-xs text-blue-700 hover:text-blue-700 flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <span>Cambiar dimensión del frame</span>
                    </button>
                  </div>
                </div>

                {/* 2. Packaging Structure Presets */}
                <PackagingPresets onSelectPreset={handleApplyPreset} />

                {/* 3. Layer Manager (Substrates, Inks, Adhesives) */}
                <LayerManager capas={capas} onChange={setCapas} permitirMonocapa={false} />

                {/* 4. Results Dashboard (Hero KPI Stats & Breakdown) */}
                <ResultsDashboard params={params} resultado={resultado} />

                {/* 4b. Frames a ocupar y clicks por tinta */}
                <ClicksCalculator
                  juego={juegoTintas}
                  onJuegoChange={setJuegoTintas}
                  llevaBlanco={llevaBlanco}
                  onLlevaBlancoChange={setLlevaBlanco}
                  clicks={clicks}
                  piezasPorFrame={resultado.acomodo.piezasPorFrame}
                  totalPiezas={resultado.produccion.totalPiezas}
                />

                {/* 5. Frame Visualizer (Imposition Canvas & Lateral Slit Waste) */}
                <FrameVisualizer 
                  anchoEmpaque={anchoEmpaque}
                  altoEmpaque={altoEmpaque}
                  anchoBobinaNatural={anchoBobinaNatural}
                  onAnchoBobinaNaturalChange={setAnchoBobinaNatural}
                  anchoFrame={anchoFrame}
                  altoFrame={altoFrame}
                  onAnchoFrameChange={setAnchoFrame}
                  onAltoFrameChange={setAltoFrame}
                  resultado={resultado}
                />

                {/* 6. Formula & Engineering Explainer */}
                <FormulaExplainer params={params} resultado={resultado} />

              </div>
            )}

            {/* MODE 2: CALCULADORA DE BOBINA INDIVIDUAL (DIRECT SINGLE ROLL) */}
            {modo === 'bobina_individual' && (
              <div className="space-y-6">
                
                {/* Mode description header banner */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 border-l-2 border-l-blue-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="font-display text-base sm:text-lg font-bold text-slate-900">
                      Calculadora de Bobina Individual
                    </h2>
                    <p className="text-xs text-slate-600 font-sans">
                      Cálculo técnico y directo de metros lineales a partir del ancho real de bobina ingresado, kilos exactos (+0%) y estructura del material (Monocapa o Multicapa).
                    </p>
                  </div>
                  <div className="px-3 py-1.5 rounded bg-slate-50 border border-slate-200 font-mono text-xs text-blue-700 font-bold shrink-0">
                    Ancho directo · kilos exactos
                  </div>
                </div>

                {/* Section 1: Inputs for Single Roll */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <div className="pb-3 border-b border-slate-200">
                    <span className="meta-label text-blue-700">Dimensiones de la Bobina</span>
                    <h3 className="font-display text-sm text-slate-900 font-bold">
                      Parámetros de Entrada
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Ancho de Bobina */}
                    <div className="space-y-2">
                      <span className="meta-label">Ancho Físico de Bobina (cm)</span>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="200"
                        value={anchoBobinaIndividual ?? ''}
                        onChange={(e) => setAnchoBobinaIndividual(parseFloat(e.target.value) || 0)}
                        className="bg-white border border-slate-300 rounded-lg font-mono min-h-10 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition w-full px-3 py-2 text-lg font-bold text-slate-900"
                      />
                      {/* Quick Width Presets */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[15, 20, 25, 30, 40, 50, 76].map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => setAnchoBobinaIndividual(w)}
                            className={`px-2 py-0.5 font-mono text-xs font-bold rounded border transition-colors ${
                              anchoBobinaIndividual === w 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                          >
                            {w} cm
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Kilos Requeridos */}
                    <div className="space-y-2">
                      <span className="meta-label">Kilos de la Bobina (kg)</span>
                      <input
                        type="number"
                        step="5"
                        min="1"
                        value={kilosBobinaIndividual ?? ''}
                        onChange={(e) => setKilosBobinaIndividual(parseFloat(e.target.value) || 0)}
                        className="bg-white border border-slate-300 rounded-lg font-mono min-h-10 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition w-full px-3 py-2 text-lg font-bold text-blue-700"
                      />
                      {/* Quick Kilos Presets */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[25, 50, 100, 250, 500, 1000].map((k) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setKilosBobinaIndividual(k)}
                            className={`px-2 py-0.5 font-mono text-xs font-bold rounded border transition-colors ${
                              kilosBobinaIndividual === k 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                          >
                            {k} kg
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Structure / Layers for Grammage computation */}
                <LayerManager capas={capas} onChange={setCapas} permitirMonocapa={true} />

                {/* Section 3: Single Result - How many ML */}
                <SingleRollResult 
                  resultado={resultadoBobina}
                  anchoBobina={anchoBobinaIndividual}
                  kilos={kilosBobinaIndividual}
                />

              </div>
            )}

            {/* MODE 3: MATERIA PRIMA NATURAL (FILM VIRGEN, CONVERSIÓN Y REFILE) */}
            {modo === 'materia_prima_natural' && (
              <RawMaterialCalculator />
            )}

            {/* MODE 4: LOTE DE BOBINAS SURTIDAS & MERMA (76 CM) */}
            {modo === 'lote_bobinas_merma' && (
              <MultiRollBatchCalculator 
                resultadoCotizacionPrensa={resultado}
                anchoBobinaNaturalGlobal={anchoBobinaNatural}
                capas={capas}
              />
            )}

            {/* MODE 5: CALCULADORA DE KG SIN IMPRESIÓN (BASE 76 CM, REPETICIONES, KG POR MATERIAL, MERMA) */}
            {modo === 'kg_sin_impresion' && (
              <KgSinImpresionCalculator capasPrensaHp={capas} />
            )}

            {/* MODE 6: CALCULADORA DE MTS EN LDPE (LAMINACIÓN, RENDIMIENTO Y CONTROL DE STOCK) */}
            {modo === 'calculadora_mts_ldpe' && (
              <LdpeMetersCalculator />
            )}

          </div>
    </AppShell>
  );
}
