import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { MATERIALES_OFICIALES, buscarMaterial, formatoCalibre } from '../data/catalogo';

export interface SeleccionMaterial {
  nombre: string;
  densidad: number;
  micras: number;
}

interface SelectorMaterialProps {
  nombre: string;
  micras: number;
  onChange: (seleccion: SeleccionMaterial) => void;
  /** Lista de materiales permitida (por defecto, todo el catálogo). */
  codigosPermitidos?: readonly string[];
  idBase?: string;
  className?: string;
}

/**
 * Selector único de material + calibre.
 * El calibre solo ofrece los valores válidos del material elegido y la densidad
 * es la oficial del catálogo (solo lectura): no se puede escribir nada a mano.
 */
export const SelectorMaterial: React.FC<SelectorMaterialProps> = ({
  nombre,
  micras,
  onChange,
  codigosPermitidos,
  idBase,
  className = ''
}) => {
  const material = buscarMaterial(nombre);
  const materiales = codigosPermitidos
    ? MATERIALES_OFICIALES.filter(m => codigosPermitidos.includes(m.codigo))
    : MATERIALES_OFICIALES;

  const calibreValido = !!material && material.calibres.some(c => Math.abs(c - micras) < 1e-9);

  const elegirMaterial = (codigo: string) => {
    const m = buscarMaterial(codigo);
    if (!m) return;
    // Conserva el calibre si también existe en el material nuevo; si no, usa el primero válido.
    const conservar = m.calibres.find(c => Math.abs(c - micras) < 1e-9);
    onChange({ nombre: m.codigo, densidad: m.densidad, micras: conservar ?? m.calibres[0] });
  };

  const elegirCalibre = (valor: string) => {
    if (!material) return;
    onChange({ nombre: material.codigo, densidad: material.densidad, micras: parseFloat(valor) });
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <select
        id={idBase ? `${idBase}-material` : undefined}
        aria-label="Material"
        value={material ? material.codigo : nombre}
        onChange={(e) => elegirMaterial(e.target.value)}
        className="input-dark px-2.5 py-1.5 text-xs font-bold min-w-[130px] flex-1"
      >
        {!material && <option value={nombre}>{nombre || 'Sin material'} (fuera de catálogo)</option>}
        {materiales.map(m => (
          <option key={m.codigo} value={m.codigo}>{m.codigo}</option>
        ))}
      </select>

      <label className="flex items-center gap-1.5 text-xs text-white/65">
        <span>Calibre</span>
        <select
          id={idBase ? `${idBase}-calibre` : undefined}
          aria-label="Calibre en micras"
          value={String(micras)}
          onChange={(e) => elegirCalibre(e.target.value)}
          disabled={!material}
          className={`input-dark px-2 py-1.5 text-xs font-bold min-w-[84px] ${calibreValido ? '' : 'border-rose-500'}`}
        >
          {!calibreValido && (
            <option value={String(micras)}>{formatoCalibre(micras)} µm (no válido)</option>
          )}
          {(material?.calibres ?? []).map(c => (
            <option key={c} value={String(c)}>{formatoCalibre(c)} µm</option>
          ))}
        </select>
      </label>

      <span
        className="text-xs text-white/65 font-mono whitespace-nowrap"
        title="Densidad oficial del catálogo (solo lectura)"
      >
        d: {material ? material.densidad : '—'}
      </span>
    </div>
  );
};

interface AvisoValidacionProps {
  errores: readonly string[];
  className?: string;
}

/** Caja de errores de catálogo / combinación. No muestra nada si no hay errores. */
export const AvisoValidacion: React.FC<AvisoValidacionProps> = ({ errores, className = '' }) => {
  if (errores.length === 0) return null;
  return (
    <div
      role="alert"
      className={`rounded-lg border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-300 ${className}`}
    >
      <div className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>Corrige la estructura: los resultados no son válidos</span>
      </div>
      <ul className="mt-1.5 ml-6 list-disc space-y-0.5 text-white/80">
        {errores.map((e, i) => <li key={i}>{e}</li>)}
      </ul>
    </div>
  );
};
