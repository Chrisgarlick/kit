// SPDX-License-Identifier: MIT
//
// Dialog behaviour for the native <dialog> (no custom element). Newer
// browsers can open and close dialogs from markup alone:
//
//   <button commandfor="d" command="show-modal">Open</button>
//   <dialog id="d" closedby="any"> … <button commandfor="d" command="close">Close</button></dialog>
//
// This fills in the browsers that can't yet (invoker commands arrived in
// Chrome 135, Firefox 144 and Safari 26; closedby in Chrome 134), so the same
// markup works across kit's whole browser floor:
//
//   command="show-modal" | "close" | "request-close"   (close passes the button's value as returnValue)
//   closedby="any"   a click on the backdrop closes it, as Escape does
//
// It also puts focus back on the button that opened the dialog when it
// closes, if focus would otherwise be lost. Importing it twice is harmless.

const KEY = Symbol.for('kit.dialog');

function requestClose(dialog, value) {
  if (typeof dialog.requestClose === 'function') { dialog.requestClose(value); return; }
  // Like Escape: a cancelable cancel event first, so a dialog can refuse.
  if (dialog.dispatchEvent(new Event('cancel', { cancelable: true }))) dialog.close(value);
}

function install() {
  if (globalThis[KEY]) return;
  globalThis[KEY] = true;
  const nativeCommands = 'commandForElement' in HTMLButtonElement.prototype;
  const nativeClosedBy = 'closedBy' in HTMLDialogElement.prototype;
  const openers = new WeakMap(); // dialog -> the button that opened it

  // Remember the opener whichever way the dialog is opened.
  document.addEventListener('click', (e) => {
    const b = e.target.closest?.('button[commandfor]');
    if (!b || b.disabled) return;
    const dialog = document.getElementById(b.getAttribute('commandfor'));
    if (!(dialog instanceof HTMLDialogElement)) return;
    const command = b.getAttribute('command');
    if (command === 'show-modal' || command === 'show') openers.set(dialog, b);
    if (nativeCommands) return;
    if (b.form && b.type !== 'button') return; // as natively: a submit or reset button in a form keeps its own job
    if (command === 'show-modal' && !dialog.open) dialog.showModal();
    else if (command === 'close' && dialog.open) dialog.close(b.value || undefined);
    else if (command === 'request-close' && dialog.open) requestClose(dialog, b.value || undefined);
  }, true);

  // closedby="any": a press that starts and ends on the backdrop closes it.
  if (!nativeClosedBy) {
    const outside = (dialog, e) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    let downOutside = null;
    document.addEventListener('pointerdown', (e) => {
      const d = e.target;
      downOutside = d instanceof HTMLDialogElement && d.open && d.getAttribute('closedby') === 'any' && outside(d, e) ? d : null;
    }, true);
    document.addEventListener('click', (e) => {
      const d = e.target;
      if (d === downOutside && d.open && outside(d, e)) requestClose(d);
      downOutside = null;
    }, true);
  }

  // Focus goes back to the opener if closing left it nowhere useful.
  document.addEventListener('close', (e) => {
    const dialog = e.target;
    if (!(dialog instanceof HTMLDialogElement)) return;
    const opener = openers.get(dialog);
    requestAnimationFrame(() => {
      const lost = !document.activeElement || document.activeElement === document.body || dialog.contains(document.activeElement);
      if (lost && opener?.isConnected) opener.focus();
    });
  }, true);
}

install();
