(function () {
  var AUTO_SCROLL_DELAY = 4500;
  var RESUME_AFTER_INTERACTION = 7000;

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

  function prepareLoopBuffer(target) {
    var wrapper = target.querySelector(".swiper-wrapper");

    if (!wrapper || target.dataset.aetherisLoopPrepared === "true") return;

    var originalSlides = Array.from(wrapper.children);
    var originalCount = originalSlides.length;

    if (!originalCount) return;

    for (var setIndex = 0; setIndex < 2; setIndex += 1) {
      originalSlides.forEach(function (slide) {
        var clone = slide.cloneNode(true);

        clone.setAttribute("aria-hidden", "true");
        clone.dataset.aetherisLoopClone = "true";
        wrapper.appendChild(clone);
      });
    }

    target.dataset.aetherisOriginalSlideCount = String(originalCount);
    target.dataset.aetherisLoopPrepared = "true";
  }

  function normalize(swiper, target) {
    var originalCount = originalSlideCount(target);

    if (!originalCount || !swiper || swiper.destroyed) return;

    if (swiper.activeIndex >= originalCount) {
      swiper.slideTo(swiper.activeIndex % originalCount, 0, false);
    }
  }

  function advance(swiper, target) {
    if (!swiper || swiper.destroyed || document.hidden) return;

    var speed = swiper.params.speed || 600;
    var originalCount = originalSlideCount(target);

    if (!originalCount) {
      swiper.slideNext(speed);
      return;
    }

    if (swiper.activeIndex >= originalCount - 1) {
      swiper.slideTo(originalCount, speed);
      return;
    }

    swiper.slideNext(speed);
  }

  function installAutoScroll(swiper, target) {
    if (!swiper || !target || target.__aetherisAutoScroll) return;

    var intervalId = null;
    var resumeTimerId = null;

    function stop() {
      if (!intervalId) return;

      window.clearInterval(intervalId);
      intervalId = null;
    }

    function start() {
      stop();
      intervalId = window.setInterval(function () {
        advance(swiper, target);
      }, AUTO_SCROLL_DELAY);
    }

    function pauseThenResume() {
      stop();
      window.clearTimeout(resumeTimerId);
      resumeTimerId = window.setTimeout(start, RESUME_AFTER_INTERACTION);
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        stop();
      } else {
        pauseThenResume();
      }
    }

    target.addEventListener("mouseenter", stop);
    target.addEventListener("mouseleave", start);
    target.addEventListener("focusin", stop);
    target.addEventListener("focusout", start);
    target.addEventListener("pointerdown", pauseThenResume);
    target.addEventListener("touchstart", pauseThenResume, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    swiper.on("transitionEnd", function () {
      normalize(swiper, target);
    });

    swiper.on("sliderMove", pauseThenResume);

    swiper.on("destroy", function () {
      stop();
      window.clearTimeout(resumeTimerId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    });

    target.__aetherisAutoScroll = {
      start: start,
      stop: stop
    };

    installWrappedNavigation(swiper, target, pauseThenResume);
    start();
  }

  function installWrappedNavigation(swiper, target, pauseThenResume) {
    var group = target.closest("[data-swiper-group]");
    var previousButton = group && group.querySelector("[data-swiper-prev]");
    var nextButton = group && group.querySelector("[data-swiper-next]");

    function keepEnabled() {
      [previousButton, nextButton].forEach(function (button) {
        if (!button) return;

        button.classList.remove("swiper-button-disabled", "swiper-button-lock");
        button.removeAttribute("disabled");
        button.setAttribute("aria-disabled", "false");
      });
    }

    if (previousButton) {
      previousButton.addEventListener(
        "click",
        function (event) {
          var originalCount = originalSlideCount(target);

          if (!originalCount || swiper.activeIndex !== 0) return;

          event.preventDefault();
          event.stopImmediatePropagation();
          swiper.slideTo(originalCount, 0, false);
          swiper.slidePrev(swiper.params.speed || 600);
          pauseThenResume();
        },
        true
      );
    }

    swiper.on("slideChange", keepEnabled);
    swiper.on("transitionEnd", keepEnabled);
    swiper.on("update", keepEnabled);
    keepEnabled();
  }

  function patchSwiper() {
    var OriginalSwiper = window.Swiper;

    if (!OriginalSwiper || OriginalSwiper.__aetherisLoopPatch) return;

    function AetherisSwiper(element, options) {
      var target = typeof element === "string" ? document.querySelector(element) : element;
      var shouldPatchCases = isCaseGallery(target);

      if (shouldPatchCases) {
        var originalEvents = (options && options.on) || {};
        prepareLoopBuffer(target);

        options = Object.assign({}, options, {
          loop: false,
          rewind: false,
          slidesPerGroup: 1,
          watchOverflow: false,
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
