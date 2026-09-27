/* "Check the throat" — tips the racket back to a low, raked angle (the way
 * you actually look at a frame on the bench) and draws a close-up of the
 * yoke so the sets of holes either side of the centre line can be counted.
 * 3 sets -> start the mains at the bottom. 4 sets -> start at the top. */
const Throat = (function () {

  function open(cfg) {
    const { racket, bed, throatPairs, headSvg, yokeSvg, depthSvg } = cfg;
    /* Read from the routing plan rather than restated here. Where the mains
       FINISH is a parity result, and the old wording -- "run up to the head,
       where they tie off" -- was only right for the frames whose mains-per-side
       count happens to be odd. mainsEnd and firstMainEnd do not depend on the
       method, so the plan can be asked for either. */
    const nM = (bed && bed.mains.length) || 16;
    const nC = (bed && bed.crosses.length) || 19;
    const pl = Steps.plan(throatPairs, cfg.method || 'two', nC, nM);
    const perSide = Math.round(nM / 2);

    /* Fourteen stacked copies of the racket were fourteen images in the
       accessibility tree, each carrying its own focusable knot markers. They
       are one visual effect, not fourteen pictures: hide them, and make sure
       nothing inside them can be tabbed to. */
    const decorative = svg => String(svg)
      .replace(/tabindex="0"/g, 'tabindex="-1"')
      .replace(/<svg /g, '<svg aria-hidden="true" focusable="false" ');
    /* A flat SVG rotated in 3D reads as a paper cutout. A real frame is a
     * ~22 mm deep beam, so edge-on you see a band, not a hairline. Stacking
     * dim copies along Z builds that band, shading from a lit near edge to a
     * dark far one. */
    const DEPTH = 13, STEP = 2.1;
    const depth = Array.from({ length: DEPTH }, (_, i) => {
      const t2 = i / (DEPTH - 1);
      return `<div class="tilt-layer" aria-hidden="true" style="transform:translateZ(${-(i + 1) * STEP}px);
        filter:brightness(${(0.72 - t2 * 0.45).toFixed(2)}) saturate(${(0.9 - t2 * 0.35).toFixed(2)})"
        >${decorative(depthSvg)}</div>`;
    }).join('');
    const th = racket.theme;
    const bottom = throatPairs === 3;
    const host = document.getElementById('throatModal');

    host.innerHTML = `
      <div class="modal-back"></div>
      <div class="modal-card" role="dialog" aria-modal="true" aria-label="Check the throat" tabindex="-1">
        <button class="modal-x" aria-label="Close">&times;</button>
        <header class="th-head">
          <h2>Count the sets at the throat</h2>
          <p>Tip the frame back and count the sets of holes either side of the centre line.</p>
          <details class="why"><summary>Why does the count matter?</summary>
            <p>That count, not your preference, decides which end the mains start from. It also decides where
               they finish and where the knots go. This is the real frame, tipped back and zoomed in on the
               yoke (the bridge at the bottom of the hoop), so you can compare it with the one in your hand.</p></details>
        </header>
        <div class="th-grid">
          <div class="th-tilt">
            <div class="tilt-viewport">
              <div class="tilt-stage">
                <div class="tilt-shadow" aria-hidden="true"></div>
                ${depth}
                <!-- one image, described once: role="img" stops assistive tech
                     walking the frame's internals as separate content -->
                <div class="tilt-face" role="img"
                     aria-label="${racket.brand} ${racket.model}, tipped back to show the throat.
                       The ${throatPairs} sets of main holes either side of the centre line are ringed.">
                  ${decorative(headSvg)}</div>
              </div>
            </div>
            <p class="tilt-cap">The yoke is lit up, and the ${throatPairs} sets are ringed on the frame.</p>
            <div class="tilt-ctl">
              <!-- 48, not 72. At a raked 72 the hoop squashes to a sliver and
                   the hole sets -- the entire point of the view -- cannot be
                   counted in it; the reader was being handed a striking image
                   and made to do the actual work in the flat close-up beside
                   it. Just enough rake to read as a frame tipped back on the
                   bench, with the yoke still legible. The slider still goes to
                   82 for anyone who wants the extreme angle. -->
              <label><span>Tilt <b class="tilt-val">48°</b></span>
                <input class="tilt-range" type="range" min="0" max="82" step="1" value="48"></label>
              <label><span>Zoom <b class="zoom-val">1.0×</b></span>
                <input class="zoom-range" type="range" min="1" max="2.5" step="0.05" value="1"></label>
              <p class="tilt-hint">scroll on the frame to zoom · drag to move it around
                <button class="linkbtn tilt-reset">reset</button></p>
            </div>
          </div>
          <div class="th-detail">
            <div class="th-yoke" role="img"
                 aria-label="Close-up of the yoke with the ${throatPairs} sets of main holes marked.">
              ${decorative(yokeSvg)}</div>
            <h3 class="th-result">Result</h3>
            <div class="th-verdict">
              <span class="th-count">${throatPairs} sets</span>
              <b>Start the mains at the ${bottom ? 'BOTTOM' : 'TOP'}</b>
              <em>Feed the two centre mains from the ${pl.mainsStart} toward the
                ${pl.firstMainEnd}. After working outward through ${perSide} mains per side, both
                main-string ends ${pl.mainsEnd === pl.mainsStart ? 'return to' : 'arrive at'} the
                ${pl.mainsEnd} and tie off there.</em>
            </div>
            <div class="th-rules">
              <div class="${bottom ? 'on' : ''}"><b>3 sets</b>, start at the bottom</div>
              <div class="${!bottom ? 'on' : ''}"><b>4 sets</b>, start at the top</div>
            </div>
            <p class="note">${racket.brand} ${racket.model}: <b>${throatPairs} sets</b>. This is built into
              the frame, so it is not something you choose. On a racket you do not know, count it before you
              thread anything. Most frames also print the pattern and the tie-off holes on the inside of the throat.</p>
          </div>
        </div>
      </div>`;

    host.classList.add('on');
    const restoreFocus = document.activeElement;
    const card = host.querySelector('.modal-card');
    card.focus();
    // keep tabbing inside the dialog while it is open
    host.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const f = [...card.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])')]
        .filter(el => !el.disabled && el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    const stage = host.querySelector('.tilt-stage');
    const range = host.querySelector('.tilt-range');
    const zrange = host.querySelector('.zoom-range');
    const val = host.querySelector('.tilt-val');
    const zval = host.querySelector('.zoom-val');

    let deg = 48, zoom = 1, px = 0, py = 0, drag = null;
    const apply = () => {
      clampPan();
      stage.style.transform =
        `perspective(1100px) translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) ` +
        `rotateX(${deg}deg) scale(${((1 - deg / 400) * zoom).toFixed(3)})`;
      val.textContent = Math.round(deg) + '°';
      zval.textContent = zoom.toFixed(1) + '×';
    };
    // past ~2.5x the frame fills the viewport and there is nothing left to see
    const MAXZ = 2.5, PAN = 220;
    const clampPan = () => { px = Math.max(-PAN, Math.min(PAN, px)); py = Math.max(-PAN, Math.min(PAN, py)); };
    const setZoom = z => { zoom = Math.max(1, Math.min(MAXZ, z)); zrange.value = zoom; apply(); };

    range.addEventListener('input', e => { deg = +e.target.value; apply(); });
    zrange.addEventListener('input', e => { zoom = Math.min(MAXZ, +e.target.value); apply(); });
    host.querySelector('.tilt-reset').addEventListener('click', () => {
      zoom = 1; px = py = 0; zrange.value = 1; apply();
    });

    const shell = host.querySelector('.th-tilt');
    shell.addEventListener('wheel', e => {
      e.preventDefault();
      setZoom(zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12));
    }, { passive: false });
    shell.addEventListener('pointerdown', e => {
      if (e.target.closest('input, button')) return;
      drag = { x: e.clientX, y: e.clientY, px, py };
      shell.setPointerCapture(e.pointerId); shell.classList.add('grabbing');
    });
    shell.addEventListener('pointermove', e => {
      if (!drag) return;
      px = drag.px + (e.clientX - drag.x);
      py = drag.py + (e.clientY - drag.y);
      stage.style.transition = 'none'; apply();
    });
    const endDrag = () => { drag = null; shell.classList.remove('grabbing');
      stage.style.transition = 'transform .3s cubic-bezier(.4,0,.2,1)'; };
    shell.addEventListener('pointerup', endDrag);
    shell.addEventListener('pointercancel', endDrag);

    // ease into the raked view so it reads as the racket tipping back
    deg = 0; apply();
    requestAnimationFrame(() => {
      stage.style.transition = 'transform .75s cubic-bezier(.4,0,.2,1)';
      deg = 48; range.value = 48; apply();
    });

    const close = () => {
      host.classList.remove('on');
      document.removeEventListener('keydown', esc);
      if (restoreFocus && restoreFocus.focus) restoreFocus.focus();
    };
    const esc = e => { if (e.key === 'Escape') close(); };
    host.querySelector('.modal-x').addEventListener('click', close);
    host.querySelector('.modal-back').addEventListener('click', close);
    document.addEventListener('keydown', esc);
  }

  return { open };
})();
