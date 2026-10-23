import React, { useState, useMemo } from 'react';
import { 
  CapaMaterial, 
  ParametrosCotizacion, 
  calcularIngenieriaEmpaque, 
  calcularBobinaIndividual,
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
import { 
  Calculator, 
  RefreshCw,
  Printer,
  Layers,
  Sliders,
  Disc,
  Boxes,
  Cpu,
  RotateCcw,
  Zap,
  Menu,
  X,
  Scissors,
  PackageCheck,
  Scale,
  Ruler,
  Sun,
  Moon,
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

/** Marca de registro de imprenta: el motivo gráfico de la marca. */
function MarcaRegistro({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="8.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16 2v8M16 22v8M2 16h8M22 16h8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="16" cy="16" r="3" fill="var(--c-accent)" />
    </svg>
  );
}

export default function App() {
  // Mode selection: Impresión HP Indigo (Frame / Imposición) vs Bobina Individual
  const [modo, setModo] = useState<ModoCalculo>('impresion_frame');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [tema, setTema] = useState<'light' | 'dark'>(() =>
    document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
  );

  const toggleTema = () => {
    const siguiente = tema === 'dark' ? 'light' : 'dark';
    setTema(siguiente);
    document.documentElement.setAttribute('data-theme', siguiente);
    try { localStorage.setItem('mts-theme', siguiente); } catch { /* sin almacenamiento */ }
  };

  const moduloActual = MODULOS.find((m) => m.id === modo) ?? MODULOS[0];

  // Input parameters state for HP Indigo Frame calculation
  const [anchoEmpaque, setAnchoEmpaque] = useState<number>(24.0);
  const [altoEmpaque, setAltoEmpaque] = useState<number>(14.0);
  const [kilosSolicitados, setKilosSolicitados] = useState<number>(250);
  const [tolerancia, setTolerancia] = useState<number>(0.10); // 10% default
  const [anchoBobinaNatural, setAnchoBobinaNatural] = useState<number>(76.0); // 76 cm default
  const [anchoFrame, setAnchoFrame] = useState<number>(FRAME_MAX_ANCHO); // 74.6 cm default
  const [altoFrame, setAltoFrame] = useState<number>(FRAME_MAX_ALTO);     // 112.0 cm default

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
    <div className="min-h-screen bg-bg text-white font-sans flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row w-full">

        {/* Fondo del menú en móvil */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 lg:hidden"
            style={{ background: 'rgba(10, 12, 30, 0.55)' }}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Barra lateral */}
        <aside
          id="sidebar"
          aria-label="Navegación principal"
          className={`fixed inset-y-0 left-0 z-40 w-[280px] max-w-[85vw] bg-surface border-r border-white/10 flex flex-col justify-between overflow-y-auto shrink-0 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:z-auto lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div>
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <div className="flex items-center gap-3">
                <MarcaRegistro className="w-8 h-8 text-white shrink-0" />
                <div className="leading-none">
                  <div className="font-display text-xl font-extrabold tracking-tight">
                    Indigo<span className="text-accent-ink">20K</span>
                  </div>
                  <div className="text-xs text-white/62 mt-1.5">Calculadora de metros</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-white/70"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav aria-label="Módulos de cálculo" className="px-3 pb-4">
              <span className="meta-label px-2 pb-2">Módulos</span>
              <div className="space-y-0.5">
                {MODULOS.map((m) => {
                  const Icono = m.icon;
                  const activo = modo === m.id;
                  return (
                    <button
                      key={m.id}
                      id={m.navId}
                      type="button"
                      aria-current={activo ? 'page' : undefined}
                      onClick={() => {
                        setModo(m.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                        activo
                          ? 'bg-accent text-white font-semibold'
                          : 'text-white/75 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icono className="w-4 h-4 shrink-0" />
                      <span className="truncate">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="px-3 pt-4 pb-4 border-t border-white/10">
              <span className="meta-label px-2 pb-2">Plantillas frecuentes</span>
              <div className="space-y-0.5">
                {ESTRUCTURAS_PREDEFINIDAS.slice(0, 4).map((preset) => (
                  <button
                    key={`sidebar-preset-${preset.id}`}
                    type="button"
                    onClick={() => {
                      handleApplyPreset(preset);
                      setSidebarOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors truncate block cursor-pointer"
                  >
                    {preset.nombre}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <dl className="px-5 py-4 border-t border-white/10 text-xs space-y-1.5">
            <div className="flex justify-between gap-3">
              <dt className="text-white/62">Prensa</dt>
              <dd className="font-mono font-medium">HP Indigo</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-white/62">Frame útil</dt>
              <dd className="font-mono font-medium">{anchoFrame.toFixed(1)} × {altoFrame.toFixed(1)} cm</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-white/62">Bobina base</dt>
              <dd className="font-mono font-medium">{anchoBobinaNatural.toFixed(1)} cm</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-white/62">Versión</dt>
              <dd className="font-mono font-medium">4.2</dd>
            </div>
          </dl>
        </aside>

        {/* Área principal */}
        <div className="flex-1 flex flex-col min-w-0">

          <header className="sticky top-0 z-20 bg-surface border-b border-white/10">
            <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2.5 rounded-lg btn-dark-secondary shrink-0"
                  aria-label="Abrir menú"
                  aria-expanded={sidebarOpen}
                  aria-controls="sidebar"
                >
                  <Menu className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <h1 className="font-display text-lg sm:text-xl font-bold truncate">{moduloActual.titulo}</h1>
                  <p className="text-sm text-white/65 truncate hidden sm:block">{moduloActual.descripcion}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={toggleTema}
                  className="btn-dark-secondary p-2.5 cursor-pointer"
                  aria-label={tema === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
                  title={tema === 'dark' ? 'Tema claro' : 'Tema oscuro'}
                >
                  {tema === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="btn-dark-secondary px-3 py-2 text-sm flex items-center gap-1.5 cursor-pointer"
                  title="Restablecer valores"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">Restablecer</span>
                </button>
              </div>
            </div>
            <div className="cmyk-strip" aria-hidden="true" />
          </header>

          {/* Pestañas en pantallas pequeñas */}
          <div
            role="tablist"
            aria-label="Módulos"
            className="flex lg:hidden items-center gap-1.5 px-4 py-2 bg-sunken border-b border-white/10 overflow-x-auto shrink-0"
          >
            {MODULOS.map((m) => {
              const Icono = m.icon;
              const activo = modo === m.id;
              return (
                <button
                  key={`tab-${m.id}`}
                  type="button"
                  role="tab"
                  aria-selected={activo}
                  onClick={() => setModo(m.id)}
                  className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activo ? 'bg-accent text-white font-semibold' : 'text-white/70 hover:bg-white/5'
                  }`}
                >
                  <Icono className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Main Scrollable Body */}
          <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
            
            {/* MODE 1: PRODUCCIÓN HP INDIGO (FRAME, IMPOSICIÓN, MERMA, ML) */}
            {modo === 'impresion_frame' && (
              <div className="space-y-6">
                
                {/* 1. Dimension & Quantity Inputs Grid */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 card-dark p-5">
                    
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
                        className="input-dark w-full px-3 py-2 text-base font-bold text-white"
                      />
                      <span className="text-xs text-white/55 block">Eje del rollo (Máx: {anchoFrame} cm)</span>
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
                        className="input-dark w-full px-3 py-2 text-base font-bold text-white"
                      />
                      <span className="text-xs text-white/55 block">Desarrollo (Máx: {altoFrame} cm)</span>
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
                        className="input-dark w-full px-3 py-2 text-base font-bold text-accent-ink"
                      />
                      <span className="text-xs text-white/55 block">Pedido base del cliente</span>
                    </div>

                    {/* Tolerancia */}
                    <div className="space-y-1.5">
                      <span className="meta-label">Tolerancia</span>
                      <select
                        value={tolerancia}
                        onChange={(e) => setTolerancia(parseFloat(e.target.value))}
                        className="input-dark w-full px-3 py-2 text-base font-bold text-white cursor-pointer"
                      >
                        <option value={0.00} className="bg-surface">0% (Exacto)</option>
                        <option value={0.05} className="bg-surface">+5% Margen</option>
                        <option value={0.10} className="bg-surface">+10% (Estándar)</option>
                        <option value={0.15} className="bg-surface">+15% Margen</option>
                        <option value={0.20} className="bg-surface">+20% Margen</option>
                      </select>
                      <span className="text-xs text-white/55 block">Margen de fabricación</span>
                    </div>

                  </div>

                  {/* Frame & Imposition Status Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded bg-surface border border-white/10 text-xs">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-1.5 text-white/70">
                        <span className="w-2 h-2 rounded-full bg-accent"></span>
                        <span className="text-xs text-white/55">Frame Prensa:</span>
                        <strong className="text-white font-bold">{anchoFrame.toFixed(1)} × {altoFrame.toFixed(1)} cm</strong>
                      </div>

                      <span className="text-white/20 hidden sm:inline">|</span>

                      <div className="text-white/70">
                        <span className="text-xs text-white/55">Bobina:</span>{' '}
                        <strong className="text-white font-bold">{anchoBobinaNatural.toFixed(1)} cm</strong>
                      </div>

                      <span className="text-white/20 hidden sm:inline">|</span>

                      <div className="text-white/70">
                        <span className="text-xs text-white/55">Acomodo:</span>{' '}
                        <span className="text-accent-ink font-bold">{resultado.acomodo.piezasPorFrame} pzas/frame</span>{' '}
                        <span className="text-white/55 text-xs">({resultado.acomodo.repEje} pistas × {resultado.acomodo.repDesarrollo} filas)</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        document.getElementById('frame-visualizer-container')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-xs text-accent-ink hover:text-accent-ink flex items-center gap-1 cursor-pointer font-bold"
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
                <div className="card-dark p-5 border-l-2 border-l-[#ff4d00] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="font-display text-base sm:text-lg font-bold text-white">
                      Calculadora de Bobina Individual
                    </h2>
                    <p className="text-xs text-white/70 font-sans">
                      Cálculo técnico y directo de metros lineales a partir del ancho real de bobina ingresado, kilos exactos (+0%) y estructura del material (Monocapa o Multicapa).
                    </p>
                  </div>
                  <div className="px-3 py-1.5 rounded bg-white/5 border border-white/10 font-mono text-xs text-accent-ink font-bold shrink-0">
                    Ancho directo · kilos exactos
                  </div>
                </div>

                {/* Section 1: Inputs for Single Roll */}
                <div className="card-dark p-5 space-y-4">
                  <div className="pb-3 border-b border-white/10">
                    <span className="meta-label text-accent-ink">Dimensiones de la Bobina</span>
                    <h3 className="font-display text-sm text-white font-bold">
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
                        className="input-dark w-full px-3 py-2 text-lg font-bold text-white"
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
                                ? 'bg-accent text-white border-accent' 
                                : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
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
                        className="input-dark w-full px-3 py-2 text-lg font-bold text-accent-ink"
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
                                ? 'bg-accent text-white border-accent' 
                                : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
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

          </main>
        </div>

      </div>

    </div>
  );
}
