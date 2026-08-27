/* =====================================================================
   PUBLIC SITE RENDERER — read-only. Fetches published content from
   Supabase and renders it into the DOM. No editing, no uploads.
   ===================================================================== */
(function () {
  const sb = window.sb;
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => (s == null ? '' : String(s).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])));

  const CAT_LABELS = { all: "All", environment: "Environment", health: "Health & Welfare", civic: "Civic Engagement", camp: "Camp Life" };

  async function safeSelect(table, opts = {}) {
    try {
      let q = sb.from(table).select(opts.select || '*');
      if (opts.order) q = q.order(opts.order, { ascending: opts.ascending !== false });
      if (opts.single) q = q.maybeSingle();
      const { data, error } = await q;
      if (error) { console.warn(`[${table}]`, error.message); return opts.single ? null : []; }
      return data;
    } catch (e) {
      console.warn(`[${table}] fetch failed`, e);
      return opts.single ? null : [];
    }
  }

  function publicUrlFor(path) {
    // If it's already an absolute URL (http/https) or a relative repo asset, use as-is.
    if (!path) return null;
    if (/^https?:\/\//i.test(path) || path.startsWith('assets/')) return path;
    // Otherwise treat as a Supabase Storage path inside the portfolio-media bucket.
    try {
      const { data } = sb.storage.from(window.SUPABASE_CONFIG.storageBucket).getPublicUrl(path);
      return data ? data.publicUrl : path;
    } catch { return path; }
  }

  /* ---------------- APPEARANCE ---------------- */
  async function applyAppearance() {
    const a = await safeSelect('appearance', { single: true });
    if (!a) return;
    const root = document.documentElement;
    if (a.primary_color) root.style.setProperty('--blue', a.primary_color);
    if (a.accent_color) root.style.setProperty('--amber', a.accent_color);
    if (a.background_color) root.style.setProperty('--bg', a.background_color);
    if (a.text_color) root.style.setProperty('--ink', a.text_color);
    if (a.card_color) root.style.setProperty('--card', a.card_color);
    if (a.border_radius) root.style.setProperty('--radius', a.border_radius);
    if (a.font_heading) root.style.setProperty('--font-heading', `'${a.font_heading}',serif`);
    if (a.font_body) root.style.setProperty('--font-body', `'${a.font_body}',sans-serif`);
    if (a.button_style === 'rounded') root.style.setProperty('--btn-radius', '10px');
    if (a.button_style === 'square') root.style.setProperty('--btn-radius', '4px');
    if (a.section_spacing === 'compact') root.style.setProperty('--section-py', '70px');
    if (a.section_spacing === 'spacious') root.style.setProperty('--section-py', '150px');
    if (a.theme_mode === 'dark') root.classList.add('dark');
  }

  /* ---------------- SITE SETTINGS / SEO ---------------- */
  async function renderSiteSettings() {
    const s = await safeSelect('site_settings', { single: true });
    if (!s) return;
    if (s.seo_title) { document.title = s.seo_title; document.getElementById('ogTitle').setAttribute('content', s.seo_title); }
    if (s.seo_description) { document.getElementById('metaDesc').setAttribute('content', s.seo_description); document.getElementById('ogDesc').setAttribute('content', s.seo_description); }
    if (s.og_image_url) document.getElementById('ogImage').setAttribute('content', publicUrlFor(s.og_image_url));
    if (s.footer_quote) document.getElementById('footerQuote').textContent = `"${s.footer_quote}"`;
  }

  /* ---------------- HERO ---------------- */
  async function renderHero() {
    const h = await safeSelect('hero', { single: true });
    if (!h) return;
    if (h.eyebrow) document.getElementById('heroEyebrow').textContent = h.eyebrow;
    if (h.headline) document.getElementById('heroHeadline').textContent = h.headline;
    if (h.subtitle) document.getElementById('heroSubtitle').textContent = h.subtitle;
    if (h.cta_primary_label) document.getElementById('heroCta').textContent = h.cta_primary_label;
    if (h.cta_primary_link) document.getElementById('heroCta').setAttribute('href', h.cta_primary_link);

    const tagsWrap = document.getElementById('heroTags');
    [h.tag1, h.tag2, h.tag3].filter(Boolean).forEach(t => tagsWrap.appendChild(el(`<span class="tag">${esc(t)}</span>`)));

    const frame = document.getElementById('heroPhotoFrame');
    if (h.photo_url) {
      frame.innerHTML = `<img src="${publicUrlFor(h.photo_url)}" alt="Manthan Khairnar">`;
    }

    window.__resumeUrl = h.resume_url ? publicUrlFor(h.resume_url) : null;
    document.querySelectorAll('#resumeBtnNav, #resumeBtnHero').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.__resumeUrl) window.open(window.__resumeUrl, '_blank', 'noopener');
        else showToast('Resume not uploaded yet.');
      });
    });
  }

  /* ---------------- ABOUT ---------------- */
  async function renderAbout() {
    const a = await safeSelect('about', { single: true });
    if (!a) return;
    if (a.badge_text) document.getElementById('aboutBadge').textContent = a.badge_text;
    document.getElementById('aboutBody').innerHTML = a.body_html || '<p class="empty-note">About text not added yet.</p>';
    const facts = [
      [a.fact1_title, a.fact1_sub], [a.fact2_title, a.fact2_sub],
      [a.fact3_title, a.fact3_sub], [a.fact4_title, a.fact4_sub]
    ].filter(f => f[0]);
    const wrap = document.getElementById('aboutFacts');
    facts.forEach(f => wrap.appendChild(el(`<div class="fact"><div class="n">${esc(f[0])}</div><div class="l">${esc(f[1] || '')}</div></div>`)));

    const h = await safeSelect('hero', { single: true });
    const videoBox = document.getElementById('videoBox');
    if (h && h.intro_video_url) {
      videoBox.innerHTML = `<video src="${publicUrlFor(h.intro_video_url)}" controls playsinline></video>`;
    }
  }

  /* ---------------- IMPACT STATS ---------------- */
  async function renderImpact() {
    const rows = await safeSelect('impact_stats', { order: 'sort_order' });
    const grid = document.getElementById('impactGrid');
    if (!rows.length) { document.querySelector('.impact-strip').style.display = 'none'; return; }
    rows.forEach(r => {
      grid.appendChild(el(`
        <div class="impact-item reveal in">
          <div class="num"><span class="counter" data-target="${r.value}">0</span><span class="plus">+</span></div>
          <div class="lab">${esc(r.label)}</div>
        </div>`));
    });
    animateCounters();
  }

  /* ---------------- JOURNEY (LEDGER) ---------------- */
    let JOURNEY_CACHE = [];
  let ACTIVE_ROLE = null;
  async function renderLedger(filter) {
    const ledgerList = document.getElementById('ledgerList');
    ledgerList.innerHTML = '';
    const items = JOURNEY_CACHE.filter(i =>
      (ACTIVE_ROLE == null || (i.role_group || 'NSS VIIT — Secretary') === ACTIVE_ROLE) &&
      (filter === 'all' || i.category === filter)
    );
    if (!items.length) { ledgerList.appendChild(el(`<p class="empty-note">No entries yet in this category.</p>`)); return; }
    items.forEach(item => {
      const card = el(`
        <div class="ledger-item reveal in">
          <div class="ledger-card">
            <div class="ledger-top">
              <div>
                <div class="ledger-date">${esc(item.entry_date)}</div>
                <div class="ledger-title">${esc(item.title)}</div>
                <div class="ledger-meta"><span>${esc(item.venue || '')}</span><span>·</span><span>${esc(item.participants || '')}</span></div>
              </div>
              <div style="display:flex; align-items:center; gap:10px;">
                <span class="ledger-badge">${esc(item.badge || '')}</span>
                <span class="ledger-caret">▾</span>
              </div>
            </div>
            <div class="ledger-detail"><div class="ledger-detail-inner">
              <div class="field-label">What happened</div><p>${esc(item.description || '')}</p>
              <div class="field-label">Personal learning</div><p>${esc(item.learning || '')}</p>
            </div></div>
          </div>
        </div>`);
      card.querySelector('.ledger-card').addEventListener('click', function () { this.classList.toggle('open'); });
      ledgerList.appendChild(card);
    });
  }
  async function initJourney() {
    JOURNEY_CACHE = await safeSelect('journey', { order: 'sort_order' });
    const roles = [...new Set(JOURNEY_CACHE.map(i => i.role_group || 'NSS VIIT — Secretary'))];
    ACTIVE_ROLE = roles[0] || null;
    const tabsWrap = document.getElementById('journeyRoleTabs');
    tabsWrap.innerHTML = '';
    roles.forEach((r, i) => {
      const tab = el(`<div class="camp-tab ${i === 0 ? 'active' : ''}">${esc(r)}</div>`);
      tab.addEventListener('click', () => {
        ACTIVE_ROLE = r;
        tabsWrap.querySelectorAll('.camp-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const activeChip = document.querySelector('#timelineFilters .filter-chip.active');
        renderLedger(activeChip ? activeChip.dataset.filter : 'all');
      });
      tabsWrap.appendChild(tab);
    });
    renderLedger('all');
    document.getElementById('timelineFilters').addEventListener('click', e => {
      const chip = e.target.closest('.filter-chip'); if (!chip) return;
      document.querySelectorAll('#timelineFilters .filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderLedger(chip.dataset.filter);
    });
  }
   
  /* ---------------- CAMP DAYS ---------------- */
  async function renderCamp() {
    const days = await safeSelect('camp_days', { order: 'sort_order' });
    const section = document.getElementById('campSection');
    if (!days.length) { section.style.display = 'none'; return; }
    const tabs = document.getElementById('campTabs'), bodies = document.getElementById('campBodies');
    days.forEach((d, i) => {
      tabs.appendChild(el(`<div class="camp-tab ${i === 0 ? 'active' : ''}" data-i="${i}">${esc(d.day_label)}</div>`));
      bodies.appendChild(el(`<div class="camp-body ${i === 0 ? 'active' : ''}" data-i="${i}"><h4>${esc(d.title || '')}</h4><p>${esc(d.description || '')}</p></div>`));
    });
    tabs.addEventListener('click', e => {
      const tab = e.target.closest('.camp-tab'); if (!tab) return;
      document.querySelectorAll('.camp-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.camp-body').forEach(b => b.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector(`.camp-body[data-i="${tab.dataset.i}"]`).classList.add('active');
    });
  }

     /* ---------------- EDUCATION ---------------- */
  async function renderEducation() {
    const rows = await safeSelect('education', { order: 'sort_order' });
    const grid = document.getElementById('eduGrid');
    if (!rows.length) { document.getElementById('education').style.display = 'none'; return; }
    rows.forEach(e => {
      grid.appendChild(el(`
        <div class="ach-card reveal in">
          <div class="t">${esc(e.degree)}</div>
          <div class="d">${esc(e.institution || '')}${e.location ? ' · ' + esc(e.location) : ''}</div>
          <div class="d">${esc(e.start_date || '')}${e.end_date ? ' – ' + esc(e.end_date) : ''}</div>
          ${e.description ? `<div class="d" style="margin-top:8px;">${esc(e.description)}</div>` : ''}
        </div>`));
    });
  }
   


  /* ---------------- PROJECTS ---------------- */
  async function renderProjects() {
    const rows = await safeSelect('projects', { order: 'sort_order' });
    const grid = document.getElementById('projGrid');
    if (!rows.length) { grid.appendChild(el(`<p class="empty-note">No projects added yet.</p>`)); return; }
    rows.forEach(p => {
      const fields = [
        ['Problem statement', p.problem], ['Objective', p.objective], ['Approach', p.approach],
        ['Technologies used', p.technologies], ['Outcome', p.outcome]
      ].filter(f => f[1]);
      const fieldsHtml = fields.length
        ? fields.map(f => `<div><div class="proj-field-label">${f[0]}</div><div class="proj-field-text">${esc(f[1])}</div></div>`).join('')
        : `<p class="empty-note">Details coming soon.</p>`;
      const links = [];
      if (p.project_link) links.push(`<a href="${esc(p.project_link)}" target="_blank" rel="noopener">Live link →</a>`);
      if (p.github_link) links.push(`<a href="${esc(p.github_link)}" target="_blank" rel="noopener">GitHub →</a>`);
      grid.appendChild(el(`
        <div class="proj-card reveal in">
          ${p.image_url ? `<img src="${publicUrlFor(p.image_url)}" alt="${esc(p.title)}" style="border-radius:10px; margin-bottom:14px; aspect-ratio:16/9; object-fit:cover;">` : ''}
          <div class="proj-tag">${esc(p.tag || '')}</div>
          <h3>${esc(p.title)}</h3>
          <div class="proj-fields">${fieldsHtml}</div>
          ${links.length ? `<div class="proj-links">${links.join('')}</div>` : ''}
        </div>`));
    });
  }

  /* ---------------- GALLERY ---------------- */
  let GALLERY_CACHE = [];
  function renderGallery(filter) {
    const grid = document.getElementById('masonryGrid');
    grid.innerHTML = '';
    const items = GALLERY_CACHE.filter(g => filter === 'all' || g.category === filter);
    items.forEach(g => {
      const src = publicUrlFor(g.image_url);
      const item = el(`<div class="masonry-item reveal in"><img loading="lazy" src="${src}" alt="${esc(g.caption)}"><div class="masonry-cap">${esc(g.caption)}</div></div>`);
      item.addEventListener('click', () => openLightbox(src, g.caption));
      grid.appendChild(item);
    });
  }
  async function initGallery() {
    GALLERY_CACHE = await safeSelect('gallery', { order: 'sort_order' });
    const cats = ['all', ...new Set(GALLERY_CACHE.map(g => g.category).filter(Boolean))];
    const filters = document.getElementById('galleryFilters');
    cats.forEach(c => filters.appendChild(el(`<div class="filter-chip ${c === 'all' ? 'active' : ''}" data-f="${c}">${CAT_LABELS[c] || c}</div>`)));
    renderGallery('all');
    filters.addEventListener('click', e => {
      const chip = e.target.closest('.filter-chip'); if (!chip) return;
      filters.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderGallery(chip.dataset.f);
    });
  }
  function openLightbox(src, cap) {
    document.getElementById('lightboxImg').src = src;
    document.getElementById('lightboxCap').textContent = cap || '';
    document.getElementById('lightbox').classList.add('open');
  }

  /* ---------------- SKILLS ---------------- */
  async function renderSkills() {
    const rows = await safeSelect('skills', { order: 'sort_order' });
    const groups = {};
    rows.forEach(r => { (groups[r.group_name] = groups[r.group_name] || []).push(r.skill_name); });
    const wrap = document.getElementById('skillsGroups');
    if (!Object.keys(groups).length) { wrap.appendChild(el(`<p class="empty-note">No skills added yet.</p>`)); return; }
    Object.entries(groups).forEach(([name, items]) => {
      wrap.appendChild(el(`
        <div class="skill-group reveal in">
          <h4><span class="dot"></span>${esc(name)}</h4>
          <div class="skill-pills">${items.map(i => `<span class="skill-pill">${esc(i)}</span>`).join('')}</div>
        </div>`));
    });
  }

  /* ---------------- CERTIFICATES ---------------- */
  async function renderCertificates() {
    const rows = await safeSelect('certificates', { order: 'sort_order' });
    const grid = document.getElementById('certGrid');
    if (!rows.length) { grid.appendChild(el(`<p class="empty-note">No certificates added yet.</p>`)); return; }
    rows.forEach(c => {
      const link = c.pdf_url || c.image_url;
      const imgHtml = c.image_url
        ? `<img src="${publicUrlFor(c.image_url)}" alt="${esc(c.title)}">`
        : `No image yet`;
      grid.appendChild(el(`
        <div class="cert-card reveal in">
          <div class="cert-img">${imgHtml}</div>
          <b>${esc(c.title)}</b>
          <span>Issued by: ${esc(c.issuer || '—')}${c.issue_date ? ' · ' + esc(c.issue_date) : ''}</span>
          ${link ? `<a class="cert-view" href="${publicUrlFor(link)}" target="_blank" rel="noopener">View full certificate →</a>` : ''}
        </div>`));
    });
  }

Commit both, hard-refresh, and each card should now show the certificate image filling most of the square, with the name and "Issued by" text underneath — matching your sketch.

One thing worth doing while you're in there: go to the admin dashboard → Certificates → make sure each entry actually has an image uploaded via the Image field (not just the PDF field) — otherwise you'll see the "No image yet" placeholder instead of the certificate itself.

Write a message…

  /* ---------------- ACHIEVEMENTS ---------------- */
  async function renderAchievements() {
    const rows = await safeSelect('achievements', { order: 'sort_order' });
    const grid = document.getElementById('achGrid');
    rows.forEach(a => grid.appendChild(el(`<div class="ach-card reveal in"><div class="n">${esc(a.stat_number || '')}</div><div class="t">${esc(a.title)}</div><div class="d">${esc(a.description || '')}</div></div>`)));
  }

  /* ---------------- BLOG ---------------- */
  async function renderBlog() {
    const rows = await safeSelect('blog', { order: 'sort_order' });
    const grid = document.getElementById('blogGrid');
    const section = document.getElementById('blogSection');
    if (!rows.length) { section.style.display = 'none'; return; }
    rows.forEach(b => {
      grid.appendChild(el(`
        <div class="blog-card reveal in">
          <div class="blog-thumb">${b.cover_image_url ? `<img src="${publicUrlFor(b.cover_image_url)}" alt="${esc(b.title)}">` : 'COMING SOON'}</div>
          <div class="blog-body">
            <div class="blog-cat">${esc(b.category || '')}</div>
            <h4>${esc(b.title)}</h4>
            <span>${esc(b.excerpt || '')}</span>
          </div>
        </div>`));
    });
  }

  /* ---------------- SOCIAL LINKS / CONTACT ---------------- */
  const ICONS = {
    linkedin: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/><path d="M10 21v-7a3 3 0 013-3v0a3 3 0 013 3v7M10 9v12"/></svg>`,
    github: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 00-1.3-3.2 4.2 4.2 0 00-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 00-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 00-.1 3.2A4.6 4.6 0 004 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/></svg>`,
    email: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 6 10-6"/></svg>`,
    instagram: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>`,
    default: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>`
  };
  async function renderContact() {
    const c = await safeSelect('contact', { single: true });
    const links = await safeSelect('social_links', { order: 'sort_order' });
    const list = document.getElementById('contactList');
    const footerLinks = document.getElementById('footerLinks');

    if (c && c.email) {
      list.appendChild(el(`<a href="mailto:${esc(c.email)}"><span class="ic">${ICONS.email}</span><div>Email<small>${esc(c.email)}</small></div></a>`));
    }
    links.forEach(l => {
      const href = l.platform === 'email' && c && c.email ? `mailto:${c.email}` : l.url;
      if (!href) return;
      list.appendChild(el(`<a href="${esc(href)}" target="_blank" rel="noopener"><span class="ic">${ICONS[l.platform] || ICONS.default}</span><div>${esc(l.label || l.platform)}<small>${esc(l.url)}</small></div></a>`));
      if (l.platform === 'linkedin') footerLinks.appendChild(el(`<a href="${esc(href)}" target="_blank" rel="noopener">NSS VIIT on LinkedIn</a>`));
    });
    list.appendChild(el(`<a id="resumeBtnContact" href="#"><span class="ic"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v13m0 0l-4-4m4 4l4-4M5 21h14"/></svg></span><div>Resume<small>View the latest PDF</small></div></a>`));
    document.getElementById('resumeBtnContact').addEventListener('click', e => {
      e.preventDefault();
      if (window.__resumeUrl) window.open(window.__resumeUrl, '_blank', 'noopener');
      else showToast('Resume not uploaded yet.');
    });

    const recipient = (c && c.form_recipient_email) || (c && c.email) || '';
    document.getElementById('contactForm').addEventListener('submit', e => {
      e.preventDefault();
      const f = e.target;
      const subject = encodeURIComponent(`Portfolio message from ${f.name.value}`);
      const body = encodeURIComponent(`${f.message.value}\n\n— ${f.name.value} (${f.email.value})`);
      if (recipient) {
        window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
        showToast('Opening your email client…');
      } else {
        showToast('Contact email not configured yet.');
      }
    });
  }

  /* ---------------- SHARED UI ---------------- */
  let toastTimer;
  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
  }

  function animateCounters() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const node = entry.target, target = parseInt(node.dataset.target, 10) || 0;
          let cur = 0; const step = Math.max(1, Math.round(target / 60));
          const t = setInterval(() => { cur += step; if (cur >= target) { cur = target; clearInterval(t); } node.textContent = cur.toLocaleString(); }, 20);
          io.unobserve(node);
        }
      });
    }, { threshold: .4 });
    document.querySelectorAll('.counter').forEach(c => io.observe(c));
  }

  function initChrome() {
    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 10));
    document.getElementById('themeBtn').addEventListener('click', () => document.documentElement.classList.toggle('dark'));
    const navToggle = document.getElementById('navToggle'), navLinks = document.getElementById('navLinks');
    navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
    document.getElementById('lightboxClose').addEventListener('click', () => document.getElementById('lightbox').classList.remove('open'));
    document.getElementById('lightbox').addEventListener('click', e => { if (e.target.id === 'lightbox') e.currentTarget.classList.remove('open'); });

    const io = new IntersectionObserver((entries) => { entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .12 });
    const reobserve = () => document.querySelectorAll('.reveal:not(.in)').forEach(elm => io.observe(elm));
    setInterval(reobserve, 800); // re-observes newly rendered async sections

    // ambient hero canvas
    const canvas = document.getElementById('heroCanvas'); const ctx = canvas.getContext('2d');
    let nodes = [];
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function sizeCanvas() {
      canvas.width = canvas.parentElement.offsetWidth; canvas.height = canvas.parentElement.offsetHeight;
      const count = Math.min(46, Math.floor(canvas.width / 34));
      nodes = Array.from({ length: count }, () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35 }));
    }
    function draw() {
      if (reduceMotion) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--blue').trim() || '#2246E8';
      nodes.forEach(n => { n.x += n.vx; n.y += n.vy; if (n.x < 0 || n.x > canvas.width) n.vx *= -1; if (n.y < 0 || n.y > canvas.height) n.vy *= -1; });
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) { ctx.strokeStyle = accent; ctx.globalAlpha = (1 - dist / 130) * .22; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke(); }
      }
      ctx.globalAlpha = .55; nodes.forEach(n => { ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2); ctx.fill(); }); ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }
    window.addEventListener('resize', sizeCanvas); sizeCanvas(); if (!reduceMotion) requestAnimationFrame(draw);
  }

  /* ---------------- BOOT ---------------- */
  async function boot() {
    if (!window.sb) { console.error('Supabase client not initialized — check config.js'); return; }
    initChrome();
    await applyAppearance();
    await Promise.all([
      renderSiteSettings(), renderHero(), renderAbout(), renderImpact(),
      initJourney(), renderCamp(), renderProjects(),
      initGallery(), renderSkills(), renderCertificates(), renderAchievements(),
      renderBlog(), renderContact(), renderEducation(),
    ]);
  }
  document.addEventListener('DOMContentLoaded', boot);
})();
