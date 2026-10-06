/* =============================================================
   MINNAT VIGOUR GYM — Site Scripts
   Vanilla JS, zero dependencies, defer-loaded
   ============================================================= */
(function () {
  'use strict';

  const qs  = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));

  /* =========================================================
     1. HEADER — Scroll state & active link
     ========================================================= */
  const header   = qs('#header');
  const navLinks = qsa('.nav-links a');
  const sections = qsa('section[id]');

  function onScroll() {
    const y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', y > 12);

    let currentId = 'home';
    for (const s of sections) {
      const top = s.offsetTop - 120;
      if (y >= top) currentId = s.id;
    }
    navLinks.forEach(a => {
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + currentId);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* =========================================================
     2. MOBILE MENU
     ========================================================= */
  const burger    = qs('#hamburger');
  const navList   = qs('#navLinks');

  function closeMenu() {
    burger?.classList.remove('is-open');
    navList?.classList.remove('is-open');
    burger?.setAttribute('aria-expanded', 'false');
  }
  function toggleMenu() {
    const open = navList.classList.toggle('is-open');
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
  }
  burger?.addEventListener('click', toggleMenu);

  // Close menu on link click
  navLinks.forEach(a => a.addEventListener('click', closeMenu));

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeMenu(); closeLightbox(); }
  });

  /* =========================================================
     3. SMOOTH SCROLL — with offset for fixed header
     ========================================================= */
  qsa('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const id = this.getAttribute('href');
      if (!id || id === '#') return;
      const target = qs(id);
      if (!target) return;
      e.preventDefault();
      const navH = (header?.offsetHeight || 72) - 1;
      const top = target.getBoundingClientRect().top + window.pageYOffset - navH;
      window.scrollTo({ top, behavior: 'smooth' });
      closeMenu();
    });
  });

  /* =========================================================
     4. SCROLL REVEAL via IntersectionObserver
     ========================================================= */
  const revealEls = qsa('.reveal');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver((entries) => {
      for (const ent of entries) {
        if (ent.isIntersecting) {
          ent.target.classList.add('is-visible');
          io.unobserve(ent.target);
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* =========================================================
     5. GALLERY FILTER
     ========================================================= */
  const filterBtns = qsa('.filter-btn');
  const galleryItems = qsa('.gallery-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.filter;
      filterBtns.forEach(b => {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-selected', String(b === btn));
      });
      galleryItems.forEach(it => {
        const match = (f === 'all') || (it.dataset.cat === f);
        it.classList.toggle('is-hidden', !match);
      });
    });
  });

  /* =========================================================
     6. LIGHTBOX
     ========================================================= */
  const lightbox    = qs('#lightbox');
  const lightboxImg = qs('#lightboxImg');
  const lightboxCap = qs('#lightboxCap');
  const lbClose     = qs('#lightboxClose');
  const lbPrev      = qs('#lightboxPrev');
  const lbNext      = qs('#lightboxNext');
  let lbIndex = 0;

  function lbItems() {
    return qsa('.gallery-item:not(.is-hidden)');
  }
  function openLightbox(i) {
    const items = lbItems();
    if (!items.length) return;
    lbIndex = (i + items.length) % items.length;
    const it = items[lbIndex];
    lightboxImg.src = it.href;
    lightboxImg.alt = (it.querySelector('img')?.alt) || '';
    lightboxCap.textContent = it.dataset.caption || '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    if (!lightbox.classList.contains('is-open')) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // Reset src after transition to free memory
    setTimeout(() => {
      if (!lightbox.classList.contains('is-open')) {
        lightboxImg.src = '';
        lightboxImg.alt = '';
      }
    }, 300);
  }
  function nextLb(delta) {
    const items = lbItems();
    if (!items.length) return;
    openLightbox(lbIndex + delta);
  }

  galleryItems.forEach((it, i) => {
    it.addEventListener('click', (e) => {
      e.preventDefault();
      const items = galleryItems;
      const visible = lbItems();
      const idx = visible.indexOf(it);
      openLightbox(idx >= 0 ? idx : i);
    });
  });

  lbClose?.addEventListener('click', closeLightbox);
  lbPrev?.addEventListener('click', () => nextLb(-1));
  lbNext?.addEventListener('click', () => nextLb(1));
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'ArrowRight') nextLb(1);
    if (e.key === 'ArrowLeft')  nextLb(-1);
  });

  /* =========================================================
     7. CONTACT FORM — Validation + Submit via WhatsApp
     ========================================================= */
  const form     = qs('#contactForm');
  const statusEl = qs('#formStatus');

  const validators = {
    name: (v) => {
      if (!v.trim()) return 'Please enter your name.';
      if (v.trim().length < 2) return 'Name seems too short.';
      return '';
    },
    phone: (v) => {
      if (!v.trim()) return 'Please enter a phone number.';
      const digits = v.replace(/\D/g, '');
      if (digits.length < 7) return 'Please enter a valid phone number.';
      if (digits.length > 15) return 'Phone number looks too long.';
      return '';
    }
  };

  function setErr(fieldName, msg) {
    const input = qs(`[name="${fieldName}"]`, form);
    const wrap = input?.closest('.field');
    const err = qs(`.err[data-for="${fieldName}"]`, form);
    if (wrap) wrap.classList.toggle('has-error', !!msg);
    if (err)  err.textContent = msg || '';
  }
  function clearStatus() {
    statusEl.textContent = '';
    statusEl.className = 'form-status';
  }

  // Live feedback
  qsa('input[name="name"], input[name="phone"]', form).forEach(inp => {
    inp.addEventListener('blur', () => {
      const fn = inp.name;
      if (validators[fn]) setErr(fn, validators[fn](inp.value));
    });
    inp.addEventListener('input', () => {
      if (inp.closest('.field')?.classList.contains('has-error')) {
        if (validators[inp.name]) setErr(inp.name, validators[inp.name](inp.value));
      }
    });
  });

  form?.addEventListener('submit', function (e) {
    e.preventDefault();
    clearStatus();

    const data = {
      name:    qs('[name="name"]', this).value.trim(),
      phone:   qs('[name="phone"]', this).value.trim(),
      goal:    qs('[name="goal"]', this).value,
      preferred: qs('[name="preferred"]', this).value,
      message: qs('[name="message"]', this).value.trim()
    };

    // Validate
    let hasError = false;
    for (const k of Object.keys(validators)) {
      const err = validators[k](data[k]);
      setErr(k, err);
      if (err) hasError = true;
    }
    if (hasError) {
      statusEl.textContent = 'Please fix the highlighted fields and try again.';
      statusEl.classList.add('is-error');
      return;
    }

    // Build WhatsApp message
    const lines = [
      '*New Gym Inquiry*',
      '',
      `*Name:* ${data.name}`,
      `*Phone:* ${data.phone}`
    ];
    if (data.goal)        lines.push(`*Goal:* ${data.goal}`);
    if (data.preferred)   lines.push(`*Preferred Training:* ${data.preferred}`);
    if (data.message)     lines.push('', `*Message:* ${data.message}`);

    const text = encodeURIComponent(lines.join('\n'));
    const waUrl = `https://wa.me/917039536321?text=${text}`;

    // Success state
    statusEl.textContent = 'Redirecting you to WhatsApp…';
    statusEl.classList.add('is-success');

    setTimeout(() => {
      window.open(waUrl, '_blank', 'noopener');
      statusEl.textContent = '✓ Inquiry ready! WhatsApp opened in a new tab. We will get back to you shortly.';
      this.reset();
    }, 500);
  });

  /* =========================================================
     8. Lazy-load background for hero (if img src fails)
     ========================================================= */
  // Minimal: ensure images get natural aspect handling via CSS aspect-ratio already set.
  // Preconnect already in head.

})();
