/* ==========================================================================
   The Legend of CPU — ui.js
   Peças de interface compartilhadas: notificações (toasts) e janelas
   (<dialog>) com confirmação acessível. Avisa os outros módulos quando
   uma janela abre/fecha (o cronômetro pausa enquanto há janela aberta).
   ========================================================================== */
(function (LCPU) {
  'use strict';

  var U = LCPU.Utils;
  var openCount = 0;
  var MAX_TOASTS = 3;

  /* ---------- Notificações ---------- */
  function toast(opts) {
    var box = document.getElementById('toasts');
    if (!box) return;
    var options = typeof opts === 'string' ? { message: opts } : (opts || {});
    var item = U.el('div', { class: 'toast toast-' + (options.type || 'info') });
    if (options.icon && LCPU.Pixel) {
      var icon = U.el('span', { class: 'toast-icon', 'aria-hidden': 'true' });
      icon.appendChild(LCPU.Pixel.icon(options.icon));
      item.appendChild(icon);
    }
    var body = U.el('div', { class: 'toast-body' }, [
      options.title ? U.el('strong', { class: 'toast-title', text: options.title }) : null,
      U.el('span', { class: 'toast-message', text: options.message || '' })
    ]);
    item.appendChild(body);
    box.appendChild(item);
    while (box.children.length > MAX_TOASTS) box.removeChild(box.firstChild);
    window.setTimeout(function () {
      item.classList.add('is-leaving');
      window.setTimeout(function () { if (item.parentNode) item.parentNode.removeChild(item); }, 400);
    }, options.duration || 4500);
  }

  /* ---------- Janelas ---------- */
  function open(dialog) {
    if (!dialog || dialog.open) return;
    dialog._returnFocus = document.activeElement;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    openCount += 1;
    LCPU.emit('ui:modal', { open: true, id: dialog.id });
  }

  function close(dialog, value) {
    if (!dialog || !dialog.open) return;
    if (typeof dialog.close === 'function') dialog.close(value || '');
    else {
      dialog.removeAttribute('open');
      dialog.dispatchEvent(new Event('close'));
    }
  }

  function bindDialog(dialog) {
    dialog.addEventListener('close', function () {
      openCount = Math.max(0, openCount - 1);
      LCPU.emit('ui:modal', { open: openCount > 0, id: dialog.id, value: dialog.returnValue });
      var back = dialog._returnFocus;
      if (back && typeof back.focus === 'function' && document.contains(back)) {
        try { back.focus({ preventScroll: true }); } catch (err) { back.focus(); }
      }
    });
    // Clicar fora da caixa (no fundo escurecido) fecha a janela
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) close(dialog, 'cancel');
    });
  }

  /** Confirmação: devolve uma Promise<boolean>. */
  function confirm(opts) {
    var dialog = document.getElementById('dialog-confirm');
    if (!dialog) return Promise.resolve(window.confirm(opts.message));
    U.$('#dialog-confirm-title').textContent = opts.title || 'Tem certeza?';
    U.$('#dialog-confirm-message').textContent = opts.message || '';
    var ok = U.$('#dialog-confirm-ok');
    var cancel = U.$('#dialog-confirm-cancel');
    ok.textContent = opts.confirmText || 'Confirmar';
    cancel.textContent = opts.cancelText || 'Cancelar';
    ok.className = 'btn ' + (opts.danger ? 'btn-danger' : 'btn-primary');
    return new Promise(function (resolve) {
      dialog.addEventListener('close', function handler() {
        dialog.removeEventListener('close', handler);
        resolve(dialog.returnValue === 'confirm');
      });
      dialog.returnValue = '';
      open(dialog);
      cancel.focus(); // ação segura em foco por padrão
    });
  }

  function init() {
    U.$$('dialog.modal').forEach(bindDialog);
    // Links dentro de janelas (ex.: "Guia completo") fecham a janela antes de navegar
    document.addEventListener('click', function (event) {
      var link = event.target.closest('[data-close-dialog]');
      if (!link) return;
      var dialog = link.closest('dialog');
      if (dialog) close(dialog, 'link');
    });
  }

  LCPU.UI = {
    toast: toast,
    open: open,
    close: close,
    confirm: confirm,
    get modalOpen() { return openCount > 0; }
  };

  LCPU.register('ui', init);
})(window.LCPU = window.LCPU || {});
