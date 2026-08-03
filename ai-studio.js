const menu = document.querySelector('.menu');
const navActions = document.querySelector('.nav-actions');

menu?.addEventListener('click', () => {
  const open = navActions.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
  menu.textContent = open ? '×' : '☰';
});

document.querySelector('.stars')?.replaceChildren(
  ...Array.from({ length: 25 }, () => {
    const star = document.createElement('img');
    star.src = 'assets/tryon-star.svg';
    star.alt = '';
    return star;
  }),
);

const prompt = document.querySelector('.prompt-box textarea');
const studioMessage = document.querySelector('.studio-message');
const studioResult = document.querySelector('.studio-result');

document.querySelector('.try-now')?.addEventListener('click', () => {
  if (!prompt?.value.trim()) {
    studioMessage.textContent = 'Describe the image you want to create.';
    studioMessage.classList.remove('success');
    prompt?.focus();
    return;
  }
  studioMessage.textContent = 'Your image is ready to preview.';
  studioMessage.classList.add('success');
  studioResult?.classList.remove('is-loading');
  studioResult?.setAttribute('aria-busy', 'false');
  studioResult?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

const filterButtons = document.querySelectorAll('.filters button');
const galleryItems = document.querySelectorAll('.gallery figure');
const gallery = document.querySelector('.gallery');

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const selected = button.dataset.filter;
    filterButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    gallery.classList.toggle('is-filtered', selected !== 'all');
    galleryItems.forEach((item) => item.classList.toggle('hidden', selected !== 'all' && item.dataset.category !== selected));
  });
});
