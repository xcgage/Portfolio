(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var queued = false;

  // ---- Sticky nav: highlight the link for the section you are in ----
  // Each section has data-group (about, work, whop, skills, contact); each nav link has data-nav.
  var links = document.querySelectorAll('.nav [data-nav]');
  var sections = document.querySelectorAll('main section[data-group]');
  var navHeight = (document.querySelector('.nav') || {}).offsetHeight || 56;

  function highlightNav() {
    var current = null;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= navHeight + 80) {
        current = sections[i].getAttribute('data-group');
      }
    }
    // Hero (above the first grouped section) = nothing highlighted.
    var atBottom = window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 4;
    if (atBottom) { current = 'contact'; }
    links.forEach(function (a) {
      var on = a.getAttribute('data-nav') === current;
      a.classList.toggle('is-active', on);
      if (on) { a.setAttribute('aria-current', 'true'); } else { a.removeAttribute('aria-current'); }
    });
  }

  // ---- CRM pipeline: the dot (--p) follows the scroll; each stage lights when the dot reaches it ----
  var pipe = document.querySelector('[data-pipe]');
  var stages = pipe ? pipe.querySelectorAll('.pipe__stage') : [];

  function movePipe() {
    if (!pipe) { return; }
    var vh = window.innerHeight;
    var r = pipe.getBoundingClientRect();
    var center = r.top + r.height / 2;
    var t = reduce.matches ? 1 : (vh * 0.85 - center) / (vh * 0.5);
    t = Math.max(0, Math.min(1, t));
    pipe.style.setProperty('--p', t);
    for (var i = 0; i < stages.length; i++) {
      var lit = t > 0 && t >= i / (stages.length - 1) - 0.0001;
      stages[i].classList.toggle('is-lit', lit);
    }
  }

  function update() {
    queued = false;
    highlightNav();
    movePipe();
  }

  function queue() {
    if (!queued) {
      queued = true;
      window.requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  window.addEventListener('load', queue);

  if (reduce.addEventListener) {
    reduce.addEventListener('change', queue);
  } else if (reduce.addListener) {
    reduce.addListener(queue);
  }

  // ---- Gallery videos: the poster is a button. The video is only created (and loaded) on click, muted ----
  document.querySelectorAll('[data-video]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var v = document.createElement('video');
      v.src = btn.getAttribute('data-video');
      v.muted = true;
      v.defaultMuted = true;
      v.controls = true;
      v.playsInline = true;
      v.autoplay = true;
      v.setAttribute('aria-label', btn.getAttribute('data-title') + ' (video)');
      btn.replaceWith(v);
      var p = v.play();
      if (p && p.catch) { p.catch(function () {}); }
    });
  });

  // ---- How I think: click an image to enlarge it. Click anywhere in the dialog, or press Esc, to close ----
  var zoom = document.querySelector('[data-zoom-dialog]');
  if (zoom) {
    var zoomImg = zoom.querySelector('img');
    document.querySelectorAll('[data-zoom]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        zoomImg.src = btn.getAttribute('data-zoom');
        zoomImg.alt = btn.getAttribute('data-alt');
        if (zoom.showModal) { zoom.showModal(); } else { zoom.setAttribute('open', ''); }
      });
    });
    zoom.addEventListener('click', function () {
      if (zoom.close) { zoom.close(); } else { zoom.removeAttribute('open'); }
    });
  }

  update();
})();
