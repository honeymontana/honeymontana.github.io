// System analyst preorder landing interactions at /sa/.
const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const navigation = document.querySelector('[data-nav]');

const setMenuState = (isOpen) => {
  if (!menuToggle || !navigation || !header) return;

  menuToggle.setAttribute('aria-expanded', String(isOpen));
  navigation.classList.toggle('is-open', isOpen);
  header.classList.toggle('is-menu-open', isOpen);
  document.body.classList.toggle('menu-open', isOpen);
};

menuToggle?.addEventListener('click', () => {
  setMenuState(menuToggle.getAttribute('aria-expanded') !== 'true');
});

navigation?.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenuState(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenuState(false);
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 1088) setMenuState(false);
});

const updateHeader = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 12);
};

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const revealItems = document.querySelectorAll('.reveal');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

const faqItems = document.querySelectorAll('.faq-list details');

faqItems.forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    faqItems.forEach((otherItem) => {
      if (otherItem !== item) otherItem.removeAttribute('open');
    });
  });
});

const applicationSection = document.querySelector('#application');
const mobileCta = document.querySelector('[data-mobile-cta]');

if (applicationSection && mobileCta && 'IntersectionObserver' in window) {
  const applicationObserver = new IntersectionObserver(
    ([entry]) => mobileCta.classList.toggle('is-hidden', entry.isIntersecting),
    { threshold: 0.05 },
  );
  applicationObserver.observe(applicationSection);
}

const widgetHost = document.querySelector('[data-application-widget]');

if (widgetHost) {
  const loader = widgetHost.querySelector('[data-widget-loader]');
  const fallback = widgetHost.querySelector('[data-widget-fallback]');
  const widgetScript = widgetHost.querySelector('[data-widget-script]');
  const reloadButton = widgetHost.querySelector('[data-widget-reload]');
  const indicator = document.querySelector('[data-widget-indicator]');
  let isReady = false;

  const setWidgetState = (state) => {
    widgetHost.dataset.widgetState = state;
    widgetHost.setAttribute('aria-busy', String(state === 'loading'));
    if (loader) loader.hidden = state !== 'loading';
    if (fallback) fallback.hidden = state !== 'error';

    if (indicator) {
      indicator.dataset.state = state;
      indicator.textContent = state === 'ready' ? '● ONLINE' : state === 'error' ? '● НУЖЕН VPN' : '● ЗАГРУЗКА';
    }
  };

  const markReady = () => {
    if (isReady) return;
    isReady = true;
    window.clearTimeout(fallbackTimer);
    setWidgetState('ready');
  };

  const inspectWidget = () => {
    const iframe = widgetHost.querySelector('iframe');
    if (!iframe) return;

    iframe.title = 'Анкета предзаписи на обучение системной аналитике';
    const iframeHeight = Number.parseFloat(iframe.style.height) || 0;
    const hostHeight = Number.parseFloat(widgetHost.style.height) || 0;

    if (iframeHeight > 20 || hostHeight > 20) markReady();
  };

  const handleWidgetMessage = (event) => {
    const iframe = widgetHost.querySelector('iframe');
    if (iframe && event.source === iframe.contentWindow) markReady();
  };

  const observer = new MutationObserver(inspectWidget);
  observer.observe(widgetHost, {
    childList: true,
    attributes: true,
    subtree: true,
    attributeFilter: ['style'],
  });

  window.addEventListener('message', handleWidgetMessage);
  widgetScript?.addEventListener('error', () => setWidgetState('error'));
  reloadButton?.addEventListener('click', () => window.location.reload());

  const fallbackTimer = window.setTimeout(() => {
    inspectWidget();
    if (!isReady) setWidgetState('error');
  }, 10000);

  inspectWidget();
}
