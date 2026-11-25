(() => {
  'use strict';

  // -------------------------------------------------------
  // Footer Year & Mobile Navigation
  // -------------------------------------------------------
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Quick Search Popover
  const searchToggle = document.getElementById('search-toggle');
  const quickSearch = document.getElementById('quick-search');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

  const SEARCH_ITEMS = [
    { label: 'Morning Coral Reef Dive ($85)', href: '#trips' },
    { label: 'Wreck & Deep Reef ($130)', href: '#trips' },
    { label: 'Sunset & Night Dive ($115)', href: '#trips' },
    { label: 'Turtle Bay Garden (12m)', href: '#sites' },
    { label: 'Blue Arch Canyon (18m)', href: '#sites' },
    { label: 'SS Horizon Wreck (24m)', href: '#sites' },
    { label: 'Outer Shelf Drop-Off (30m)', href: '#sites' },
    { label: 'Discover Scuba Course', href: '#courses' },
    { label: 'Open Water Diver Certification', href: '#courses' },
    { label: 'Advanced Open Water', href: '#courses' }
  ];

  function renderSearchChips(query = '') {
    if (!searchResults) return;
    const q = query.trim().toLowerCase();
    const matches = SEARCH_ITEMS.filter(item => item.label.toLowerCase().includes(q)).slice(0, 6);
    searchResults.innerHTML = '';
    if (matches.length === 0) {
      const msg = document.createElement('span');
      msg.className = 'search-chip';
      msg.textContent = 'No matching dives found';
      searchResults.appendChild(msg);
      return;
    }
    matches.forEach(item => {
      const a = document.createElement('a');
      a.className = 'search-chip';
      a.href = item.href;
      a.textContent = item.label;
      a.addEventListener('click', () => {
        if (quickSearch) quickSearch.hidden = true;
        if (searchToggle) searchToggle.setAttribute('aria-expanded', 'false');
      });
      searchResults.appendChild(a);
    });
  }

  if (searchToggle && quickSearch) {
    const closeSearch = () => {
      quickSearch.hidden = true;
      searchToggle.setAttribute('aria-expanded', 'false');
    };

    searchToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const opening = quickSearch.hidden;
      quickSearch.hidden = !opening;
      searchToggle.setAttribute('aria-expanded', String(opening));
      if (opening) {
        renderSearchChips(searchInput ? searchInput.value : '');
        if (searchInput) searchInput.focus();
      }
    });

    document.addEventListener('click', (e) => {
      if (!quickSearch.hidden && !quickSearch.contains(e.target) && e.target !== searchToggle) {
        closeSearch();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !quickSearch.hidden) {
        closeSearch();
        searchToggle.focus();
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => renderSearchChips(searchInput.value));
  }

  // Active Navigation Scroll-Spy
  const navLinkEls = Array.from(document.querySelectorAll('.nav-links .nav-link'));
  const spySections = [
    { el: document.getElementById('hero-ocean-zone'), href: '#top' },
    { el: document.getElementById('trips'), href: '#trips' },
    { el: document.getElementById('sites'), href: '#sites' },
    { el: document.getElementById('courses'), href: '#courses' },
    { el: document.getElementById('about'), href: '#about' }
  ].filter(s => s.el);

  if (navLinkEls.length > 0 && spySections.length > 0) {
    const spyObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter(en => en.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length === 0) return;
      const match = spySections.find(s => s.el === visible[0].target);
      if (match) {
        navLinkEls.forEach(a => a.classList.toggle('active', a.getAttribute('href') === match.href));
      }
    }, { rootMargin: '-28% 0px -52% 0px', threshold: [0.05, 0.25, 0.5] });

    spySections.forEach(s => spyObserver.observe(s.el));
  }

  // Footer Newsletter Form
  const newsletterForm = document.getElementById('newsletter-form');
  const newsletterEmail = document.getElementById('newsletter-email');
  const newsletterFeedback = document.getElementById('newsletter-feedback');

  if (newsletterForm && newsletterEmail && newsletterFeedback) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = newsletterEmail.value.trim();
      if (!val || !val.includes('@')) {
        newsletterFeedback.textContent = 'Please enter a valid email address.';
        return;
      }
      newsletterFeedback.textContent = `Subscribed ${val} to BlueTide dive updates!`;
      newsletterForm.reset();
    });
  }

  // Exclusive FAQ accordion (one item open at a time)
  const faqItems = Array.from(document.querySelectorAll('#faq .faq-item'));
  faqItems.forEach(item => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      faqItems.forEach(other => {
        if (other !== item && other.open) other.open = false;
      });
    });
  });

  // -------------------------------------------------------
  // Custom Ocean-Glass Dropdowns + Trip Selection & Form
  // -------------------------------------------------------
  const tripSelect = document.getElementById('trip');
  const levelSelect = document.getElementById('level');
  const bookSection = document.getElementById('book');

  const customSelectInstances = [];

  function enhanceSelect(selectEl) {
    if (!selectEl || selectEl.dataset.enhanced === 'true') return;
    selectEl.dataset.enhanced = 'true';

    const wrapper = document.createElement('div');
    wrapper.className = 'cselect';
    selectEl.parentNode.insertBefore(wrapper, selectEl);
    wrapper.appendChild(selectEl);
    selectEl.classList.add('cselect-native');
    selectEl.tabIndex = -1;
    selectEl.setAttribute('aria-hidden', 'true');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'cselect-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const labelSpan = document.createElement('span');
    labelSpan.className = 'cselect-label';

    const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chevron.setAttribute('width', '16');
    chevron.setAttribute('height', '16');
    chevron.setAttribute('viewBox', '0 0 16 16');
    chevron.setAttribute('fill', 'none');
    chevron.setAttribute('class', 'cselect-chevron');
    chevron.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M4 6L8 10L12 6');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.7');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    chevron.appendChild(path);

    trigger.appendChild(labelSpan);
    trigger.appendChild(chevron);

    const menu = document.createElement('div');
    menu.className = 'cselect-menu';
    menu.setAttribute('role', 'listbox');

    const optionButtons = Array.from(selectEl.options).map((opt, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cselect-option';
      btn.setAttribute('role', 'option');
      btn.dataset.value = opt.value;
      btn.dataset.index = String(idx);

      // Split optional price suffix like " ($85)" into a sleek pill badge
      const priceMatch = opt.textContent.match(/^(.*?)\s*\((\$\d+)\)$/);
      const textSpan = document.createElement('span');
      textSpan.textContent = priceMatch ? priceMatch[1] : opt.textContent;
      btn.appendChild(textSpan);

      if (priceMatch) {
        const priceSpan = document.createElement('span');
        priceSpan.className = 'cselect-opt-price';
        priceSpan.textContent = priceMatch[2];
        btn.appendChild(priceSpan);
      }

      btn.addEventListener('click', () => {
        selectEl.value = opt.value;
        sync();
        close();
        trigger.focus();
      });

      menu.appendChild(btn);
      return btn;
    });

    wrapper.appendChild(trigger);
    wrapper.appendChild(menu);

    const sync = () => {
      const selectedOpt = selectEl.options[selectEl.selectedIndex] || selectEl.options[0];
      labelSpan.textContent = selectedOpt ? selectedOpt.textContent : '';
      optionButtons.forEach(btn => {
        const isSel = btn.dataset.value === selectEl.value;
        btn.classList.toggle('selected', isSel);
        btn.setAttribute('aria-selected', String(isSel));
      });
    };

    const close = () => {
      wrapper.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    };

    const open = () => {
      customSelectInstances.forEach(inst => {
        if (inst.wrapper !== wrapper) inst.close();
      });
      wrapper.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    };

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (wrapper.classList.contains('open')) close();
      else open();
    });

    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
        const activeBtn = menu.querySelector('.cselect-option.selected') || optionButtons[0];
        if (activeBtn) activeBtn.focus();
      } else if (e.key === 'Escape') {
        close();
      }
    });

    menu.addEventListener('keydown', (e) => {
      const focusedIdx = optionButtons.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = optionButtons[Math.min(optionButtons.length - 1, focusedIdx + 1)];
        if (next) next.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = optionButtons[Math.max(0, focusedIdx - 1)];
        if (prev) prev.focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
        trigger.focus();
      }
    });

    const fieldLabel = document.querySelector(`label[for="${selectEl.id}"]`);
    if (fieldLabel) {
      fieldLabel.addEventListener('click', (e) => {
        e.preventDefault();
        trigger.focus();
        open();
      });
    }

    selectEl.addEventListener('change', sync);
    sync();
    customSelectInstances.push({ wrapper, close, sync });
  }

  enhanceSelect(levelSelect);
  enhanceSelect(tripSelect);

  document.addEventListener('click', (e) => {
    customSelectInstances.forEach(inst => {
      if (!inst.wrapper.contains(e.target)) inst.close();
    });
  });

  document.querySelectorAll('.select-trip').forEach(btn => {
    btn.addEventListener('click', () => {
      const chosen = btn.dataset.trip;
      if (tripSelect && chosen) {
        tripSelect.value = chosen;
        tripSelect.dispatchEvent(new Event('change'));
      }
      if (bookSection) {
        bookSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  const dateInput = document.getElementById('date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    if (!dateInput.value) {
      dateInput.value = today;
    }
  }

  const form = document.getElementById('booking-form');
  const feedback = document.getElementById('form-feedback');

  if (form && feedback) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const date = document.getElementById('date').value;
      const trip = tripSelect ? tripSelect.value : 'a dive';

      if (!name || !email || !email.includes('@') || !date) {
        feedback.textContent = 'Please enter your name, a valid email address, and a preferred date.';
        feedback.className = 'form-feedback error';
        return;
      }

      feedback.textContent = `Thanks, ${name}! Your request for "${trip}" on ${date} is ready. Our dive master will reach out to ${email} shortly.`;
      feedback.className = 'form-feedback success';
      form.reset();
      customSelectInstances.forEach(inst => inst.sync());
      if (dateInput) {
        dateInput.value = dateInput.min;
      }
    });
  }

  // -------------------------------------------------------
  // Interactive 2D Ocean Simulation (Ripples, Waves, Bubbles)
  // -------------------------------------------------------
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const oceanZones = Array.from(document.querySelectorAll('.ocean-zone'));

  function createOceanController(zone) {
    const canvas = zone.querySelector('.ocean-canvas');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const mode = canvas.dataset.ocean || 'hero';
    let width = 0;
    let height = 0;
    let dpr = 1;
    let isVisible = true;
    let time = Math.random() * 10;

    // 1D spring-physics water surface columns
    const COL_COUNT = 72;
    const waveY = new Float32Array(COL_COUNT);
    const waveV = new Float32Array(COL_COUNT);

    // Cursor state relative to this ocean zone
    const pointer = {
      x: 0.5,
      y: 0.5,
      px: 0.5,
      py: 0.5,
      active: false,
      lastRippleAt: 0
    };

    const ripples = [];
    const bubbles = [];

    function initBubbles(count) {
      bubbles.length = 0;
      for (let i = 0; i < count; i++) {
        bubbles.push({
          x: Math.random() * (width || 1200),
          y: Math.random() * (height || 600),
          r: 1.8 + Math.random() * 4.5,
          speed: 18 + Math.random() * 34,
          drift: (Math.random() - 0.5) * 14,
          phase: Math.random() * Math.PI * 2,
          alpha: 0.14 + Math.random() * 0.28
        });
      }
    }

    function resize() {
      const rect = zone.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(rect.width, 1);
      height = Math.max(rect.height, 1);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (bubbles.length === 0) {
        initBubbles(mode === 'deep' ? 42 : 30);
      }
    }

    function spawnRipple(x, y, maxRadius = 90, strength = 0.45) {
      ripples.push({ x, y, r: 6, maxRadius, alpha: strength });
      if (ripples.length > 26) ripples.shift();
    }

    function disturbWave(normX, force) {
      const idx = Math.floor(Math.max(0, Math.min(COL_COUNT - 1, normX * (COL_COUNT - 1))));
      for (let k = -2; k <= 2; k++) {
        const i = idx + k;
        if (i >= 0 && i < COL_COUNT) {
          const falloff = 1 - Math.abs(k) * 0.3;
          waveV[i] += force * falloff;
        }
      }
    }

    const sectionPhoto = zone.querySelector('.section-ocean-photo');

    zone.addEventListener('pointermove', (e) => {
      const rect = zone.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      pointer.px = pointer.x;
      pointer.py = pointer.y;
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;

      if (sectionPhoto) {
        const nx = (x / Math.max(rect.width, 1)) - 0.5;
        const ny = (y / Math.max(rect.height, 1)) - 0.5;
        sectionPhoto.style.setProperty('--px', `${(-nx * 12).toFixed(1)}px`);
        sectionPhoto.style.setProperty('--py', `${(-ny * 9).toFixed(1)}px`);
      }

      const speed = Math.hypot(x - pointer.px, y - pointer.py);
      const now = performance.now();
      if (now - pointer.lastRippleAt > 48 && speed > 2) {
        spawnRipple(x, y, 60 + Math.min(speed * 1.4, 70), 0.36);
        disturbWave(x / width, Math.min(speed * 0.45, 16));
        pointer.lastRippleAt = now;
      }

      // Gently push nearby bubbles away from cursor wake
      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];
        const dx = b.x - x;
        const dy = b.y - y;
        const dist = Math.hypot(dx, dy);
        if (dist > 1 && dist < 110) {
          const push = (1 - dist / 110) * 1.9;
          b.x += (dx / dist) * push;
          b.y += (dy / dist) * push * 0.6;
        }
      }
    }, { passive: true });

    zone.addEventListener('pointerleave', () => {
      pointer.active = false;
    });

    zone.addEventListener('click', (e) => {
      const rect = zone.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      spawnRipple(x, y, 150, 0.65);
      spawnRipple(x, y, 95, 0.48);
      disturbWave(x / width, 24);
      // Small splash of bubbles on click
      for (let i = 0; i < 4; i++) {
        bubbles.push({
          x: x + (Math.random() - 0.5) * 26,
          y: y + (Math.random() - 0.5) * 14,
          r: 2 + Math.random() * 3.5,
          speed: 32 + Math.random() * 30,
          drift: (Math.random() - 0.5) * 18,
          phase: Math.random() * Math.PI * 2,
          alpha: 0.42
        });
      }
      if (bubbles.length > 56) bubbles.splice(0, bubbles.length - 56);
    });

    function stepWavePhysics() {
      const k = 0.028;
      const damp = 0.94;
      const spread = 0.22;

      for (let i = 0; i < COL_COUNT; i++) {
        const accel = -k * waveY[i];
        waveV[i] = (waveV[i] + accel) * damp;
        waveY[i] += waveV[i];
      }

      const leftD = new Float32Array(COL_COUNT);
      const rightD = new Float32Array(COL_COUNT);
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < COL_COUNT; i++) {
          if (i > 0) {
            leftD[i] = spread * (waveY[i] - waveY[i - 1]);
            waveV[i - 1] += leftD[i];
          }
          if (i < COL_COUNT - 1) {
            rightD[i] = spread * (waveY[i] - waveY[i + 1]);
            waveV[i + 1] += rightD[i];
          }
        }
        for (let i = 0; i < COL_COUNT; i++) {
          if (i > 0) waveY[i - 1] += leftD[i];
          if (i < COL_COUNT - 1) waveY[i + 1] += rightD[i];
        }
      }
    }

    function drawWaveLayer(baseRatio, amp, freq, speed, color, useSpring) {
      const baseY = height * baseRatio;
      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let i = 0; i < COL_COUNT; i++) {
        const t = i / (COL_COUNT - 1);
        const x = t * width;
        const swell = Math.sin(t * Math.PI * freq + time * speed) * amp
                    + Math.cos(t * Math.PI * (freq * 0.6) - time * speed * 0.7) * (amp * 0.45);
        const springOffset = useSpring ? Math.max(-42, Math.min(42, waveY[i])) : 0;
        ctx.lineTo(x, baseY + swell + springOffset);
      }

      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    function render(dt) {
      if (!isVisible || width === 0 || height === 0) return;

      time += dt;
      stepWavePhysics();
      ctx.clearRect(0, 0, width, height);

      // Cursor water shimmer glow
      if (pointer.active) {
        const glow = ctx.createRadialGradient(pointer.x, pointer.y, 4, pointer.x, pointer.y, 170);
        glow.addColorStop(0, 'rgba(142, 229, 245, 0.16)');
        glow.addColorStop(1, 'rgba(142, 229, 245, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 170, 0, Math.PI * 2);
        ctx.fill();
      }

      // Subtle lower wave current keeping hero's sandy seabed & coral clear
      drawWaveLayer(0.86, 8, 4.2, 1.1, 'rgba(7, 88, 114, 0.14)', true);

      // Expanding cursor ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += 95 * dt;
        rp.alpha -= 0.55 * dt;
        if (rp.alpha <= 0 || rp.r >= rp.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = `rgba(173, 238, 250, ${rp.alpha.toFixed(3)})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Rising ocean bubbles
      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];
        b.y -= b.speed * dt;
        b.x += Math.sin(time * 1.4 + b.phase) * 0.35 + b.drift * dt * 0.25;
        if (b.y < -12) {
          b.y = height + 10;
          b.x = Math.random() * width;
        }
        if (b.x < -10) b.x = width + 10;
        if (b.x > width + 10) b.x = -10;

        ctx.strokeStyle = `rgba(210, 248, 255, ${b.alpha})`;
        ctx.fillStyle = `rgba(180, 240, 252, ${(b.alpha * 0.35).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    resize();
    return {
      zone,
      resize,
      render,
      setVisible(v) { isVisible = v; }
    };
  }

  const controllers = oceanZones
    .map(createOceanController)
    .filter(Boolean);

  if (controllers.length > 0 && !prefersReducedMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const ctrl = controllers.find(c => c.zone === entry.target);
        if (ctrl) ctrl.setVisible(entry.isIntersecting);
      });
    }, { threshold: 0.02 });

    controllers.forEach(c => observer.observe(c.zone));
    window.addEventListener('resize', () => controllers.forEach(c => c.resize()));
    window.addEventListener('load', () => controllers.forEach(c => c.resize()));

    let last = performance.now();
    function tick(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      for (let i = 0; i < controllers.length; i++) {
        controllers[i].render(dt);
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // -------------------------------------------------------
  // Hero Dive Torch Spotlight & Clear Ocean Mode Toggle
  // -------------------------------------------------------
  function initHeroSpotlightAndModes() {
    const heroZone = document.getElementById('hero-ocean-zone');
    const spotlight = document.getElementById('hero-spotlight');
    const modeButtons = Array.from(document.querySelectorAll('[data-hero-mode]'));
    if (!heroZone || !spotlight || modeButtons.length === 0) return;

    let targetX = 58;
    let targetY = 48;
    let currentX = 58;
    let currentY = 48;

    const setHeroMode = (mode) => {
      const isTorch = mode === 'torch';
      heroZone.classList.toggle('is-torch', isTorch);
      heroZone.classList.toggle('is-clear', !isTorch);
      modeButtons.forEach(btn => {
        const active = btn.dataset.heroMode === mode;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
    };

    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        setHeroMode(btn.dataset.heroMode);
      });
    });

    heroZone.addEventListener('pointermove', (e) => {
      const rect = heroZone.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
      targetY = ((e.clientY - rect.top) / Math.max(rect.height, 1)) * 100;
      if (prefersReducedMotion) {
        spotlight.style.setProperty('--tx', `${targetX.toFixed(2)}%`);
        spotlight.style.setProperty('--ty', `${targetY.toFixed(2)}%`);
      }
    }, { passive: true });

    if (!prefersReducedMotion) {
      const animateTorch = () => {
        currentX += (targetX - currentX) * 0.16;
        currentY += (targetY - currentY) * 0.16;
        spotlight.style.setProperty('--tx', `${currentX.toFixed(2)}%`);
        spotlight.style.setProperty('--ty', `${currentY.toFixed(2)}%`);
        requestAnimationFrame(animateTorch);
      };
      requestAnimationFrame(animateTorch);
    }
  }

  initHeroSpotlightAndModes();

  // -------------------------------------------------------
  // Hero Underwater Photo WebGL Ripple-Refraction Shader
  // -------------------------------------------------------
  function initHeroWaterShader() {
    if (prefersReducedMotion) return;
    const heroZone = document.getElementById('hero-ocean-zone');
    const heroImg = document.getElementById('hero-photo');
    const glCanvas = document.getElementById('hero-gl-canvas');
    if (!heroZone || !heroImg || !glCanvas) return;

    // Gentle CSS depth parallax (always works, even on file://)
    heroZone.addEventListener('pointermove', (e) => {
      const rect = heroZone.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / Math.max(rect.width, 1) - 0.5;
      const ny = (e.clientY - rect.top) / Math.max(rect.height, 1) - 0.5;
      heroImg.style.setProperty('--hx', `${(-nx * 14).toFixed(1)}px`);
      heroImg.style.setProperty('--hy', `${(-ny * 10).toFixed(1)}px`);
    }, { passive: true });

    const gl = glCanvas.getContext('webgl', { alpha: false, antialias: true });
    if (!gl) return;

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };

    const vs = compile(gl.VERTEX_SHADER, `
      attribute vec2 aPos;
      varying vec2 vUv;
      void main() {
        vUv = aPos * 0.5 + 0.5;
        gl_Position = vec4(aPos, 0.0, 1.0);
      }
    `);

    const fs = compile(gl.FRAGMENT_SHADER, `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTex;
      uniform vec2 uRes;
      uniform vec2 uImgRes;
      uniform float uTime;
      uniform vec2 uMouse;
      uniform vec4 uRipples[10];

      void main() {
        float screenAsp = uRes.x / max(uRes.y, 1.0);
        float imgAsp = uImgRes.x / max(uImgRes.y, 1.0);
        vec2 coverScale = screenAsp > imgAsp
          ? vec2(1.0, imgAsp / screenAsp)
          : vec2(screenAsp / imgAsp, 1.0);

        vec2 uv = (vUv - 0.5) * coverScale + 0.5;
        // Subtle parallax shift with cursor
        uv += (uMouse - 0.5) * vec2(-0.014, 0.010);

        // Ambient gentle underwater wave & caustic sway
        float topSurface = smoothstep(0.45, 1.0, vUv.y);
        float swayX = sin(vUv.y * 12.0 + uTime * 1.4) * 0.0022 * (0.4 + topSurface);
        float swayY = cos(vUv.x * 10.0 - uTime * 1.1) * 0.0018;
        vec2 totalOffset = vec2(swayX, swayY);
        float causticBoost = 0.0;

        // Interactive concentric cursor ripples
        for (int i = 0; i < 10; i++) {
          vec4 rp = uRipples[i];
          float age = uTime - rp.z;
          if (rp.w > 0.0 && age >= 0.0 && age < 2.6) {
            vec2 diff = vUv - rp.xy;
            diff.x *= screenAsp;
            float dist = length(diff);
            float radius = age * 0.36;
            float ring = exp(-abs(dist - radius) * 18.0) * exp(-age * 1.35) * rp.w;
            float wave = sin((dist - radius) * 48.0) * ring;
            vec2 dir = dist > 0.0001 ? diff / dist : vec2(0.0);
            totalOffset += dir * wave * 0.022;
            causticBoost += max(0.0, wave) * 0.32;
          }
        }

        vec2 refracted = clamp(uv + totalOffset, 0.002, 0.998);
        float r = texture2D(uTex, clamp(refracted + totalOffset * 0.35, 0.002, 0.998)).r;
        float g = texture2D(uTex, refracted).g;
        float b = texture2D(uTex, clamp(refracted - totalOffset * 0.35, 0.002, 0.998)).b;
        vec3 col = vec3(r, g, b);

        // Soft underwater caustic shimmer on seabed & ripple crests
        float floorMask = smoothstep(0.62, 0.12, vUv.y);
        float caustic = sin(vUv.x * 26.0 + uTime * 1.8 + sin(vUv.y * 18.0 - uTime))
                      * cos(vUv.y * 22.0 - uTime * 1.4);
        col += vec3(0.55, 0.92, 1.0) * max(0.0, caustic) * 0.06 * floorMask;
        col += vec3(0.75, 0.96, 1.0) * causticBoost;

        gl_FragColor = vec4(col, 1.0);
      }
    `);

    if (!vs || !fs) return;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const tex = gl.createTexture();
    const ripples = Array.from({ length: 10 }, () => [0.5, 0.5, -10, 0]);
    let rippleIdx = 0;
    let mouseX = 0.5;
    let mouseY = 0.5;
    let lastSpawn = 0;
    let startTime = performance.now();
    let texReady = false;
    let heroVisible = true;

    const pushRipple = (x, y, strength) => {
      const t = (performance.now() - startTime) / 1000;
      ripples[rippleIdx] = [x, 1.0 - y, t, strength];
      rippleIdx = (rippleIdx + 1) % 10;
    };

    heroZone.addEventListener('pointermove', (e) => {
      const rect = heroZone.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / Math.max(rect.width, 1);
      mouseY = (e.clientY - rect.top) / Math.max(rect.height, 1);
      const now = performance.now();
      if (now - lastSpawn > 90) {
        pushRipple(mouseX, mouseY, 0.75);
        lastSpawn = now;
      }
    }, { passive: true });

    heroZone.addEventListener('click', (e) => {
      const rect = heroZone.getBoundingClientRect();
      const x = (e.clientX - rect.left) / Math.max(rect.width, 1);
      const y = (e.clientY - rect.top) / Math.max(rect.height, 1);
      pushRipple(x, y, 1.45);
    });

    const resizeGl = () => {
      const rect = heroZone.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      glCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
      glCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
      gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    };
    window.addEventListener('resize', resizeGl);
    resizeGl();

    const uploadTexture = () => {
      try {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, heroImg);
        texReady = true;
        glCanvas.classList.add('ready');
      } catch (_) {
        // file:// CORS fallback: keep CSS parallax <img> + 2D ocean canvas active
        texReady = false;
      }
    };

    if (heroImg.complete && heroImg.naturalWidth > 0) {
      uploadTexture();
    } else {
      heroImg.addEventListener('load', uploadTexture);
    }

    const visObs = new IntersectionObserver((entries) => {
      heroVisible = entries[0].isIntersecting;
    }, { threshold: 0.02 });
    visObs.observe(heroZone);

    const drawGl = () => {
      if (texReady && heroVisible) {
        const t = (performance.now() - startTime) / 1000;
        gl.useProgram(prog);
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        const loc = gl.getAttribLocation(prog, 'aPos');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(gl.getUniformLocation(prog, 'uTex'), 0);
        gl.uniform2f(gl.getUniformLocation(prog, 'uRes'), glCanvas.width, glCanvas.height);
        gl.uniform2f(gl.getUniformLocation(prog, 'uImgRes'), heroImg.naturalWidth || 1280, heroImg.naturalHeight || 720);
        gl.uniform1f(gl.getUniformLocation(prog, 'uTime'), t);
        gl.uniform2f(gl.getUniformLocation(prog, 'uMouse'), mouseX, mouseY);
        gl.uniform4fv(gl.getUniformLocation(prog, 'uRipples'), new Float32Array(ripples.flat()));
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      requestAnimationFrame(drawGl);
    };
    requestAnimationFrame(drawGl);
  }

  initHeroWaterShader();

  // -------------------------------------------------------
  // Living Bioluminescent Jellyfish Simulation (Footer + Book)
  // -------------------------------------------------------
  const FOOTER_JELLY_SPECS = [
    // Left-side pair
    { scale: 0.92, xRatio: 0.16, minXRatio: 0.06, maxXRatio: 0.36, yRatio: 0.44, dir:  1, pulseRate: 2.15, speedMult: 0.95, phase: 0.0, alpha: 0.95, tint: [56, 214, 245] },
    { scale: 0.56, xRatio: 0.28, minXRatio: 0.08, maxXRatio: 0.38, yRatio: 0.74, dir: -1, pulseRate: 2.90, speedMult: 0.78, phase: 3.4, alpha: 0.74, tint: [96, 240, 218] },
    // Center pair
    { scale: 0.74, xRatio: 0.46, minXRatio: 0.35, maxXRatio: 0.65, yRatio: 0.34, dir:  1, pulseRate: 2.45, speedMult: 0.86, phase: 1.8, alpha: 0.88, tint: [104, 232, 250] },
    { scale: 0.52, xRatio: 0.56, minXRatio: 0.36, maxXRatio: 0.66, yRatio: 0.66, dir: -1, pulseRate: 3.05, speedMult: 0.76, phase: 4.5, alpha: 0.78, tint: [164, 186, 255] },
    // Right-side pair
    { scale: 0.86, xRatio: 0.82, minXRatio: 0.64, maxXRatio: 0.94, yRatio: 0.36, dir: -1, pulseRate: 2.35, speedMult: 0.88, phase: 1.3, alpha: 0.94, tint: [120, 224, 255] },
    { scale: 0.62, xRatio: 0.74, minXRatio: 0.62, maxXRatio: 0.92, yRatio: 0.68, dir:  1, pulseRate: 2.70, speedMult: 0.80, phase: 2.5, alpha: 0.82, tint: [142, 180, 255] }
  ];

  const BOOK_JELLY_SPECS = [
    { scale: 0.78, xRatio: 0.14, minXRatio: 0.05, maxXRatio: 0.34, yRatio: 0.24, dir:  1, pulseRate: 2.15, speedMult: 0.88, phase: 0.4, alpha: 0.86, tint: [56, 214, 245] },
    { scale: 0.54, xRatio: 0.24, minXRatio: 0.06, maxXRatio: 0.38, yRatio: 0.78, dir: -1, pulseRate: 2.75, speedMult: 0.76, phase: 2.9, alpha: 0.74, tint: [96, 240, 218] },
    { scale: 0.62, xRatio: 0.50, minXRatio: 0.35, maxXRatio: 0.65, yRatio: 0.20, dir:  1, pulseRate: 2.45, speedMult: 0.80, phase: 1.7, alpha: 0.78, tint: [104, 232, 250] },
    { scale: 0.74, xRatio: 0.86, minXRatio: 0.66, maxXRatio: 0.95, yRatio: 0.72, dir: -1, pulseRate: 2.30, speedMult: 0.84, phase: 4.1, alpha: 0.84, tint: [142, 180, 255] }
  ];

  function initJellyfishField(containerId, canvasId, specs, opts = {}) {
    const {
      moteCount = 18,
      fishCount = 0,
      hasManta = false,
      hasKelp = false
    } = opts;
    const container = document.getElementById(containerId);
    const canvas = document.getElementById(canvasId);
    if (!container || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let visible = false;
    let time = 0;

    const pointer = { x: -999, y: -999, active: false };
    container.addEventListener('pointermove', (e) => {
      const rect = container.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    }, { passive: true });
    container.addEventListener('pointerleave', () => {
      pointer.active = false;
    });

    const TENTACLE_COUNT = 7;
    const NODES_PER_TENTACLE = 13;

    const jellies = specs.map((spec) => {
      const startX = 180 + spec.xRatio * 800;
      const startY = 80 + spec.yRatio * 180;
      return {
        ...spec,
        x: startX,
        y: startY,
        vx: spec.dir * 28 * spec.speedMult,
        vy: 0,
        heading: spec.dir === 1 ? 0.08 : Math.PI - 0.08,
        pulsePhase: spec.phase,
        excitement: 0,
        bellRx: 34 * spec.scale,
        bellRy: 25 * spec.scale,
        contract: 0,
        tentacles: Array.from({ length: TENTACLE_COUNT }, (_, tIdx) => ({
          offsetRatio: (tIdx / (TENTACLE_COUNT - 1)) * 2 - 1,
          segLen: (tIdx % 2 === 0 ? 9.5 : 7.5) * spec.scale,
          nodes: Array.from({ length: NODES_PER_TENTACLE }, () => ({ x: startX, y: startY }))
        }))
      };
    });

    const motes = Array.from({ length: moteCount }, () => ({
      x: Math.random() * 1400,
      y: Math.random() * 680,
      r: 0.8 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2,
      speed: 6 + Math.random() * 10
    }));

    const fish = Array.from({ length: fishCount }, (_, i) => {
      const angle = (i / Math.max(1, fishCount)) * Math.PI * 2;
      const radius = 24 + (i % 4) * 20;
      return {
        x: 240 + Math.cos(angle) * radius,
        y: 180 + Math.sin(angle) * radius * 0.5,
        vx: 42,
        vy: 0,
        ox: Math.cos(angle) * radius,
        oy: Math.sin(angle) * radius * 0.55,
        scale: 0.68 + (i % 3) * 0.22,
        phase: i * 0.85,
        tint: i % 2 === 0 ? 'rgba(155, 240, 255, 0.44)' : 'rgba(96, 218, 242, 0.36)'
      };
    });

    const manta = hasManta ? { x: -120, y: 220, vx: 26, vy: 0, wingPhase: 0 } : null;

    const kelpBlades = hasKelp ? [
      { xRatio: 0.03, hRatio: 0.26, w: 14, phase: 0.2 },
      { xRatio: 0.06, hRatio: 0.34, w: 18, phase: 1.5 },
      { xRatio: 0.095, hRatio: 0.22, w: 12, phase: 2.7 },
      { xRatio: 0.905, hRatio: 0.24, w: 13, phase: 0.9 },
      { xRatio: 0.94, hRatio: 0.35, w: 18, phase: 2.2 },
      { xRatio: 0.972, hRatio: 0.27, w: 14, phase: 3.4 }
    ] : [];

    let initialized = false;
    function resize() {
      const rect = container.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(rect.width, 1);
      height = Math.max(rect.height, 1);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      jellies.forEach((j) => {
        const baseX = initialized ? j.x : width * j.xRatio;
        const baseY = initialized ? j.y : height * j.yRatio;
        j.x = Math.max(width * j.minXRatio, Math.min(width * j.maxXRatio, baseX));
        j.y = Math.max(36, Math.min(height - 42, baseY));
      });
      if (!initialized && manta) {
        manta.x = width * 0.22;
        manta.y = height * 0.34;
      }
      initialized = true;
    }

    function shortestAngleDiff(current, target) {
      let diff = (target - current + Math.PI) % (Math.PI * 2) - Math.PI;
      if (diff < -Math.PI) diff += Math.PI * 2;
      return diff;
    }

    function stepJelly(j, dt) {
      let cursorEscapeAngle = null;
      if (pointer.active) {
        const dx = j.x - pointer.x;
        const dy = j.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 165) {
          j.excitement = Math.min(1.4, j.excitement + dt * 2.2);
          cursorEscapeAngle = Math.atan2(dy, dx);
          j.dir = dx >= 0 ? 1 : -1;
        }
      }
      j.excitement = Math.max(0, j.excitement - dt * 0.7);

      j.pulsePhase += dt * (j.pulseRate + j.excitement * 1.65);
      const rawSin = Math.sin(j.pulsePhase);
      j.contract = Math.pow(Math.max(0, rawSin), 1.5);

      const minX = width * j.minXRatio;
      const maxX = width * j.maxXRatio;
      if (j.x > maxX) j.dir = -1;
      if (j.x < minX) j.dir = 1;

      const baseY = height * j.yRatio + Math.sin(time * 0.55 + j.phase) * (height * 0.12);
      const desiredVy = (baseY - j.y) * 0.015;
      let targetHeading = j.dir === 1
        ? Math.atan2(desiredVy, 1)
        : Math.atan2(desiredVy, -1);

      if (cursorEscapeAngle !== null) {
        targetHeading = cursorEscapeAngle;
      }

      j.heading += shortestAngleDiff(j.heading, targetHeading) * Math.min(1, dt * 2.1);

      const thrust = (12 + j.contract * 54) * j.speedMult * (1 + j.excitement * 0.55);
      j.vx += (Math.cos(j.heading) * thrust - j.vx) * Math.min(1, dt * 3.4);
      j.vy += (Math.sin(j.heading) * thrust * 0.65 - j.vy) * Math.min(1, dt * 3.4);

      j.x += j.vx * dt;
      j.y += j.vy * dt;
      j.y = Math.max(36, Math.min(height - 42, j.y));

      j.bellRx = (34 - j.contract * 9) * j.scale;
      j.bellRy = (25 + j.contract * 7) * j.scale;
      const cosH = Math.cos(j.heading);
      const sinH = Math.sin(j.heading);

      for (let t = 0; t < j.tentacles.length; t++) {
        const tent = j.tentacles[t];
        const lateral = tent.offsetRatio * (j.bellRx * 0.78);
        const anchorX = j.x - cosH * (j.bellRy * 0.25) - sinH * lateral;
        const anchorY = j.y - sinH * (j.bellRy * 0.25) + cosH * lateral;

        tent.nodes[0].x = anchorX;
        tent.nodes[0].y = anchorY;

        for (let n = 1; n < NODES_PER_TENTACLE; n++) {
          const prev = tent.nodes[n - 1];
          const curr = tent.nodes[n];

          const wave = Math.sin(time * 2.6 - n * 0.45 + t * 0.7 + j.phase) * 13 * j.scale * dt;
          curr.x += (-sinH * wave) - cosH * 8 * dt;
          curr.y += (cosH * wave) + 10 * dt;

          const dx = curr.x - prev.x;
          const dy = curr.y - prev.y;
          const dist = Math.hypot(dx, dy) || 0.001;
          curr.x = prev.x + (dx / dist) * tent.segLen;
          curr.y = prev.y + (dy / dist) * tent.segLen;
        }
      }
    }

    function drawJelly(j) {
      const [tr, tg, tb] = j.tint;
      const aScale = j.alpha;

      // Ambient bioluminescent aura
      const auraR = 115 * j.scale;
      const aura = ctx.createRadialGradient(j.x, j.y, 4 * j.scale, j.x, j.y, auraR);
      aura.addColorStop(0, `rgba(${tr}, ${tg}, ${tb}, ${((0.16 + j.contract * 0.1 + j.excitement * 0.08) * aScale).toFixed(3)})`);
      aura.addColorStop(1, `rgba(${tr}, ${tg}, ${tb}, 0)`);
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(j.x, j.y, auraR, 0, Math.PI * 2);
      ctx.fill();

      // Flowing tentacles
      for (let t = 0; t < j.tentacles.length; t++) {
        const nodes = j.tentacles[t].nodes;
        ctx.beginPath();
        ctx.moveTo(nodes[0].x, nodes[0].y);
        for (let n = 1; n < nodes.length - 1; n++) {
          const mx = (nodes[n].x + nodes[n + 1].x) * 0.5;
          const my = (nodes[n].y + nodes[n + 1].y) * 0.5;
          ctx.quadraticCurveTo(nodes[n].x, nodes[n].y, mx, my);
        }
        const lastNode = nodes[nodes.length - 1];
        ctx.lineTo(lastNode.x, lastNode.y);
        ctx.strokeStyle = t % 2 === 0
          ? `rgba(${tr}, ${tg}, ${tb}, ${(0.42 * aScale).toFixed(3)})`
          : `rgba(186, 168, 255, ${(0.28 * aScale).toFixed(3)})`;
        ctx.lineWidth = (t % 2 === 0 ? 1.8 : 1.2) * j.scale;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Translucent pulsing bell
      ctx.save();
      ctx.translate(j.x, j.y);
      ctx.rotate(j.heading + Math.PI * 0.5);

      const bellGrad = ctx.createRadialGradient(0, -j.bellRy * 0.35, 2, 0, 0, j.bellRx * 1.2);
      bellGrad.addColorStop(0, `rgba(220, 252, 255, ${(0.56 * aScale).toFixed(3)})`);
      bellGrad.addColorStop(0.55, `rgba(${tr}, ${tg}, ${tb}, ${(0.30 * aScale).toFixed(3)})`);
      bellGrad.addColorStop(1, `rgba(14, 130, 172, ${(0.08 * aScale).toFixed(3)})`);

      ctx.fillStyle = bellGrad;
      ctx.strokeStyle = `rgba(${Math.min(255, tr + 80)}, ${Math.min(255, tg + 30)}, 255, ${(0.56 * aScale).toFixed(3)})`;
      ctx.lineWidth = Math.max(1, 1.5 * j.scale);

      ctx.beginPath();
      ctx.moveTo(-j.bellRx, 4 * j.scale);
      ctx.bezierCurveTo(-j.bellRx * 1.05, -j.bellRy * 1.35, j.bellRx * 1.05, -j.bellRy * 1.35, j.bellRx, 4 * j.scale);
      ctx.quadraticCurveTo(j.bellRx * 0.5, 11 * j.scale, 0, 5 * j.scale);
      ctx.quadraticCurveTo(-j.bellRx * 0.5, 11 * j.scale, -j.bellRx, 4 * j.scale);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = `rgba(195, 250, 255, ${((0.24 + j.contract * 0.16) * aScale).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(0, -j.bellRy * 0.25, j.bellRx * 0.42, j.bellRy * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    function drawKelp() {
      for (let i = 0; i < kelpBlades.length; i++) {
        const k = kelpBlades[i];
        const baseX = width * k.xRatio;
        const h = Math.min(180, height * k.hRatio);
        const sway = Math.sin(time * 0.95 + k.phase) * 18;
        const swayMid = Math.sin(time * 0.95 + k.phase - 0.8) * 9;
        ctx.fillStyle = 'rgba(7, 52, 74, 0.42)';
        ctx.beginPath();
        ctx.moveTo(baseX - k.w * 0.5, height);
        ctx.quadraticCurveTo(baseX - k.w * 0.35 + swayMid, height - h * 0.5, baseX + sway, height - h);
        ctx.quadraticCurveTo(baseX + k.w * 0.4 + swayMid, height - h * 0.5, baseX + k.w * 0.5, height);
        ctx.closePath();
        ctx.fill();
      }
    }

    function stepAndDrawManta(dt) {
      if (!manta) return;
      manta.wingPhase += dt * 1.65;
      const targetY = height * 0.34 + Math.sin(time * 0.24) * (height * 0.10);
      let desVy = (targetY - manta.y) * 0.6;
      if (pointer.active) {
        const dx = manta.x - pointer.x;
        const dy = manta.y - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < 165 && d > 1) desVy += (dy / d) * 32;
      }
      manta.vx += (28 - manta.vx) * Math.min(1, dt * 1.5);
      manta.vy += (desVy - manta.vy) * Math.min(1, dt * 1.6);
      manta.x += manta.vx * dt;
      manta.y += manta.vy * dt;
      if (manta.x > width + 130) manta.x = -130;

      const wingLift = Math.sin(manta.wingPhase) * 14;
      const angle = Math.atan2(manta.vy, manta.vx);
      ctx.save();
      ctx.translate(manta.x, manta.y);
      ctx.rotate(angle);

      const grad = ctx.createRadialGradient(8, 0, 4, 0, 0, 62);
      grad.addColorStop(0, 'rgba(64, 198, 228, 0.26)');
      grad.addColorStop(1, 'rgba(10, 64, 96, 0.08)');
      ctx.fillStyle = grad;
      ctx.strokeStyle = 'rgba(118, 228, 250, 0.28)';
      ctx.lineWidth = 1.2;

      ctx.beginPath();
      ctx.moveTo(34, -5);
      ctx.quadraticCurveTo(10, -18, -10, -48 + wingLift);
      ctx.quadraticCurveTo(-22, -18, -32, -2);
      ctx.lineTo(-74, Math.sin(manta.wingPhase - 1.0) * 5);
      ctx.lineTo(-32, 2);
      ctx.quadraticCurveTo(-22, 18, -10, 48 - wingLift);
      ctx.quadraticCurveTo(10, 18, 34, 5);
      ctx.quadraticCurveTo(26, 0, 34, -5);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    function stepAndDrawFish(dt) {
      if (fish.length === 0) return;
      const schoolX = width * (0.5 + 0.34 * Math.sin(time * 0.21));
      const schoolY = height * (0.48 + 0.22 * Math.sin(time * 0.42));

      for (let i = 0; i < fish.length; i++) {
        const f = fish[i];
        const tx = schoolX + f.ox + Math.sin(time * 0.9 + f.phase) * 14;
        const ty = schoolY + f.oy + Math.cos(time * 1.1 + f.phase) * 10;
        let dvx = (tx - f.x) * 1.6;
        let dvy = (ty - f.y) * 1.6;

        if (pointer.active) {
          const dx = f.x - pointer.x;
          const dy = f.y - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < 130 && d > 1) {
            const push = ((130 - d) / 130) * 185;
            dvx += (dx / d) * push;
            dvy += (dy / d) * push;
          }
        }

        f.vx += (dvx - f.vx) * Math.min(1, dt * 3.4);
        f.vy += (dvy - f.vy) * Math.min(1, dt * 3.4);
        f.x += f.vx * dt;
        f.y += f.vy * dt;

        const heading = Math.atan2(f.vy, f.vx);
        const tailWag = Math.sin(time * 9.5 + f.phase) * 3.2 * f.scale;
        const len = 11 * f.scale;
        const wid = 4.2 * f.scale;

        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(heading);
        ctx.fillStyle = f.tint;
        ctx.beginPath();
        ctx.moveTo(len, 0);
        ctx.quadraticCurveTo(len * 0.1, -wid, -len * 0.75, 0);
        ctx.lineTo(-len * 1.25, -wid * 0.9 + tailWag);
        ctx.lineTo(-len * 1.25, wid * 0.9 + tailWag);
        ctx.lineTo(-len * 0.75, 0);
        ctx.quadraticCurveTo(len * 0.1, wid, len, 0);
        ctx.fill();
        ctx.restore();
      }
    }

    function step(dt) {
      time += dt;
      ctx.clearRect(0, 0, width, height);

      if (hasKelp) drawKelp();

      // Drifting bioluminescent plankton motes
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        m.y -= m.speed * 0.016;
        m.x += Math.sin(time * 0.7 + m.phase) * 0.22;
        if (m.y < -6) { m.y = height + 6; m.x = Math.random() * width; }
        const a = 0.16 + 0.18 * Math.sin(time * 1.8 + m.phase);
        ctx.fillStyle = `rgba(142, 229, 245, ${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(m.x % width, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (prefersReducedMotion) return;

      stepAndDrawManta(dt);
      stepAndDrawFish(dt);

      for (let i = 0; i < jellies.length; i++) {
        stepJelly(jellies[i], dt);
        drawJelly(jellies[i]);
      }
    }

    const visObserver = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
    }, { threshold: 0.02 });
    visObserver.observe(container);

    window.addEventListener('resize', resize);
    resize();

    let lastTime = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      if (visible) {
        step(dt);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  initJellyfishField('site-footer', 'footer-jellyfish-canvas', FOOTER_JELLY_SPECS, {
    moteCount: 24,
    hasKelp: true
  });
  initJellyfishField('book', 'book-jellyfish-canvas', BOOK_JELLY_SPECS, {
    moteCount: 16,
    fishCount: 16,
    hasManta: true,
    hasKelp: true
  });
})();
