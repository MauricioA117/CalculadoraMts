# Fórmulas por módulo

Unidades: anchos y largos en **cm**, pesos en **kg**, calibres en **µm**, gramajes en **g/m²**, metros lineales en **ML**.

Las fórmulas de Excel de abajo usan nombres de función en inglés (`INT`, `XLOOKUP`, `SUM`), que es como se escriben por la API de Excel; Excel las muestra traducidas al idioma del usuario. Los nombres de celda (`AnchoEmp`, `Kg`…) son sugerencias: crea nombres definidos o sustitúyelos por las referencias reales.

Regla general: **no redondees pasos intermedios**. La app solo redondea al mostrar (ML a entero, kilos a 2 decimales, porcentajes a 1–2 decimales).

---

## §1. Producción HP Indigo (pedido impreso)

### Entradas

| Nombre | Descripción | Ejemplo |
|---|---|---|
| `AnchoEmp` | Ancho del empaque (eje), cm | 18 |
| `AltoEmp` | Alto del empaque (desarrollo), cm | 20 |
| `Kg` | Kilos solicitados | 100 |
| `Tol` | Tolerancia en decimal | 0.10 |
| `AnchoBobina` | Bobina base de entrada, cm | 76 |
| Tabla `Capas` | Material, Micras, ¿Impresión? (Sí/No), Tinta g/m² (solo en la capa impresa; 2.0 por defecto) | BOPP MATE 20 (impresa) / PET MET 12 / CE-21 62.5 |

Constantes: `FrameAncho = 74.5`, `FrameAlto = 112.5`, `Sep = 0.1`, `Adh = 2`.

### 1. Acomodo en el frame

| Resultado | Fórmula |
|---|---|
| Pistas al eje `n` | `=INT((FrameAncho + Sep) / (AnchoEmp + Sep) + 1E-9)` |
| Filas en desarrollo | `=INT(FrameAlto / AltoEmp + 1E-9)` |
| Piezas por frame | `= n × filas` |
| Ancho útil de producto | `= n × AnchoEmp` (sin separaciones) |
| Separaciones totales | `=MAX(0, n − 1) × Sep` |
| Banda impresa | `= ancho útil + separaciones` (va centrada en la bobina) |

Si `n = 0`, el empaque no cabe en el frame: avísalo y no sigas.

### 2. Gramaje de la estructura

- Gramaje de cada capa: `= densidad × micras` (densidad del catálogo).
- Tinta: el valor de la columna Tinta de la capa impresa (2.0 g/m² por defecto). Si ninguna capa está marcada, se usa la primera.
- Adhesivo total: `= (número de capas − 1) × 2`.
- **Gramaje total** `G = SUM(gramajes de capas) + tinta + adhesivo`.

Tipo de estructura: 2 capas = Bilaminado, 3 = Trilaminado, más = Multicapa. HP exige mínimo 2.

### 3. Producción

| Resultado | Fórmula |
|---|---|
| Kilos totales | `= Kg × (1 + Tol)` |
| Metros lineales | `= KgTot × 1000 / (G × AnchoUtil / 100)`; se usa el **ancho útil de producto**, no la banda |
| Total de piezas | `= ML × 100 / AltoEmp × n` (con ML sin redondear) |

### 4. Desglose de kilos por material

La tabla lleva **dos columnas de kilos** por renglón:

- **Kg netos** (producto terminado): `= KgTot × gramaje_renglón / G`. También `% = gramaje_renglón / G`.
- **Kg brutos** (lo que se pide a almacén, incluye el refile): `= KgBrutosBobina × gramaje_renglón / G`, que equivale a kg netos + merma de ese renglón. `KgBrutosBobina` se calcula en el paso 5.

El orden del desglose sigue la manufactura:

1. Capa 1 (sustrato impreso)
2. Tinta digital
3. Adhesivo unión 1-2
4. Capa 2
5. Adhesivo unión 2-3
6. Capa 3, y así sucesivamente.

La suma de los kg netos debe dar `KgTot`, y la de los kg brutos, `KgBrutosBobina`.

### 5. Refile y merma lateral

| Resultado | Fórmula |
|---|---|
| Bobina efectiva | `=MAX(Banda, AnchoBobina)` |
| Refile por lado | `= (Bobina − Banda) / 2`, igual en ambas orillas |
| Merma total de ancho | `= Bobina − AnchoUtil` (refile de las dos orillas más las separaciones) |
| % merma de ancho | `= MermaAncho / Bobina` |
| Área desperdiciada (m²) | `= MermaAncho / 100 × ML` |
| Kg merma del sustrato impreso | `= Área × gramaje_capa_impresa / 1000` |
| Kg merma de la estructura | `= Área × G / 1000` |
| Kg brutos de bobina | `= KgTot + Kg merma estructura` |
| Merma por renglón del desglose | `= Área × gramaje_renglón / 1000` |

Nota: la app redondea la merma de ancho y el área a 2 decimales antes de calcular los kilos de merma. La diferencia es mínima, pero si un número sale 0.01 distinto, esa es la causa.

### Ejemplo de verificación

18 × 20 cm, 100 kg, tolerancia 10 %, bobina de 76 cm, BOPP MATE 20 (impresa, 2 g/m² de tinta) / PET MET 12 / CE-21 62.5:

- n = 4 pistas, 5 filas, 20 piezas por frame. Ancho útil 72 cm, separaciones 0.3 cm, banda 72.3 cm.
- G = 18.2 + 16.8 + 57.5 + 2 (tinta) + 4 (adhesivo) = **98.5 g/m²**. Trilaminado.
- Kilos totales 110. **ML = 1,551**. Total de piezas 31,021.
- Desglose, kg netos → brutos: BOPP MATE 20.32 → 21.45 · Tinta 2.23 → 2.36 · Adhesivo 1-2 2.23 → 2.36 · PET MET 18.76 → 19.80 · Adhesivo 2-3 2.23 → 2.36 · CE-21 64.21 → 67.78. Totales: 110 netos → 116.11 brutos.
- Refile por lado **1.85 cm**; merma de ancho 4 cm (5.26 %); área 62.04 m².
- Kg merma del sustrato 1.13; kg merma de la estructura 6.11; kg brutos de bobina 116.11.

---

## §2. Bobina individual

Entradas: ancho de la bobina (cm), kilos, capas. Sin tolerancia y sin frame. Sí admite monocapa.

- `G = SUM(densidad × micras) + tinta + (capas − 1) × 2`.
  - Tinta: el valor de la columna Tinta de la capa impresa (o de la primera capa, si ninguna está marcada). Si la celda está vacía, usa 2.0, salvo en una monocapa sin impresión, donde es 0.
- `ML = Kg × 1000 / (G × Ancho / 100)`.
- Kilos por capa: `= Kg × gramaje_capa / G`.

**Ejemplo:** bobina de 76 cm y 50 kg, BOPP MATE 20 (impresa) / PET MET 12 → G = 18.2 + 16.8 + 2 + 2 = 39 g/m², **ML = 1,687**. Kilos: BOPP MATE 23.33, PET MET 21.54.

---

## §3. Materia prima natural y refile (película virgen, una capa)

Entradas: modo (kilos o metros), cantidad, ancho de la bobina madre (cm, 76 por defecto), ancho solicitado total (cm), número de salidas, material y micras.

| Resultado | Fórmula |
|---|---|
| Gramaje | `= densidad × micras` (sin tinta ni adhesivo) |
| Ancho útil | `=MIN(Madre, Solicitado)`; si Solicitado > Madre, avisa de sobreancho |
| Ancho por salida | `= AnchoUtil / Salidas` |
| Refile total | `= Madre − AnchoUtil` |
| Refile por lado | `= RefileTotal / 2` |
| ML (modo kilos) | `= KgMadre × 1000 / (g × Madre / 100)` |
| Kg madre (modo metros) | `= ML × g × (Madre / 100) / 1000` |
| Kg útiles | `= ML × g × (AnchoUtil / 100) / 1000` |
| Kg de refile | `= KgMadre − KgÚtiles` |
| Kg por salida | `= KgÚtiles / Salidas` |
| % aprovechamiento / % refile | `= AnchoUtil / Madre` y `= RefileTotal / Madre` |
| Área total / útil / refile (m²) | `= ML × ancho_correspondiente / 100` |
| Rendimiento m²/kg | `= 1000 / g` |
| ML por kg madre / ML por kg útil | `= ML / KgMadre` y `= ML / KgÚtiles` |

**Ejemplo:** 100 kg de BOPP NAT 20 µm, madre de 76 cm, 70 cm útiles en 2 salidas → g = 18.2, **ML = 7,230**, refile 6 cm (3 por lado), kg útiles 92.11, kg de refile 7.89, 46.05 kg por salida, 54.95 m²/kg.

---

## §4. Lote de bobinas de inventario

Entradas: metros requeridos, ancho requerido (cm), gramaje del material (`densidad × micras`), ancho base estándar (76 cm) y una tabla de bobinas (código, peso kg, ancho cm, ¿activa?).

Por cada bobina activa, en el orden de la tabla:

| Columna | Fórmula |
|---|---|
| ¿Válida por ancho? | `= Ancho >= AnchoReq − 0.05` (margen de 0.5 mm). Las no válidas se rechazan y no suman nada. |
| ML de la bobina | `= Peso × 1000 / (g × Ancho / 100)` |
| Refile (cm) | `= Ancho − AnchoReq` |
| Kg de merma | `= ML × g × (Refile / 100) / 1000` |
| Kg útiles | `= Peso − Merma` |
| % de merma | `= Refile / Ancho` |
| ML acumulados | suma acumulada de ML de las bobinas válidas |
| % de cobertura acumulado | `= ML acumulados / MetrosReq` |
| Bobina meta | la primera en la que el acumulado pasa de < MetrosReq a ≥ MetrosReq |

Totales:

- ML totales (redondeado), kg brutos (suma de pesos válidos), merma total y kg útiles totales.
- Diferencia `= ML totales − MetrosReq`; cobertura `= ML totales / MetrosReq`; **alcanza** si ML totales ≥ MetrosReq.
- Si falta: metros faltantes `= MetrosReq − ML totales` y kg faltantes `= MetrosFalt × g × (AnchoBase / 100) / 1000`.
- Si sobra: metros sobrantes `= Diferencia` y kg sobrantes con la misma conversión a ancho base.
- % de merma global `= Merma total / Kg brutos`. Empalmes estimados `= bobinas válidas − 1`.

**Ejemplo:** 3,000 ML a 70 cm, g = 18.2 (BOPP MATE 20), bobinas B1 30 kg × 76 cm, B2 25 kg × 72 cm, B3 20 kg × 65 cm:

- B1: 2,169 ML, refile 6 cm, merma 2.37 kg.
- B2: 1,908 ML, refile 2 cm, merma 0.69 kg; es la bobina meta.
- B3: rechazada, porque 65 cm es menor que 70 cm.
- Total: **4,077 ML**, que sí alcanza (135.9 %). Sobran 1,077 ML = 14.90 kg a 76 cm. Merma de 3.06 kg (5.57 %), 1 empalme.

---

## §5. Kg sin impresión (corte / producto sin tinta)

Entradas: kilos, modo (`útiles objetivo` = los kilos son el producto terminado, que es el valor por defecto; `brutos` = los kilos son de bobina), ancho de producto (cm), ancho de sustrato (76 cm), separación entre pistas (cm, 0 por defecto), largo de producto (cm, opcional, para contar piezas), capas, ¿incluir adhesivo? (sí por defecto si hay 2 o más capas), adhesivo por unión (2.0) y % de merma de proceso (0 a 50).

| Resultado | Fórmula |
|---|---|
| Repeticiones `n` | `=INT((Sustrato + Sep) / (Producto + Sep) + 1E-9)`; si es 0, el ancho es insuficiente |
| Ancho útil | `= n × Producto` |
| Refile total / por lado | `= Sustrato − AnchoUtil` y la mitad por lado |
| Ratio de aprovechamiento `r` | `= AnchoUtil / Sustrato` |
| Gramaje `G` | `= SUM(densidad × micras) + (capas − 1) × adhesivo` (sin tinta) |
| Factor global `f` | `= r / (1 + MermaProceso%)` |

Kilos:

- **Modo útiles objetivo:** KgÚtiles = Kg; KgTotales `= KgÚtiles / f`; merma total `= KgTotales − KgÚtiles`; merma de refile `= KgTotales × (1 − r)`; merma de proceso `= KgÚtiles × MermaProceso%`.
- **Modo brutos:** KgTotales = Kg; merma de refile `= KgTotales × (1 − r)`; KgÚtiles `= f × KgTotales`; merma de proceso `= KgÚtiles × MermaProceso%`; merma total = refile + proceso.

Después:

- ML `= KgTotales × 1000 / (G × Sustrato / 100)`. ML útiles acumulados `= ML × n`.
- Área de sustrato `= ML × Sustrato / 100` y área útil `= ML × AnchoUtil / 100`.
- Piezas (si hay largo) `= INT(ML × 100 / Largo) × n`.
- Desglose por material y por adhesivo: `% = gramaje / G`, aplicado a KgTotales, KgÚtiles y merma.

**Ejemplo:** 100 kg útiles, producto de 24 cm, sustrato de 76 cm, largo de 30 cm, BOPP MATE 20 / BOPP MET 20, 3 % de merma de proceso:

- n = 3, ancho útil 72 cm, refile 4 cm (2 por lado).
- G = 38.4 g/m².
- Kg totales 108.72; merma 8.72 (refile 5.72 + proceso 3.00).
- **ML = 3,725**; 37,248 piezas.
- Por capa: 51.53 kg totales / 47.40 útiles. Adhesivo: 5.66 kg.

---

## §6. LDPE / sellante para laminación

Entradas por renglón: estructura (CE o MCE del catálogo), calibre (µm), densidad, ancho de bobina (cm, 76), metros a laminar, stock en kg y % de merma de laminación.

| Resultado | Fórmula |
|---|---|
| Gramaje | `= densidad × calibre` |
| Rendimiento m²/kg | `= 1000 / g` |
| ML por kg | `= 1000 / (g × Ancho / 100)` |
| Kg teóricos | `= Metros × (Ancho / 100) × g / 1000` |
| Kg de merma | `= KgTeóricos × Merma%` (merma sobre el neto) |
| Kg requeridos | `= KgTeóricos + KgMerma` |
| Diferencia | `= Stock − KgRequeridos`; alcanza si ≥ 0 |
| Kg por metro con merma `k` | `= (Ancho / 100) × (g / 1000) × (1 + Merma%)` |
| Metros alcanzables con el stock | `=INT(Stock / k)` |
| Si falta | kg faltantes `= −Diferencia`; metros faltantes `=ROUNDUP(KgFaltantes / k, 0)` |
| Si sobra | kg sobrantes `= Diferencia`; metros sobrantes `=INT(KgSobrantes / k)` |
| % de cobertura | `=MIN(999, Stock / KgRequeridos)` |

Consolidado de varios renglones: suma metros, kg requeridos, stock, faltantes (solo de los que no alcanzan) y sobrantes (solo de los que alcanzan). Balance `= Stock total − Requeridos total`.

**Ejemplo:** CE-21 62.5 µm (d 0.92), 76 cm, 5,000 m, stock de 200 kg, 5 % de merma:

- g = 57.5; 17.39 m²/kg; 22.88 ML/kg.
- Kg teóricos 218.50 + merma 10.93 = **229.43 kg requeridos**.
- **No alcanza:** faltan 29.43 kg ≈ 642 m.
- Con el stock se pueden laminar 4,358 m (87.2 % de cobertura).
