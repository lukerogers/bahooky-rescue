// Keep installation optional: unsupported/insecure browsers can still play online.
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(new URL('../sw.js', import.meta.url), {
      updateViaCache: 'none',
    }).catch(error => console.warn('Offline play is unavailable:', error));
  });
}
