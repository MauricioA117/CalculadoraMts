---
name: calculadora-mts
description: Calculadora de metros lineales, kilos, refile y merma para empaque flexible (impresión digital HP Indigo 20000/25K, laminación, materia prima natural, lotes de bobinas y LDPE). Úsala siempre que el usuario pida en Excel calcular metros lineales a partir de kilos (o al revés), gramaje de una estructura (BOPP, PET, CPP, NYLON, CE, MCE), acomodo o repeticiones en el frame de la prensa, pistas al eje, refile, merma, kilos por material, si las bobinas de inventario alcanzan, o consumo y faltante de LDPE, aunque no mencione "calculadora" ni esta skill.
---

# Calculadora de metros (empaque flexible)

Esta skill lleva a Excel las fórmulas de la app "Calculadora de metros". El objetivo es que cualquier hoja que armes dé **exactamente** los mismos números que la app.

## Cómo trabajar en Excel

1. **Identifica el módulo** con la tabla de abajo. Si el usuario no da un dato obligatorio (por ejemplo, la estructura de capas), pregúntalo; no lo inventes.
2. **Arma la hoja en tres bloques**: *Datos de entrada* (celdas editables, con relleno de color claro), *Cálculos* y *Resultados*. Pon una etiqueta con la unidad junto a cada celda (cm, kg, µm, g/m², ML).
3. **Escribe fórmulas, nunca valores pegados.** Cada resultado debe recalcularse si el usuario cambia una entrada. Usa nombres definidos o referencias claras a las celdas de entrada.
4. **Calcula con valores completos y redondea solo al mostrar** (formato de número). La app no redondea los pasos intermedios; si usas `REDONDEAR` a la mitad, los números no coinciden.
5. **Valida la estructura** con las reglas del catálogo antes de dar resultados, y marca el error en la hoja si alguna regla falla.
6. **Comprueba** tu hoja con el ejemplo del módulo en [references/formulas.md](references/formulas.md); si no coincide, revisa antes de entregarla.

## Módulos

| Módulo | Úsalo cuando el usuario… | Detalle |
|---|---|---|
| **1. Producción HP Indigo** | Tiene un pedido impreso: medida del empaque, kilos, tolerancia y estructura. Quiere pistas, piezas por frame, ML, kilos por material y merma. | formulas.md §1 |
| **2. Bobina individual** | Tiene una bobina (ancho y kilos) de una estructura y quiere sus metros lineales. Sin tolerancia ni frame. | formulas.md §2 |
| **3. Materia prima y refile** | Corta película virgen de una sola capa: bobina madre → ancho útil y número de salidas. | formulas.md §3 |
| **4. Lote de bobinas** | Tiene varias bobinas de inventario (peso y ancho) y quiere saber si alcanzan para unos metros a un ancho. | formulas.md §4 |
| **5. Kg sin impresión** | Producto sin tinta: kilos objetivo, ancho de producto y estructura. Quiere repeticiones, ML y kilos por material. | formulas.md §5 |
| **6. LDPE (laminación)** | Quiere los kilos de sellante (CE/MCE) para laminar X metros y si el stock alcanza. | formulas.md §6 |

## Constantes

| Constante | Valor |
|---|---|
| Frame HP Indigo 20000 / 25K: ancho útil (eje) | **74.5 cm** |
| Frame HP Indigo 20000 / 25K: desarrollo | **112.5 cm** |
| Separación entre carriles (pistas al eje) en HP | **0.1 cm** |
| Ancho de bobina estándar / natural | **76 cm** |
| Tinta digital | **2.0 g/m²** (en la capa impresa) |
| Adhesivo de laminación | **2.0 g/m² por unión** (uniones = capas − 1) |

Solo existe un frame (HP Indigo 20000 / 25K). No uses otros formatos de prensa.

## Catálogo oficial de materiales

Es la única fuente de densidades y calibres. Un material o calibre fuera de esta tabla **no se puede usar**.

| Código | Familia | Densidad (g/cm³) | Calibres válidos (µm) | Solo capa final |
|---|---|---|---|---|
| BOPP MATE | BOPP | 0.91 | 20 | No |
| BOPP MET | BOPP | 0.91 | 20 | No |
| BOPP NAT | BOPP | 0.91 | 20, 30 | No |
| CPP NAT | CPP | 0.90 | 50 | Sí |
| PET MATE | PET | 1.40 | 12 | No |
| PET MET | PET | 1.40 | 12 | No |
| PET NAT | PET | 1.40 | 12 | No |
| PET PELABLE | PET | 1.36 | 20 | No |
| NYLON | NYLON | 1.16 | 15 | No |
| CE-20 | CE | 0.98 | 75 | Sí |
| CE-21 | CE | 0.92 | 50, 62.5, 75, 87.5, 100, 112.5 | Sí |
| CE-11 | CE | 0.92 | 55 | Sí |
| MCE-12 | MCE | 0.92 | 50 | Sí |
| MCE-31 | MCE | 0.92 | 55 | Sí |

Gramaje de una capa: **g/m² = densidad × micras**. Galgas = micras × 4.

Cuando construyas una hoja con capas, crea esta tabla en una hoja aparte ("Catálogo") y toma la densidad con `BUSCARX`/`BUSCARV` a partir del código; no la escribas a mano en cada capa.

### Reglas de estructura

1. Cada capa debe ser un material del catálogo.
2. El calibre debe estar entre los calibres válidos de ese material.
3. CE, MCE y CPP tienen cara sellante: solo pueden ir como **última capa**.
4. Máximo **una** capa sellante por estructura.
5. Producción HP no admite monocapa: mínimo 2 capas, porque la tinta debe quedar encapsulada.

La capa impresa ("rige") es la marcada como impresión; si no hay ninguna, es la primera.

## Fórmulas clave (resumen)

- **Metros lineales**: `ML = kg × 1000 / (gramaje_total × ancho_cm / 100)`
- **Kilos desde metros**: `kg = ML × gramaje_total × (ancho_cm / 100) / 1000`
- **Pistas al eje en HP**: `n = ENTERO((74.5 + 0.1) / (ancho_empaque + 0.1))`
- **Banda impresa en HP**: `n × ancho_empaque + (n − 1) × 0.1`, centrada en la bobina
- **Refile por lado**: `(ancho_bobina − banda) / 2`
- **Kilos por material**: muestra siempre dos columnas. **Kg netos** `= kg_total × gramaje_capa / gramaje_total` y **Kg brutos** `= kg_brutos_bobina × gramaje_capa / gramaje_total` (incluye el refile; es lo que se pide a almacén). Etiqueta siempre cuál es cuál.

Las fórmulas completas de cada módulo, el orden del desglose y los ejemplos de verificación están en [references/formulas.md](references/formulas.md). Léelo antes de construir cualquier módulo.

## Al entregar

Resume en el chat los resultados principales (ML, kilos totales, pistas, refile y merma) y señala cualquier advertencia: estructura inválida, ancho del producto mayor que el frame, bobinas rechazadas por ancho o stock insuficiente.
