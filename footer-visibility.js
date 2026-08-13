(() => {
  const root = document.documentElement;
  const revealFooter = () => {
    document.querySelectorAll('[data-site-footer]').forEach((footer) => {
      footer.hidden = false;
    });
    root.dataset.footerGeo = 'RU';
  };

  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[?::1\]?)$/.test(window.location.hostname)) {
    revealFooter();
    return;
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 3000);

  fetch('/cdn-cgi/trace', {
    cache: 'no-store',
    credentials: 'omit',
    signal: controller.signal,
  })
    .then((response) => {
      if (!response.ok) throw new Error('Country lookup failed');
      return response.text();
    })
    .then((trace) => {
      const country = trace.match(/^loc=([A-Z]{2})$/m)?.[1];
      if (!country) throw new Error('Country is missing');
      root.dataset.footerGeo = country;
      if (country === 'RU') revealFooter();
    })
    .catch(() => { root.dataset.footerGeo = 'unknown'; })
    .finally(() => window.clearTimeout(timeout));
})();
