// Utilitario para gestión centralizada y segura de scroll lock con conteo de referencias
let lockCount = 0;
let originalBodyOverflow = '';
let originalHtmlOverflow = '';

export const lockScroll = () => {
  if (lockCount === 0) {
    const currentBody = document.body.style.overflow;
    const currentHtml = document.documentElement.style.overflow;
    originalBodyOverflow = currentBody !== 'hidden' ? currentBody : '';
    originalHtmlOverflow = currentHtml !== 'hidden' ? currentHtml : '';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }
  lockCount++;
};

export const unlockScroll = () => {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = originalBodyOverflow || '';
    document.documentElement.style.overflow = originalHtmlOverflow || '';
  }
};

export const forceUnlockScroll = () => {
  lockCount = 0;
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
};
