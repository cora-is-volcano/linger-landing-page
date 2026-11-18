// Set the launch post and collector when the campaign opens. Both are public URLs.
// The collector accepts a JSON POST {email, githubProfile, socialConfirmed,
// launchPostUrl, note} and returns HTTP 2xx with JSON {accepted: true} only after
// recording the application. It should validate inputs and deduplicate by email.
window.LINGER_WAITLIST = {
  launchPostUrl: '',
  applicationEndpoint: '',
  ...window.LINGER_WAITLIST,
};
