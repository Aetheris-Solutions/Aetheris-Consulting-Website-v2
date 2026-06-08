(function () {
  // Auto-advance cadence (ms) for the cases gallery.
  var AUTO_SCROLL_DELAY = 4500;
  // Transition duration (ms) for each single step. Smooth, not sluggish.
  var TRANSITION_SPEED = 700;
  // Swiper's native loop needs enough real slides to wrap without showing an
  // empty edge. With only a handful of CMS cases the loop glitches, so we
  // duplicate whole sets up to this minimum before handing it to Swiper.
  var MIN_SLIDES_FOR_LOOP = 10;

  function isCaseGallery(target) {
    return (
      target &&
      target.matches &&
      target.matches("[data-swiper-wrap]") &&
      target.querySelector(".case-collection_item")
    );
  }

  // Duplicate the original slides (whole sets) until there are enough of them
  // for Swiper's loop mode to behave. These are REAL slides; Swiper still adds
  // its own loop clones on top to create the seamless wrap.
  function ensureEnoughSlides(target) {
    var wrapper = target.querySelector(".swiper-wrapper");

    if (!wrapper || target.dataset.aetherisLoopPrepared === "true") return;

    var originalSlides = Array.from(wrapper.children);
    var originalCount = originalSlides.length;

    if (!originalCount) return;

    while (wrapper.children.length < MIN_SLIDES_FOR_LOOP) {
      originalSlides.forEach(function (slide) {
        wrapper.appendChild(slide.cloneNode(true));
      });
    }

    target.dataset.aetherisLoopPrepared = "true";
  }

  function patchSwiper() {
    var OriginalSwiper = window.Swiper;

    if (!OriginalSwiper || OriginalSwiper.__aetherisLoopPatch) return;

    function AetherisSwiper(element, options) {
      var target = typeof element === "string" ? document.querySelector(element) : element;

      if (isCaseGallery(target)) {
        ensureEnoughSlides(target);

        var originalEvents = (options && options.on) || {};

        options = Object.assign({}, options, {
          // Native, genuinely seamless infinite loop — no manual teleport.
          loop: true,
          rewind: false,
          // Advance exactly one card per step.
          slidesPerGroup: 1,
          // Smooth single-step transition.
          speed: (options && options.speed) || TRANSITION_SPEED,
          // Extra buffered slides on each side so the wrap never reveals a gap.
          loopAdditionalSlides: 3,
          // Step automatically; keep running after the user clicks/drags, and
          // pause while hovering the gallery.
          autoplay: {
            delay: AUTO_SCROLL_DELAY,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          },
          // Preserve any init/event hooks the upstream init passed in.
          on: originalEvents
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
