(function () {
  'use strict';

  var page = document.querySelector('[data-page]');
  var fill = document.querySelector('[data-line]');
  var scaleX = document.querySelector('[data-scale-x]');
  var scaleY = document.querySelector('[data-scale-y]');
  var readout = document.querySelector('[data-readout]');
  var dim = document.querySelector('[data-dim]');
  var namewrap = document.querySelector('.namewrap');
  var pipe = document.querySelector('[data-pipe]');
  var stages = pipe ? pipe.querySelectorAll('.pipe__stage') : [];
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var queued = false;

  function pad(n) {
    return ('0000' + n).slice(-4);
  }

  // Ruler numbers: one label every 100px. Tick marks themselves are CSS.
  function buildScale(el, length, axis) {
    var frag = document.createDocumentFragment();
    for (var n = 0; n < length; n += 100) {
      var s = document.createElement('span');
      s.textContent = pad(n);
      s.style[axis] = n + 'px';
      frag.appendChild(s);
    }
    el.textContent = '';
    el.appendChild(frag);
  }

  // Dimension line over the name shows its real measured width.
  function measureName() {
    if (dim && namewrap) {
      dim.textContent = 'W ' + Math.round(namewrap.offsetWidth) + ' PX';
    }
  }

  function buildRulers() {
    buildScale(scaleX, scaleX.clientWidth, 'left');
    buildScale(scaleY, page.offsetHeight, 'top');
    measureName();
  }

  // Scroll-drawn line: reaches 60% down the viewport, plus up to 40% more as you near
  // the bottom, so it arrives exactly at the page end. Plain height change, no easing.
  function drawLine(y) {
    var h = page.offsetHeight;
    var vh = window.innerHeight;
    var max = Math.max(1, document.documentElement.scrollHeight - vh);
    var progress = Math.min(1, y / max);
    var top = page.getBoundingClientRect().top;
    var reach = reduce.matches ? h : Math.min(h, -top + vh * 0.6 + vh * 0.4 * progress);
    fill.style.height = Math.max(0, reach) + 'px';
  }

  // CRM pipeline: dot position (--p) follows the scroll. Each stage lights when the dot reaches it.
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
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    drawLine(y);
    movePipe();
    readout.textContent = pad(Math.round(y));
  }

  function queue() {
    if (!queued) {
      queued = true;
      window.requestAnimationFrame(update);
    }
  }

  function onResize() {
    buildRulers();
    queue();
  }

  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('load', onResize);

  if (window.ResizeObserver) {
    new ResizeObserver(onResize).observe(page);
  }

  if (reduce.addEventListener) {
    reduce.addEventListener('change', queue);
  } else if (reduce.addListener) {
    reduce.addListener(queue);
  }

  // Snap-in for section titles: hidden until scrolled into view, then appear at once.
  var titles = document.querySelectorAll('.snapin');
  if ('IntersectionObserver' in window && !reduce.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    titles.forEach(function (t) { io.observe(t); });
  } else {
    titles.forEach(function (t) { t.classList.add('is-in'); });
  }

  // Gallery videos: the poster is a button. The video is only created (and loaded) on click, muted.
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

  onResize();
})();
