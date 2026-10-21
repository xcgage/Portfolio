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

  /* ----- Pipeline: a loop, like a GIF. A dot travels through the five stages and lights each one,
     sits on 05 for 3 seconds, then starts over. It plays while the pipeline is on screen. ----- */
  var pipe = document.querySelector("[data-pipe]");
  var stages = pipe ? pipe.querySelectorAll(".pipe__stage") : [];
  var PIPE_LEAD = 600;     // ms parked on 01 before moving
  var PIPE_TRAVEL = 5000;  // ms from 01 to 05
  var PIPE_HOLD = 3000;    // ms resting on 05 before the restart

  function setPipe(p) {
    pipe.style.setProperty("--p", p.toFixed(3));
    for (var i = 0; i < stages.length; i++) {
      stages[i].classList.toggle("is-lit", p >= i / (stages.length - 1) - 0.02);
    }
  }

  var pipeFrame = 0;
  var pipeStart = 0;

  function pipeTick(now) {
    var t = (now - pipeStart) % (PIPE_LEAD + PIPE_TRAVEL + PIPE_HOLD);
    var p = 0;
    if (t >= PIPE_LEAD) {
      var x = Math.min(1, (t - PIPE_LEAD) / PIPE_TRAVEL);
      p = 0.5 - Math.cos(Math.PI * x) / 2;   // gentle ease in and out
    }
    setPipe(p);
    pipeFrame = window.requestAnimationFrame(pipeTick);
  }

  if (pipe) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      setPipe(1);                            // no motion: show the finished pipeline
    } else {
      setPipe(0);
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          if (!pipeFrame) { pipeStart = performance.now(); pipeFrame = window.requestAnimationFrame(pipeTick); }
        } else if (pipeFrame) {
          window.cancelAnimationFrame(pipeFrame);
          pipeFrame = 0;
          setPipe(0);
        }
      }, { threshold: 0.2 }).observe(pipe);
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      updateNav();
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  updateNav();

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
