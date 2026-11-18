// Touch browsers may defer :active until release. Keep clicks and scrolling native.
for (const button of document.querySelectorAll('.btn, .review-button, .apply-button')) {
  button.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch' && event.isPrimary && !button.matches(':disabled')) {
      button.toggleAttribute('data-touch-pressed', true);
    }
  });
  const release = event => {
    if (event.pointerType === 'touch' && event.isPrimary) button.removeAttribute('data-touch-pressed');
  };
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    button.addEventListener(type, release);
  }
}
