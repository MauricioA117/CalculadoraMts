/**
 * Movimiento de la interfaz.
 *
 * - Crossfade: al tocar una opción de un menú marcado con `data-fundir`, se congela una copia de cómo se veía
 *   la zona y se desvanece encima mientras el contenido nuevo aparece. Todo se pinta dentro de la página, así
 *   que respeta el filtro del tema oscuro / vidrio (las View Transitions del navegador lo ignoraban y parpadeaba).
 * - Título compartido: el nombre de la opción del menú vuela hasta el título del encabezado.
 * - Magnificación: en los contenedores con `data-magnifica`, cada botón crece según la cercanía del cursor.
 */

const DURACION_FUNDIDO = 300;
const DURACION_TITULO = 460;
const CURVA = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

const movimientoReducido = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Congela la zona, deja que React pinte lo nuevo y desvanece la copia vieja encima. */
export function fundirZona(zona: HTMLElement | null) {
  if (!zona || movimientoReducido()) return;
  const padre = zona.parentElement;
  if (!padre) return;
  const caja = zona.getBoundingClientRect();
  if (!caja.width || !caja.height) return;
  if (getComputedStyle(padre).position === 'static') padre.style.position = 'relative';
  const cajaPadre = padre.getBoundingClientRect();

  const copia = zona.cloneNode(true) as HTMLElement;
  copia.removeAttribute('data-fundido');
  copia.setAttribute('aria-hidden', 'true');
  copia.setAttribute('inert', '');
  copia.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
  copia.removeAttribute('id');
  // Los lienzos (render 3D, gráficas en canvas) se copian vacíos: se ocultan para no dejar huecos
  copia.querySelectorAll('canvas').forEach((c) => ((c as HTMLElement).style.visibility = 'hidden'));
  Object.assign(copia.style, {
    position: 'absolute',
    top: `${caja.top - cajaPadre.top + padre.scrollTop - padre.clientTop}px`,
    left: `${caja.left - cajaPadre.left + padre.scrollLeft - padre.clientLeft}px`,
    width: `${caja.width}px`,
    height: `${caja.height}px`,
    margin: '0',
    pointerEvents: 'none',
    zIndex: '1',
    overflow: 'hidden',
  });
  padre.appendChild(copia);

  // React pinta el contenido nuevo en este mismo evento; en el siguiente cuadro ya está listo para fundir
  requestAnimationFrame(() => {
    zona.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DURACION_FUNDIDO, easing: 'ease' });
    copia
      .animate([{ opacity: 1 }, { opacity: 0 }], { duration: DURACION_FUNDIDO, easing: 'ease', fill: 'forwards' })
      .finished.finally(() => copia.remove());
  });
}

/** Hace volar el título desde la posición de `desde` (la etiqueta del menú) hasta donde está. */
export function volarTitulo(desde: DOMRect | null, titulo: HTMLElement | null, tamanoDesde: number) {
  if (!desde || !titulo || movimientoReducido()) return;
  const hasta = titulo.getBoundingClientRect();
  if (!desde.width || !hasta.width) return;
  const tamanoHasta = parseFloat(getComputedStyle(titulo).fontSize) || 20;
  const escala = tamanoDesde / tamanoHasta;
  const dx = desde.left - hasta.left;
  const dy = desde.top + desde.height / 2 - (hasta.top + (hasta.height * escala) / 2);

  // Copia flotante por encima de la barra lateral; el título real se oculta mientras vuela
  const fantasma = titulo.cloneNode(true) as HTMLElement;
  fantasma.setAttribute('aria-hidden', 'true');
  Object.assign(fantasma.style, {
    position: 'fixed',
    left: `${hasta.left}px`,
    top: `${hasta.top}px`,
    width: `${hasta.width}px`,
    margin: '0',
    zIndex: '60',
    pointerEvents: 'none',
    transformOrigin: 'left top',
  });
  document.body.appendChild(fantasma);
  titulo.style.visibility = 'hidden';
  fantasma
    .animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${escala})`, opacity: 0.6 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: DURACION_TITULO, easing: CURVA },
    )
    .finished.finally(() => {
      titulo.style.visibility = '';
      fantasma.remove();
    });
}

let activo = false;

/** Activa (una sola vez) el crossfade de los menús con `data-fundir` y la magnificación de los `data-magnifica`. */
export function activarMovimiento() {
  if (activo || typeof document === 'undefined') return;
  activo = true;

  // Crossfade: en fase de captura, antes de que React procese el clic, para copiar la vista vieja
  document.addEventListener(
    'click',
    (e) => {
      const boton = (e.target as HTMLElement | null)?.closest?.('button');
      const menu = boton?.closest<HTMLElement>('[data-fundir]');
      if (!boton || !menu || boton.getAttribute('aria-current') === 'page') return;
      const selector = menu.dataset.fundir || '[data-fundido]';
      const zona = menu.closest<HTMLElement>(selector) ?? document.querySelector<HTMLElement>(selector);
      fundirZona(zona);
    },
    true,
  );

  // Magnificación: el más cercano al cursor crece más; se detecta solo si el menú está en fila o en columna
  const puedeMagnificar = window.matchMedia('(pointer: fine)');
  let actual: HTMLElement | null = null;
  let pendiente = 0;
  const soltar = (menu: HTMLElement) => menu.querySelectorAll<HTMLElement>('button').forEach((b) => b.style.setProperty('--mag', '0'));
  document.addEventListener('pointermove', (e) => {
    if (!puedeMagnificar.matches || movimientoReducido()) return;
    const x = e.clientX;
    const y = e.clientY;
    const menu = (e.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-magnifica]') ?? null;
    if (actual && actual !== menu) soltar(actual);
    actual = menu;
    if (!menu || pendiente) return;
    pendiente = requestAnimationFrame(() => {
      pendiente = 0;
      const enColumna = getComputedStyle(menu).flexDirection.startsWith('column');
      const alcance = enColumna ? 110 : 150;
      menu.querySelectorAll<HTMLElement>('button').forEach((b) => {
        const caja = b.getBoundingClientRect();
        // En fila cuenta también la distancia vertical (pesa el doble) para que los menús de varias filas no crezcan en columna
        const distancia = enColumna
          ? Math.abs(y - (caja.top + caja.height / 2))
          : Math.hypot(x - (caja.left + caja.width / 2), 2 * (y - (caja.top + caja.height / 2)));
        b.style.setProperty('--mag', Math.max(0, 1 - distancia / alcance).toFixed(3));
      });
    });
  });
  document.addEventListener('pointerleave', () => actual && soltar(actual));
}
