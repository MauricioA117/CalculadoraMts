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
    <div id="layer-manager-container" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="meta-label text-blue-700">
              Estructura del Laminado
            </span>
            <span className="font-mono text-xs text-slate-500">
              ({tipoEstructuraNombre})
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5 font-sans">
            {permitirMonocapa && capas.length === 1 ? (
              <span>Estructura <strong className="text-blue-700">Monocapa</strong>. Gramaje de tinta editable ({gramajeTintaTotal.toFixed(1)} g/m²).</span>
            ) : (
              <span>Mínimo <strong className="text-slate-900">Bilaminado</strong>. Tinta configurable (<strong className="text-blue-700">{gramajeTintaTotal.toFixed(1)} g/m²</strong>) + Adhesivo <strong className="text-slate-900">2.0 g/m²</strong> por unión.</span>
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
              className="bg-slate-50 border border-slate-200 text-slate-900 text-xs px-3 py-1.5 rounded cursor-pointer hover:border-slate-400 focus:outline-none focus:border-blue-600"
            >
              <option value="" className="bg-white text-slate-600">Añadir material...</option>
              {CATALOGO_MATERIALES.map(mat => (
                <option key={mat.nombre} value={mat.nombre} className="bg-white text-slate-900">
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
                    ? 'bg-blue-600/[0.08] border-blue-600/50 '
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  
                  {/* Left: Index, Print Indicator & Name */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 min-w-0 sm:min-w-[240px] flex-1">
                    {/* Index tag */}
                    <div className="w-6 h-6 rounded bg-slate-100 text-slate-900 font-mono text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </div>

                    {/* Print Role Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleSetPrintLayer(capa.id)}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        isPrintLayer
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
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
                      className="w-full sm:w-auto sm:flex-1 sm:min-w-[260px]"
                      onChange={(sel) => {
                        onChange(capas.map(c => c.id === capa.id ? { ...c, ...sel } : c));
                      }}
                    />
                  </div>

                  {/* Gramaje resultante de la capa */}
                  <div className="flex items-center gap-3 text-xs">
                    <div className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-right min-w-[75px]">
                      <span className="text-slate-900 font-bold">{gramajeCapa.toFixed(1)}</span>
                      <span className="text-xs text-slate-500 ml-1">g/m²</span>
                    </div>
                  </div>

                  {/* Right: Actions (Move up/down, Delete) */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveLayer(idx, 'up')}
                      className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                      title="Mover arriba"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isLastLayer}
                      onClick={() => handleMoveLayer(idx, 'down')}
                      className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                      title="Mover abajo"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={capas.length <= minCapas}
                      onClick={() => handleRemoveLayer(capa.id)}
                      className="p-1 rounded text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                      title={capas.length <= minCapas ? (permitirMonocapa ? 'Mínimo 1 capa' : 'Mínimo 2 capas (Bilaminado)') : 'Eliminar capa'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              </div>

              {/* Editable Ink Grammage Row right after the Print Layer */}
              {isPrintLayer && (
                <div className="px-3.5 py-2.5 bg-blue-600/[0.07] border border-dashed border-blue-600/40 rounded flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span className="text-slate-900 font-bold">Tinta Digital HP Indigo ElectroInk:</span>
                    <span className="text-xs text-slate-500 hidden sm:inline">(Gramaje por m²)</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Numeric input */}
                    <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded border border-blue-600/40">
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
                        className="w-14 bg-transparent text-center font-mono font-bold text-slate-900 text-xs focus:outline-none"
                      />
                      <span className="text-xs text-blue-700 font-bold">g/m²</span>
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
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                <div className="px-3.5 py-1.5 bg-slate-50 border border-dashed border-slate-200 rounded flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    <span>Adhesivo de Laminación (Unión capa {idx + 1} y {idx + 2}):</span>
                  </div>
                  <strong className="text-slate-900 font-bold">2.0 g/m²</strong>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Structure Summary Strip */}
      <div className="mt-4 pt-3.5 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
          <span className="text-xs text-slate-500 block">Espesor Total</span>
          <span className="font-display text-base font-bold text-slate-900">{totalMicras} µm</span>
        </div>

        <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
          <span className="text-xs text-slate-500 block">Sustratos Puros</span>
          <span className="font-display text-base font-bold text-slate-900">{sumaGramajeSustratos.toFixed(1)} g/m²</span>
        </div>

        <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
          <span className="text-xs text-slate-500 block">Tinta + Adhesivo</span>
          <span className="font-display text-base font-bold text-slate-900">
            {(gramajeTintaTotal + gramajeAdhesivoTotal).toFixed(1)} g/m²
          </span>
        </div>

        <div className="p-2.5 rounded bg-blue-600/10 border border-blue-600/30">
          <span className="text-xs text-blue-700 font-bold block">Gramaje Total Estructura</span>
          <span className="font-display text-base font-bold text-slate-900">
            {gramajeEstructuraCompleta.toFixed(1)} g/m²
          </span>
        </div>
      </div>
    </div>
  );
};
