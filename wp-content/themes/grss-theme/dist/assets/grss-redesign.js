(() => {
  const headerShell = document.querySelector('.wp-block-template-part:has(.site-header)');
  const header = document.querySelector('.site-header__inner');
  const navigation = document.querySelector('.primary-navigation');
  const panel = navigation?.querySelector('.wp-block-navigation__responsive-container');
  const openButton = navigation?.querySelector('.wp-block-navigation__responsive-container-open');
  const panelSurface = panel?.querySelector('.wp-block-navigation__responsive-close');
  const dialog = panel?.querySelector('.wp-block-navigation__responsive-dialog');
  const legacyCloseButton = panel?.querySelector('.wp-block-navigation__responsive-container-close');
  if (!headerShell || !header || !navigation || !panel || !openButton || !panelSurface || !dialog) return;

  if (!header.querySelector('.header-contact-link')) {
    const contact = document.createElement('a');
    contact.className = 'header-contact-link';
    contact.href = '/contacto/';
    contact.textContent = 'Contacto';
    header.append(contact);
  }

  panel.id ||= 'grss-navigation-panel';
  dialog.id ||= `${panel.id}-dialog`;
  openButton.setAttribute('aria-controls', dialog.id);
  openButton.setAttribute('aria-expanded', 'false');
  openButton.setAttribute('aria-label', 'Abrir el menú');
  panel.setAttribute('aria-hidden', 'true');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', 'Menú principal');

  if (legacyCloseButton) {
    legacyCloseButton.hidden = true;
    legacyCloseButton.tabIndex = -1;
    legacyCloseButton.setAttribute('aria-hidden', 'true');
  }

  document.body.append(panel);

  let previousFocus = null;
  let lockedScrollY = 0;
  let isOpen = false;

  const submenuIsOpen = (element) => {
    const submenu = element.closest('.wp-block-navigation__submenu-container');
    if (!submenu) return true;
    const toggle = submenu.parentElement?.querySelector(':scope > .wp-block-navigation-submenu__toggle');
    return toggle?.getAttribute('aria-expanded') === 'true';
  };

  const focusable = () => [...dialog.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hidden && element.getClientRects().length && submenuIsOpen(element));

  const updatePanelPosition = () => {
    const headerRect = document.querySelector('.site-header')?.getBoundingClientRect();
    if (!headerRect) return;
    const navBottom = Math.round(headerRect.bottom);
    const viewportHeight = Math.round(window.visualViewport?.height || window.innerHeight);
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const panelGap = isMobile ? 11 : 15;
    const bottomClearance = 24;
    const availableHeight = Math.max(180, viewportHeight - navBottom - panelGap - bottomClearance);
    document.documentElement.style.setProperty('--grss-nav-bottom', `${navBottom}px`);
    document.documentElement.style.setProperty('--grss-nav-left', `${Math.round(headerRect.left)}px`);
    document.documentElement.style.setProperty('--grss-panel-gap', `${panelGap}px`);
    document.documentElement.style.setProperty('--grss-panel-max-height', `${availableHeight}px`);
  };

  const lockScroll = () => {
    lockedScrollY = window.scrollY;
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.width = `${document.documentElement.clientWidth}px`;
    document.documentElement.classList.add('grss-nav-open');
    document.body.classList.add('grss-nav-open');
  };

  const unlockScroll = () => {
    document.documentElement.classList.remove('grss-nav-open');
    document.body.classList.remove('grss-nav-open');
    document.body.style.removeProperty('top');
    document.body.style.removeProperty('width');
    window.scrollTo({ top: lockedScrollY, left: 0, behavior: 'instant' });
  };

  const setOpen = (nextOpen, { restoreFocus = true } = {}) => {
    if (isOpen === nextOpen) return;
    isOpen = nextOpen;
    if (nextOpen) {
      previousFocus = document.activeElement;
      updatePanelPosition();
      lockScroll();
    }

    panel.classList.toggle('grss-menu-open', nextOpen);
    panel.classList.toggle('is-menu-open', nextOpen);
    openButton.classList.toggle('is-menu-active', nextOpen);
    openButton.setAttribute('aria-expanded', String(nextOpen));
    openButton.setAttribute('aria-label', nextOpen ? 'Cerrar el menú' : 'Abrir el menú');
    panel.setAttribute('aria-hidden', String(!nextOpen));

    if (nextOpen) {
      window.requestAnimationFrame(() => window.setTimeout(() => focusable()[0]?.focus(), 30));
      const syncUntil = performance.now() + 3000;
      const syncPanelPosition = () => {
        if (!isOpen) return;
        updatePanelPosition();
        if (performance.now() < syncUntil) window.requestAnimationFrame(syncPanelPosition);
      };
      window.requestAnimationFrame(syncPanelPosition);
    } else {
      unlockScroll();
      panel.querySelectorAll('.wp-block-navigation-submenu__toggle').forEach((toggle) => {
        toggle.setAttribute('aria-expanded', 'false');
      });
      if (restoreFocus && previousFocus instanceof HTMLElement) previousFocus.focus();
    }
  };

  openButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    setOpen(!isOpen);
  }, true);

  panel.addEventListener('click', (event) => {
    if (event.target === panel) {
      setOpen(false);
      return;
    }
    if (event.target.closest('a[href]')) setOpen(false, { restoreFocus: false });
  });

  panel.querySelectorAll('.wp-block-navigation-submenu__toggle').forEach((toggle) => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      toggle.setAttribute('aria-expanded', String(toggle.getAttribute('aria-expanded') !== 'true'));
        updatePanelPosition();
    }, true);
  });

  document.addEventListener('keydown', (event) => {
    if (!isOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key !== 'Tab') return;
    const items = focusable();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener('resize', updatePanelPosition, { passive: true });
  window.visualViewport?.addEventListener('resize', updatePanelPosition, { passive: true });
  window.addEventListener('pagehide', () => {
    if (isOpen) unlockScroll();
  });
})();
/* Prefer the tightly cropped client artwork supplied with the theme. */
document.querySelectorAll('.logo-list img[src$="/mcdonald.webp"]').forEach((image) => {
  image.src = image.src.replace(/mcdonald\.webp(?:\?.*)?$/, 'mcdonald.png');
});
