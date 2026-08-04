document.querySelector('.stars')?.replaceChildren(
  ...Array.from({ length: 25 }, () => {
    const star = document.createElement('img');
    star.src = 'assets/tryon-star.svg';
    star.alt = '';
    return star;
  }),
);

const personInput = document.getElementById('editor-person-input');
const uploadMessage = document.querySelector('.upload-message');
const prompt = document.querySelector('.prompt-box textarea');
const magicResult = document.querySelector('.result-panel');

personInput?.addEventListener('change', () => {
  const file = personInput.files?.[0];
  if (!file) return;

  if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    personInput.value = '';
    uploadMessage.textContent = 'Choose a JPEG or PNG image up to 5 MB.';
    return;
  }

  const card = document.querySelector(`label[for="${personInput.id}"]`);
  const preview = card?.querySelector('.upload-bg');
  if (!preview) return;
  const previousUrl = preview.dataset.previewUrl;
  if (previousUrl) URL.revokeObjectURL(previousUrl);
  const previewUrl = URL.createObjectURL(file);
  preview.src = previewUrl;
  preview.dataset.previewUrl = previewUrl;
  card.classList.add('has-preview');
  uploadMessage.textContent = '';
});

document.querySelector('.try-now')?.addEventListener('click', () => {
  if (!personInput?.files?.length) {
    uploadMessage.textContent = 'Upload a person to begin editing.';
    return;
  }
  if (!prompt?.value.trim()) {
    uploadMessage.textContent = 'Describe the change you want to make.';
    prompt?.focus();
    return;
  }

  uploadMessage.textContent = 'Your edit is ready to preview.';
  uploadMessage.classList.add('success');
  magicResult?.classList.remove('is-loading');
  magicResult?.setAttribute('aria-busy', 'false');
  magicResult?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});
