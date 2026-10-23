(() => {
  const navigation = document.querySelector('.primary-navigation');
  const container = navigation?.querySelector('.wp-block-navigation__responsive-container');
  const openButton = navigation?.querySelector('.wp-block-navigation__responsive-container-open');
  const closeButton = navigation?.querySelector('.wp-block-navigation__responsive-container-close');
  if (!navigation || !container || !openButton || !closeButton) return;

  const dialog = container.querySelector('.wp-block-navigation__responsive-dialog');
  const pageRegions = [...document.body.children].filter((element) =>
    element !== container && !['SCRIPT', 'STYLE'].includes(element.tagName)
  );
  let returnFocus = null;

  const focusable = () => [...container.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hidden && element.getClientRects().length);

  const close = () => {
    container.classList.remove('has-modal-open', 'is-menu-open');
    document.documentElement.classList.remove('has-modal-open');
    document.body.classList.remove('has-modal-open');
    openButton.setAttribute('aria-expanded', 'false');
    dialog?.removeAttribute('role');
    dialog?.removeAttribute('aria-modal');
    pageRegions.forEach((element) => {
      element.removeAttribute('inert');
      element.removeAttribute('aria-hidden');
    });
    returnFocus?.focus();
  };

  const open = () => {
    returnFocus = document.activeElement;
    container.classList.add('has-modal-open', 'is-menu-open');
    document.documentElement.classList.add('has-modal-open');
    document.body.classList.add('has-modal-open');
    openButton.setAttribute('aria-expanded', 'true');
    dialog?.setAttribute('role', 'dialog');
    dialog?.setAttribute('aria-modal', 'true');
    pageRegions.forEach((element) => {
      if (!element.contains(navigation)) {
        element.setAttribute('inert', '');
        element.setAttribute('aria-hidden', 'true');
      }
    });
    window.requestAnimationFrame(() => closeButton.focus());
  };

  if (!container.id) container.id = 'grss-mobile-navigation';
  openButton.setAttribute('aria-controls', container.id);
  openButton.setAttribute('aria-expanded', 'false');
  openButton.addEventListener('click', open);
  closeButton.addEventListener('click', close);
  container.querySelectorAll('a[href]').forEach((link) => link.addEventListener('click', () => {
    if (window.matchMedia('(max-width: 767px)').matches) close();
  }));
  container.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const elements = focusable();
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768 && container.classList.contains('is-menu-open')) close();
  }, { passive: true });
})();
