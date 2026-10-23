// types/calculadora.ts
import {
  MATERIALES_OFICIALES,
  MATERIALES_COEXTRUIDOS,
  ANCHO_BOBINA_ESTANDAR_CM,
  buscarMaterial,
  type FamiliaMaterial
} from '../data/catalogo';

export interface CapaMaterial {
  id: string;             // UUID de Supabase o identificador temporal
  nombre: string;         // Ej. 'BOPP MATE', 'PET MET'
  densidad: number;       // Factor de densidad (Ej. 0.91 para BOPP)
  micras: number;         // Calibre de la película
  gramajeTinta: number;   // Gr/m2 de tinta (normalmente 2 o 0)
  esImpresion: boolean;   // Flag para saber qué capa rige los metros lineales
}

export interface ParametrosCotizacion {
  anchoEmpaque: number;   // En centímetros
  altoEmpaque: number;    // En centímetros
  kilosSolicitados: number; // Cantidad base
  tolerancia: number;     // Porcentaje en decimal (Ej. 0.10 para 10%)
  capas: CapaMaterial[];  // Arreglo dinámico de 1 a N capas
}

export interface DetalleCapa {
  idMaterial: string;
  nombre: string;
  gramajeSustrato: number;
  gramajeTotalCapa: number;
  porcentaje: number;
  kilosRequeridos: number;
  metrosLineales: number;
  esTinta?: boolean;
  esAdhesivo?: boolean;
}

export interface ResultadoBobinaIndividual {
  anchoBobinaCm: number;
  kilos: number;
  gramajeTotal: number;
  metrosLineales: number;
  tipoEstructura: string;
  adhesivo: {
    gramajeTotal: number;
    numeroUniones: number;
  };
  tinta: {
    gramaje: number;
  };
  capasConGramaje: {
    nombre: string;
    densidad: number;
    micras: number;
    gramajeSustrato: number;
    kilosRequeridos: number;
    porcentaje: number;
  }[];
}

/**
 * Calcula los metros lineales para una bobina individual directamente con el ancho ingresado,
 * sin tolerancia (+0%) y con soporte para Monocapa (1 capa, 0 adhesivo) o Multicapa (N capas).
 */
export function calcularBobinaIndividual(
  anchoBobinaCm: number,
  kilos: number,
  capas: CapaMaterial[]
): ResultadoBobinaIndividual {
  const anchoSafe = Math.max(0.01, anchoBobinaCm || 0);
  const kilosSafe = Math.max(0, kilos || 0);
  const numCapas = capas.length;

  // 1. Gramajes de sustratos
  let sumaGramajeSustratos = 0;
  const capasDetalle = capas.map(capa => {
    const gramajeSustrato = (Number(capa.densidad) || 0) * (Number(capa.micras) || 0);
    sumaGramajeSustratos += gramajeSustrato;
    return {
      nombre: capa.nombre,
      densidad: Number(capa.densidad) || 0,
      micras: Number(capa.micras) || 0,
      gramajeSustrato
    };
  });

  // 2. Aportes de tinta y adhesivo de laminación:
  // Si es Monocapa (1 capa): NO hay uniones de laminación (0 g/m² adhesivo).
  // Si es Multicapa (>=2 capas): hay (N-1) uniones de adhesivo (2.0 g/m² por unión).
  const esMonocapa = numCapas === 1;
  const numeroUniones = Math.max(0, numCapas - 1);
  const gramajeAdhesivo = numeroUniones * GRAMAJE_ADHESIVO_POR_LAMINACION; // 0 g/m² si es monocapa
  
  // Buscar la capa de impresión o la primera capa para obtener el gramaje de tinta configurado
  const capaImpresion = capas.find(c => c.esImpresion) || (capas.length > 0 ? capas[0] : undefined);
  const gramajeTinta = capaImpresion && typeof capaImpresion.gramajeTinta === 'number' && !isNaN(capaImpresion.gramajeTinta)
    ? Math.max(0, capaImpresion.gramajeTinta)
    : (esMonocapa && (!capaImpresion || !capaImpresion.esImpresion) ? 0 : GRAMAJE_TINTA_FIJO);

  const gramajeTotal = sumaGramajeSustratos + gramajeTinta + gramajeAdhesivo;

  // 3. Conversión directa a metros lineales:
  // Metros Lineales = (Kilos * 1000) / [ GramajeTotal (g/m²) * (Ancho_Bobina_cm / 100) ]
  let metrosLineales = 0;
  if (gramajeTotal > 0 && anchoSafe > 0) {
    metrosLineales = (kilosSafe * 1000) / (gramajeTotal * (anchoSafe / 100));
  }

  const capasConGramaje = capasDetalle.map(c => {
    const porcentaje = gramajeTotal > 0 ? c.gramajeSustrato / gramajeTotal : 0;
    const kilosRequeridos = kilosSafe * porcentaje;
    return {
      ...c,
      porcentaje,
      kilosRequeridos: Number(kilosRequeridos.toFixed(2))
    };
  });

  const tipoEstructura = esMonocapa 
    ? 'Monocapa (1 Capa pura)' 
    : numCapas === 2 
      ? 'Bilaminado (2 Capas)' 
      : numCapas === 3 
        ? 'Trilaminado (3 Capas)' 
        : `Multicapa (${numCapas} Capas)`;

  return {
    anchoBobinaCm: anchoSafe,
    kilos: kilosSafe,
    gramajeTotal: Number(gramajeTotal.toFixed(2)),
    metrosLineales: Math.round(metrosLineales),
    tipoEstructura,
    adhesivo: {
      gramajeTotal: gramajeAdhesivo,
      numeroUniones
    },
    tinta: {
      gramaje: gramajeTinta
    },
    capasConGramaje
  };
}


export interface ResultadoCotizacion {
  acomodo: {
    repEje: number;
    repDesarrollo: number;
    piezasPorFrame: number;
    medidaBobinaImpresa: number; // cm, banda impresa incluyendo separaciones
    anchoUtilProducto: number; // cm, repEje × anchoEmpaque
    separacionCarrilCm: number; // cm entre carriles
    separacionesTotalCm: number; // (repEje - 1) × separación
    anchoFrame: number; // cm
    altoFrame: number;  // cm
  };
  produccion: {
    metrosLineales: number;
    totalPiezas: number;
    totalKilos: number;
    tipoEstructura: string; // 'Bilaminado', 'Trilaminado', 'Multicapa'
    gramajeTotal: number;
  };
  tinta: {
    gramaje: number; // 2.0 g/m2 fijo siempre
    porcentaje: number; // % sobre total estructura
    kilosRequeridos: number; // kg tinta
  };
  adhesivo: {
    gramajeTotal: number; // (N-1) * 2.0 g/m2
    gramajePorUnion: number; // 2.0 g/m2 fijo por interfaz
    numeroUniones: number; // N - 1
    uniones: number; // N - 1 (alias)
    porcentaje: number; // % sobre total estructura
    kilosRequeridos: number; // kg adhesivo
  };
  merma: {
    anchoBobinaNatural: number; // cm (default 76.0 cm)
    sobranteAnchoCm: number;    // 76 - anchoUtilProducto (refile + separaciones)
    refilePorLadoCm: number;    // (76 - medidaBobinaImpresa) / 2, banda centrada
    sobranteAnchoPct: number;   // (sobrante / 76) * 100
    areaDesperdicioM2: number;  // m2
    kgDesperdicioSustrato: number;   // kg sustrato impresion
    kgDesperdicioEstructura: number; // kg estructura total laminada
    kgTotalesBobina76: number;       // total kilos netos + merma
    desgloseMermaPorCapa: {
      idMaterial: string;
      nombre: string;
      kgMerma: number;
      esTinta?: boolean;
      esAdhesivo?: boolean;
    }[];
  };
  desgloseMateriales: DetalleCapa[];
}

// Constantes físicas del equipo (HP Indigo 20000/25K) y bobina natural
export const FRAME_MAX_ANCHO = 74.5; // cm
export const FRAME_MAX_ALTO = 112.5; // cm
export const SEPARACION_CARRILES_CM = 0.1; // cm entre cada carril (repetición al eje)
export const ANCHO_BOBINA_NATURAL_DEFAULT = 76.0; // cm
export const GRAMAJE_TINTA_FIJO = 2.0; // g/m² fijo siempre en digital
export const GRAMAJE_ADHESIVO_POR_LAMINACION = 2.0; // g/m² fijo por cada interfaz de laminación

export interface PresetFrame {
  id: string;
  nombre: string;
  ancho: number;
  alto: number;
  descripcion: string;
}

export const PRESETS_FRAME: PresetFrame[] = [
  {
    id: 'hp20000_25k',
    nombre: 'HP Indigo 20000 / 25K',
    ancho: FRAME_MAX_ANCHO,
    alto: FRAME_MAX_ALTO,
    descripcion: 'Estándar empaque flexible (74.5 × 112.5 cm)'
  }
];

/**
 * Determina el nombre del tipo de estructura según el número de capas de sustrato
 */
export function getTipoEstructuraNombre(numCapas: number): string {
  if (numCapas <= 1) return 'Monocapa';
  if (numCapas === 2) return 'Bilaminado (2 capas)';
  if (numCapas === 3) return 'Trilaminado (3 capas)';
  return `Multicapa (${numCapas} capas)`;
}

/**
 * Calcula la ingeniería de producción para Kronos
 * En impresión digital no existe monocapa (mínimo Bilaminado).
 * Tinta fija en 2.0 g/m² (configurable).
 * Adhesivo fijo en 2.0 g/m² por cada interfaz de laminación (Bilaminado = 2 g/m², Trilaminado = 4 g/m²).
 * Ambos se separan del cálculo de porcentaje de sustrato (BOPP/PET) para la conversión exacta a metros lineales.
 */
export function calcularIngenieriaEmpaque(
  params: ParametrosCotizacion,
  anchoBobinaNatural: number = ANCHO_BOBINA_NATURAL_DEFAULT,
  anchoFrame: number = FRAME_MAX_ANCHO,
  altoFrame: number = FRAME_MAX_ALTO
): ResultadoCotizacion {
  const { anchoEmpaque, altoEmpaque, kilosSolicitados, tolerancia, capas } = params;

  // Validación y normalización de dimensiones del frame
  const anchoFrameVal = typeof anchoFrame === 'number' && !isNaN(anchoFrame) && anchoFrame > 0
    ? anchoFrame
    : FRAME_MAX_ANCHO;
  const altoFrameVal = typeof altoFrame === 'number' && !isNaN(altoFrame) && altoFrame > 0
    ? altoFrame
    : FRAME_MAX_ALTO;

  // 1. CÁLCULO DEL FRAME (ACOMODO)
  // Cada carril al eje lleva una separación: n·ancho + (n-1)·sep ≤ frame
  const repEje = anchoEmpaque > 0
    ? Math.floor((anchoFrameVal + SEPARACION_CARRILES_CM) / (anchoEmpaque + SEPARACION_CARRILES_CM) + 1e-9)
    : 0;
  const repDesarrollo = altoEmpaque > 0 ? Math.floor(altoFrameVal / altoEmpaque + 1e-9) : 0;
  const piezasPorFrame = repEje * repDesarrollo;
  // Ancho de producto (sin separaciones): rige la conversión kg -> ML
  const anchoUtilProducto = anchoEmpaque * repEje;
  const separacionesTotalCm = Math.max(0, repEje - 1) * SEPARACION_CARRILES_CM;
  // Banda impresa completa (producto + separaciones), centrada en la bobina
  const medidaBobinaImpresa = anchoUtilProducto + separacionesTotalCm;

  // 2. ESTRUCTURA DE MATERIALES (PESOS)
  const numCapasSustrato = Math.max(1, capas.length);
  const tipoEstructura = getTipoEstructuraNombre(numCapasSustrato);

  // Aporte de tinta (editable por el usuario en la capa de impresión, por defecto 2.0 g/m²)
  const capaImpresionRaw = capas.find(c => c.esImpresion) || (capas.length > 0 ? capas[0] : undefined);
  const gramajeTintaConfig = capaImpresionRaw && typeof capaImpresionRaw.gramajeTinta === 'number' && !isNaN(capaImpresionRaw.gramajeTinta)
    ? Math.max(0, capaImpresionRaw.gramajeTinta)
    : GRAMAJE_TINTA_FIJO;

  // Aporte fijo de adhesivo: 2 g/m² por cada unión de laminación (N-1)
  // Bilaminado (2 capas) -> 1 interfaz = 2 g/m²
  // Trilaminado (3 capas) -> 2 interfaces = 4 g/m²
  const numeroUnionesLaminacion = Math.max(0, numCapasSustrato - 1);
  const gramajeAdhesivoTotal = numeroUnionesLaminacion * GRAMAJE_ADHESIVO_POR_LAMINACION;
  
  let sumaGramajeSustratos = 0;
  const capasConGramaje = capas.map(capa => {
    const gramajeSustrato = capa.densidad * capa.micras;
    sumaGramajeSustratos += gramajeSustrato;
    
    return {
      ...capa,
      gramajeSustrato,
      gramajeTinta: capa.esImpresion ? gramajeTintaConfig : 0,
      gramajeTotalCapa: gramajeSustrato // Sustrato puro
    };
  });

  // Gramaje total de la estructura = suma sustratos + tinta (configurable g/m²) + adhesivo total ((N-1)*2 g/m²)
  const gramajeEstructuraTotal = sumaGramajeSustratos + gramajeTintaConfig + gramajeAdhesivoTotal;

  // 3. CÁLCULOS DE SALIDA (PRODUCCIÓN)
  const factorCrecimiento = 1 + (tolerancia || 0);
  const totalKilos = kilosSolicitados * factorCrecimiento;

  // Encontrar la capa de impresión para el cálculo rector
  const capaImpresionObj = capasConGramaje.find(c => c.esImpresion) || capasConGramaje[0];
  const gramajeSustratoImpresion = capaImpresionObj ? capaImpresionObj.gramajeSustrato : 0;
  const porcentajeSustratoImpresion = (gramajeEstructuraTotal > 0 && gramajeSustratoImpresion > 0)
    ? gramajeSustratoImpresion / gramajeEstructuraTotal
    : 0;
  const kilosSustratoImpresion = totalKilos * porcentajeSustratoImpresion;

  // 4. CONVERSIÓN DE KILOS A METROS LINEALES
  // ML = (Kg_totales * 1000) / (Gramaje_estructura * Ancho_impreso_en_metros)
  // (equivale a pasar por el sustrato de impresión, donde el porcentaje se cancela)
  let metrosLineales = 0;
  if (gramajeEstructuraTotal > 0 && anchoUtilProducto > 0) {
    metrosLineales = (totalKilos * 1000) / (gramajeEstructuraTotal * (anchoUtilProducto / 100));
  }
  const metrosLinealesEntero = Math.round(metrosLineales);

  const totalPiezas = altoEmpaque > 0 ? ((metrosLineales * 100) / altoEmpaque) * repEje : 0;

  // Construir el desglose respetando la secuencia física de manufactura:
  // Para Bicapa: Impresión -> Tinta -> Adhesivo -> Laminación
  // Para Tricapa: Impresión -> Tinta -> Adhesivo (1-2) -> Laminación 1 -> Adhesivo (2-3) -> Laminación 2
  const desgloseMateriales: DetalleCapa[] = [];
  const desgloseMermaPorCapa: {
    idMaterial: string;
    nombre: string;
    kgMerma: number;
    esTinta?: boolean;
    esAdhesivo?: boolean;
  }[] = [];

  // Constantes de porcentaje y kilos de tinta (configurable g/m²)
  const porcentajeTinta = gramajeEstructuraTotal > 0 ? gramajeTintaConfig / gramajeEstructuraTotal : 0;
  const kilosTintaRequeridos = totalKilos * porcentajeTinta;

  // Constantes por unión de adhesivo (2 g/m² cada una)
  const porcentajePorAdhesivo = gramajeEstructuraTotal > 0 ? GRAMAJE_ADHESIVO_POR_LAMINACION / gramajeEstructuraTotal : 0;
  const kilosPorAdhesivoRequeridos = totalKilos * porcentajePorAdhesivo;

  // Recorrer capas e intercalar tinta y adhesivos en su orden físico
  capasConGramaje.forEach((capa, idx) => {
    const porcentaje = gramajeEstructuraTotal > 0 ? capa.gramajeSustrato / gramajeEstructuraTotal : 0;
    const kilosRequeridos = totalKilos * porcentaje;

    // 1. Si es la capa inicial (o de impresión), agregar primero el sustrato
    if (idx === 0) {
      desgloseMateriales.push({
        idMaterial: capa.id,
        nombre: capa.nombre,
        gramajeSustrato: Number(capa.gramajeSustrato.toFixed(2)),
        gramajeTotalCapa: Number(capa.gramajeSustrato.toFixed(2)),
        porcentaje: Number(porcentaje.toFixed(4)),
        kilosRequeridos: Number(kilosRequeridos.toFixed(2)),
        metrosLineales: metrosLinealesEntero,
        esTinta: false,
        esAdhesivo: false
      });

      // 2. Inmediatamente después del sustrato de impresión va la TINTA DIGITAL (configurable g/m²)
      desgloseMateriales.push({
        idMaterial: 'tinta_digital',
        nombre: `TINTA DIGITAL (${gramajeTintaConfig.toFixed(1)} g/m²)`,
        gramajeSustrato: gramajeTintaConfig,
        gramajeTotalCapa: gramajeTintaConfig,
        porcentaje: Number(porcentajeTinta.toFixed(4)),
        kilosRequeridos: Number(kilosTintaRequeridos.toFixed(2)),
        metrosLineales: metrosLinealesEntero,
        esTinta: true,
        esAdhesivo: false
      });
    } else {
      // Para capas subsiguientes (idx >= 1), primero va el ADHESIVO de la unión anterior con esta capa
      const adhesivoId = `adhesivo_union_${idx}`;
      const nombreAdhesivo = numeroUnionesLaminacion === 1
        ? 'ADHESIVO LAMINACIÓN (Fijo 2.0 g/m²)'
        : `ADHESIVO LAMINACIÓN (Unión ${idx}-${idx + 1} • 2.0 g/m²)`;

      desgloseMateriales.push({
        idMaterial: adhesivoId,
        nombre: nombreAdhesivo,
        gramajeSustrato: GRAMAJE_ADHESIVO_POR_LAMINACION,
        gramajeTotalCapa: GRAMAJE_ADHESIVO_POR_LAMINACION,
        porcentaje: Number(porcentajePorAdhesivo.toFixed(4)),
        kilosRequeridos: Number(kilosPorAdhesivoRequeridos.toFixed(2)),
        metrosLineales: metrosLinealesEntero,
        esTinta: false,
        esAdhesivo: true
      });

      // Luego va el sustrato de laminación
      desgloseMateriales.push({
        idMaterial: capa.id,
        nombre: capa.nombre,
        gramajeSustrato: Number(capa.gramajeSustrato.toFixed(2)),
        gramajeTotalCapa: Number(capa.gramajeSustrato.toFixed(2)),
        porcentaje: Number(porcentaje.toFixed(4)),
        kilosRequeridos: Number(kilosRequeridos.toFixed(2)),
        metrosLineales: metrosLinealesEntero,
        esTinta: false,
        esAdhesivo: false
      });
    }
  });

  // 5. CÁLCULO DE MERMA Y DESPERDICIO LATERAL (BOBINA NATURAL 76 CM)
  // La banda impresa se centra: el refile se reparte en ambas orillas.
  // La merma total incluye además las separaciones entre carriles.
  const bobinaNatural = Math.max(medidaBobinaImpresa, anchoBobinaNatural || ANCHO_BOBINA_NATURAL_DEFAULT);
  const refilePorLadoCm = Math.max(0, Number(((bobinaNatural - medidaBobinaImpresa) / 2).toFixed(2)));
  const sobranteAnchoCm = Math.max(0, Number((bobinaNatural - anchoUtilProducto).toFixed(2)));
  const sobranteAnchoPct = bobinaNatural > 0 ? Number(((sobranteAnchoCm / bobinaNatural) * 100).toFixed(2)) : 0;
  
  // Área en m2 del refile lateral
  const areaDesperdicioM2 = Number(((sobranteAnchoCm / 100) * metrosLineales).toFixed(2));
  
  // Kilos de desperdicio en sustrato de impresión
  const kgDesperdicioSustrato = Number(((areaDesperdicioM2 * gramajeSustratoImpresion) / 1000).toFixed(2));
  
  // Kilos de desperdicio en estructura completa laminada
  const kgDesperdicioEstructura = Number(((areaDesperdicioM2 * gramajeEstructuraTotal) / 1000).toFixed(2));
  
  // Kilos totales brutos requeridos de la bobina de 76 cm
  const kgTotalesBobina76 = Number((totalKilos + kgDesperdicioEstructura).toFixed(2));

  // Generar el desglose de merma en el mismo orden exacto del desgloseMateriales
  desgloseMateriales.forEach(item => {
    const kgMerma = Number(((areaDesperdicioM2 * item.gramajeTotalCapa) / 1000).toFixed(2));
    desgloseMermaPorCapa.push({
      idMaterial: item.idMaterial,
      nombre: item.nombre,
      kgMerma,
      esTinta: item.esTinta,
      esAdhesivo: item.esAdhesivo
    });
  });

  const porcentajeAdhesivo = gramajeEstructuraTotal > 0 ? gramajeAdhesivoTotal / gramajeEstructuraTotal : 0;
  const kilosAdhesivoRequeridos = totalKilos * porcentajeAdhesivo;

  return {
    acomodo: {
      repEje,
      repDesarrollo,
      piezasPorFrame,
      medidaBobinaImpresa: Number(medidaBobinaImpresa.toFixed(2)),
      anchoUtilProducto: Number(anchoUtilProducto.toFixed(2)),
      separacionCarrilCm: SEPARACION_CARRILES_CM,
      separacionesTotalCm: Number(separacionesTotalCm.toFixed(2)),
      anchoFrame: anchoFrameVal,
      altoFrame: altoFrameVal
    },
    produccion: {
      metrosLineales: metrosLinealesEntero,
      totalPiezas: Math.round(totalPiezas),
      totalKilos: Number(totalKilos.toFixed(2)),
      tipoEstructura,
      gramajeTotal: Number(gramajeEstructuraTotal.toFixed(2))
    },
    tinta: {
      gramaje: gramajeTintaConfig,
      porcentaje: Number(porcentajeTinta.toFixed(4)),
      kilosRequeridos: Number(kilosTintaRequeridos.toFixed(2))
    },
    adhesivo: {
      gramajeTotal: gramajeAdhesivoTotal,
      gramajePorUnion: GRAMAJE_ADHESIVO_POR_LAMINACION,
      numeroUniones: numeroUnionesLaminacion,
      uniones: numeroUnionesLaminacion,
      porcentaje: Number(porcentajeAdhesivo.toFixed(4)),
      kilosRequeridos: Number(kilosAdhesivoRequeridos.toFixed(2))
    },
    merma: {
      anchoBobinaNatural: Number(bobinaNatural.toFixed(2)),
      sobranteAnchoCm,
      refilePorLadoCm,
      sobranteAnchoPct,
      areaDesperdicioM2,
      kgDesperdicioSustrato,
      kgDesperdicioEstructura,
      kgTotalesBobina76,
      desgloseMermaPorCapa
    },
    desgloseMateriales
  };
}

// Catálogo de materiales: derivado del catálogo oficial (src/data/catalogo.ts).
// No se definen aquí densidades ni calibres propios.
export interface MaterialCatalogo {
  nombre: string;
  categoria: string;
  densidad: number;
  micrasTipicas: number;            // primer calibre válido (valor inicial al elegir el material)
  calibres: readonly number[];      // únicos calibres válidos (µm)
  soloCapaFinal: boolean;           // cara sellante: solo puede ir al final
  gramajeTintaSugerido: number;
  color: string;
  descripcion: string;
}

const COLOR_FAMILIA: Record<FamiliaMaterial, string> = {
  BOPP: '#38bdf8',
  CPP: '#34d399',
  PET: '#fbbf24',
  NYLON: '#c084fc',
  CE: '#fb7185',
  MCE: '#f97316'
};

export const CATALOGO_MATERIALES: MaterialCatalogo[] = MATERIALES_OFICIALES.map(m => ({
  nombre: m.codigo,
  categoria: m.familia,
  densidad: m.densidad,
  micrasTipicas: m.calibres[0],
  calibres: m.calibres,
  soloCapaFinal: m.soloCapaFinal,
  gramajeTintaSugerido: m.soloCapaFinal ? 0 : 2,
  color: COLOR_FAMILIA[m.familia],
  descripcion: `d: ${m.densidad} · ${m.calibres.join(' / ')} µm`
}));

/** Construye una capa a partir del catálogo oficial (nunca con valores sueltos). */
function capaOficial(codigo: string, micras: number, imprime = false): Omit<CapaMaterial, 'id'> {
  const m = buscarMaterial(codigo);
  if (!m) throw new Error(`Material fuera de catálogo: ${codigo}`);
  return {
    nombre: m.codigo,
    densidad: m.densidad,
    micras,
    gramajeTinta: imprime ? GRAMAJE_TINTA_FIJO : 0,
    esImpresion: imprime
  };
}

// Estructuras de ejemplo para HP: mínimo bilaminado, sellante siempre al final.
export interface EstructuraPredefinida {
  id: string;
  nombre: string;
  descripcion: string;
  anchoSugerido: number;
  altoSugerido: number;
  kilosSugeridos: number;
  toleranciaSugerida: number;
  capas: Omit<CapaMaterial, 'id'>[];
}

export const ESTRUCTURAS_PREDEFINIDAS: EstructuraPredefinida[] = [
  {
    id: 'bopp_mate_pet_met_ce21',
    nombre: 'BOPP MATE / PET MET / CE-21',
    descripcion: 'Trilaminado de alta barrera: BOPP MATE 20 µm, PET MET 12 µm y CE-21 62.5 µm como capa sellante',
    anchoSugerido: 14.0,
    altoSugerido: 20.0,
    kilosSugeridos: 100,
    toleranciaSugerida: 0.10,
    capas: [capaOficial('BOPP MATE', 20, true), capaOficial('PET MET', 12), capaOficial('CE-21', 62.5)]
  },
  {
    id: 'bopp_mate_pet_nat_ce21',
    nombre: 'BOPP MATE / PET NAT / CE-21',
    descripcion: 'Trilaminado estándar: BOPP MATE 20 µm, PET NAT 12 µm y CE-21 62.5 µm como capa sellante',
    anchoSugerido: 14.0,
    altoSugerido: 20.0,
    kilosSugeridos: 100,
    toleranciaSugerida: 0.10,
    capas: [capaOficial('BOPP MATE', 20, true), capaOficial('PET NAT', 12), capaOficial('CE-21', 62.5)]
  },
  {
    id: 'bopp_mate_bopp_met',
    nombre: 'BOPP MATE / BOPP MET',
    descripcion: 'Bilaminado para snack y polvos: BOPP MATE 20 µm y BOPP MET 20 µm como fondo sellable',
    anchoSugerido: 12.0,
    altoSugerido: 18.0,
    kilosSugeridos: 100,
    toleranciaSugerida: 0.10,
    capas: [capaOficial('BOPP MATE', 20, true), capaOficial('BOPP MET', 20)]
  }
];

// ==========================================
// 4. MÓDULO MATERIA PRIMA NATURAL (FILM VIRGEN Y REFILE)
// ==========================================

export interface ParametrosMateriaPrimaNatural {
  modoEntrada: 'kilos' | 'metros'; // Entrada por Kilos madre o Metros lineales
  cantidadEntrada: number;          // Kilos brutos o Metros lineales según modoEntrada
  anchoBobinaMadreCm: number;       // Ancho original de la bobina virgen/natural (cm)
  anchoSolicitadoCm: number;        // Ancho útil total requerido (cm)
  numeroSalidas: number;            // Número de bobinas hijas / pistas cortadas
  nombreMaterial: string;           // Nombre del material puro
  densidad: number;                 // Densidad g/cm³
  micras: number;                   // Calibre en micras
}

export interface ResultadoMateriaPrimaNatural {
  nombreMaterial: string;
  densidad: number;
  micras: number;
  gramaje: number;                  // g/m² puro (sin tinta, sin adhesivo)

  anchoBobinaMadreCm: number;
  anchoUtilTotalCm: number;
  anchoPorSalidaCm: number;
  numeroSalidas: number;
  refileTotalCm: number;            // cm totales recortados
  refilePorLadoCm: number;          // cm por orilla si es simétrico

  metrosLineales: number;           // Metros lineales continuos totales
  kilosMadreTotal: number;          // Kilos brutos ingresados / calculados
  kilosUtilesTotal: number;         // Kilos que quedan de material útil
  kilosRefileTotal: number;         // Kilos de merma de refile
  kilosPorSalida: number;           // Kilos por bobina hija cortada

  porcentajeAprovechamiento: number; // % del ancho que se aprovecha
  porcentajeRefile: number;          // % del ancho que se refila (merma)

  areaTotalM2: number;
  areaUtilM2: number;
  areaRefileM2: number;
  rendimientoM2Kg: number;
  rendimientoMlKgMadre: number;
  rendimientoMlKgUtil: number;

  esAlertaSobreancho: boolean;
}

export interface SustratoNaturalPreset {
  id: string;
  nombre: string;
  categoria: string;
  densidad: number;
  micrasDefault: number;
  calibres: readonly number[];
  descripcion: string;
}

export const SUSTRATOS_NATURALES_PRESETS: SustratoNaturalPreset[] = MATERIALES_OFICIALES.map(m => ({
  id: m.codigo,
  nombre: m.codigo,
  categoria: m.familia,
  densidad: m.densidad,
  micrasDefault: m.calibres[0],
  calibres: m.calibres,
  descripcion: `d: ${m.densidad} · ${m.calibres.join(' / ')} µm`
}));

/**
 * Calcula la ingeniería de corte, metros lineales y merma por refile para puro material natural (sin adhesivo ni tinta).
 */
export function calcularMateriaPrimaNatural(params: ParametrosMateriaPrimaNatural): ResultadoMateriaPrimaNatural {
  const densidad = Math.max(0.01, params.densidad || 0.90);
  const micras = Math.max(0.1, params.micras || 20);
  const gramaje = Number((densidad * micras).toFixed(3)); // g/m² puro

  const anchoMadre = Math.max(0.1, params.anchoBobinaMadreCm || 76);
  const salidas = Math.max(1, Math.floor(params.numeroSalidas || 1));
  
  const anchoSolicitadoInput = Math.max(0.01, params.anchoSolicitadoCm || 70);
  const esAlertaSobreancho = anchoSolicitadoInput > anchoMadre;
  const anchoUtilTotalCm = Math.min(anchoMadre, anchoSolicitadoInput);
  
  const anchoPorSalidaCm = Number((anchoUtilTotalCm / salidas).toFixed(2));
  const refileTotalCm = Math.max(0, Number((anchoMadre - anchoUtilTotalCm).toFixed(2)));
  const refilePorLadoCm = Number((refileTotalCm / 2).toFixed(2));

  let metrosLineales = 0;
  let kilosMadreTotal = 0;

  if (params.modoEntrada === 'metros') {
    metrosLineales = Math.max(0, params.cantidadEntrada || 0);
    // kg = (m * gramaje * (ancho / 100)) / 1000
    kilosMadreTotal = (metrosLineales * gramaje * (anchoMadre / 100)) / 1000;
  } else {
    // modo 'kilos'
    kilosMadreTotal = Math.max(0, params.cantidadEntrada || 0);
    // m = (kg * 1000) / (gramaje * (ancho / 100))
    if (gramaje > 0 && anchoMadre > 0) {
      metrosLineales = (kilosMadreTotal * 1000) / (gramaje * (anchoMadre / 100));
    }
  }

  // Kilos que quedan útiles:
  const kilosUtilesTotal = (metrosLineales * gramaje * (anchoUtilTotalCm / 100)) / 1000;
  // Kilos de refile / merma:
  const kilosRefileTotal = Math.max(0, kilosMadreTotal - kilosUtilesTotal);
  // Kilos por bobina hija:
  const kilosPorSalida = salidas > 0 ? kilosUtilesTotal / salidas : kilosUtilesTotal;

  // Porcentajes
  const porcentajeAprovechamiento = anchoMadre > 0 ? (anchoUtilTotalCm / anchoMadre) * 100 : 0;
  const porcentajeRefile = anchoMadre > 0 ? (refileTotalCm / anchoMadre) * 100 : 0;

  // Áreas
  const areaTotalM2 = metrosLineales * (anchoMadre / 100);
  const areaUtilM2 = metrosLineales * (anchoUtilTotalCm / 100);
  const areaRefileM2 = metrosLineales * (refileTotalCm / 100);

  // Rendimientos
  const rendimientoM2Kg = gramaje > 0 ? 1000 / gramaje : 0;
  const rendimientoMlKgMadre = kilosMadreTotal > 0 ? metrosLineales / kilosMadreTotal : 0;
  const rendimientoMlKgUtil = kilosUtilesTotal > 0 ? metrosLineales / kilosUtilesTotal : 0;

  return {
    nombreMaterial: params.nombreMaterial || 'Film Natural',
    densidad,
    micras,
    gramaje,
    anchoBobinaMadreCm: anchoMadre,
    anchoUtilTotalCm: Number(anchoUtilTotalCm.toFixed(2)),
    anchoPorSalidaCm,
    numeroSalidas: salidas,
    refileTotalCm,
    refilePorLadoCm,
    metrosLineales: Math.round(metrosLineales),
    kilosMadreTotal: Number(kilosMadreTotal.toFixed(2)),
    kilosUtilesTotal: Number(kilosUtilesTotal.toFixed(2)),
    kilosRefileTotal: Number(kilosRefileTotal.toFixed(2)),
    kilosPorSalida: Number(kilosPorSalida.toFixed(2)),
    porcentajeAprovechamiento: Number(porcentajeAprovechamiento.toFixed(2)),
    porcentajeRefile: Number(porcentajeRefile.toFixed(2)),
    areaTotalM2: Math.round(areaTotalM2),
    areaUtilM2: Math.round(areaUtilM2),
    areaRefileM2: Math.round(areaRefileM2),
    rendimientoM2Kg: Number(rendimientoM2Kg.toFixed(2)),
    rendimientoMlKgMadre: Number(rendimientoMlKgMadre.toFixed(2)),
    rendimientoMlKgUtil: Number(rendimientoMlKgUtil.toFixed(2)),
    esAlertaSobreancho
  };
}

// ==========================================
// 5. MÓDULO GESTOR DE LOTES DE BOBINAS MULTIPLES & MERMA
// ==========================================

export interface BobinaInventario {
  id: string;
  codigo: string;
  pesoKg: number;
  anchoCm: number;
  activo: boolean;
}

export interface DetalleBobinaProcesada {
  id: string;
  codigo: string;
  pesoKg: number;
  anchoCm: number;
  activo: boolean;
  
  esValidaAncho: boolean;          // anchoCm >= anchoRequerido
  metrosLineales: number;          // Metros continuos de esta bobina
  refileCm: number;                // anchoCm - anchoRequerido
  mermaRefileKg: number;           // Kilos de merma generados por esta bobina
  kilosUtilesKg: number;           // Kilos aprovechados de esta bobina
  porcentajeMerma: number;         // % de desecho por refile
  
  metrosAcumulados: number;        // Suma acumulada en la secuencia
  porcentajeCoberturaAcumulado: number;
  esBobinaDeCorteMeta: boolean;    // La bobina en la que se alcanza el 100% del pedido
}

export interface ResultadoLoteBobinas {
  anchoRequeridoCm: number;
  anchoBaseEstandarCm: number;     // 76.0 cm por defecto
  metrosRequeridos: number;
  gramaje: number;
  nombreMaterial: string;

  bobinas: DetalleBobinaProcesada[];
  totalBobinasValidas: number;
  totalBobinasRechazadas: number;

  kilosBrutosTotales: number;
  metrosLinealesTotales: number;
  
  diferenciaMetros: number;        // Total aportado - Requerido
  porcentajeCobertura: number;     // (Aportado / Requerido) * 100
  alcanzaMaterial: boolean;        // metrosLinealesTotales >= metrosRequeridos

  kilosFaltantes: number;          // Si falta, cuántos kg de bobina base (76 cm) faltan
  metrosFaltantes: number;         // Si falta, cuántos metros faltan
  kilosSobrantes: number;          // Si sobra, cuántos kg brutos sobran en la última bobina
  metrosSobrantes: number;

  mermaRefileTotalKg: number;      // Merma total por refilar al ancho requerido
  kilosUtilesTotales: number;      // Kilos útiles netos
  porcentajeMermaGlobal: number;   // % de refile promedio

  empalmesEstimados: number;       // Cambios de bobina en máquina (totalBobinas - 1)
  indiceBobinaMeta: number;        // Índice de la bobina donde se llega a la meta (-1 si no alcanza)
}

export function calcularLoteBobinas(
  bobinasInput: BobinaInventario[],
  metrosRequeridos: number,
  anchoRequeridoCm: number,
  gramaje: number,
  anchoBaseEstandarCm: number = 76.0,
  nombreMaterial: string = 'Material Base'
): ResultadoLoteBobinas {
  const g = Math.max(0.01, gramaje || 18.0);
  const anchoReq = Math.max(1.0, anchoRequeridoCm || 70.0);
  const anchoBase = Math.max(1.0, anchoBaseEstandarCm || 76.0);
  const mReq = Math.max(1, metrosRequeridos || 1000);

  let metrosAcum = 0;
  let kilosBrutosTotales = 0;
  let mermaRefileTotalKg = 0;
  let kilosUtilesTotales = 0;
  let totalBobinasValidas = 0;
  let totalBobinasRechazadas = 0;
  let indiceBobinaMeta = -1;

  const bobinasProcesadas: DetalleBobinaProcesada[] = [];

  bobinasInput.forEach((b, idx) => {
    if (!b.activo) {
      bobinasProcesadas.push({
        id: b.id,
        codigo: b.codigo || `Bobina ${idx + 1}`,
        pesoKg: b.pesoKg || 0,
        anchoCm: b.anchoCm || anchoBase,
        activo: false,
        esValidaAncho: false,
        metrosLineales: 0,
        refileCm: 0,
        mermaRefileKg: 0,
        kilosUtilesKg: 0,
        porcentajeMerma: 0,
        metrosAcumulados: metrosAcum,
        porcentajeCoberturaAcumulado: mReq > 0 ? (metrosAcum / mReq) * 100 : 0,
        esBobinaDeCorteMeta: false
      });
      return;
    }

    const peso = Math.max(0, b.pesoKg || 0);
    const ancho = Math.max(0.1, b.anchoCm || anchoBase);
    const esValidaAncho = ancho >= anchoReq - 0.05; // Margen técnico de 0.5 mm

    if (!esValidaAncho) {
      totalBobinasRechazadas++;
      bobinasProcesadas.push({
        id: b.id,
        codigo: b.codigo || `Bobina ${idx + 1}`,
        pesoKg: peso,
        anchoCm: ancho,
        activo: true,
        esValidaAncho: false,
        metrosLineales: 0,
        refileCm: 0,
        mermaRefileKg: 0,
        kilosUtilesKg: 0,
        porcentajeMerma: 0,
        metrosAcumulados: metrosAcum,
        porcentajeCoberturaAcumulado: mReq > 0 ? (metrosAcum / mReq) * 100 : 0,
        esBobinaDeCorteMeta: false
      });
      return;
    }

    // Metros de esta bobina: ML = (kg * 1000) / (gramaje * (ancho / 100))
    const ml = (peso * 1000) / (g * (ancho / 100));
    const refileCm = Math.max(0, Number((ancho - anchoReq).toFixed(2)));
    // Merma en kg = (ml * gramaje * (refile / 100)) / 1000
    const mermaKg = (ml * g * (refileCm / 100)) / 1000;
    const utilesKg = Math.max(0, peso - mermaKg);
    const pctMerma = ancho > 0 ? (refileCm / ancho) * 100 : 0;

    const metrosPrevios = metrosAcum;
    metrosAcum += ml;
    kilosBrutosTotales += peso;
    mermaRefileTotalKg += mermaKg;
    kilosUtilesTotales += utilesKg;
    totalBobinasValidas++;

    const cubreMetaAhora = metrosPrevios < mReq && metrosAcum >= mReq;
    if (cubreMetaAhora && indiceBobinaMeta === -1) {
      indiceBobinaMeta = idx;
    }

    bobinasProcesadas.push({
      id: b.id,
      codigo: b.codigo || `Bobina ${idx + 1}`,
      pesoKg: peso,
      anchoCm: ancho,
      activo: true,
      esValidaAncho: true,
      metrosLineales: Math.round(ml),
      refileCm,
      mermaRefileKg: Number(mermaKg.toFixed(2)),
      kilosUtilesKg: Number(utilesKg.toFixed(2)),
      porcentajeMerma: Number(pctMerma.toFixed(2)),
      metrosAcumulados: Math.round(metrosAcum),
      porcentajeCoberturaAcumulado: Number(((metrosAcum / mReq) * 100).toFixed(1)),
      esBobinaDeCorteMeta: cubreMetaAhora
    });
  });

  const metrosLinealesTotales = Math.round(metrosAcum);
  const diferenciaMetros = metrosLinealesTotales - mReq;
  const porcentajeCobertura = mReq > 0 ? (metrosLinealesTotales / mReq) * 100 : 0;
  const alcanzaMaterial = metrosLinealesTotales >= mReq;

  let kilosFaltantes = 0;
  let metrosFaltantes = 0;
  let kilosSobrantes = 0;
  let metrosSobrantes = 0;

  if (!alcanzaMaterial) {
    metrosFaltantes = mReq - metrosLinealesTotales;
    // Faltante en kg usando bobina estándar de 76 cm: kg = (ML * g * 0.76) / 1000
    kilosFaltantes = (metrosFaltantes * g * (anchoBase / 100)) / 1000;
  } else {
    metrosSobrantes = diferenciaMetros;
    kilosSobrantes = (metrosSobrantes * g * (anchoBase / 100)) / 1000;
  }

  const porcentajeMermaGlobal = kilosBrutosTotales > 0 
    ? (mermaRefileTotalKg / kilosBrutosTotales) * 100 
    : 0;

  return {
    anchoRequeridoCm: Number(anchoReq.toFixed(2)),
    anchoBaseEstandarCm: Number(anchoBase.toFixed(2)),
    metrosRequeridos: mReq,
    gramaje: Number(g.toFixed(2)),
    nombreMaterial,
    bobinas: bobinasProcesadas,
    totalBobinasValidas,
    totalBobinasRechazadas,
    kilosBrutosTotales: Number(kilosBrutosTotales.toFixed(2)),
    metrosLinealesTotales,
    diferenciaMetros,
    porcentajeCobertura: Number(porcentajeCobertura.toFixed(1)),
    alcanzaMaterial,
    kilosFaltantes: Number(kilosFaltantes.toFixed(2)),
    metrosFaltantes: Math.round(metrosFaltantes),
    kilosSobrantes: Number(kilosSobrantes.toFixed(2)),
    metrosSobrantes: Math.round(metrosSobrantes),
    mermaRefileTotalKg: Number(mermaRefileTotalKg.toFixed(2)),
    kilosUtilesTotales: Number(kilosUtilesTotales.toFixed(2)),
    porcentajeMermaGlobal: Number(porcentajeMermaGlobal.toFixed(2)),
    empalmesEstimados: Math.max(0, totalBobinasValidas - 1),
    indiceBobinaMeta
  };
}

// ========================================================
// CALCULADORA DE KG SIN IMPRESIÓN (Materia Prima / Corte)
// ========================================================

export interface CapaSinImpresion {
  id: string;
  nombre: string;
  densidad: number;
  micras: number;
}

export interface DesgloseCapaSinImpresion {
  id: string;
  nombre: string;
  densidad: number;
  micras: number;
  gramaje: number;          // g/m²
  porcentaje: number;       // % del gramaje total
  kilosTotales: number;     // kg brutos de bobina necesarios de este material
  kilosUtiles: number;      // kg que quedan en el producto útil
  kilosDesperdicio: number; // kg de merma de refile de este material
}

export interface ParametrosCalculadoraKgSinImpresion {
  kilosTotales: number;             // kg (útiles u brutos según modo)
  anchoProductoCm: number;          // Ancho de cada repetición / tira / empaque en cm
  anchoSustratoCm: number;          // Ancho del sustrato (por defecto 76 cm)
  separacionPistasCm?: number;      // Espacio entre pistas de corte (gap en cm)
  largoProductoCm?: number;         // Largo / paso opcional para conteo de piezas
  capas: CapaSinImpresion[];        // Estructura de materiales (sin impresión)
  incluirAdhesivo?: boolean;        // Si es multicapa, incluir adhesivo
  gramajeAdhesivoPorUnion?: number; // Gramaje adhesivo g/m² por unión (default 2.0)
  modoKilos?: 'kilos_utiles_objetivo' | 'kilos_totales_brutos'; // Default: kilos_utiles_objetivo
  mermaProcesoPct?: number;         // Merma adicional de proceso / arranque (%) opcional
}

export interface ResultadoCalculadoraKgSinImpresion {
  anchoSustratoCm: number;
  anchoProductoCm: number;
  repeticiones: number;              // Cuántas repeticiones caben al ancho
  anchoUtilTotalCm: number;          // Repeticiones * anchoProducto
  anchoDesperdicioRefileCm: number;  // Ancho sustrato - Ancho útil
  refilePorLadoCm: number;           // Refile por orilla (si se centra)
  porcentajeAprovechamiento: number; // % del ancho que es útil
  porcentajeDesperdicio: number;     // % del ancho que es desperdicio/refile
  mermaProcesoPct: number;          // % merma adicional de proceso/ajuste
  porcentajeMermaTotal: number;      // % total de merma sobre bruto

  gramajeTotal: number;              // g/m² sin tinta
  metrosLineales: number;            // ML a correr en la máquina
  metrosLinealesUtilesAcumulados: number; // ML * repeticiones
  areaSustratoM2: number;            // m² totales procesados
  areaUtilM2: number;                // m² de producto útil obtenido
  totalPiezas?: number;              // Total de piezas si se ingresó largo

  kilosTotales: number;              // kg totales brutos de materia prima requerida
  kilosUtiles: number;               // kg netos de producto terminado (da EXACTAMENTE los KG deseados)
  kilosDesperdicio: number;          // kg totales de desperdicio/merma
  kilosDesperdicioRefile: number;    // kg de refile lateral
  kilosDesperdicioProceso: number;   // kg de merma de proceso/arranque
  modoKilos: 'kilos_utiles_objetivo' | 'kilos_totales_brutos';

  desgloseMateriales: DesgloseCapaSinImpresion[];
  desgloseAdhesivo?: {
    gramajeTotal: number;
    kilosTotales: number;
    kilosUtiles: number;
    kilosDesperdicio: number;
    porcentaje: number;
  };
  esAnchoInsuficiente: boolean;
}

export interface PresetSinImpresion {
  id: string;
  nombre: string;
  descripcion: string;
  anchoProductoDefault: number;
  capas: {
    nombre: string;
    densidad: number;
    micras: number;
  }[];
}

/** Capa del catálogo oficial para presets (valida que exista y toma su densidad). */
function capaSinImpresion(codigo: string, micras: number) {
  const m = buscarMaterial(codigo);
  if (!m) throw new Error(`Material fuera de catálogo: ${codigo}`);
  return { nombre: m.codigo, densidad: m.densidad, micras };
}

function presetSinImpresion(
  id: string,
  descripcion: string,
  anchoProductoDefault: number,
  capas: [string, number][]
): PresetSinImpresion {
  const capasOficiales = capas.map(([c, mc]) => capaSinImpresion(c, mc));
  return {
    id,
    nombre: capasOficiales.map(c => `${c.nombre} ${c.micras} µm`).join(' / '),
    descripcion,
    anchoProductoDefault,
    capas: capasOficiales
  };
}

export const PRESETS_SIN_IMPRESION: PresetSinImpresion[] = [
  presetSinImpresion('bopp_nat_mono', 'Monocapa transparente sin impresión', 18, [['BOPP NAT', 20]]),
  presetSinImpresion('bopp_mate_bopp_met', 'Bilaminado de polipropileno con fondo metalizado', 24, [['BOPP MATE', 20], ['BOPP MET', 20]]),
  presetSinImpresion('pet_nat_ce21', 'Bilaminado hermético con capa sellante CE-21', 15, [['PET NAT', 12], ['CE-21', 50]]),
  presetSinImpresion('pet_nat_nylon_ce21', 'Trilaminado con barrera de nylon y capa sellante CE-21', 20, [['PET NAT', 12], ['NYLON', 15], ['CE-21', 75]]),
  presetSinImpresion('ce21_mono', 'Monocapa sellable sin impresión', 36, [['CE-21', 75]])
];


export function calcularKgSinImpresion(
  params: ParametrosCalculadoraKgSinImpresion
): ResultadoCalculadoraKgSinImpresion {
  const anchoSustrato = Math.max(0.1, params.anchoSustratoCm || 76);
  const anchoProducto = Math.max(0.01, params.anchoProductoCm || 0.01);
  const sep = Math.max(0, params.separacionPistasCm || 0);
  const kilosInput = Math.max(0, params.kilosTotales || 0);
  const modoKilos = params.modoKilos || 'kilos_utiles_objetivo';
  const mermaProcesoPct = Math.max(0, Math.min(50, params.mermaProcesoPct || 0));

  // 1. Repeticiones / pistas al ancho
  const espacioPorPista = anchoProducto + sep;
  // n pistas ocupan n·pieza + (n−1)·sep, por eso el último hueco no cuenta: n = floor((ancho + sep) / (pieza + sep))
  const repeticiones = Math.max(0, Math.floor((anchoSustrato + sep) / (espacioPorPista > 0 ? espacioPorPista : anchoProducto) + 1e-9));
  const esAnchoInsuficiente = repeticiones === 0;

  const anchoUtilTotalCm = repeticiones * anchoProducto;
  const anchoDesperdicioRefileCm = Math.max(0, anchoSustrato - anchoUtilTotalCm);
  const refilePorLadoCm = anchoDesperdicioRefileCm / 2;

  const porcentajeAprovechamiento = anchoSustrato > 0 ? (anchoUtilTotalCm / anchoSustrato) * 100 : 0;
  const porcentajeDesperdicio = anchoSustrato > 0 ? (anchoDesperdicioRefileCm / anchoSustrato) * 100 : 0;

  // 2. Gramaje de la estructura (SIN IMPRESIÓN, 0 TINTA)
  const numCapas = params.capas.length;
  let sumaGramajeSustratos = 0;
  const capasConGramaje = params.capas.map(capa => {
    const d = Number(capa.densidad) || 0;
    const m = Number(capa.micras) || 0;
    const g = Number((d * m).toFixed(2));
    sumaGramajeSustratos += g;
    return { ...capa, densidad: d, micras: m, gramaje: g };
  });

  const incluirAdhesivo = params.incluirAdhesivo !== false && numCapas >= 2;
  const uniones = Math.max(0, numCapas - 1);
  const gramajeAdhPorUnion = params.gramajeAdhesivoPorUnion ?? GRAMAJE_ADHESIVO_POR_LAMINACION;
  const gramajeAdhesivoTotal = incluirAdhesivo ? Number((uniones * gramajeAdhPorUnion).toFixed(2)) : 0;

  const gramajeTotal = Number((sumaGramajeSustratos + gramajeAdhesivoTotal).toFixed(2));

  // 3. Balance de Kilos y Merma
  // Factores de aprovechamiento
  const ratioAprovechamientoAncho = anchoSustrato > 0 ? (anchoUtilTotalCm / anchoSustrato) : 0;
  const ratioRefileAncho = Math.max(0, 1 - ratioAprovechamientoAncho);
  // La merma de proceso se define SOBRE EL NETO: bruto necesario = neto × (1 + m)
  const factorProcesoNeto = 1 + (mermaProcesoPct / 100);
  const factorGlobalAprovechamiento = ratioAprovechamientoAncho > 0 ? ratioAprovechamientoAncho / factorProcesoNeto : 0;

  let kilosTotales = 0;
  let kilosUtiles = 0;
  let kilosDesperdicio = 0;
  let kilosDesperdicioRefile = 0;
  let kilosDesperdicioProceso = 0;

  if (modoKilos === 'kilos_utiles_objetivo') {
    // Al final en kilos útiles dan EXACTAMENTE los KG totales ingresados
    kilosUtiles = kilosInput;
    if (factorGlobalAprovechamiento > 0) {
      kilosTotales = kilosUtiles / factorGlobalAprovechamiento;
      kilosDesperdicio = kilosTotales - kilosUtiles;
      kilosDesperdicioRefile = kilosTotales * ratioRefileAncho;
      kilosDesperdicioProceso = kilosUtiles * (mermaProcesoPct / 100);
    } else {
      kilosTotales = kilosInput;
      kilosDesperdicio = 0;
      kilosDesperdicioRefile = 0;
      kilosDesperdicioProceso = 0;
    }
  } else {
    // Modo tradicional: partir de bobinas brutas disponibles
    kilosTotales = kilosInput;
    kilosDesperdicioRefile = kilosTotales * ratioRefileAncho;
    kilosUtiles = factorGlobalAprovechamiento * kilosTotales;
    kilosDesperdicioProceso = kilosUtiles * (mermaProcesoPct / 100);
    kilosDesperdicio = kilosDesperdicioRefile + kilosDesperdicioProceso;
  }

  const porcentajeMermaTotal = kilosTotales > 0 ? (kilosDesperdicio / kilosTotales) * 100 : 0;

  // Metros Lineales continuos de bobina de sustrato
  let metrosLineales = 0;
  if (gramajeTotal > 0 && anchoSustrato > 0) {
    metrosLineales = (kilosTotales * 1000) / (gramajeTotal * (anchoSustrato / 100));
  }
  const metrosLinealesEntero = Math.round(metrosLineales);
  const metrosLinealesUtilesAcumulados = metrosLinealesEntero * repeticiones;

  const areaSustratoM2 = Number(((metrosLinealesEntero * anchoSustrato) / 100).toFixed(1));
  const areaUtilM2 = Number(((metrosLinealesEntero * anchoUtilTotalCm) / 100).toFixed(1));

  let totalPiezas: number | undefined = undefined;
  if (params.largoProductoCm && params.largoProductoCm > 0) {
    totalPiezas = Math.floor((metrosLinealesEntero * 100) / params.largoProductoCm) * repeticiones;
  }

  // 4. Desglose de Kilos Requeridos de CADA material (con balance perfecto)
  const desgloseMateriales: DesgloseCapaSinImpresion[] = capasConGramaje.map(capa => {
    const pct = gramajeTotal > 0 ? (capa.gramaje / gramajeTotal) : 0;
    const kgUtilCapa = Number((kilosUtiles * pct).toFixed(2));
    const kgDesperdicioCapa = Number((kilosDesperdicio * pct).toFixed(2));
    const kgTotalCapa = Number((kilosTotales * pct).toFixed(2));

    return {
      id: capa.id,
      nombre: capa.nombre,
      densidad: capa.densidad,
      micras: capa.micras,
      gramaje: capa.gramaje,
      porcentaje: Number((pct * 100).toFixed(2)),
      kilosTotales: kgTotalCapa,
      kilosUtiles: kgUtilCapa,
      kilosDesperdicio: kgDesperdicioCapa
    };
  });

  // Desglose de adhesivo
  let desgloseAdhesivo: ResultadoCalculadoraKgSinImpresion['desgloseAdhesivo'] = undefined;
  if (gramajeAdhesivoTotal > 0) {
    const pctAdh = gramajeTotal > 0 ? (gramajeAdhesivoTotal / gramajeTotal) : 0;
    const kgUtilAdh = Number((kilosUtiles * pctAdh).toFixed(2));
    const kgDesperdicioAdh = Number((kilosDesperdicio * pctAdh).toFixed(2));
    const kgTotalAdh = Number((kilosTotales * pctAdh).toFixed(2));

    desgloseAdhesivo = {
      gramajeTotal: gramajeAdhesivoTotal,
      kilosTotales: kgTotalAdh,
      kilosUtiles: kgUtilAdh,
      kilosDesperdicio: kgDesperdicioAdh,
      porcentaje: Number((pctAdh * 100).toFixed(2))
    };
  }

  return {
    anchoSustratoCm: Number(anchoSustrato.toFixed(2)),
    anchoProductoCm: Number(anchoProducto.toFixed(2)),
    repeticiones,
    anchoUtilTotalCm: Number(anchoUtilTotalCm.toFixed(2)),
    anchoDesperdicioRefileCm: Number(anchoDesperdicioRefileCm.toFixed(2)),
    refilePorLadoCm: Number(refilePorLadoCm.toFixed(2)),
    porcentajeAprovechamiento: Number(porcentajeAprovechamiento.toFixed(2)),
    porcentajeDesperdicio: Number(porcentajeDesperdicio.toFixed(2)),
    mermaProcesoPct,
    porcentajeMermaTotal: Number(porcentajeMermaTotal.toFixed(2)),
    gramajeTotal,
    metrosLineales: metrosLinealesEntero,
    metrosLinealesUtilesAcumulados,
    areaSustratoM2,
    areaUtilM2,
    totalPiezas,
    kilosTotales: Number(kilosTotales.toFixed(2)),
    kilosUtiles: Number(kilosUtiles.toFixed(2)),
    kilosDesperdicio: Number(kilosDesperdicio.toFixed(2)),
    kilosDesperdicioRefile: Number(kilosDesperdicioRefile.toFixed(2)),
    kilosDesperdicioProceso: Number(kilosDesperdicioProceso.toFixed(2)),
    modoKilos,
    desgloseMateriales,
    desgloseAdhesivo,
    esAnchoInsuficiente
  };
}

// =========================================================================
// CALCULADORA DE METROS EN LDPE (LAMINACIÓN & CONTROL DE STOCK DE BOBINAS)
// =========================================================================

export interface EstructuraLdpeItem {
  id: string;
  nombreEstructura: string;     // Código oficial del catálogo (CE-21, MCE-12, ...)
  descripcion?: string;
  calibreMicras: number;        // Calibre en micras (µm), ej. 21, 25, 50, 60
  unidadCalibre: 'micras' | 'galgas'; // 'micras' o 'galgas'
  densidad: number;             // Densidad g/cm³ (ej. 0.92 para LDPE natural, 0.98 para blanco)
  anchoBobinaCm: number;        // Ancho de la bobina de LDPE en cm (ej. 76.0 cm)
  metrosALaminar: number;       // Metros lineales que se correrán en laminadora
  stockKgDisponible: number;    // Kilos de esta estructura que se tienen en almacén / taller
  mermaLaminacionPct: number;   // % de merma en laminadora (empalmes, arranque, tensión)
  observaciones?: string;
}

export interface ResultadoCalculoLdpeItem {
  id: string;
  nombreEstructura: string;
  calibreMicras: number;
  densidad: number;
  anchoBobinaCm: number;
  gramajeGsm: number;                 // Gramaje en g/m² (densidad × micras)
  rendimientoM2Kg: number;            // Rendimiento en m²/kg (1000 / gramaje)
  rendimientoMLKg: number;            // Rendimiento en metros lineales por cada kg a ese ancho
  metrosALaminar: number;             // Metros lineales a laminar solicitados
  kgTeoricos: number;                 // Kilos netos teóricos requeridos sin merma
  mermaLaminacionPct: number;         // Porcentaje de merma configurado
  kgMerma: number;                    // Kilos adicionales estimados de merma
  kgRequeridosTotal: number;          // Kilos totales a usar (teórico + merma)
  stockKgDisponible: number;          // Kilos que se tienen en existencia
  diferenciaKg: number;               // stock - requeridos
  alcanza: boolean;                   // true si el stock cubre o supera los kg requeridos
  kgFaltantes: number;                // Cuántos kg faltan si no alcanza (0 si alcanza)
  metrosFaltantes: number;            // Cuántos metros aprox faltan cubrir si no alcanza
  kgSobrantes: number;                // Cuántos kg quedan de reserva si alcanza
  metrosSobrantes: number;            // Cuántos metros aprox sobrarán en bobina
  metrosAlcanzablesConStock: number;  // Metros máximos que se pueden laminar con el stock actual
  porcentajeCobertura: number;        // (stock / requeridos) * 100%
}

export interface ResumenConsolidadoLdpe {
  totalEstructuras: number;
  estructurasConFaltante: number;
  estructurasCubiertas: number;
  totalMetrosALaminar: number;
  totalKgRequeridos: number;
  totalKgStock: number;
  balanceKgTotal: number;
  totalKgFaltantes: number;
  totalMetrosFaltantes: number;
  totalKgSobrantes: number;
  items: ResultadoCalculoLdpeItem[];
}

export interface PresetLdpe {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  calibreMicras: number;
  densidad: number;
  anchoDefaultCm: number;
}

export const PRESETS_LDPE: PresetLdpe[] = MATERIALES_COEXTRUIDOS.flatMap(m =>
  m.calibres.map(calibre => ({
    id: `${m.codigo}_${calibre}`,
    codigo: m.codigo,
    nombre: `${m.codigo} · ${calibre} µm`,
    descripcion: `d: ${m.densidad} · ${calibre * 4} galgas`,
    calibreMicras: calibre,
    densidad: m.densidad,
    anchoDefaultCm: ANCHO_BOBINA_ESTANDAR_CM
  }))
);

/**
 * Calcula el consumo de LDPE a partir de los metros a laminar, el calibre y el ancho,
 * y evalúa si el stock en almacén alcanza o cuántos metros/kilos faltan.
 */
export function calcularItemLdpe(item: EstructuraLdpeItem): ResultadoCalculoLdpeItem {
  const anchoCm = Math.max(0.1, item.anchoBobinaCm || ANCHO_BOBINA_ESTANDAR_CM);
  const calibre = Math.max(0.1, item.calibreMicras || 1);
  const densidad = Math.max(0.01, item.densidad || 0.92);
  const metros = Math.max(0, item.metrosALaminar || 0);
  const stockKg = Math.max(0, item.stockKgDisponible || 0);
  const mermaPct = Math.max(0, item.mermaLaminacionPct || 0);

  // Todo se calcula con valores completos; el redondeo es solo para mostrar.
  // Gramaje g/m² = Densidad × Calibre (micras)
  const gramaje = densidad * calibre;
  const rendimientoM2Kg = gramaje > 0 ? 1000 / gramaje : 0;
  const rendimientoMLKg = gramaje > 0 ? 1000 / (gramaje * (anchoCm / 100)) : 0;

  // Kg teóricos = metros × (ancho / 100) × gramaje / 1000
  const kgTeoricos = (metros * (anchoCm / 100) * gramaje) / 1000;

  // Merma de laminación SOBRE EL NETO: requerido = teórico × (1 + m)
  const kgMerma = kgTeoricos * (mermaPct / 100);
  const kgRequeridosTotal = kgTeoricos + kgMerma;

  // Balance con el stock
  const diferenciaKg = stockKg - kgRequeridosTotal;
  const alcanza = diferenciaKg >= -1e-9;

  // kg consumidos por cada metro, incluyendo la merma
  const factorKgPorMetroConMerma = (anchoCm / 100) * (gramaje / 1000) * (1 + mermaPct / 100);

  const metrosAlcanzablesConStock = factorKgPorMetroConMerma > 0
    ? Math.floor(stockKg / factorKgPorMetroConMerma + 1e-9)
    : 0;

  let kgFaltantes = 0;
  let metrosFaltantes = 0;
  let kgSobrantes = 0;
  let metrosSobrantes = 0;

  if (alcanza) {
    kgSobrantes = Math.max(0, diferenciaKg);
    metrosSobrantes = factorKgPorMetroConMerma > 0
      ? Math.floor(kgSobrantes / factorKgPorMetroConMerma + 1e-9)
      : 0;
  } else {
    kgFaltantes = -diferenciaKg;
    metrosFaltantes = factorKgPorMetroConMerma > 0
      ? Math.ceil(kgFaltantes / factorKgPorMetroConMerma - 1e-9)
      : 0;
  }

  const porcentajeCobertura = kgRequeridosTotal > 0
    ? Math.min(999, (stockKg / kgRequeridosTotal) * 100)
    : (stockKg > 0 ? 100 : 0);

  return {
    id: item.id,
    nombreEstructura: item.nombreEstructura,
    calibreMicras: calibre,
    densidad,
    anchoBobinaCm: anchoCm,
    gramajeGsm: Number(gramaje.toFixed(2)),
    rendimientoM2Kg: Number(rendimientoM2Kg.toFixed(2)),
    rendimientoMLKg: Number(rendimientoMLKg.toFixed(2)),
    metrosALaminar: metros,
    kgTeoricos: Number(kgTeoricos.toFixed(2)),
    mermaLaminacionPct: mermaPct,
    kgMerma: Number(kgMerma.toFixed(2)),
    kgRequeridosTotal: Number(kgRequeridosTotal.toFixed(2)),
    stockKgDisponible: stockKg,
    diferenciaKg: Number(diferenciaKg.toFixed(2)),
    alcanza,
    kgFaltantes: Number(kgFaltantes.toFixed(2)),
    metrosFaltantes,
    kgSobrantes: Number(kgSobrantes.toFixed(2)),
    metrosSobrantes,
    metrosAlcanzablesConStock,
    porcentajeCobertura: Number(porcentajeCobertura.toFixed(1))
  };
}

/**
 * Calcula el resumen consolidado de varias órdenes o estructuras de LDPE
 */
export function calcularConsolidadoLdpe(items: EstructuraLdpeItem[]): ResumenConsolidadoLdpe {
  const resultados = items.map(calcularItemLdpe);
  let totalMetrosALaminar = 0;
  let totalKgRequeridos = 0;
  let totalKgStock = 0;
  let totalKgFaltantes = 0;
  let totalMetrosFaltantes = 0;
  let totalKgSobrantes = 0;
  let estructurasConFaltante = 0;
  let estructurasCubiertas = 0;

  resultados.forEach(res => {
    totalMetrosALaminar += res.metrosALaminar;
    totalKgRequeridos += res.kgRequeridosTotal;
    totalKgStock += res.stockKgDisponible;
    if (res.alcanza) {
      estructurasCubiertas += 1;
      totalKgSobrantes += res.kgSobrantes;
    } else {
      estructurasConFaltante += 1;
      totalKgFaltantes += res.kgFaltantes;
      totalMetrosFaltantes += res.metrosFaltantes;
    }
  });

  const balanceKgTotal = Number((totalKgStock - totalKgRequeridos).toFixed(2));

  return {
    totalEstructuras: items.length,
    estructurasConFaltante,
    estructurasCubiertas,
    totalMetrosALaminar,
    totalKgRequeridos: Number(totalKgRequeridos.toFixed(2)),
    totalKgStock: Number(totalKgStock.toFixed(2)),
    balanceKgTotal,
    totalKgFaltantes: Number(totalKgFaltantes.toFixed(2)),
    totalMetrosFaltantes,
    totalKgSobrantes: Number(totalKgSobrantes.toFixed(2)),
    items: resultados
  };
}


