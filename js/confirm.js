/* A styled yes or no question, in place of the browser's confirm().
 *
 * ask({ title, body, yes, no }, onYes, onNo) shows the question over whatever
 * is open, moves focus to the safe answer, keeps Tab inside, and treats
 * Escape, the backdrop and the close button as "no". Focus goes back to
 * wherever it was when the question was asked.
 *
 * It is on window so the tests can answer it without a click. */
const Confirm = (function () {
  let host = null, done = null, opener = null;

  function build() {
    host = document.createElement('div');
    host.className = 'modal';
    host.id = 'confirmModal';
    host.innerHTML = `
      <div class="modal-back" data-cf="no"></div>
      <div class="modal-card cf-card" role="alertdialog" aria-modal="true"
        aria-labelledby="cfTitle" aria-describedby="cfBody" tabindex="-1">
        <button class="modal-x" type="button" data-cf="no" aria-label="Close">&times;</button>
        <h2 class="cf-title" id="cfTitle"></h2>
        <p class="cf-body" id="cfBody"></p>
        <div class="cf-nav">
          <button type="button" class="btn ghost" data-cf="no"></button>
          <button type="button" class="btn primary" data-cf="yes"></button>
        </div>
      </div>`;
    document.body.appendChild(host);
    host.addEventListener('click', e => {
      const b = e.target.closest('[data-cf]');
      if (b) answer(b.dataset.cf === 'yes');
    });
    host.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); answer(false); return; }
      if (e.key !== 'Tab') return;
      const f = [...host.querySelectorAll('.cf-card button')];
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  function answer(yes) {
    if (!done) return;
    const d = done; done = null;
    host.classList.remove('on');
    if (opener && opener.focus && document.contains(opener)) opener.focus();
    opener = null;
    if (yes) { if (d.onYes) d.onYes(); } else if (d.onNo) d.onNo();
  }

  function ask(o, onYes, onNo) {
    if (!host) build();
    opener = document.activeElement;
    done = { onYes, onNo };
    host.querySelector('.cf-title').textContent = o.title || 'Are you sure?';
    host.querySelector('.cf-body').textContent = o.body || '';
    host.querySelector('[data-cf=yes]').textContent = o.yes || 'Yes';
    host.querySelector('.cf-nav [data-cf=no]').textContent = o.no || 'Cancel';
    host.classList.add('on');
    // the safe answer takes focus, so a stray Enter keeps the work
    host.querySelector('.cf-nav [data-cf=no]').focus();
  }

  const api = { ask, isOpen: () => !!done };
  window.Confirm = api;
  return api;
})();
