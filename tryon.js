document.querySelector('.stars')?.replaceChildren(
  ...Array.from({ length: 25 }, () => {
    const star = document.createElement('img');
    star.src = 'assets/tryon-star.svg';
    star.alt = '';
    return star;
  }),
);

const uploadMessage = document.querySelector('.upload-message');
const uploads = new Set();
const tryonResult = document.querySelector('.result-panel');

document.querySelectorAll('[data-upload]').forEach((input) => {
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      input.value = '';
      uploadMessage.textContent = 'Choose a JPEG or PNG image up to 5 MB.';
      return;
    }

    const card = document.querySelector(`label[for="${input.id}"]`);
    const preview = card?.querySelector('.upload-bg');
    if (!preview) return;

    const previousUrl = preview.dataset.previewUrl;
    if (previousUrl) URL.revokeObjectURL(previousUrl);
    const previewUrl = URL.createObjectURL(file);
    preview.src = previewUrl;
    preview.dataset.previewUrl = previewUrl;
    card.classList.add('has-preview');
    uploads.add(input.dataset.upload);
    uploadMessage.textContent = '';
    document.querySelector('.try-now')?.classList.toggle('is-ready', uploads.size === 2);
  });
});

document.querySelector('.try-now')?.addEventListener('click', () => {
  if (uploads.size < 2) {
    uploadMessage.textContent = 'Upload a person and an outfit to try the look.';
    return;
  }

  tryonResult?.classList.remove('is-loading');
  tryonResult?.classList.add('has-result');
  tryonResult?.setAttribute('aria-busy', 'false');
  tryonResult?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});
