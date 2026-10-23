import React, { useState, useMemo } from 'react';
import { 
  EstructuraLdpeItem, 
  ResultadoCalculoLdpeItem, 
  ResumenConsolidadoLdpe, 
  calcularItemLdpe, 
  calcularConsolidadoLdpe, 
  PRESETS_LDPE, 
  PresetLdpe 
} from '../types/calculadora';
import { MATERIALES_COEXTRUIDOS, validarEstructura } from '../data/catalogo';
import { SelectorMaterial, AvisoValidacion } from './SelectorMaterial';
import { 
  Ruler, 
  Weight, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  ArrowRight, 
  TrendingUp, 
  Layers, 
  Boxes, 
  RefreshCw, 
  Sparkles, 
  Scale, 
  Info, 
  RotateCcw,
  Sliders,
  ChevronRight,
  TrendingDown,
  Eraser
} from 'lucide-react';

export const LdpeMetersCalculator: React.FC = () => {
  // Lista de estructuras / trabajos de laminación en proceso
  const [estructuras, setEstructuras] = useState<EstructuraLdpeItem[]>([
    {
      id: 'ldpe-item-1',
      nombreEstructura: 'CE-21',
      calibreMicras: 75,
      unidadCalibre: 'micras',
      densidad: 0.92,
      anchoBobinaCm: 76.0,
      metrosALaminar: 5000,
      stockKgDisponible: 45,
      mermaLaminacionPct: 2.0,
      observaciones: 'Trabajo principal bolsa flowpack'
    },
    {
      id: 'ldpe-item-2',
      nombreEstructura: 'MCE-12',
      calibreMicras: 50,
      unidadCalibre: 'micras',
      densidad: 0.92,
      anchoBobinaCm: 76.0,
      metrosALaminar: 8000,
      stockKgDisponible: 160,
      mermaLaminacionPct: 2.0,
      observaciones: 'Laminado barrera alta luz'
    }
  ]);

  // Vista activa: 'lista' (todas las órdenes) | 'inverso' (simulador rápido)
  const [vistaActiva, setVistaActiva] = useState<'lista' | 'inverso'>('lista');

  // Estado para el simulador inverso
  const [simuladorKilos, setSimuladorKilos] = useState<number>(100);
  const [simuladorCodigo, setSimuladorCodigo] = useState<string>('CE-21');
  const [simuladorCalibre, setSimuladorCalibre] = useState<number>(75);
  const simuladorEstructuraId = `${simuladorCodigo}_${simuladorCalibre}`;
  const [simuladorAnchoCm, setSimuladorAnchoCm] = useState<number>(76.0);
  const [simuladorMermaPct, setSimuladorMermaPct] = useState<number>(2.0);

  // Notificación de copiado
  const [copied, setCopied] = useState<boolean>(false);

  // Ejecución del cálculo consolidado reactivo
  const resumen: ResumenConsolidadoLdpe = useMemo(() => {
    return calcularConsolidadoLdpe(estructuras);
  }, [estructuras]);

  // Manejo de actualización de campos de una estructura
  const handleUpdateItem = (id: string, updates: Partial<EstructuraLdpeItem>) => {
    setEstructuras(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, ...updates };

      // Si cambió de unidad o calibre en galgas/micras
      if (updates.calibreMicras !== undefined && updated.unidadCalibre === 'galgas') {
        // mantener sincronía
      }
      return updated;
    }));
  };

  // Agregar nueva estructura a partir de un preset
  const handleAddPreset = (preset: PresetLdpe) => {
    const newItem: EstructuraLdpeItem = {
      id: `ldpe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nombreEstructura: preset.codigo,
      descripcion: preset.descripcion,
      calibreMicras: preset.calibreMicras,
      unidadCalibre: 'micras',
      densidad: preset.densidad,
      anchoBobinaCm: preset.anchoDefaultCm,
      metrosALaminar: 4000,
      stockKgDisponible: 50,
      mermaLaminacionPct: 2.0
    };
    setEstructuras(prev => [...prev, newItem]);
  };

  // Eliminar una estructura
  const handleDeleteItem = (id: string) => {
    if (estructuras.length <= 1) {
      // Limpiar en vez de borrar todo
      handleUpdateItem(id, {
        metrosALaminar: 0,
        stockKgDisponible: 0
      });
      return;
    }
    setEstructuras(prev => prev.filter(item => item.id !== id));
  };

  // Restablecer a valores de fábrica
  const handleReset = () => {
    setEstructuras([
      {
        id: 'ldpe-item-1',
        nombreEstructura: 'CE-21',
        calibreMicras: 75,
        unidadCalibre: 'micras',
        densidad: 0.92,
        anchoBobinaCm: 76.0,
        metrosALaminar: 5000,
        stockKgDisponible: 45,
        mermaLaminacionPct: 2.0,
        observaciones: 'Trabajo principal bolsa flowpack'
      },
      {
        id: 'ldpe-item-2',
        nombreEstructura: 'MCE-12',
        calibreMicras: 50,
        unidadCalibre: 'micras',
        densidad: 0.92,
        anchoBobinaCm: 76.0,
        metrosALaminar: 8000,
        stockKgDisponible: 160,
        mermaLaminacionPct: 2.0,
        observaciones: 'Laminado barrera alta luz'
      }
    ]);
  };

  // Limpiar todo el stock de LDPE (poner en 0 kg todas las estructuras)
  const handleClearAllStock = () => {
    setEstructuras(prev => prev.map(item => ({
      ...item,
      stockKgDisponible: 0
    })));
  };

  // Copiar reporte completo de producción
  const handleCopyReport = () => {
    let texto = `📊 REPORTE DE CONSUMO Y STOCK DE LDPE (LAMINACIÓN)\n`;
    texto += `Fecha: ${new Date().toLocaleDateString('es-MX')} | Órdenes: ${resumen.totalEstructuras}\n`;
    texto += `--------------------------------------------------------\n\n`;

    resumen.items.forEach((item, index) => {
      texto += `🔹 ESTRUCTURA #${index + 1}: ${item.nombreEstructura} (${item.calibreMicras}µm | Ancho: ${item.anchoBobinaCm} cm)\n`;
      texto += `   • Metros a laminar: ${item.metrosALaminar.toLocaleString()} m\n`;
      texto += `   • Gramaje: ${item.gramajeGsm} g/m² | Rendimiento: ${item.rendimientoMLKg} m/kg\n`;
      texto += `   • LDPE requerido: ${item.kgRequeridosTotal.toFixed(2)} kg (Teórico: ${item.kgTeoricos.toFixed(2)} kg + Merma: ${item.kgMerma.toFixed(2)} kg)\n`;
      texto += `   • Stock disponible: ${item.stockKgDisponible.toFixed(2)} kg (${item.porcentajeCobertura.toFixed(1)}% cobertura)\n`;
      if (item.alcanza) {
        texto += `   • Estado: ✅ ALCANZA PERFECTO (Sobran ${item.kgSobrantes.toFixed(2)} kg / ~${item.metrosSobrantes.toLocaleString()} m)\n`;
      } else {
        texto += `   • Estado: ⚠️ NO ALCANZA (FALTAN ${item.kgFaltantes.toFixed(2)} kg / ~${item.metrosFaltantes.toLocaleString()} m)\n`;
        texto += `   • Con el stock actual sólo alcanzas a laminar: ${item.metrosAlcanzablesConStock.toLocaleString()} m\n`;
      }
      texto += `\n`;
    });

    texto += `--------------------------------------------------------\n`;
    texto += `📌 TOTALES CONSOLIDADOS:\n`;
    texto += `• Total Metros a Laminar: ${resumen.totalMetrosALaminar.toLocaleString()} m\n`;
    texto += `• Total LDPE Requerido: ${resumen.totalKgRequeridos.toFixed(2)} kg\n`;
    texto += `• Total LDPE en Stock: ${resumen.totalKgStock.toFixed(2)} kg\n`;
    if (resumen.totalKgFaltantes > 0) {
      texto += `• ⚠️ DÉFICIT TOTAL A COMPRAR/SOLICITAR: ${resumen.totalKgFaltantes.toFixed(2)} kg (~${resumen.totalMetrosFaltantes.toLocaleString()} m faltantes en ${resumen.estructurasConFaltante} estructura(s))\n`;
    } else {
      texto += `• ✅ TODO EL PROGRAMA ESTÁ CUBIERTO (Sobrante global neto: +${resumen.totalKgSobrantes.toFixed(2)} kg)\n`;
    }

    navigator.clipboard.writeText(texto);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Cálculo del simulador inverso
  const simuladorResultado = useMemo(() => {
    const preset = PRESETS_LDPE.find(p => p.id === simuladorEstructuraId) || PRESETS_LDPE[0];
    const itemSimulado: EstructuraLdpeItem = {
      id: 'simulado',
      nombreEstructura: preset.codigo,
      calibreMicras: simuladorCalibre,
      unidadCalibre: 'micras',
      densidad: preset.densidad,
      anchoBobinaCm: simuladorAnchoCm,
      metrosALaminar: 1000,
      stockKgDisponible: simuladorKilos,
      mermaLaminacionPct: simuladorMermaPct
    };
    const res = calcularItemLdpe(itemSimulado);

    // Con simuladorKilos, ¿cuántos metros reales se laminan?
    return {
      preset,
      calibreIngresado: simuladorCalibre,
      gramaje: res.gramajeGsm,
      rendimientoMLKg: res.rendimientoMLKg,
      metrosTotalesConStock: res.metrosAlcanzablesConStock,
      metrosSinMerma: res.gramajeGsm > 0 
        ? Math.floor((simuladorKilos * 1000) / ((simuladorAnchoCm / 100) * res.gramajeGsm))
        : 0
    };
  }, [simuladorKilos, simuladorEstructuraId, simuladorCalibre, simuladorAnchoCm, simuladorMermaPct]);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. Header Banner & Context */}
      <div className="card-dark p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs bg-accent/20 text-accent-ink border border-accent/30 px-2 py-0.5 rounded font-bold ">
                Laminación de polietileno LDPE
              </span>
              <span className="font-mono text-xs bg-white/5 text-white/70 border border-white/10 px-2 py-0.5 rounded">
                CE-20 • CE-21 • CE-11 • MCE-12 • MCE-31
              </span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <Ruler className="w-6 h-6 text-accent-ink" />
              <span>Calculadora de Metros en LDPE</span>
            </h2>
            <p className="text-xs sm:text-sm text-white/70 max-w-3xl leading-relaxed">
              Calcula con precisión los <strong>kilogramos de LDPE a consumir</strong> al laminar a partir de los 
              <strong> metros lineales</strong>, el <strong>calibre</strong> y el <strong>tipo de estructura</strong>. 
              Compara contra tu <strong>stock en almacén</strong> y detecta al instante si te alcanza o 
              <strong> cuántos metros y kilos te faltan</strong>.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
            <button
              type="button"
              onClick={handleCopyReport}
              className="btn-dark-secondary px-3.5 py-2 text-xs flex items-center gap-2 font-mono hover:border-accent transition-colors"
              title="Copiar reporte consolidado para WhatsApp o compras"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-white/70" />
                  <span>Copiar Reporte</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleClearAllStock}
              className="btn-dark-secondary px-3 py-2 text-xs flex items-center gap-1.5 font-mono text-purple-300 border-purple-500/40 hover:border-purple-300 hover:bg-purple-950/40 transition-colors"
              title="Poner en 0 kg el stock de todas las estructuras de LDPE"
            >
              <Eraser className="w-3.5 h-3.5 text-purple-400" />
              <span>Limpiar Stock (0 kg)</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="btn-dark-secondary px-3 py-2 text-xs flex items-center gap-1.5 font-mono hover:border-white/40 transition-colors"
              title="Restablecer valores de prueba"
            >
              <RotateCcw className="w-3.5 h-3.5 text-white/70" />
              <span className="hidden sm:inline">Restablecer</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs: Órdenes de Laminación vs Simulador Inverso */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setVistaActiva('lista')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              vistaActiva === 'lista'
                ? 'bg-accent text-white shadow-md shadow-accent/20'
                : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>1. Control de Órdenes & Stock ({estructuras.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setVistaActiva('inverso')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              vistaActiva === 'inverso'
                ? 'bg-accent text-white shadow-md shadow-accent/20'
                : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>2. Simulador Inverso (Kilos → Metros Rindentes)</span>
          </button>
        </div>
      </div>

      {/* VISTA 1: CONTROL DE ÓRDENES Y STOCK */}
      {vistaActiva === 'lista' && (
        <div className="space-y-6">

          {/* Quick Presets Catalog Bar */}
          <div className="card-dark p-4 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="meta-label flex items-center gap-1.5 text-white">
                  <Sparkles className="w-3.5 h-3.5 text-accent-ink" />
                  <span>Materiales del catálogo (CE y MCE) con sus calibres válidos:</span>
                </span>
                <p className="text-xs text-white/62 mt-0.5">
                  Agrega el material con el calibre de tu bobina de almacén. Solo se ofrecen los <strong className="text-white">calibres válidos</strong> de cada material.
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {PRESETS_LDPE.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleAddPreset(preset)}
                  className="px-2.5 py-1.5 rounded bg-white/[0.04] border border-white/10 hover:border-accent/50 hover:bg-accent/10 text-left transition-all group cursor-pointer"
                >
                  <div className="text-xs font-bold text-white group-hover:text-accent-ink flex items-center gap-1.5">
                    <span>{preset.codigo}</span>
                    <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">
                      {preset.calibreMicras} µm
                    </span>
                  </div>
                  <div className="text-xs text-white/55 truncate max-w-[170px]">
                    {preset.descripcion}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* HERO SUMMARY DIAGNOSTIC BAR (Semáforo Global) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Tarjeta 1: Metros a Laminar */}
            <div className="card-dark p-4 space-y-1 border-t-2 border-t-blue-500">
              <span className="meta-label">Total Metros a Laminar</span>
              <div className="font-mono text-2xl lg:text-3xl font-bold text-white">
                {resumen.totalMetrosALaminar.toLocaleString()} <span className="text-sm text-white/62 font-normal">m</span>
              </div>
              <p className="text-xs text-white/62">
                Sumatoria en {resumen.totalEstructuras} estructura(s) programadas
              </p>
            </div>

            {/* Tarjeta 2: Kilos de LDPE Requeridos */}
            <div className="card-dark p-4 space-y-1 border-t-2 border-t-accent">
              <span className="meta-label">LDPE Total Requerido</span>
              <div className="font-mono text-2xl lg:text-3xl font-bold text-accent-ink">
                {resumen.totalKgRequeridos.toFixed(2)} <span className="text-sm text-white/62 font-normal">kg</span>
              </div>
              <p className="text-xs text-white/62">
                Incluye merma de laminadora y arranque
              </p>
            </div>

            {/* Tarjeta 3: Stock Disponible en Almacén */}
            <div className="card-dark p-4 space-y-1 border-t-2 border-t-purple-500">
              <div className="flex items-center justify-between">
                <span className="meta-label">LDPE en Stock</span>
                <button
                  type="button"
                  onClick={handleClearAllStock}
                  className="text-xs text-purple-400 hover:text-purple-200 hover:underline flex items-center gap-1 cursor-pointer"
                  title="Poner stock de todas las estructuras en 0 kg"
                >
                  <Eraser className="w-3 h-3" />
                  <span>Limpiar (0 kg)</span>
                </button>
              </div>
              <div className="font-mono text-2xl lg:text-3xl font-bold text-purple-300">
                {resumen.totalKgStock.toFixed(2)} <span className="text-sm text-white/62 font-normal">kg</span>
              </div>
              <p className="text-xs text-white/62">
                Existencias registradas en bobinas
              </p>
            </div>

            {/* Tarjeta 4: Balance / Diagnóstico Final (ALCANZA o FALTAN) */}
            <div className={`card-dark p-4 space-y-1 border-t-2 ${
              resumen.estructurasConFaltante > 0 ? 'border-t-rose-500 bg-rose-500/5' : 'border-t-emerald-500 bg-emerald-500/5'
            }`}>
              <span className="meta-label flex items-center justify-between">
                <span>Diagnóstico Global</span>
                {resumen.estructurasConFaltante > 0 ? (
                  <span className="text-xs font-bold text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded">Déficit</span>
                ) : (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">Cubierto</span>
                )}
              </span>
              
              {resumen.estructurasConFaltante > 0 ? (
                <>
                  <div className="font-mono text-2xl font-bold text-rose-400">
                    -{resumen.totalKgFaltantes.toFixed(2)} <span className="text-sm text-rose-300 font-normal">kg</span>
                  </div>
                  <p className="text-xs text-rose-300/80 font-bold">
                    ⚠️ Faltan ~{resumen.totalMetrosFaltantes.toLocaleString()} m en {resumen.estructurasConFaltante} orden(es)
                  </p>
                </>
              ) : (
                <>
                  <div className="font-mono text-2xl font-bold text-emerald-400">
                    +{resumen.totalKgSobrantes.toFixed(2)} <span className="text-sm text-emerald-300 font-normal">kg</span>
                  </div>
                  <p className="text-xs text-emerald-300/80">
                    ✅ Stock 100% suficiente con reserva
                  </p>
                </>
              )}
            </div>

          </div>

          {/* LIST OF STRUCTURES (CARDS INTERACTIVAS CON INPUTS Y DIAGNÓSTICO EN TIEMPO REAL) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-white/80 flex items-center gap-2">
                <Layers className="w-4 h-4 text-accent-ink" />
                <span>Detalle de Estructuras y Control de Bobinas</span>
              </h3>
              <span className="text-xs text-white/55">
                {estructuras.length} estructura(s) configurada(s)
              </span>
            </div>

            {estructuras.map((item, index) => {
              const res = calcularItemLdpe(item);
              const esDéficit = !res.alcanza;

              return (
                <div 
                  key={item.id}
                  className={`card-dark p-5 space-y-4 transition-all border ${
                    esDéficit ? 'border-rose-500/40 bg-rose-500/[0.05]' : 'border-emerald-500/30'
                  }`}
                >
                  {/* Top Bar of the Item */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded bg-white/10 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <SelectorMaterial
                            idBase={`ldpe-${index + 1}`}
                            nombre={item.nombreEstructura}
                            micras={item.calibreMicras}
                            codigosPermitidos={MATERIALES_COEXTRUIDOS.map(m => m.codigo)}
                            onChange={(sel) => handleUpdateItem(item.id, {
                              nombreEstructura: sel.nombre,
                              densidad: sel.densidad,
                              calibreMicras: sel.micras
                            })}
                          />
                          <span className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70">
                            {res.gramajeGsm.toFixed(2)} g/m²
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {/* Estado Badge */}
                      {res.alcanza ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ALCANZA (+{res.kgSobrantes.toFixed(1)} kg)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/20 border border-rose-500/40 text-rose-400 font-mono text-xs font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>FALTAN {res.kgFaltantes.toFixed(1)} KG (~{res.metrosFaltantes.toLocaleString()} m)</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded bg-white/5 text-white/55 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Eliminar estructura"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <AvisoValidacion errores={validarEstructura([{ nombre: item.nombreEstructura, micras: item.calibreMicras }]).errores} />

                  {/* Two Main Operational Panels: 1. Almacén (Calibre y Stock que tú defines) | 2. Trabajo en Máquina */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    
                    {/* PANEL A: DATOS EN TU ALMACÉN (Stock & Calibre que tú pones) */}
                    <div className="lg:col-span-6 bg-purple-950/20 border border-purple-500/40 rounded-lg p-4 space-y-3 shadow-inner">
                      <div className="flex flex-wrap items-center justify-between gap-1 border-b border-purple-500/20 pb-2">
                        <span className="font-mono text-xs font-bold text-purple-200 flex items-center gap-1.5">
                          <Boxes className="w-4 h-4 text-purple-400" />
                          <span>En almacén: stock y calibre de bobina</span>
                        </span>
                        <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded">
                          Calibre del catálogo
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Calibre en almacén: se elige arriba, del catálogo */}
                        <div className="space-y-1.5">
                          <span className="meta-label text-purple-100 font-bold">Calibre en almacén</span>
                          <div className="input-dark w-full px-3 py-2 text-base font-bold font-mono">
                            {item.calibreMicras} µm
                          </div>
                          <span className="text-xs text-white/65 block">
                            Equivalente: {Number((item.calibreMicras * 4).toFixed(1))} galgas · d: {item.densidad}
                          </span>
                          <span className="text-xs text-white/55 block">Se cambia en el selector de la estructura</span>
                        </div>

                        {/* Stock en Almacén (Kg) */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="meta-label text-purple-200 font-bold">
                              Kilos LDPE en Almacén (Stock)
                            </label>
                            <button
                              type="button"
                              onClick={() => handleUpdateItem(item.id, { stockKgDisponible: 0 })}
                              className="text-xs text-purple-400 hover:text-purple-200 hover:underline flex items-center gap-1 cursor-pointer"
                              title="Poner en 0 kg el stock de esta estructura"
                            >
                              <Eraser className="w-2.5 h-2.5" />
                              <span>Limpiar (0 kg)</span>
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={item.stockKgDisponible ?? ''}
                              onChange={(e) => handleUpdateItem(item.id, { stockKgDisponible: Math.max(0, parseFloat(e.target.value) || 0) })}
                              className="input-dark w-full px-3 py-2 text-base font-bold text-purple-200 font-mono border-purple-500/50 focus:border-purple-300"
                              placeholder="0"
                            />
                            <span className="absolute right-2.5 top-2.5 text-xs text-purple-300 font-bold pointer-events-none">kg</span>
                          </div>

                          {/* Quick Stock Pills */}
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateItem(item.id, { stockKgDisponible: 0 })}
                              className={`px-1.5 py-0.5 rounded text-xs transition-colors ${
                                item.stockKgDisponible === 0 
                                  ? 'bg-rose-500/40 text-rose-200 border border-rose-500/50 font-bold' 
                                  : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              0 kg
                            </button>
                            {[20, 45, 60, 100, 150, 250, 500].map(k => (
                              <button
                                key={k}
                                type="button"
                                onClick={() => handleUpdateItem(item.id, { stockKgDisponible: k })}
                                className={`px-1.5 py-0.5 rounded text-xs transition-colors ${
                                  item.stockKgDisponible === k 
                                    ? 'bg-purple-600 text-white font-bold' 
                                    : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
                                }`}
                              >
                                {k}k
                              </button>
                            ))}
                          </div>
                          <span className="text-xs text-white/55 block">
                            Existencia física en almacén
                          </span>
                        </div>
                      </div>

                      {/* Densidad y Gramaje */}
                      <div className="pt-2 border-t border-purple-500/20 flex flex-wrap items-center justify-between text-xs text-white/70">
                        <div className="flex items-center gap-2">
                          <span>Densidad film:</span>
                          <input
                            type="number"
                            min="0.5"
                            max="1.5"
                            step="0.01"
                            value={item.densidad ?? 0.92}
                            onChange={(e) => handleUpdateItem(item.id, { densidad: Math.max(0.5, parseFloat(e.target.value) || 0.92) })}
                            className="bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-xs font-bold text-white w-16 text-center"
                          />
                          <span className="text-xs text-white/55">g/cm³</span>
                        </div>
                        <div>
                          Gramaje resultante: <strong className="text-purple-300">{res.gramajeGsm.toFixed(2)} g/m²</strong>
                        </div>
                      </div>
                    </div>

                    {/* PANEL B: ORDEN A LAMINAR (Metros & Máquina) */}
                    <div className="lg:col-span-6 bg-black/40 border border-white/10 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                          <Ruler className="w-4 h-4 text-accent-ink" />
                          <span>Trabajo a laminar: tirada en máquina</span>
                        </span>
                        <span className="text-xs text-white/62">
                          Parámetros de producción
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Metros a Laminar */}
                        <div className="space-y-1.5">
                          <label className="meta-label text-accent-ink font-bold">
                            Metros Lineales a Laminar (m)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="100"
                              value={item.metrosALaminar ?? ''}
                              onChange={(e) => handleUpdateItem(item.id, { metrosALaminar: Math.max(0, parseFloat(e.target.value) || 0) })}
                              className="input-dark w-full px-3 py-2 text-base font-bold text-white font-mono focus:border-accent"
                            />
                            <span className="absolute right-2.5 top-2.5 text-xs text-white/55 pointer-events-none">m</span>
                          </div>
                          {/* Metros Quick Buttons */}
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {[1000, 3000, 5000, 8000, 10000, 20000].map(m => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => handleUpdateItem(item.id, { metrosALaminar: m })}
                                className={`px-1.5 py-0.5 rounded text-xs transition-colors ${
                                  item.metrosALaminar === m 
                                    ? 'bg-accent text-white font-bold' 
                                    : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
                                }`}
                              >
                                {m >= 1000 ? `${m/1000}k` : m}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Ancho y Merma */}
                        <div className="space-y-2.5">
                          {/* Ancho Bobina */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="meta-label">Ancho Bobina LDPE (cm)</label>
                              <div className="flex gap-1">
                                {[75, 76, 80, 100].map(w => (
                                  <button
                                    key={w}
                                    type="button"
                                    onClick={() => handleUpdateItem(item.id, { anchoBobinaCm: w })}
                                    className={`px-1 py-0.2 rounded text-xs ${
                                      item.anchoBobinaCm === w ? 'bg-accent text-white' : 'bg-white/5 text-white/62'
                                    }`}
                                  >
                                    {w}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <input
                              type="number"
                              min="1"
                              step="0.5"
                              value={item.anchoBobinaCm ?? ''}
                              onChange={(e) => handleUpdateItem(item.id, { anchoBobinaCm: Math.max(0.1, parseFloat(e.target.value) || 0) })}
                              className="input-dark w-full px-2.5 py-1.5 text-sm font-bold text-white font-mono"
                            />
                          </div>

                          {/* Merma Laminación */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="meta-label">Merma Laminación (%)</label>
                              <div className="flex gap-1">
                                {[0, 1.5, 2, 3, 5].map(p => (
                                  <button
                                    key={p}
                                    type="button"
                                    onClick={() => handleUpdateItem(item.id, { mermaLaminacionPct: p })}
                                    className={`px-1 py-0.2 rounded text-xs ${
                                      item.mermaLaminacionPct === p ? 'bg-accent text-white' : 'bg-white/5 text-white/62'
                                    }`}
                                  >
                                    {p}%
                                  </button>
                                ))}
                              </div>
                            </div>
                            <input
                              type="number"
                              min="0"
                              max="30"
                              step="0.5"
                              value={item.mermaLaminacionPct ?? ''}
                              onChange={(e) => handleUpdateItem(item.id, { mermaLaminacionPct: Math.max(0, parseFloat(e.target.value) || 0) })}
                              className="input-dark w-full px-2.5 py-1.5 text-sm font-bold text-white font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-white/62">
                        <span>Consumo Teórico Neto: <strong className="text-white">{res.kgTeoricos.toFixed(2)} kg</strong></span>
                        <span>+ Merma ({res.mermaLaminacionPct}%): <strong className="text-accent-ink">+{res.kgMerma.toFixed(2)} kg</strong></span>
                      </div>
                    </div>

                  </div>

                  {/* BOTTOM RESULTS & METRIC BREAKDOWN FOR THIS SPECIFIC STRUCTURE */}
                  <div className="p-3.5 bg-black/40 rounded-lg border border-white/10 space-y-3">
                    
                    {/* Diagnostic Callout */}
                    <div className={`p-3 rounded border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      esDéficit 
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-200' 
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    }`}>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          {esDéficit ? (
                            <>
                              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                              <span className="text-rose-400">El stock no alcanza para laminar {item.metrosALaminar.toLocaleString()} metros</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span className="text-emerald-400">El stock es suficiente para cubrir la orden completa</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs opacity-90">
                          {esDéficit ? (
                            <>
                              Con tus <strong>{res.stockKgDisponible.toFixed(1)} kg</strong> en stock sólo alcanzas a laminar 
                              <strong className="text-white font-bold ml-1">{res.metrosAlcanzablesConStock.toLocaleString()} m</strong>.
                              Te faltan aproximadamente <strong className="text-white font-bold ml-1">{res.metrosFaltantes.toLocaleString()} metros</strong> 
                              {' '}(Déficit de <strong className="text-rose-300 ml-1">{res.kgFaltantes.toFixed(2)} kg</strong> de {item.nombreEstructura}).
                            </>
                          ) : (
                            <>
                              Consumirás <strong>{res.kgRequeridosTotal.toFixed(2)} kg</strong> de tus <strong>{res.stockKgDisponible.toFixed(2)} kg</strong>.
                              Te sobrarán en bobina aproximadamente <strong className="text-emerald-300 ml-1">+{res.kgSobrantes.toFixed(2)} kg</strong> 
                              {' '}(Equivalentes a <strong className="text-white ml-1">~{res.metrosSobrantes.toLocaleString()} metros</strong> de reserva).
                            </>
                          )}
                        </p>
                      </div>

                      {/* Visual Coverage Bar */}
                      <div className="w-full md:w-56 shrink-0 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="opacity-70">Cobertura de Stock:</span>
                          <span className="font-bold">{res.porcentajeCobertura.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              esDéficit ? 'bg-rose-500' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${Math.min(100, res.porcentajeCobertura)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Detailed Numbers Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                      <div className="p-2 rounded bg-white/[0.02] border border-white/5 space-y-0.5">
                        <span className="text-xs text-white/55 block">LDPE Teórico Neto</span>
                        <div className="text-white font-bold text-sm">
                          {res.kgTeoricos.toFixed(2)} <span className="text-xs text-white/62 font-normal">kg</span>
                        </div>
                        <span className="text-xs text-white/55 block">0% merma</span>
                      </div>

                      <div className="p-2 rounded bg-white/[0.02] border border-white/5 space-y-0.5">
                        <span className="text-xs text-white/55 block">+ Merma Laminación ({res.mermaLaminacionPct}%)</span>
                        <div className="text-accent-ink font-bold text-sm">
                          +{res.kgMerma.toFixed(2)} <span className="text-xs text-white/62 font-normal">kg</span>
                        </div>
                        <span className="text-xs text-white/55 block">Ajuste y arranques</span>
                      </div>

                      <div className="p-2 rounded bg-white/[0.02] border border-white/5 space-y-0.5">
                        <span className="text-xs text-accent-ink font-bold block">Total a Usar / Pedir</span>
                        <div className="text-white font-bold text-base text-accent-ink">
                          {res.kgRequeridosTotal.toFixed(2)} <span className="text-xs text-white/62 font-normal">kg</span>
                        </div>
                        <span className="text-xs text-white/55 block">Consumo total requerido</span>
                      </div>

                      <div className="p-2 rounded bg-white/[0.02] border border-white/5 space-y-0.5">
                        <span className="text-xs text-white/55 block">Rendimiento Físico</span>
                        <div className="text-white font-bold text-sm">
                          {res.rendimientoMLKg.toFixed(2)} <span className="text-xs text-white/62 font-normal">m/kg</span>
                        </div>
                        <span className="text-xs text-white/55 block">
                          {res.rendimientoM2Kg.toFixed(2)} m²/kg
                        </span>
                      </div>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>

          {/* TABLA INDUSTRIAL CONSOLIDADA (RESUMEN PARA DESPACHO / COMPRAS) */}
          <div className="card-dark p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-accent-ink" />
                <span>Balance de LDPE: tabla comparativa</span>
              </h3>
              <span className="text-xs text-white/62">
                Laminación continua en base {estructuras[0]?.anchoBobinaCm || 76} cm
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/62 text-xs ">
                    <th className="py-2.5 px-3">Estructura</th>
                    <th className="py-2.5 px-3 text-accent-ink">Calibre Almacén</th>
                    <th className="py-2.5 px-3">Gramaje</th>
                    <th className="py-2.5 px-3">Ancho</th>
                    <th className="py-2.5 px-3 text-right">Metros a Laminar</th>
                    <th className="py-2.5 px-3 text-right">LDPE Requerido</th>
                    <th className="py-2.5 px-3 text-right text-purple-300">Stock en Almacén</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                    <th className="py-2.5 px-3 text-right">Faltante / Sobrante</th>
                    <th className="py-2.5 px-3 text-right">Metros Faltantes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {resumen.items.map((row) => (
                    <tr key={`table-${row.id}`} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-accent" />
                        <span>{row.nombreEstructura}</span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">{row.calibreMicras} µm</td>
                      <td className="py-2.5 px-3 text-white/70">{row.gramajeGsm.toFixed(1)} g/m²</td>
                      <td className="py-2.5 px-3 text-white/70">{row.anchoBobinaCm} cm</td>
                      <td className="py-2.5 px-3 text-right font-bold text-white">{row.metrosALaminar.toLocaleString()} m</td>
                      <td className="py-2.5 px-3 text-right font-bold text-accent-ink">{row.kgRequeridosTotal.toFixed(2)} kg</td>
                      <td className="py-2.5 px-3 text-right font-bold text-purple-300">{row.stockKgDisponible.toFixed(2)} kg</td>
                      <td className="py-2.5 px-3 text-center">
                        {row.alcanza ? (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            Cubierto
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                            Falta
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        {row.alcanza ? (
                          <span className="text-emerald-400">+{row.kgSobrantes.toFixed(2)} kg</span>
                        ) : (
                          <span className="text-rose-400">-{row.kgFaltantes.toFixed(2)} kg</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        {row.alcanza ? (
                          <span className="text-emerald-400/70">0 m</span>
                        ) : (
                          <span className="text-rose-400 font-extrabold">~{row.metrosFaltantes.toLocaleString()} m</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-white/20 bg-white/[0.02] font-bold text-white">
                    <td className="py-3 px-3 text-accent-ink">Totales</td>
                    <td className="py-3 px-3 text-white/62">-</td>
                    <td className="py-3 px-3 text-white/62">-</td>
                    <td className="py-3 px-3 text-white/62">-</td>
                    <td className="py-3 px-3 text-right text-base">{resumen.totalMetrosALaminar.toLocaleString()} m</td>
                    <td className="py-3 px-3 text-right text-base text-accent-ink">{resumen.totalKgRequeridos.toFixed(2)} kg</td>
                    <td className="py-3 px-3 text-right text-base text-purple-300">{resumen.totalKgStock.toFixed(2)} kg</td>
                    <td className="py-3 px-3 text-center">
                      {resumen.estructurasConFaltante === 0 ? (
                        <span className="text-emerald-400 text-xs">Todo en orden</span>
                      ) : (
                        <span className="text-rose-400 text-xs">{resumen.estructurasConFaltante} con déficit</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right text-base">
                      {resumen.totalKgFaltantes > 0 ? (
                        <span className="text-rose-400">-{resumen.totalKgFaltantes.toFixed(2)} kg</span>
                      ) : (
                        <span className="text-emerald-400">+{resumen.totalKgSobrantes.toFixed(2)} kg</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right text-base">
                      {resumen.totalMetrosFaltantes > 0 ? (
                        <span className="text-rose-400">~{resumen.totalMetrosFaltantes.toLocaleString()} m</span>
                      ) : (
                        <span className="text-emerald-400">0 m</span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Quick Helper Notes */}
            <div className="p-3 bg-white/[0.02] rounded border border-white/5 text-xs text-white/62 flex items-start gap-2">
              <Info className="w-4 h-4 text-accent-ink shrink-0 mt-0.5" />
              <div>
                <strong>Criterio de Cálculo:</strong> Los metros faltantes se calculan dividiendo los kilos faltantes entre el factor 
                de consumo real por metro lineal <code className="text-white/80">[(Ancho/100) × (Gramaje/1000) × (1 + Merma%)]</code>. 
                De esta forma, al pedir esos kilos faltantes cubrirás con seguridad la tirada requerida incluyendo la merma de arranque.
              </div>
            </div>

          </div>

        </div>
      )}

      {/* VISTA 2: SIMULADOR INVERSO (SI TENGO X KILOS DE LDPE, ¿CUÁNTOS METROS RINDO?) */}
      {vistaActiva === 'inverso' && (
        <div className="card-dark p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="font-display text-base font-bold tracking-tight text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-accent-ink" />
              <span>Simulador Inverso: De Kilos de LDPE en Almacén a Metros Lineales</span>
            </h3>
            <p className="text-xs text-white/70">
              ¿Encontraste una bobina en inventario o compraste un lote de kilos? Calcula inmediatamente 
              cuántos metros de laminado puedes extraer para cada estructura.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-black/40 rounded-lg border border-white/10">
            {/* Input Kilos disponibles */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="meta-label text-accent-ink">Kilos LDPE Disponibles</label>
                <button
                  type="button"
                  onClick={() => setSimuladorKilos(0)}
                  className="text-xs text-purple-400 hover:text-purple-200 hover:underline flex items-center gap-1 cursor-pointer"
                  title="Poner en 0 kg"
                >
                  <Eraser className="w-2.5 h-2.5" />
                  <span>Limpiar (0 kg)</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={simuladorKilos ?? ''}
                  onChange={(e) => setSimuladorKilos(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="input-dark w-full px-3 py-2 text-lg font-mono font-bold text-white"
                />
                <span className="absolute right-3 top-2.5 text-xs text-white/55">kg</span>
              </div>
              <div className="flex gap-1 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSimuladorKilos(0)}
                  className={`px-1.5 py-0.5 rounded text-xs transition-colors ${
                    simuladorKilos === 0 
                      ? 'bg-rose-500/40 text-rose-200 border border-rose-500/50 font-bold' 
                      : 'bg-white/5 text-white/62 hover:text-white'
                  }`}
                >
                  0k
                </button>
                {[25, 50, 100, 200, 500].map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setSimuladorKilos(k)}
                    className={`px-1.5 py-0.5 rounded text-xs transition-colors ${
                      simuladorKilos === k ? 'bg-accent text-white' : 'bg-white/5 text-white/62 hover:text-white'
                    }`}
                  >
                    {k}k
                  </button>
                ))}
              </div>
            </div>

            {/* Material y calibre del catálogo oficial */}
            <div className="space-y-1.5">
              <label className="meta-label">Material y calibre</label>
              <SelectorMaterial
                idBase="simulador-ldpe"
                nombre={simuladorCodigo}
                micras={simuladorCalibre}
                codigosPermitidos={MATERIALES_COEXTRUIDOS.map(m => m.codigo)}
                onChange={(sel) => {
                  setSimuladorCodigo(sel.nombre);
                  setSimuladorCalibre(sel.micras);
                }}
              />
              <span className="text-xs text-white/65 block">
                {simuladorCalibre * 4} galgas
              </span>
            </div>

            {/* Ancho Bobina */}
            <div className="space-y-1.5">
              <label className="meta-label">Ancho de Bobina (cm)</label>
              <input
                type="number"
                step="0.5"
                value={simuladorAnchoCm ?? ''}
                onChange={(e) => setSimuladorAnchoCm(Math.max(1, parseFloat(e.target.value) || 76))}
                className="input-dark w-full px-3 py-2 text-sm font-mono font-bold text-white"
              />
              <span className="text-xs text-white/55 block">
                Base habitual: 76.0 cm
              </span>
            </div>

            {/* Merma Estimada */}
            <div className="space-y-1.5">
              <label className="meta-label">Merma Estimada (%)</label>
              <input
                type="number"
                step="0.5"
                value={simuladorMermaPct ?? ''}
                onChange={(e) => setSimuladorMermaPct(Math.max(0, parseFloat(e.target.value) || 0))}
                className="input-dark w-full px-3 py-2 text-sm font-mono font-bold text-white"
              />
              <span className="text-xs text-white/55 block">
                Arranque y ajustes de tensión
              </span>
            </div>
          </div>

          {/* Resultado Inverso Hero Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="card-dark p-5 space-y-1 border-t-2 border-t-accent bg-accent/[0.05]">
              <span className="meta-label text-accent-ink">Metros Netos Útiles (Con Merma {simuladorMermaPct}%)</span>
              <div className="font-mono text-3xl font-bold text-white">
                {simuladorResultado.metrosTotalesConStock.toLocaleString()} <span className="text-base text-white/62 font-normal">m</span>
              </div>
              <p className="text-xs text-white/62">
                Metros garantizados que correrán en máquina
              </p>
            </div>

            <div className="card-dark p-5 space-y-1 border-t-2 border-t-blue-500">
              <span className="meta-label">Rendimiento Lineal</span>
              <div className="font-mono text-3xl font-bold text-blue-400">
                {simuladorResultado.rendimientoMLKg.toFixed(2)} <span className="text-base text-white/62 font-normal">m/kg</span>
              </div>
              <p className="text-xs text-white/62">
                Metros que rinde cada kilogramo a {simuladorAnchoCm} cm de ancho
              </p>
            </div>

            <div className="card-dark p-5 space-y-1 border-t-2 border-t-purple-500">
              <span className="meta-label">Gramaje Resultante</span>
              <div className="font-mono text-3xl font-bold text-purple-300">
                {simuladorResultado.gramaje.toFixed(2)} <span className="text-base text-white/62 font-normal">g/m²</span>
              </div>
              <p className="text-xs text-white/62">
                Densidad {simuladorResultado.preset.densidad} × {simuladorResultado.preset.calibreMicras} µm
              </p>
            </div>

          </div>

          {/* Comparativa Multi-Estructura con los mismos Kilos */}
          <div className="space-y-3 pt-2">
            <h4 className="font-display text-xs font-bold text-white/80">
              Comparativa de Rendimiento con {simuladorKilos} kg en los materiales del catálogo:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PRESETS_LDPE.map(p => {
                const g = p.densidad * p.calibreMicras;
                const mSinMerma = Math.floor((simuladorKilos * 1000) / ((simuladorAnchoCm / 100) * g));
                const mConMerma = Math.floor(mSinMerma / (1 + simuladorMermaPct / 100));
                const esSeleccionado = p.id === simuladorEstructuraId;

                return (
                  <div
                    key={`comp-${p.id}`}
                    onClick={() => { setSimuladorCodigo(p.codigo); setSimuladorCalibre(p.calibreMicras); }}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                      esSeleccionado 
                        ? 'border-accent bg-accent/10 ' 
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-white">{p.codigo}</span>
                      <span className="text-xs text-white/62">{p.calibreMicras}µm</span>
                    </div>
                    <div className="font-mono text-lg font-bold text-accent-ink mt-1">
                      {mConMerma.toLocaleString()} <span className="text-xs text-white/62 font-normal">m</span>
                    </div>
                    <div className="text-xs text-white/55 flex justify-between mt-1">
                      <span>Gramaje: {g.toFixed(1)} g/m²</span>
                      <span>Rend: {(1000 / ((simuladorAnchoCm/100) * g)).toFixed(1)} m/kg</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* 3. Reference Formula Guide Card */}
      <div className="card-dark p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-accent-ink" />
          <h4 className="font-display text-xs font-bold text-white">
            Formulario técnico: laminación de LDPE en empaque flexible
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs text-white/70">
          <div className="p-3 bg-white/[0.02] rounded border border-white/5 space-y-1">
            <span className="text-xs text-accent-ink font-bold block">1. Gramaje del Film (g/m²)</span>
            <p className="text-white font-bold">Gramaje = Densidad × Micras</p>
            <p className="text-xs text-white/55">
              Ej: CE-21 a 75 µm (0.92 × 75 = 69.00 g/m²). CE-20 a 75 µm (0.98 × 75 = 73.50 g/m²).
            </p>
          </div>

          <div className="p-3 bg-white/[0.02] rounded border border-white/5 space-y-1">
            <span className="text-xs text-accent-ink font-bold block">2. Kilos de LDPE Requeridos</span>
            <p className="text-white font-bold">Kg = [Metros × (Ancho_m) × (Gramaje/1000)] × (1 + Merma%)</p>
            <p className="text-xs text-white/55">
              Pasa metros a laminar directamente al peso exacto a montar en desbobinador.
            </p>
          </div>

          <div className="p-3 bg-white/[0.02] rounded border border-white/5 space-y-1">
            <span className="text-xs text-accent-ink font-bold block">3. Metros Faltantes Aprox.</span>
            <p className="text-white font-bold">Metros Faltantes = Kg Faltantes / Consumo por Metro</p>
            <p className="text-xs text-white/55">
              Te indica con precisión cuántos metros te faltará correr en máquina si tu stock es menor al requerido.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
