const navbar = document.querySelector('.navbar');
const menu = navbar?.querySelector('.menu');
const navActions = navbar?.querySelector('.nav-actions');

const setMenuOpen = (open) => {
  if (!menu || !navActions) return;
  navActions.classList.toggle('open', open);
  menu.setAttribute('aria-expanded', String(open));
  menu.textContent = open ? '×' : '☰';
};

menu?.addEventListener('click', () => {
  setMenuOpen(!navActions?.classList.contains('open'));
});

navActions?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenuOpen(false));
});

document.addEventListener('click', (event) => {
  if (navbar && !navbar.contains(event.target)) setMenuOpen(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navActions?.classList.contains('open')) {
    setMenuOpen(false);
    menu?.focus();
  }
});

const desktopNavigation = window.matchMedia('(min-width: 1001px)');
desktopNavigation.addEventListener('change', ({ matches }) => {
  if (matches) setMenuOpen(false);
});

if (!document.querySelector('#login-overlay')) {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="login-overlay" id="login-overlay" hidden>
      <div class="login-backdrop" data-login-close></div>
      <section class="login-dialog" role="dialog" aria-modal="true" aria-labelledby="login-title" tabindex="-1">
        <div class="login-visual" aria-hidden="true"><img src="assets/login-promo.png" alt="" /></div>
        <div class="login-panel">
          <img class="login-panel-grid" src="assets/login-grid.svg" alt="" aria-hidden="true" />
          <button class="login-close" type="button" aria-label="Close sign in" data-login-close><img src="assets/login-close.svg" alt="" /></button>
          <div class="login-content">
            <header class="login-heading"><span class="login-logo" aria-hidden="true"><img src="assets/slora-logo-mark.svg" alt="" /><img src="assets/slora-logo-wordmark.svg" alt="" /></span><h2 id="login-title">Sign in now for free generate</h2></header>
            <form class="login-form" novalidate>
              <button class="login-google" type="button"><img src="assets/login-google.svg" alt="" /><span>Sign in with Google</span></button>
              <span class="login-or">or</span>
              <label class="login-email-label" for="login-email">Continue with email</label>
              <input id="login-email" name="email" type="email" autocomplete="email" placeholder="name@gmail.com" required />
              <button class="login-code" type="button">Get verification code</button>
              <button class="login-submit" type="submit">SIGN IN</button>
              <p class="login-status" aria-live="polite"></p>
            </form>
            <p class="login-legal">By proceeding with the login process, you agree to our <a href="#">User Service Agreement</a> and <a href="#">Privacy Policy.</a></p>
          </div>
        </div>
      </section>
    </div>`);
}

const loginOverlay = document.querySelector('#login-overlay');
const loginDialog = loginOverlay?.querySelector('.login-dialog');
const loginForm = loginOverlay?.querySelector('.login-form');
const loginEmail = loginOverlay?.querySelector('#login-email');
const loginStatus = loginOverlay?.querySelector('.login-status');
const loginGoogle = loginOverlay?.querySelector('.login-google');
const loginCode = loginOverlay?.querySelector('.login-code');
let loginReturnFocus = null;

const isAuthenticated = () => {
  if (typeof window.SloraAuth?.isAuthenticated === 'function') {
    return Boolean(window.SloraAuth.isAuthenticated());
  }

  return localStorage.getItem('slora.authenticated') === 'true';
};

const setLoginStatus = (message = '') => {
  if (loginStatus) loginStatus.textContent = message;
};

const openLogin = (trigger) => {
  if (!loginOverlay || !loginDialog) return;
  loginReturnFocus = trigger || document.activeElement;
  loginOverlay.hidden = false;
  document.body.classList.add('login-open');
  setMenuOpen(false);
  setLoginStatus();
  requestAnimationFrame(() => loginDialog.focus());
};

const closeLogin = () => {
  if (!loginOverlay || loginOverlay.hidden) return;
  loginOverlay.hidden = true;
  document.body.classList.remove('login-open');
  setLoginStatus();
  loginReturnFocus?.focus?.();
  loginReturnFocus = null;
};

document.querySelectorAll('[data-auth-trigger]').forEach((trigger) => {
  trigger.addEventListener('click', (event) => {
    if (isAuthenticated()) return;
    event.preventDefault();
    openLogin(trigger);
  });
});

loginOverlay?.querySelectorAll('[data-login-close]').forEach((control) => {
  control.addEventListener('click', closeLogin);
});

loginGoogle?.addEventListener('click', () => {
  setLoginStatus('');
  window.dispatchEvent(new CustomEvent('slora:google-sign-in'));
});

loginCode?.addEventListener('click', () => {
  if (!loginEmail?.checkValidity()) {
    loginEmail?.reportValidity();
    return;
  }

  setLoginStatus('Verification code requested.');
  window.dispatchEvent(new CustomEvent('slora:request-code', { detail: { email: loginEmail.value } }));
});

loginForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!loginForm.checkValidity()) {
    loginForm.reportValidity();
    return;
  }

  setLoginStatus('');
  window.dispatchEvent(new CustomEvent('slora:email-sign-in', { detail: { email: loginEmail.value } }));
});

loginOverlay?.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeLogin();
    return;
  }

  if (event.key !== 'Tab') return;
  const focusable = [...loginOverlay.querySelectorAll('button, input, a[href]')].filter((item) => !item.disabled && item.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

const filterButtons = [...document.querySelectorAll('.filters button')];
const gallery = document.querySelector('.gallery');
const galleryItems = [...document.querySelectorAll('.gallery figure')];
const galleryStat = gallery?.querySelector('.stat');
const filterClasses = ['filter-try', 'filter-editor', 'filter-studio', 'filter-lifestyle'];

filterButtons.forEach((button) => {
  button.setAttribute('aria-pressed', String(button.classList.contains('active')));
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const selected = button.dataset.filter || 'all';

    filterButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });

    gallery?.classList.remove(...filterClasses);
    gallery?.classList.toggle('is-filtered', selected !== 'all');
    if (selected !== 'all') gallery?.classList.add(`filter-${selected}`);
    if (galleryStat) galleryStat.hidden = selected !== 'all';

    galleryItems.forEach((item) => {
      const visible = selected === 'all' || item.dataset.category === selected;
      item.classList.toggle('hidden', !visible);
      item.setAttribute('aria-hidden', String(!visible));

      if (visible && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        item.animate(
          [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: 320, easing: 'ease-out' },
        );
      }
    });
  });
});
