(() => {
  'use strict';
  const config = window.LINGER_WAITLIST || {};
  const form = document.querySelector('#waitlist-form');
  const email = form.elements.email;
  const github = form.elements.github;
  const attestation = form.elements.socialConfirmed;
  const button = document.querySelector('#apply-button');
  const availability = document.querySelector('#availability');
  const status = document.querySelector('#form-status');
  const dialog = document.querySelector('.application-dialog');
  let accepted = false;
  let sending = false;

  function publicUrl(value) {
    try {
      const url = new URL(value);
      if (url.protocol === 'https:' && !url.username && !url.password && !url.port) return url;
    } catch { /* Empty or invalid configuration keeps registration closed. */ }
    return null;
  }

  const endpoint = publicUrl(config.applicationEndpoint);
  const candidatePost = publicUrl(config.launchPostUrl);
  const post = candidatePost && /^(?:www\.)?(?:x|twitter)\.com$/.test(candidatePost.hostname)
    && /^\/HeyLingerAI\/status\/\d+\/?$/i.test(candidatePost.pathname) ? candidatePost : null;

  function githubProfile() {
    const url = publicUrl(github.value.trim());
    const profilePath = /^\/[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}\/?$/i;
    if (url?.hostname !== 'github.com' || !profilePath.test(url.pathname)) return null;
    return `https://github.com${url.pathname.replace(/\/$/, '')}`;
  }

  function showResult(title, description) {
    document.querySelector('#result-title').textContent = title;
    document.querySelector('#result-description').textContent = description;
    dialog.showModal();
  }

  if (post) {
    // The fallback remains a usable link when embeds are blocked.
    const embed = document.createElement('iframe');
    const tweetId = post.pathname.split('/').filter(Boolean).pop();
    embed.src = `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&dnt=true`;
    embed.title = 'Linger’s launch announcement on X';
    embed.loading = 'lazy';
    embed.referrerPolicy = 'no-referrer';
    const postLink = document.createElement('a');
    postLink.href = post.origin + post.pathname;
    postLink.target = '_blank';
    postLink.rel = 'noopener noreferrer';
    postLink.className = 'launch-link';
    postLink.textContent = 'Open the launch post on X';
    document.querySelector('#post-pending').replaceWith(embed, postLink);
    attestation.disabled = false;
    button.disabled = false;
    button.textContent = endpoint ? 'Apply to join' : 'Check application';
    availability.textContent = endpoint ? 'Apply with your email, GitHub profile and launch repost.' : 'You can check your application here. Submissions open soon.';
  }

  github.addEventListener('input', () => github.setCustomValidity(''));
  form.addEventListener('input', () => { status.textContent = ''; });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!post || accepted || sending) return;
    const profile = githubProfile();
    github.setCustomValidity(profile ? '' : 'Enter a GitHub profile URL, such as https://github.com/username.');
    if (!form.reportValidity() || !attestation.checked) return;
    if (!endpoint) {
      showResult('Ready to apply', 'Your application is complete. Submissions open soon. Your details have not been sent.');
      return;
    }
    const application = {
      email: email.value.trim(),
      githubProfile: profile,
      socialConfirmed: true,
      launchPostUrl: post.origin + post.pathname,
      note: form.elements.note.value.trim(),
    };
    button.disabled = true;
    sending = true;
    button.textContent = 'Submitting…';
    status.textContent = '';
    try {
      const response = await fetch(endpoint.href, {
        method: 'POST', credentials: 'omit', cache: 'no-store', redirect: 'error',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(application), signal: AbortSignal.timeout(15000),
      });
      if (!response.ok || (await response.json()).accepted !== true) throw new Error('Unconfirmed registration');
      accepted = true;
      form.reset();
      for (const control of form.elements) control.disabled = true;
      button.textContent = 'Application received';
      availability.tabIndex = -1;
      availability.textContent = 'Application received. We’ll email selected testers with next steps.';
      showResult('Application received', 'Thanks for applying. If you’re selected, we’ll email your invitation and the next steps for claiming test credits on Discord.');
    } catch {
      status.textContent = 'We couldn’t confirm your application. Please try again.';
      button.textContent = 'Apply to join';
      button.disabled = false;
    } finally {
      sending = false;
    }
  });
  dialog.addEventListener('close', () => (accepted ? availability : button).focus());
})();
