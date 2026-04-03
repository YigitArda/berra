/**
 * Legacy bootstrap modal/runtime helpers.
 *
 * Bu dosya legacy ekranlarda modal durumunu merkezi olarak yönetir.
 */

(function bootstrapLegacyCompat() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const BODY_MODAL_CLASS = 'modal-open';
  const BACKDROP_ID = 'legacy-modal-backdrop';
  const OPEN_CLASS = 'open';

  let activeModalId = null;

  const getModal = (id) => {
    if (!id) return null;
    return document.getElementById(id);
  };

  const isOverlayModal = (node) => Boolean(node && node.classList && node.classList.contains('overlay'));

  const ensureBackdrop = () => {
    const existing = document.getElementById(BACKDROP_ID);
    if (existing) return existing;

    const backdrop = document.createElement('div');
    backdrop.id = BACKDROP_ID;
    backdrop.className = 'modal-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.addEventListener('click', () => {
      if (activeModalId) window.closeModal(activeModalId);
    });
    document.body.appendChild(backdrop);
    return backdrop;
  };

  const cleanupBackdrop = () => {
    const backdrop = document.getElementById(BACKDROP_ID);
    if (backdrop) backdrop.remove();
  };

  const syncModalState = () => {
    const hasActiveModal = Boolean(activeModalId && getModal(activeModalId));
    document.body.classList.toggle(BODY_MODAL_CLASS, hasActiveModal);

    const backdrop = document.getElementById(BACKDROP_ID);
    if (!hasActiveModal) {
      if (backdrop) backdrop.classList.remove(OPEN_CLASS);
      cleanupBackdrop();
      return;
    }

    const activeModal = getModal(activeModalId);
    if (isOverlayModal(activeModal)) {
      if (backdrop) backdrop.classList.remove(OPEN_CLASS);
      cleanupBackdrop();
      return;
    }

    const ensured = ensureBackdrop();
    ensured.classList.add(OPEN_CLASS);
  };

  window.openModal = function openModal(id) {
    const modal = getModal(id);
    if (!modal) return;

    if (activeModalId && activeModalId !== id) {
      window.closeModal(activeModalId);
    }

    modal.classList.add(OPEN_CLASS);
    modal.setAttribute('aria-hidden', 'false');

    activeModalId = id;
    syncModalState();
  };

  window.closeModal = function closeModal(id) {
    const targetId = id || activeModalId;
    const modal = getModal(targetId);
    if (modal) {
      modal.classList.remove(OPEN_CLASS);
      modal.setAttribute('aria-hidden', 'true');
    }

    if (!id || targetId === activeModalId) {
      activeModalId = null;
    }

    syncModalState();
  };

  window.closeActiveModal = function closeActiveModal() {
    if (!activeModalId) return;
    window.closeModal(activeModalId);
  };

  window.getActiveModalId = function getActiveModalId() {
    return activeModalId;
  };

  const forceCloseOnRouteChange = () => {
    if (activeModalId) {
      window.closeModal(activeModalId);
    } else {
      // Defensive cleanup for stale nodes/classes.
      document.body.classList.remove(BODY_MODAL_CLASS);
      cleanupBackdrop();
      document.querySelectorAll('.overlay.open').forEach((node) => node.classList.remove(OPEN_CLASS));
    }
  };

  const wrapNavigate = () => {
    if (typeof window.navigate !== 'function' || window.navigate.__modalGuardWrapped) return;

    const originalNavigate = window.navigate;
    const wrappedNavigate = function guardedNavigate(...args) {
      forceCloseOnRouteChange();
      return originalNavigate.apply(this, args);
    };
    wrappedNavigate.__modalGuardWrapped = true;
    window.navigate = wrappedNavigate;
  };

  wrapNavigate();

  // navigate sonradan tanımlanıyorsa set edip sarmalayalım.
  const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'navigate');
  if (!originalDescriptor || originalDescriptor.configurable) {
    let navigateRef = window.navigate;
    Object.defineProperty(window, 'navigate', {
      configurable: true,
      enumerable: true,
      get() {
        return navigateRef;
      },
      set(value) {
        navigateRef = value;
        wrapNavigate();
      }
    });
    if (navigateRef) wrapNavigate();
  }

  document.addEventListener('click', (event) => {
    const overlay = event.target;
    if (!(overlay instanceof Element)) return;
    if (!overlay.classList.contains('overlay')) return;
    if (event.target !== overlay) return;

    const id = overlay.getAttribute('id');
    window.closeModal(id || undefined);
  });
})();
