const menu = document.querySelector('.menu');
const actions = document.querySelector('.nav-actions');

menu.addEventListener('click', () => {
  const open = actions.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
  menu.textContent = open ? '×' : '☰';
});

document.querySelectorAll('.nav-actions a').forEach((link) => {
  link.addEventListener('click', () => {
    actions.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.textContent = '☰';
  });
});

const filterButtons = document.querySelectorAll('.filters button');
const galleryItems = document.querySelectorAll('.gallery figure');
const gallery = document.querySelector('.gallery');
const galleryStat = document.querySelector('.gallery .stat');
const galleryFilterClasses = ['filter-try', 'filter-editor', 'filter-studio', 'filter-lifestyle'];

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const selectedFilter = button.dataset.filter;

    if (selectedFilter === 'studio') {
      window.location.href = 'ai-studio.html';
      return;
    }

    filterButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    button.classList.add('active');

    gallery?.classList.remove(...galleryFilterClasses);
    gallery?.classList.toggle('is-filtered', selectedFilter !== 'all');
    if (selectedFilter !== 'all') gallery?.classList.add(`filter-${selectedFilter}`);

    if (galleryStat) galleryStat.hidden = selectedFilter !== 'all';

    galleryItems.forEach((item) => {
      const visible = selectedFilter === 'all' || item.dataset.category === selectedFilter;
      item.classList.toggle('hidden', !visible);
      item.setAttribute('aria-hidden', String(!visible));

      if (visible && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        item.animate(
          [
            { opacity: 0, transform: 'translateY(12px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: 320, easing: 'ease-out' },
        );
      }
    });
  });
});
