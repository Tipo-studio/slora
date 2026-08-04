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
