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
