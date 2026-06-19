window.addEventListener('DOMContentLoaded', () => {
  new Swiper('.hero-swiper', {
    loop: true,
    autoplay: { delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: false },
    pagination: { el: '.swiper-pagination', clickable: true },
    keyboard: { enabled: true },
    preloadImages: true,
    effect: 'fade',
    fadeEffect: { crossFade: true }
  });

  const lightboxOverlay = document.getElementById('lightboxOverlay');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxClose = document.getElementById('lightboxClose');
  const imageSelectors = '.gallery-grid img, .hero-swiper .swiper-slide img';

  if (lightboxOverlay && lightboxImage && lightboxClose) {
    document.querySelectorAll(imageSelectors).forEach(img => {
      img.addEventListener('click', () => {
        lightboxImage.src = img.src;
        lightboxImage.alt = img.alt || 'Enlarged photo';
        lightboxOverlay.classList.add('active');
        lightboxOverlay.setAttribute('aria-hidden', 'false');
      });
    });

    const closeLightbox = () => {
      lightboxOverlay.classList.remove('active');
      lightboxOverlay.setAttribute('aria-hidden', 'true');
      lightboxImage.src = '';
    };

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxOverlay.addEventListener('click', event => {
      if (event.target === lightboxOverlay) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && lightboxOverlay.classList.contains('active')) {
        closeLightbox();
      }
    });
  }

  const estimatePopup = document.getElementById('estimate-popup');
  const estimateClose = document.getElementById('estimate-popup-close');
  const estimateCta = document.getElementById('estimate-popup-cta');

  if (estimatePopup && estimateClose) {
    setTimeout(() => {
      estimatePopup.classList.add('visible');
    }, 4000);

    const closeEstimatePopup = () => {
      estimatePopup.classList.remove('visible');
    };

    estimateClose.addEventListener('click', closeEstimatePopup);

    if (estimateCta) {
      estimateCta.addEventListener('click', closeEstimatePopup);
    }

    estimatePopup.addEventListener('click', event => {
      if (event.target === estimatePopup) {
        closeEstimatePopup();
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeEstimatePopup();
      }
    });
  }
});
