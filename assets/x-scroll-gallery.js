(function () {
    // Exit early on server-side rendering / no window
    if (typeof window === 'undefined') return;

    /**
     * Desktop scroll animation for X Scroll Gallery
     * - Works only on desktop (>= 1024px)
     * - When section reaches the center of the viewport, it gets pinned
     * - While pinned, cards animate from the initial stacked layout
     *   into a straight row that fills the container width
     */
    function initDesktopXScrollSection(section) {
        // Ensure GSAP and ScrollTrigger are available
        if (!window.gsap || !window.ScrollTrigger) {
            console.warn('GSAP / ScrollTrigger are not loaded');
            return;
        }

        // Desktop only (tablet/mobile handled by Swiper)
        if (window.matchMedia('(max-width: 1023px)').matches) {
            return;
        }

        const gallery = section.querySelector('.x-scroll-gallery');
        if (!gallery) return;

        const items = Array.from(
            gallery.querySelectorAll('.x-scroll-gallery__item')
        );
        if (!items.length) return;

        const total = items.length;
        const GAP = 30; // horizontal spacing between cards in the final row

        // ===== 1) Measure container and available width =====
        const parent = gallery.parentElement; // .x-scroll-section__inner
        const parentStyles = window.getComputedStyle(parent);
        const paddingLeft = parseFloat(parentStyles.paddingLeft) || 0;
        const paddingRight = parseFloat(parentStyles.paddingRight) || 0;

        // Initial gallery width from CSS (920px in design)
        const galleryStartWidth = gallery.offsetWidth;
        const galleryRectStart = gallery.getBoundingClientRect();

        // Max gallery width inside the parent (respecting inner paddings)
        const galleryFullWidth =
            parent.clientWidth - paddingLeft - paddingRight;

        // ===== 2) Capture initial card positions/sizes from CSS layout =====
        const startStates = items.map((item) => {
            const rect = item.getBoundingClientRect();
            return {
                left: rect.left - galleryRectStart.left,
                top: rect.top - galleryRectStart.top,
                width: rect.width,
                height: rect.height
            };
        });

        // Lock current layout into pure absolute positioning
        // (we remove right/transform to avoid mixing CSS transforms with GSAP)
        items.forEach((item, i) => {
            const s = startStates[i];
            gsap.set(item, {
                position: 'absolute',
                left: s.left,
                top: s.top,
                width: s.width,
                height: s.height,
                right: 'auto',
                transform: 'none'
            });
        });

        // ===== 3) Compute final card size (uniform row) =====
        // Use the center card as aspect ratio reference
        const centerIndex = Math.floor(total / 2);
        const centerStart = startStates[centerIndex];
        const ratio =
            centerStart.height && centerStart.width
                ? centerStart.height / centerStart.width
                : 1;

        // Available width for cards in the final row (without gaps)
        const rowAvailableWidth = galleryFullWidth - GAP * (total - 1);
        let cardWidthFinal = rowAvailableWidth / total;

        // Clamp card width to reasonable bounds
        const MIN_CARD_WIDTH = 160;
        const MAX_CARD_WIDTH = 360;
        if (cardWidthFinal < MIN_CARD_WIDTH) cardWidthFinal = MIN_CARD_WIDTH;
        if (cardWidthFinal > MAX_CARD_WIDTH) cardWidthFinal = MAX_CARD_WIDTH;

        const cardHeightFinal = cardWidthFinal * ratio;

        // Final gallery height (row vertically centered with some padding)
        const galleryHeightFinal = cardHeightFinal + 56;

        // ===== 4) Compute final positions for straight row =====
        const rowTotalWidth = cardWidthFinal * total + GAP * (total - 1);
        const rowStartX = (galleryFullWidth - rowTotalWidth) / 2; // center row horizontally
        const rowY = (galleryHeightFinal - cardHeightFinal) / 2;  // center row vertically

        // ===== 5) ScrollTrigger with pin: parallax-like behavior =====
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                // When section center reaches viewport center → start animation
                start: 'center center',
                // Allocate extra scroll distance for the pinned animation
                end: '+=50',
                scrub: 1,          // smooth, scroll-linked animation
                pin: true,         // pin the section (page background stops scrolling)
                pinSpacing: true,  // add spacing so content below is pushed down
                anticipatePin: 1,
                // markers: true      // debug markers (disable in production)
            }
        });

        section.__xScrollTimeline = tl;
        section.__xScrollDesktopInited = true;

        // a) Animate gallery container from initial width to full width
        tl.to(
            gallery,
            {
                width: galleryFullWidth,
                height: galleryHeightFinal,
                duration: 1.2,
                ease: 'power3.out'
            },
            0
        );

        // b) Animate all cards into a straight row with equal size
        tl.to(
            items,
            {
                left: (i) => rowStartX + i * (cardWidthFinal + GAP),
                top: rowY,
                width: cardWidthFinal,
                height: cardHeightFinal,
                padding: 16,
                duration: 1.2,
                ease: 'power3.out'
            },
            0
        );

        // ===== 6) Additional ScrollTrigger to control z-index vs header =====
        section.__xScrollHeaderTrigger = ScrollTrigger.create({
            trigger: section,
            start: 'top top',
            end: 'bottom top',
            onEnter() {
                section.classList.add('x-scroll-section--behind-header');
            },
            onLeaveBack() {
                section.classList.remove('x-scroll-section--behind-header');
            }
        });
    }

    function destroyDesktopXScrollSection(section) {
        const gallery = section.querySelector('.x-scroll-gallery');
        if (gallery) {
            gallery.style.width = '';
            gallery.style.height = '';
        }

        const items = section.querySelectorAll('.x-scroll-gallery__item');
        items.forEach((item) => {
            item.style.left = '';
            item.style.top = '';
            item.style.width = '';
            item.style.height = '';
            item.style.padding = '';
            item.style.position = '';
            item.style.transform = '';
            item.style.right = '';
        });

        if (section.__xScrollTimeline) {
            if (section.__xScrollTimeline.scrollTrigger) {
                section.__xScrollTimeline.scrollTrigger.kill();
            }
            section.__xScrollTimeline.kill();
            section.__xScrollTimeline = null;
        }

        if (section.__xScrollHeaderTrigger) {
            section.__xScrollHeaderTrigger.kill();
            section.__xScrollHeaderTrigger = null;
        }

        section.__xScrollDesktopInited = false;
    }

    function destroyMobileSwiper(section) {
        const swiperEl = section.querySelector('[data-x-scroll-gallery-mobile]');
        if (!swiperEl) return;

        if (swiperEl.__xSwiperInstance) {
            swiperEl.__xSwiperInstance.destroy(true, true);
            swiperEl.__xSwiperInstance = null;
        }
        swiperEl.__xSwiperInited = false;
    }


    /**
     * Mobile/Tablet Swiper initialization
     * - Works up to 1023px width
     * - Desktop GSAP animation is disabled on these breakpoints
     */
    function initMobileSwiper(section) {
        // Only run on mobile/tablet
        if (!window.matchMedia('(max-width: 1023px)').matches) {
            return;
        }

        const swiperEl = section.querySelector('[data-x-scroll-gallery-mobile]');
        if (!swiperEl || !window.Swiper) return;

        // Prevent multiple Swiper instances on the same element
        if (swiperEl.__xSwiperInited) return;
        swiperEl.__xSwiperInited = true;

        // Basic centered carousel with breakpoints
        // Autoplay enabled on small screens
        const swiper = new Swiper(swiperEl, {
            slidesPerView: 1.6,
            centeredSlides: true,
            spaceBetween: 20,
            loop: true,
            autoplay: {
                enabled: true
            },
            breakpoints: {
                480: {
                    slidesPerView: 2.6,
                    spaceBetween: 20,
                    centeredSlides: true
                },
                768: {
                    slidesPerView: 4,
                    centeredSlides: false
                },
                1024: {
                    // On desktop Swiper should be destroyed (we use GSAP instead)
                    destroy: true
                }
            }
        });
        swiperEl.__xSwiperInstance = swiper;
    }

    /**
     * Init all X Scroll sections on the page
     */
    function initAllXScrollSections() {
        const sections = document.querySelectorAll('[data-x-scroll-section]');
        sections.forEach((section) => {
            initDesktopXScrollSection(section);
            initMobileSwiper(section);
        });
    }

    let xScrollResizeTimeout = null;

    function reinitOnResize() {
        clearTimeout(xScrollResizeTimeout);
        xScrollResizeTimeout = setTimeout(() => {
            const sections = document.querySelectorAll('[data-x-scroll-section]');
            sections.forEach((section) => {
                // destroy current widgets
                destroyDesktopXScrollSection(section);
                destroyMobileSwiper(section);
                // init again according to new breakpoint
                initDesktopXScrollSection(section);
                initMobileSwiper(section);
            });
        }, 150);
    }

    window.addEventListener('resize', reinitOnResize);

    // Initial load
    document.addEventListener('DOMContentLoaded', initAllXScrollSections);

    // Re-init when section is reloaded via Shopify theme editor
    document.addEventListener('shopify:section:load', (event) => {
        const section =
            event.target.querySelector('[data-x-scroll-section]') ||
            event.target;

        if (
            section &&
            section.matches &&
            section.matches('[data-x-scroll-section]')
        ) {
            initDesktopXScrollSection(section);
            initMobileSwiper(section);
        }
    });
})();
