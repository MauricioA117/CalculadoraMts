// src/data/catalogo.ts
// ---------------------------------------------------------------------------
// FUENTE ÚNICA DE VERDAD de materiales, densidades y calibres.
// Todo selector, preset y validación de la app sale de aquí. No existen otras
// denominaciones: si un material no está en esta lista, no se puede usar.
// ---------------------------------------------------------------------------

/** Ancho estándar de bobina (cm). */
export const ANCHO_BOBINA_ESTANDAR_CM = 76;

export type FamiliaMaterial = 'BOPP' | 'CPP' | 'PET' | 'NYLON' | 'CE' | 'MCE';

export interface MaterialOficial {
  /** Código oficial y único (es también el nombre que se muestra). */
  codigo: string;
  familia: FamiliaMaterial;
  /** Densidad en g/cm³. */
  densidad: number;
  /** Únicos calibres válidos, en micras (µm). */
  calibres: readonly number[];
  /**
   * true = tiene cara sellante: solo puede ir como capa final de la estructura
   * (CE, MCE y CPP). El BOPP también sella, pero puede ir en cualquier posición
   * (p. ej. BOPP MATE como capa impresa).
   */
  soloCapaFinal: boolean;
}

export const MATERIALES_OFICIALES: readonly MaterialOficial[] = [
  { codigo: 'BOPP MATE',   familia: 'BOPP',  densidad: 0.91, calibres: [20],                                  soloCapaFinal: false },
  { codigo: 'BOPP MET',    familia: 'BOPP',  densidad: 0.91, calibres: [20],                                  soloCapaFinal: false },
  { codigo: 'BOPP NAT',    familia: 'BOPP',  densidad: 0.91, calibres: [20, 30],                              soloCapaFinal: false },
  { codigo: 'CPP NAT',     familia: 'CPP',   densidad: 0.90, calibres: [50],                                  soloCapaFinal: true  },
  { codigo: 'PET MATE',    familia: 'PET',   densidad: 1.40, calibres: [12],                                  soloCapaFinal: false },
  { codigo: 'PET MET',     familia: 'PET',   densidad: 1.40, calibres: [12],                                  soloCapaFinal: false },
  { codigo: 'PET NAT',     familia: 'PET',   densidad: 1.40, calibres: [12],                                  soloCapaFinal: false },
  { codigo: 'PET PELABLE', familia: 'PET',   densidad: 1.36, calibres: [20],                                  soloCapaFinal: false },
  { codigo: 'NYLON',       familia: 'NYLON', densidad: 1.16, calibres: [15],                                  soloCapaFinal: false },
  { codigo: 'CE-20',       familia: 'CE',    densidad: 0.98, calibres: [75],                                  soloCapaFinal: true  },
  { codigo: 'CE-21',       familia: 'CE',    densidad: 0.92, calibres: [50, 62.5, 75, 87.5, 100, 112.5],      soloCapaFinal: true  },
  { codigo: 'CE-11',       familia: 'CE',    densidad: 0.92, calibres: [55],                                  soloCapaFinal: true  },
  { codigo: 'MCE-12',      familia: 'MCE',   densidad: 0.92, calibres: [50],                                  soloCapaFinal: true  },
  { codigo: 'MCE-31',      familia: 'MCE',   densidad: 0.92, calibres: [55],                                  soloCapaFinal: true  },
];

export const NOMBRES_MATERIALES: readonly string[] = MATERIALES_OFICIALES.map(m => m.codigo);

/** Busca un material por código (sin distinguir mayúsculas ni espacios sobrantes). */
export function buscarMaterial(codigo: string | undefined | null): MaterialOficial | undefined {
  const c = (codigo ?? '').trim().toUpperCase();
  return MATERIALES_OFICIALES.find(m => m.codigo === c);
}

/** Calibres válidos de un material ([] si el código no existe). */
export function calibresDe(codigo: string | undefined | null): readonly number[] {
  return buscarMaterial(codigo)?.calibres ?? [];
}

export function esCalibreValido(codigo: string, micras: number): boolean {
  return calibresDe(codigo).some(c => Math.abs(c - micras) < 1e-9);
}

/** Materiales sellantes (CE, MCE) usados por el módulo de laminación. */
export const MATERIALES_COEXTRUIDOS: readonly MaterialOficial[] =
  MATERIALES_OFICIALES.filter(m => m.familia === 'CE' || m.familia === 'MCE');

/** Formatea un calibre sin ceros sobrantes (62.5 → "62.5", 20 → "20"). */
export function formatoCalibre(micras: number): string {
  return String(micras);
}

// ---------------------------------------------------------------------------
// Validación de estructuras
// ---------------------------------------------------------------------------

export interface CapaParaValidar {
  nombre: string;
  micras: number;
}

export interface ResultadoValidacion {
  /** Problemas que invalidan el cálculo. */
  errores: string[];
}

/**
 * Reglas:
 *  1. Cada capa debe ser un material del catálogo.
 *  2. El calibre debe estar entre los calibres válidos de ese material.
 *  3. CE, MCE y CPP (cara sellante) solo pueden ir como última capa.
 *  4. Máximo una capa sellante por estructura.
 *  5. Producción HP no admite monocapa (la tinta debe quedar encapsulada).
 */
export function validarEstructura(
  capas: readonly CapaParaValidar[],
  opciones: { requiereMinimoDosCapas?: boolean } = {}
): ResultadoValidacion {
  const errores: string[] = [];

  if (opciones.requiereMinimoDosCapas && capas.length < 2) {
    errores.push('Producción HP requiere al menos 2 capas: la tinta debe ir encapsulada.');
  }

  let sellantes = 0;
  capas.forEach((capa, idx) => {
    const pos = idx + 1;
    const mat = buscarMaterial(capa.nombre);
    if (!mat) {
      errores.push(`Capa ${pos}: "${capa.nombre}" no está en el catálogo.`);
      return;
    }
    if (!esCalibreValido(mat.codigo, Number(capa.micras))) {
      errores.push(
        `Capa ${pos}: ${mat.codigo} no existe en ${formatoCalibre(Number(capa.micras))} µm (válidos: ${mat.calibres.join(', ')} µm).`
      );
    }
    if (mat.soloCapaFinal) {
      sellantes++;
      if (capas.length > 1 && idx !== capas.length - 1) {
        errores.push(`Capa ${pos}: ${mat.codigo} tiene cara sellante y solo puede ir como capa final.`);
      }
    }
  });

  if (sellantes > 1) {
    errores.push('Solo puede haber una capa sellante (CE, MCE o CPP) en la estructura.');
  }

  return { errores };
}
