(function () {
  // Auto-advance cadence (ms) for the cases gallery.
  var AUTO_SCROLL_DELAY = 4500;

  function isCaseGallery(target) {
    return (
      target &&
      target.matches &&
      target.matches("[data-swiper-wrap]") &&
      target.querySelector(".case-collection_item")
    );
  }

  function originalSlideCount(target) {
    return Number(target.dataset.aetherisOriginalSlideCount || 0);
  }

  // Build a multi-set buffer: duplicate the original slides into several
  // identical sets and park the active slide in the MIDDLE set, so there are
  // always whole sets of real slides on BOTH sides to scroll into — enough to
  // fill even a very wide viewport. This sidesteps Swiper v11+'s native loop
  // (which empties out with few slides) while still giving a seamless wrap.
  function ensureLoopBuffer(target) {
    var wrapper = target.querySelector(".swiper-wrapper");

    if (!wrapper || target.dataset.aetherisLoopPrepared === "true") return;

    // The Webflow CSS centres the flex row (justify-content: center), which
    // offsets every slide by (containerWidth - totalSlidesWidth) / 2. Swiper's
    // translate math assumes slides start at x=0, so the more slides we add the
    // further the whole strip drifts off-screen left. Pin it to flex-start.
    wrapper.style.justifyContent = "flex-start";

    var originalSlides = Array.from(wrapper.children);
    var originalCount = originalSlides.length;

    if (!originalCount) return;

    // Aim for ~5 sets (generous buffer on each side for wide screens).
    var targetCount = Math.max(originalCount * 5, 20);

    while (wrapper.children.length < targetCount) {
      originalSlides.forEach(function (slide) {
        var clone = slide.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.dataset.aetherisLoopClone = "true";
        wrapper.appendChild(clone);
      });
    }

    var sets = Math.floor(wrapper.children.length / originalCount);
    var middleStart = Math.floor(sets / 2) * originalCount;

    target.dataset.aetherisOriginalSlideCount = String(originalCount);
    target.dataset.aetherisMiddleStart = String(middleStart);
    target.dataset.aetherisLoopPrepared = "true";
  }

  // After every transition, snap the active index back into the middle set
  // [middleStart, middleStart + count) with a 0ms, callback-free move. Because
  // every set is an identical copy, the on-screen result is pixel-for-pixel the
  // same — the wrap is invisible. Works in both directions (next and prev).
  function recenter(swiper, target) {
    if (!swiper || swiper.destroyed) return;

    var count = originalSlideCount(target);
    if (!count) return;

    var start = Number(target.dataset.aetherisMiddleStart || 0);
    var idx = swiper.activeIndex;

    if (idx >= start + count) {
      swiper.slideTo(idx - count, 0, false);
    } else if (idx < start) {
      swiper.slideTo(idx + count, 0, false);
    }
  }

  function installAutoScroll(swiper, target) {
    if (!swiper || !target || target.__aetherisAutoScroll) return;

    // Recenter after every settled transition. Swiper's native autoplay waits
    // for each transition to finish before the next step, so there is no race:
    // the index is always snapped back into the middle set before the next
    // advance fires.
    swiper.on("transitionEnd", function () {
      recenter(swiper, target);
    });

    swiper.on("destroy", function () {
      target.__aetherisAutoScroll = null;
    });

    target.__aetherisAutoScroll = true;
  }

  function patchSwiper() {
    var OriginalSwiper = window.Swiper;

    if (!OriginalSwiper || OriginalSwiper.__aetherisLoopPatch) return;

    function AetherisSwiper(element, options) {
      var target = typeof element === "string" ? document.querySelector(element) : element;

      if (isCaseGallery(target)) {
        ensureLoopBuffer(target);

        var middleStart = Number(target.dataset.aetherisMiddleStart || 0);
        var originalEvents = (options && options.on) || {};

        // Keep the upstream navigation, pagination, keyboard, speed and
        // grabCursor options; override only what's needed to drive a stable,
        // seamless step-loop ourselves (sizing, looping, autoplay, start).
        options = Object.assign({}, options, {
          loop: false,
          rewind: false,
          // The cards are capped at 24em by CSS (max-width), so a numeric
          // slidesPerView makes Swiper translate by container/spv while the
          // slides are actually narrower — the strip drifts left a bit every
          // step. 'auto' makes Swiper measure the real slide width and
          // translate by it, so stepping and the wrap stay pixel-accurate.
          slidesPerView: "auto",
          // Drop the upstream numeric per-breakpoint slidesPerView so 'auto'
          // applies at every width.
          breakpoints: {},
          // Native autoplay handles step timing (waits for each transition),
          // so steps never overlap the recenter snap. Pauses on hover.
          autoplay: {
            delay: AUTO_SCROLL_DELAY,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          },
          initialSlide: middleStart,
          on: Object.assign({}, originalEvents, {
            init: function (swiper) {
              if (typeof originalEvents.init === "function") {
                originalEvents.init.call(this, swiper);
              }
              installAutoScroll(swiper, target);
            }
          })
        });
      }

      return new OriginalSwiper(element, options);
    }

    Object.setPrototypeOf(AetherisSwiper, OriginalSwiper);
    AetherisSwiper.prototype = OriginalSwiper.prototype;
    AetherisSwiper.__aetherisLoopPatch = true;
    AetherisSwiper.__OriginalSwiper = OriginalSwiper;
    window.Swiper = AetherisSwiper;
  }

  if (window.Swiper) {
    patchSwiper();
    return;
  }

  var attempts = 0;
  var waitForSwiper = window.setInterval(function () {
    attempts += 1;

    if (window.Swiper || attempts > 50) {
      window.clearInterval(waitForSwiper);
      patchSwiper();
    }
  }, 20);
})();
