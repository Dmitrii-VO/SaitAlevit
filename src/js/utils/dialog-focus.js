export function keepDialogFocus(event, dialog) {
  if (event.key !== "Tab" || dialog.getAttribute("aria-hidden") !== "false") return;
  const controls = [...dialog.querySelectorAll("a[href], button:not(:disabled), input:not(:disabled)")].filter(
    element => element.getClientRects().length > 0,
  );
  if (!controls.length) return;
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
