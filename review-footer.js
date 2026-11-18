(() => {
  'use strict';
  const dialog = document.getElementById('business-contact-dialog');
  const form = document.getElementById('business-contact-form');
  if (!dialog || !form) return;
  let trigger = null;
  document.querySelectorAll('[data-contact-open]').forEach(button => {
    button.addEventListener('click', () => {
      trigger = button;
      if (!dialog.open) {
        document.getElementById('contact-form-status').textContent = '';
        dialog.showModal();
      }
    });
  });
  dialog.querySelector('[data-contact-close]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => trigger?.focus({ preventScroll: true }));
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const subject = form.elements.subject.value.trim();
    const message = form.elements.message.value.trim();
    if (!subject || !message) {
      document.getElementById('contact-form-status').textContent = 'Please add a subject and message.';
      return;
    }
    document.getElementById('contact-form-status').textContent = 'Your email app will open a draft. Review it there before sending.';
    window.location.href = `mailto:tonyzhang@simplexai.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  });
})();
