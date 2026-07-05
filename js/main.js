/* =========================================================================
   BUSY BEES FOUNDATION SCHOOL — INTERACTIONS
   Pure vanilla JS. No dependencies. Shared across every page.
   ========================================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     Sticky header shadow-on-scroll
     --------------------------------------------------------------------- */
  var header = document.getElementById('site-header');
  function onScrollHeader() {
    if (!header) return;
    if (document.documentElement.classList.contains('menu-open')) return;
    if (window.scrollY > 4) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  }
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------------------------------------------------------------------
     Mobile navigation toggle
     --------------------------------------------------------------------- */
  var navToggle = document.getElementById('nav-toggle');
  var mainNav = document.getElementById('main-nav');

  var lockedScrollY = 0;
  function lockBodyScroll() {
    lockedScrollY = window.scrollY || window.pageYOffset || 0;
    document.documentElement.classList.add('menu-open');
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + lockedScrollY + 'px';
    document.body.style.width = '100%';
  }
  function unlockBodyScroll() {
    document.documentElement.classList.remove('menu-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo({ top: lockedScrollY, left: 0, behavior: 'instant' });
  }

  function closeMobileNav() {
    if (!mainNav || !navToggle) return;
    mainNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open menu');
    unlockBodyScroll();
  }
  function openMobileNav() {
    lockBodyScroll();
    if (header) mainNav.style.top = header.getBoundingClientRect().bottom + 'px';
    mainNav.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Close menu');
  }
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = mainNav.classList.contains('is-open');
      if (isOpen) closeMobileNav(); else openMobileNav();
    });
  }

  /* ---------------------------------------------------------------------
     Dropdown / mega-menu navigation
     --------------------------------------------------------------------- */
  var navItems = document.querySelectorAll('.nav-item');
  var mobileNavMql = window.matchMedia('(max-width: 860px)');

  function closeAllDropdowns(except) {
    navItems.forEach(function (item) {
      if (item === except) return;
      item.classList.remove('is-open');
      var trigger = item.querySelector('[data-toggle]');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  }

  navItems.forEach(function (item) {
    var trigger = item.querySelector('[data-toggle]');
    if (!trigger) return;
    trigger.addEventListener('click', function (e) {
      /* Desktop: dropdowns open on hover (pure CSS) — let the link navigate normally.
         Mobile drawer: no hover, so tapping the parent still toggles the accordion. */
      if (!mobileNavMql.matches) return;
      e.preventDefault();
      var isOpen = item.classList.contains('is-open');
      closeAllDropdowns(item);
      item.classList.toggle('is-open', !isOpen);
      trigger.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav-item')) closeAllDropdowns();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeAllDropdowns();
      closeMobileNav();
    }
  });

  /* Close mobile nav / dropdowns when a plain link is followed */
  document.querySelectorAll('.dropdown-link, .nav-link:not([data-toggle])').forEach(function (link) {
    link.addEventListener('click', function () {
      closeMobileNav();
      closeAllDropdowns();
    });
  });

  /* ---------------------------------------------------------------------
     Smooth scroll with header offset for in-page anchors
     --------------------------------------------------------------------- */
  var headerOffset = 76;
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
      history.pushState(null, '', id);
    });
  });

  /* ---------------------------------------------------------------------
     Scroll-reveal via IntersectionObserver
     --------------------------------------------------------------------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------------------------------------------------------------------
     Animated number counters
     --------------------------------------------------------------------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1400;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = Math.floor(eased * target);
      el.textContent = value + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }

    if (reduceMotion) el.textContent = target + suffix;
    else requestAnimationFrame(step);
  }

  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countObserver.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---------------------------------------------------------------------
     Scrollspy — highlight active nav link (home page sections)
     --------------------------------------------------------------------- */
  var spyIds = window.BBFS_SPY_SECTIONS || [];
  var sections = spyIds.map(function (id) { return document.getElementById(id); }).filter(Boolean);
  var navLinks = document.querySelectorAll('.nav-link[href*="#"]');

  function setActiveLink(id) {
    navLinks.forEach(function (link) {
      var match = link.getAttribute('href').indexOf('#' + id) !== -1;
      link.classList.toggle('is-active', match);
    });
  }
  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActiveLink(entry.target.id);
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    sections.forEach(function (sec) { spy.observe(sec); });
  }

  /* ---------------------------------------------------------------------
     Accordion (core values / school-life clubs)
     --------------------------------------------------------------------- */
  document.querySelectorAll('.accordion').forEach(function (accordion) {
    var singleOpen = accordion.getAttribute('data-single-open') === 'true';
    var items = accordion.querySelectorAll('.accordion-item');

    items.forEach(function (item) {
      var head = item.querySelector('.accordion-head');
      var body = item.querySelector('.accordion-body');
      if (!head || !body) return;

      head.addEventListener('click', function () {
        var isOpen = item.classList.contains('is-open');

        if (singleOpen) {
          items.forEach(function (other) {
            if (other === item) return;
            other.classList.remove('is-open');
            var otherBody = other.querySelector('.accordion-body');
            if (otherBody) otherBody.style.maxHeight = null;
            var otherHead = other.querySelector('.accordion-head');
            if (otherHead) otherHead.setAttribute('aria-expanded', 'false');
          });
        }

        item.classList.toggle('is-open', !isOpen);
        head.setAttribute('aria-expanded', String(!isOpen));
        body.style.maxHeight = !isOpen ? body.scrollHeight + 'px' : null;
      });
    });
  });

  /* ---------------------------------------------------------------------
     Filter tabs (news page)
     --------------------------------------------------------------------- */
  document.querySelectorAll('[data-filter-group]').forEach(function (group) {
    var buttons = group.querySelectorAll('.tab-btn');
    var targetSelector = group.getAttribute('data-filter-group');
    var items = document.querySelectorAll(targetSelector);

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        var filter = btn.getAttribute('data-filter');

        items.forEach(function (el) {
          var cats = (el.getAttribute('data-category') || '').split(' ');
          var show = filter === 'all' || cats.indexOf(filter) !== -1;
          el.style.display = show ? '' : 'none';
        });
      });
    });
  });

  /* ---------------------------------------------------------------------
     Forms — client-side only (static site, no backend)
     --------------------------------------------------------------------- */
  document.querySelectorAll('form[data-form]').forEach(function (form) {
    var status = form.querySelector('.form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var message = form.getAttribute('data-success-message') || 'Thank you! We have received your submission.';
      var nameField = form.querySelector('[data-success-name]');
      if (nameField && nameField.value.trim()) {
        message = message.replace('{name}', nameField.value.trim());
      }
      if (status) {
        status.textContent = message;
        status.classList.add('success');
      }
      form.reset();
    });
  });

  /* ---------------------------------------------------------------------
     Footer year
     --------------------------------------------------------------------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

})();
