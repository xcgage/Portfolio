(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----- Nav: highlight the link for the section in view -----
     Each <section data-group="..."> maps to a nav link with data-nav="...". An empty group highlights nothing. */
  var links = document.querySelectorAll("[data-nav]");
  var sections = Array.prototype.slice.call(document.querySelectorAll("section[data-group]"));

  function updateNav() {
    var navH = document.querySelector(".nav").offsetHeight;
    var current = "";
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= navH + 120) current = sections[i].getAttribute("data-group");
    }
    for (var j = 0; j < links.length; j++) {
      links[j].classList.toggle("is-active", links[j].getAttribute("data-nav") === current);
    }
  }

  /* ----- Pipeline: a dot travels through the five stages as you scroll, lighting each one ----- */
  var pipe = document.querySelector("[data-pipe]");
  var stages = pipe ? pipe.querySelectorAll(".pipe__stage") : [];

  function setPipe(p) {
    pipe.style.setProperty("--p", p.toFixed(3));
    for (var i = 0; i < stages.length; i++) {
      stages[i].classList.toggle("is-lit", p >= i / (stages.length - 1) - 0.02);
    }
  }

  function updatePipe() {
    if (!pipe) return;
    if (reduceMotion) { setPipe(1); return; }
    var vh = window.innerHeight;
    var r = pipe.getBoundingClientRect();
    var p = (vh * 0.85 - r.top) / (vh * 0.4 + r.height);
    setPipe(Math.max(0, Math.min(1, p)));
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      updateNav();
      updatePipe();
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  updateNav();
  updatePipe();

  /* ----- Gentle fade-up as sections come into view ----- */
  var reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    for (var k = 0; k < reveals.length; k++) reveals[k].classList.add("is-in");
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    for (var m = 0; m < reveals.length; m++) io.observe(reveals[m]);
  }

  /* ----- Gallery videos: only the poster loads until clicked, then it plays muted ----- */
  var tileButtons = document.querySelectorAll("[data-video]");
  for (var t = 0; t < tileButtons.length; t++) {
    tileButtons[t].addEventListener("click", function (e) {
      var btn = e.currentTarget;
      var box = btn.parentNode;
      var v = document.createElement("video");
      v.src = btn.getAttribute("data-video");
      v.muted = true;
      v.defaultMuted = true;
      v.controls = true;
      v.autoplay = true;
      v.loop = true;
      v.playsInline = true;
      v.setAttribute("aria-label", btn.getAttribute("aria-label").replace(/^Play /, "").replace(/ \(video, muted\)$/, ""));
      box.replaceChild(v, btn);
      var play = v.play();
      if (play && play.catch) play.catch(function () {});
    });
  }

  /* ----- How I think: click to enlarge (native <dialog>; click anywhere or Esc closes) ----- */
  var dialog = document.querySelector("[data-zoom-dialog]");
  if (dialog && dialog.showModal) {
    var big = dialog.querySelector("img");
    var openers = document.querySelectorAll("[data-zoom]");
    for (var z = 0; z < openers.length; z++) {
      openers[z].addEventListener("click", function (e) {
        var b = e.currentTarget;
        big.src = b.getAttribute("data-zoom");
        big.alt = b.getAttribute("data-alt") || "";
        dialog.showModal();
      });
    }
    dialog.addEventListener("click", function () { dialog.close(); });
  }
})();
