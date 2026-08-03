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

const filterButtons = document.querySelectorAll('.filters button');
const galleryItems = document.querySelectorAll('.gallery figure');
const gallery = document.querySelector('.gallery');

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const selected = button.dataset.filter;
    if (selected === 'studio') {
      window.location.href = 'ai-studio.html';
      return;
    }
    filterButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    gallery.classList.toggle('is-filtered', selected !== 'all');
    galleryItems.forEach((item) => item.classList.toggle('hidden', selected !== 'all' && item.dataset.category !== selected));
  });
});
