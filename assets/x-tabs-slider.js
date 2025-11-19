(function () {
  if (typeof window === 'undefined') return;

  if (typeof Swiper === 'undefined') {
    console.warn('[x-tabs-slider] Swiper not found');
    return;
  }

  const instances = new Map(); // sectionEl -> swiper

  function getFills(navItems) {
    return navItems.map(item =>
      item.querySelector('.x-tabs-nav__fill')
    );
  }

  function restartFillAnimation(navItems, activeIndex, autoplayDelay) {
    const fills = getFills(navItems);
    fills.forEach(function (fill, idx) {
      if (!fill) return;

      fill.classList.remove('is-animating');
      fill.classList.remove('is-filled');
      // force reflow
      void fill.offsetWidth;

      if (idx === activeIndex) {
        fill.style.animationDuration = autoplayDelay + 'ms';
        fill.classList.add('is-animating');
      }
    });
  }

  function setStaticFill(navItems, activeIndex) {
    const fills = getFills(navItems);
    fills.forEach(function (fill, idx) {
      if (!fill) return;
      fill.classList.remove('is-animating');
      if (idx === activeIndex) {
        fill.classList.add('is-filled');
      } else {
        fill.classList.remove('is-filled');
      }
    });
  }

  function clearFill(navItems) {
    const fills = getFills(navItems);
    fills.forEach(function (fill) {
      if (!fill) return;
      fill.classList.remove('is-animating');
      fill.classList.remove('is-filled');
    });
  }

  function setActiveTab(navItems, activeIndex) {
    navItems.forEach(function (item, idx) {
      const isActive = idx === activeIndex;
      item.classList.toggle('is-active', isActive);
      item.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  function scrollToActiveTab(navContainer, activeItem) {
    if (!navContainer || !activeItem) return;

    const containerRect = navContainer.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    const currentScroll = navContainer.scrollLeft;
    const offset = itemRect.left - containerRect.left;
    const targetScroll = currentScroll + offset - 2;

    navContainer.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
    });
}

  function initSection(sectionEl) {
    if (!sectionEl || instances.has(sectionEl)) return;

    const swiperEl = sectionEl.querySelector('.x-tabs-main-swiper');
    if (!swiperEl) return;

    const navItems = Array.prototype.slice.call(
      sectionEl.querySelectorAll('.x-tabs-nav__item')
    );
    if (!navItems.length) return;

    const navContainer = sectionEl.querySelector('.x-tabs-nav');

    const autoplayAttr = swiperEl.getAttribute('data-autoplay-delay');
    const autoplayDelay = autoplayAttr ? parseInt(autoplayAttr, 10) : 6000;
    const enableAutoplay =
      swiperEl.getAttribute('data-enable-autoplay') === 'true';

    const swiper = new Swiper(swiperEl, {
      loop: true,
      slidesPerView: 1,
      speed: 700,
      autoplay: enableAutoplay
        ? {
            delay: autoplayDelay,
            disableOnInteraction: false,
          }
        : false,
      on: {
        init: function (sw) {
            setActiveTab(navItems, sw.realIndex);

            const activeItem = navItems[sw.realIndex];
            scrollToActiveTab(navContainer, activeItem);

            if (enableAutoplay) {
            restartFillAnimation(navItems, sw.realIndex, autoplayDelay);
            } else {
            setStaticFill(navItems, sw.realIndex);
            }
        },
        slideChange: function (sw) {
            setActiveTab(navItems, sw.realIndex);

            const activeItem = navItems[sw.realIndex];
            scrollToActiveTab(navContainer, activeItem);

            if (enableAutoplay) {
            restartFillAnimation(navItems, sw.realIndex, autoplayDelay);
            } else {
            setStaticFill(navItems, sw.realIndex);
            }
        },
    },

    });

    // Клик по табу
    navItems.forEach(function (item, idx) {
        item.addEventListener('click', function () {
            const inst = instances.get(sectionEl);
            if (!inst) return;

            if (typeof inst.slideToLoop === 'function') {
            inst.slideToLoop(idx);
            } else {
            inst.slideTo(idx);
            }

            if (enableAutoplay) {
            restartFillAnimation(navItems, idx, autoplayDelay);
            } else {
            setStaticFill(navItems, idx);
            }

            scrollToActiveTab(navContainer, item);
        });
    });


    instances.set(sectionEl, swiper);
  }

  function destroySection(sectionEl) {
    const swiper = instances.get(sectionEl);
    if (!swiper) return;

    if (typeof swiper.destroy === 'function') {
      swiper.destroy(true, true);
    }
    instances.delete(sectionEl);
  }

  function initAllSections(root) {
    const scope = root || document;
    const sections = scope.querySelectorAll('.x-tabs');
    sections.forEach(function (sectionEl) {
      initSection(sectionEl);
    });
  }

  function destroyAllSections(root) {
    const scope = root || document;
    const sections = scope.querySelectorAll('.x-tabs');
    sections.forEach(function (sectionEl) {
      destroySection(sectionEl);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initAllSections(document);
  });

  document.addEventListener('shopify:section:load', function (event) {
    if (!event || !event.target) return;
    initAllSections(event.target);
  });

  document.addEventListener('shopify:section:unload', function (event) {
    if (!event || !event.target) return;
    destroyAllSections(event.target);
  });
})();
