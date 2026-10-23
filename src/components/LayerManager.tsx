import React, { useState } from 'react';
import { CapaMaterial, CATALOGO_MATERIALES, MaterialCatalogo } from '../types/calculadora';
import { Trash2, Printer, ArrowUp, ArrowDown, Layers, Sparkles } from 'lucide-react';
import { validarEstructura, buscarMaterial } from '../data/catalogo';
import { SelectorMaterial, AvisoValidacion } from './SelectorMaterial';

interface LayerManagerProps {
  capas: CapaMaterial[];
  onChange: (capas: CapaMaterial[]) => void;
  permitirMonocapa?: boolean;
}

export const LayerManager: React.FC<LayerManagerProps> = ({ capas, onChange, permitirMonocapa = false }) => {
  const [selectedCatalogPreset, setSelectedCatalogPreset] = useState<string>('');

  const minCapas = permitirMonocapa ? 1 : 2;

  const handleAddLayer = (preset: MaterialCatalogo) => {
    const newId = `layer-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const isFirstLayer = capas.length === 0;

    const newLayer: CapaMaterial = {
      id: newId,
      nombre: preset.nombre,
      densidad: preset.densidad,
      micras: preset.micrasTipicas,
      gramajeTinta: isFirstLayer ? 2 : 0,
      esImpresion: isFirstLayer
    };

    // La capa sellante (CE, MCE, CPP) siempre es la última: una capa nueva
    // que no sea sellante se inserta antes de ella.
    const ultima = capas[capas.length - 1];
    const ultimaEsSellante = !!ultima && !!buscarMaterial(ultima.nombre)?.soloCapaFinal;
    if (ultimaEsSellante && !preset.soloCapaFinal) {
      onChange([...capas.slice(0, -1), newLayer, ultima]);
    } else {
      onChange([...capas, newLayer]);
    }
  };

  const handleRemoveLayer = (id: string) => {
    if (capas.length <= minCapas) return;
    const filtered = capas.filter(c => c.id !== id);
    const hasPrint = filtered.some(c => c.esImpresion);
    if (!hasPrint && filtered.length > 0) {
      filtered[0].esImpresion = true;
      filtered[0].gramajeTinta = 2; // Tinta por defecto en 2 g/m²
    }
    onChange(filtered);
  };

  const handleUpdateLayer = (id: string, field: keyof CapaMaterial, value: any) => {
    const updated = capas.map(c => {
      if (c.id === id) {
        return { ...c, [field]: value };
      }
      return c;
    });
    onChange(updated);
  };

  const handleSetPrintLayer = (id: string) => {
    const existingTinta = capas.find(c => c.esImpresion)?.gramajeTinta ?? 2.0;
    const updated = capas.map(c => ({
      ...c,
      esImpresion: c.id === id,
      gramajeTinta: c.id === id ? existingTinta : 0
    }));
    onChange(updated);
  };

  const handleMoveLayer = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= capas.length) return;
    const newCapas = [...capas];
    const temp = newCapas[index];
    newCapas[index] = newCapas[newIndex];
    newCapas[newIndex] = temp;
    onChange(newCapas);
  };

  const totalMicras = capas.reduce((acc, c) => acc + (Number(c.micras) || 0), 0);
  const sumaGramajeSustratos = capas.reduce(
    (acc, c) => acc + (Number(c.densidad) || 0) * (Number(c.micras) || 0),
    0
  );
  const numUnionesAdhesivo = Math.max(0, capas.length - 1);
  const gramajeAdhesivoTotal = numUnionesAdhesivo * 2.0;
  const printCapa = capas.find(c => c.esImpresion) || (capas.length > 0 ? capas[0] : undefined);
  const gramajeTintaTotal = printCapa && typeof printCapa.gramajeTinta === 'number' && !isNaN(printCapa.gramajeTinta)
    ? Math.max(0, printCapa.gramajeTinta)
    : (permitirMonocapa && (!printCapa || !printCapa.esImpresion) ? 0 : 2.0);
  const gramajeEstructuraCompleta = sumaGramajeSustratos + gramajeTintaTotal + gramajeAdhesivoTotal;

  const tipoEstructuraNombre = capas.length === 1
    ? 'Monocapa (1 Capa pura)'
    : capas.length === 2 
      ? 'Bilaminado (2 Capas)' 
      : capas.length === 3 
        ? 'Trilaminado (3 Capas)' 
        : `Multicapa (${capas.length} Capas)`;

  return (
    <div id="layer-manager-container" className="card-dark p-5 mb-6">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="meta-label text-accent-ink">
              Estructura del Laminado
            </span>
            <span className="font-mono text-xs text-white/55">
              ({tipoEstructuraNombre})
            </span>
          </div>
          <p className="text-xs text-white/70 mt-0.5 font-sans">
            {permitirMonocapa && capas.length === 1 ? (
              <span>Estructura <strong className="text-accent-ink">Monocapa</strong>. Gramaje de tinta editable ({gramajeTintaTotal.toFixed(1)} g/m²).</span>
            ) : (
              <span>Mínimo <strong className="text-white">Bilaminado</strong>. Tinta configurable (<strong className="text-accent-ink">{gramajeTintaTotal.toFixed(1)} g/m²</strong>) + Adhesivo <strong className="text-white">2.0 g/m²</strong> por unión.</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick preset dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedCatalogPreset}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedCatalogPreset(val);
                if (val) {
                  const preset = CATALOGO_MATERIALES.find(m => m.nombre === val);
                  if (preset) handleAddLayer(preset);
                  setSelectedCatalogPreset('');
                }
              }}
              className="bg-white/5 border border-white/10 text-white text-xs px-3 py-1.5 rounded cursor-pointer hover:border-white/30 focus:outline-none focus:border-accent"
            >
              <option value="" className="bg-surface text-white/70">Añadir material...</option>
              {CATALOGO_MATERIALES.map(mat => (
                <option key={mat.nombre} value={mat.nombre} className="bg-surface text-white">
                  {mat.nombre}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      <AvisoValidacion
        className="mb-3"
        errores={validarEstructura(capas, { requiereMinimoDosCapas: !permitirMonocapa }).errores}
      />

      {/* Layer List / Sequence Builder */}
      <div className="space-y-2.5">
        {capas.map((capa, idx) => {
          const gramajeCapa = (Number(capa.densidad) || 0) * (Number(capa.micras) || 0);
          const isPrintLayer = capa.esImpresion;
          const isLastLayer = idx === capas.length - 1;

          return (
            <React.Fragment key={capa.id}>
              {/* Material Layer Row Card */}
              <div
                className={`p-3.5 rounded border transition-all ${
                  isPrintLayer
                    ? 'bg-accent/[0.08] border-accent/50 '
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  
                  {/* Left: Index, Print Indicator & Name */}
                  <div className="flex items-center gap-3 min-w-[240px] flex-1">
                    {/* Index tag */}
                    <div className="w-6 h-6 rounded bg-white/10 text-white font-mono text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </div>

                    {/* Print Role Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleSetPrintLayer(capa.id)}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        isPrintLayer
                          ? 'bg-accent text-white shadow-sm'
                          : 'bg-white/5 text-white/62 border border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                      title={isPrintLayer ? 'Capa de Impresión (Define ML)' : 'Hacer Capa de Impresión'}
                    >
                      <Printer className="w-3 h-3" />
                      <span>{isPrintLayer ? 'Impresión (rige ML)' : 'Laminación'}</span>
                    </button>

                    {/* Material y calibre del catálogo oficial */}
                    <SelectorMaterial
                      idBase={`capa-${idx + 1}`}
                      nombre={capa.nombre}
                      micras={Number(capa.micras)}
                      className="flex-1 min-w-[260px]"
                      onChange={(sel) => {
                        onChange(capas.map(c => c.id === capa.id ? { ...c, ...sel } : c));
                      }}
                    />
                  </div>

                  {/* Gramaje resultante de la capa */}
                  <div className="flex items-center gap-3 text-xs">
                    <div className="px-2 py-1 bg-white/5 border border-white/10 rounded text-right min-w-[75px]">
                      <span className="text-white font-bold">{gramajeCapa.toFixed(1)}</span>
                      <span className="text-xs text-white/55 ml-1">g/m²</span>
                    </div>
                  </div>

                  {/* Right: Actions (Move up/down, Delete) */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveLayer(idx, 'up')}
                      className="p-1 rounded text-white/55 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                      title="Mover arriba"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isLastLayer}
                      onClick={() => handleMoveLayer(idx, 'down')}
                      className="p-1 rounded text-white/55 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                      title="Mover abajo"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={capas.length <= minCapas}
                      onClick={() => handleRemoveLayer(capa.id)}
                      className="p-1 rounded text-white/55 hover:text-red-400 hover:bg-red-950/30 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                      title={capas.length <= minCapas ? (permitirMonocapa ? 'Mínimo 1 capa' : 'Mínimo 2 capas (Bilaminado)') : 'Eliminar capa'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              </div>

              {/* Editable Ink Grammage Row right after the Print Layer */}
              {isPrintLayer && (
                <div className="px-3.5 py-2.5 bg-accent/[0.07] border border-dashed border-accent/40 rounded flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent"></span>
                    <span className="text-white font-bold">Tinta Digital HP Indigo ElectroInk:</span>
                    <span className="text-xs text-white/62 hidden sm:inline">(Gramaje por m²)</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Numeric input */}
                    <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded border border-accent/40">
                      <input
                        type="number"
                        id={`input-ink-grammage-${capa.id}`}
                        step="0.1"
                        min="0"
                        max="20"
                        value={capa.gramajeTinta !== undefined ? capa.gramajeTinta : 2.0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          handleUpdateLayer(capa.id, 'gramajeTinta', isNaN(val) ? 0 : Math.max(0, val));
                        }}
                        className="w-14 bg-transparent text-center font-mono font-bold text-white text-xs focus:outline-none"
                      />
                      <span className="text-xs text-accent-ink font-bold">g/m²</span>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-1">
                      {[
                        { label: '0g (Sin Tinta)', val: 0 },
                        { label: '1.5g', val: 1.5 },
                        { label: '2.0g (Estándar)', val: 2.0 },
                        { label: '2.5g', val: 2.5 },
                        { label: '3.0g (Blanco/Alta)', val: 3.0 }
                      ].map(preset => {
                        const isSelected = (capa.gramajeTinta ?? 2.0) === preset.val;
                        return (
                          <button
                            key={`ink-preset-${preset.val}`}
                            type="button"
                            onClick={() => handleUpdateLayer(capa.id, 'gramajeTinta', preset.val)}
                            className={`px-1.5 py-0.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-accent text-white'
                                : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Adhesivo de laminación between layers if multicapa */}
              {!isLastLayer && (
                <div className="px-3.5 py-1.5 bg-white/[0.03] border border-dashed border-white/10 rounded flex items-center justify-between text-xs text-white/70">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span>
                    <span>Adhesivo de Laminación (Unión capa {idx + 1} y {idx + 2}):</span>
                  </div>
                  <strong className="text-white font-bold">2.0 g/m²</strong>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Structure Summary Strip */}
      <div className="mt-4 pt-3.5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded bg-white/[0.02] border border-white/5">
          <span className="text-xs text-white/55 block">Espesor Total</span>
          <span className="font-display text-base font-bold text-white">{totalMicras} µm</span>
        </div>

        <div className="p-2.5 rounded bg-white/[0.02] border border-white/5">
          <span className="text-xs text-white/55 block">Sustratos Puros</span>
          <span className="font-display text-base font-bold text-white">{sumaGramajeSustratos.toFixed(1)} g/m²</span>
        </div>

        <div className="p-2.5 rounded bg-white/[0.02] border border-white/5">
          <span className="text-xs text-white/55 block">Tinta + Adhesivo</span>
          <span className="font-display text-base font-bold text-white">
            {(gramajeTintaTotal + gramajeAdhesivoTotal).toFixed(1)} g/m²
          </span>
        </div>

        <div className="p-2.5 rounded bg-accent/10 border border-accent/30">
          <span className="text-xs text-accent-ink font-bold block">Gramaje Total Estructura</span>
          <span className="font-display text-base font-bold text-white">
            {gramajeEstructuraCompleta.toFixed(1)} g/m²
          </span>
        </div>
      </div>
    </div>
  );
};
