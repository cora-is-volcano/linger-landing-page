(() => {
  'use strict';
  // Integrators may set these before this script. No credentials belong here.
  const config = window.LINGER_SITE_CONFIG || {};
  // Updates remain visibly unavailable until a real subscription flow is supplied.
  const httpsUrl = value => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
    } catch { return null; }
  };
  const waitlistUrl = httpsUrl(config.waitlistUrl);
  const waitlistDialog = document.getElementById('waitlist-dialog');
  let waitlistTrigger = null;
  document.querySelectorAll('[data-waitlist]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      if (waitlistUrl) {
        window.location.assign(waitlistUrl);
        return;
      }
      waitlistTrigger = button;
      if (waitlistDialog && !waitlistDialog.open) {
        waitlistDialog.returnValue = '';
        waitlistDialog.showModal();
      }
    });
  });
  if (waitlistDialog) {
    waitlistDialog.querySelector('[data-waitlist-close]')?.addEventListener('click', () => waitlistDialog.close());
    waitlistDialog.querySelector('[data-waitlist-download]')?.addEventListener('click', () => waitlistDialog.close('download'));
    waitlistDialog.addEventListener('click', event => {
      if (event.target !== waitlistDialog) return;
      const box = waitlistDialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) waitlistDialog.close();
    });
    waitlistDialog.addEventListener('close', () => {
      if (waitlistDialog.returnValue === 'download') {
        // Continue keyboard navigation at the destination, not the hero CTA.
        document.getElementById('download-title')?.focus({ preventScroll: true });
      } else {
        waitlistTrigger?.focus({ preventScroll: true });
      }
    });
  }
  const discordUrl = httpsUrl(config.discordUrl);
  const discordPending = document.getElementById('discord-pending');
  if (discordUrl && discordPending) {
    const link = document.createElement('a');
    link.href = discordUrl;
    link.className = 'review-social-circle';
    link.setAttribute('aria-label', 'Join the Linger Discord community');
    const icon = discordPending.querySelector('svg');
    if (icon) link.append(icon.cloneNode(true));
    const label = document.createElement('span');
    label.className = 'sr-only';
    label.textContent = 'Discord';
    link.append(label);
    discordPending.replaceWith(link);
  }
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
