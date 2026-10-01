/* "Check the throat" — tips the racket back to a low, raked angle (the way
 * you actually look at a frame on the bench) and draws a close-up of the
 * yoke so the sets of holes either side of the center line can be counted.
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
    const mq = q => !!(window.matchMedia && window.matchMedia(q).matches);
    const touchOnly = mq('(hover: none)');
    const narrow = mq('(max-width: 860px)');

    /* Why the count matters: start from the wrong end and the mains finish in
       the throat, where the frame narrows and there is no hole left to come
       out of, so the job cannot carry on. */
    /* Why the count matters, drawn from how it really fails. On the throat
       side the string loops on the outside of the frame from one main hole to
       the next. Only the first few holes (the sets you count) sit on the bridge
       between the two throat arms; the next one is past an arm. Start from the
       right end and every throat-side loop joins two holes on the same side of
       an arm. Start from the wrong end and one loop has to get from the last
       bridge hole to the first hole past the arm, straight through the arm. */
    const whySvg = startAt => {
      const n = throatPairs, W = 380, H = 262, cx = 190, PER = 6, GAP = 22;
      const yAt = off => 150 - 0.0026 * off * off;            // the bottom of the hoop
      const off = k => 11 + GAP * (k - 1);                      // hole k from the center line
      const armOff = GAP * n;                                   // where each throat arm meets the hoop
      const C = { frame: '#3a4049', edge: '#59616c', main: '#c3ccd7', loop: '#f2f0ea',
                  ok: '#79cfa4', bad: '#e8b268', hole: '#9aa3b0', ink: '#c3ccd7' };
      let g = '';
      // the hoop's bottom, as a band
      const band = [];
      for (let x = 8; x <= W - 8; x += 6) band.push(`${x},${yAt(x - cx).toFixed(1)}`);
      // throat arms, from where they leave the hoop down toward the handle
      [-1, 1].forEach(sd => {
        const x0 = cx + sd * armOff, y0 = yAt(armOff);
        g += `<path d="M${x0},${y0 + 4} C${x0 - sd * 6},${y0 + 46} ${cx + sd * 30},${H - 40} ${cx + sd * 18},${H}"
          stroke="${C.frame}" stroke-width="16" fill="none" stroke-linecap="round"/>`;
      });
      g += `<polyline points="${band.join(' ')}" fill="none" stroke="${C.frame}" stroke-width="16" stroke-linecap="round"/>
        <polyline points="${band.join(' ')}" fill="none" stroke="${C.edge}" stroke-width="1" transform="translate(0,-8)"/>`;
      // from the wrong end the job never gets past the arm, so nothing beyond it is strung
      const first = startAt === 'throat' ? 2 : 1;
      const stuck = first % 2 === n % 2;                       // a throat loop pairs hole n with n + 1
      const reach = stuck ? n : PER;
      // the mains running up from their holes
      for (let k = 1; k <= reach; k++) [-1, 1].forEach(sd => {
        const x = cx + sd * off(k);
        g += `<line x1="${x}" y1="${yAt(off(k)) - 9}" x2="${x}" y2="6" stroke="${C.main}" stroke-width="2" stroke-opacity="${k > 4 ? 0.55 : 0.9}"/>`;
      });
      // throat-side loops: starting at the throat, mains 1 and 2 join at the head, so the
      // throat loops are 2-3, 4-5, ...; starting at the head they are 1-2, 3-4, ...
      let blocked = null;
      for (let k = first; k + 1 <= PER && k <= reach; k += 2) [-1, 1].forEach(sd => {
        const a = cx + sd * off(k), b = cx + sd * off(k + 1), ya = yAt(off(k)) + 9, yb = yAt(off(k + 1)) + 9;
        const crosses = k <= n && k + 1 > n;
        const col = crosses ? C.bad : C.loop;
        g += `<path d="M${a},${ya} C${a},${ya + 18} ${b},${yb + 18} ${b},${yb}" fill="none" stroke="${col}"
          stroke-width="3" stroke-linecap="round" ${crosses ? 'stroke-dasharray="5 4"' : ''}/>`;
        if (crosses && sd > 0) blocked = { x: cx + armOff, y: yAt(armOff) + 18 };
      });
      // the holes, numbered outward from the center, the ones on the bridge highlighted
      for (let k = 1; k <= PER; k++) [-1, 1].forEach(sd => {
        const x = cx + sd * off(k), y = yAt(off(k));
        g += `<rect x="${x - 3}" y="${y - 7}" width="6" height="14" rx="2.5" fill="${k <= n ? '#4cc9e0' : C.hole}"
          stroke="#05070a" stroke-width="1"/>`;
        if (sd > 0) g += `<text x="${x}" y="${y + 34}" text-anchor="middle" class="why-n">${k}</text>`;
      });
      // the bridge, and what goes wrong
      g += `<path d="M${cx - armOff + 6},${yAt(armOff) + 46} L${cx + armOff - 6},${yAt(armOff) + 46}" stroke="#4cc9e0"
          stroke-width="1.2" stroke-dasharray="3 3"/>
        <text x="${cx}" y="${yAt(armOff) + 60}" text-anchor="middle" class="why-l" fill="#4cc9e0">${n} sets on the bridge</text>`;
      if (blocked) {
        g += `<path d="M${blocked.x - 9},${blocked.y - 9} l18,18 M${blocked.x + 9},${blocked.y - 9} l-18,18"
            stroke="#ef4444" stroke-width="3.6" stroke-linecap="round"/>
          <text x="${W - 10}" y="${H - 34}" text-anchor="end" class="why-l" fill="${C.bad}">this loop has to</text>
          <text x="${W - 10}" y="${H - 20}" text-anchor="end" class="why-l" fill="${C.bad}">go through the arm</text>`;
      } else {
        g += `<text x="${W - 12}" y="${H - 34}" text-anchor="end" class="why-l" fill="${C.ok}">every loop stays</text>
          <text x="${W - 12}" y="${H - 20}" text-anchor="end" class="why-l" fill="${C.ok}">clear of the arms</text>`;
      }
      return `<svg viewBox="0 0 ${W} ${H}" class="why-svg" role="img" aria-label="${blocked
        ? 'Starting from the ' + startAt + ': one loop on the throat side would have to pass through the throat arm.'
        : 'Starting from the ' + startAt + ': every loop on the throat side joins two holes on the same side of an arm.'}">${g}</svg>`;
    };
    const host = document.getElementById('throatModal');

    host.innerHTML = `
      <div class="modal-back"></div>
      <div class="modal-card" role="dialog" aria-modal="true" aria-label="Check the throat" tabindex="-1">
        <button class="modal-x" aria-label="Close">&times;</button>
        <header class="th-head">
          <h2>Count the sets at the throat</h2>
          <p>Tip the frame back and count the sets of holes either side of the center line.</p>
          <button type="button" class="btn th-why-btn"><span class="why-q" aria-hidden="true">?</span>Why count?</button>
        </header>
        <div class="th-why" hidden>
          <button type="button" class="btn ghost th-why-back">&larr; Back to counting</button>
          <h2 class="th-why-h">Why count?</h2>
          <p>Start from the wrong end and one loop at the throat has to pass through a throat arm. You can't
            string that, so you're stuck and have to start over.</p>
          <div class="why-pair">
            <figure>${whySvg(pl.mainsStart)}<figcaption><b>Start at the ${pl.mainsStart}</b> (right for ${throatPairs} sets).
              Loops at the throat pair up holes that sit side by side.</figcaption></figure>
            <figure>${whySvg(pl.mainsStart === 'throat' ? 'head' : 'throat')}<figcaption><b>Start at the
              ${pl.mainsStart === 'throat' ? 'head' : 'throat'}</b> (wrong). The dashed loop would have to pass
              through the throat arm.</figcaption></figure>
          </div>
        </div>
        <div class="th-grid">
          <div class="th-tilt">
            <div class="tilt-viewport">
              <div class="tilt-stage">
                <div class="tilt-shadow" aria-hidden="true"></div>
                ${depth}
                <!-- one image, described once: role="img" stops assistive tech
                     walking the frame's internals as separate content -->
                <div class="tilt-face" role="img"
                     aria-label="${racket.brand} ${racketName(racket)}, tipped back to show the throat.
                       The ${throatPairs} sets of main holes either side of the center line are ringed.">
                  ${decorative(headSvg)}</div>
              </div>
            </div>
            <p class="tilt-cap">The bottom of the hoop is lit up, and the ${throatPairs} sets are ringed on the frame.</p>
            <!-- on a phone the sliders fold away behind "Tilt and zoom", so the
                 close-up and the result fit on one screen; pinch and drag
                 still work on the frame itself -->
            <details class="tilt-more" ${narrow ? '' : 'open'}>
            <summary class="tilt-sum">Tilt and zoom</summary>
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
              <p class="tilt-hint">${touchOnly ? 'pinch' : 'scroll on the frame'} to zoom · drag to move it around
                <button class="linkbtn tilt-reset">reset</button></p>
            </div>
            </details>
          </div>
          <div class="th-detail">
            <div class="th-yoke" role="img"
                 aria-label="Close-up of the bottom of the hoop with the ${throatPairs} sets of main holes marked.">
              ${decorative(yokeSvg)}</div>
            <h3 class="th-result">Result</h3>
            <div class="th-verdict">
              <span class="th-count">${throatPairs} sets</span>
              <b>Start the mains at the ${pl.mainsStart}</b>
              <em>Feed the two center mains from the ${pl.mainsStart} toward the
                ${pl.firstMainEnd}. After working outward through ${perSide} mains per side, both
                main-string ends ${pl.mainsEnd === pl.mainsStart ? 'return to' : 'arrive at'} the
                ${pl.mainsEnd} and tie off there.</em>
            </div>
            <p class="note">Most frames also print the pattern and tie-off holes inside the throat.</p>
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
      const f = [...card.querySelectorAll('button, input, summary, [tabindex]:not([tabindex="-1"])')]
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
      if (e.target.closest('input, button, summary')) return;
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
    /* Why count? is its own page: the counting view steps aside for it, and
       a back button brings the counting view back. */
    const whyBox = host.querySelector('.th-why');
    const mainParts = [host.querySelector('.th-head'), host.querySelector('.th-grid')];
    const showWhy = on => {
      whyBox.hidden = !on;
      mainParts.forEach(x => { x.hidden = on; });
      card.scrollTop = 0;
      (on ? host.querySelector('.th-why-back') : host.querySelector('.th-why-btn')).focus();
    };
    host.querySelector('.th-why-btn').addEventListener('click', () => showWhy(true));
    host.querySelector('.th-why-back').addEventListener('click', () => showWhy(false));
    host.querySelector('.modal-back').addEventListener('click', close);
    document.addEventListener('keydown', esc);
  }

  return { open };
})();
