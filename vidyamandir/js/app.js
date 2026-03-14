/* ══ VIDYA MANDIR v2 — Core ══ */
const App = {
  _data: null,

  async loadData() {
    if (this._data) return this._data;
    const r = await fetch('data/subjects.json');
    this._data = await r.json();
    this._mergeAdminData();
    return this._data;
  },

  /* Admin can override/extend EVERY built-in chapter */
  _mergeAdminData() {
    const ov = JSON.parse(localStorage.getItem('vm_overrides') || '{}');
    // ov[sid::cid] = { videoId, lessons, extraNotes, extraTopics, extraQuiz }
    if (!this._data) return;
    this._data.subjects.forEach(s => {
      s.chapters.forEach(ch => {
        const key = `${s.id}::${ch.id}`;
        const o = ov[key];
        if (!o) return;
        // Override video/lesson fields
        if (o.videoId && ch.lessons?.length) ch.lessons[0].videoId = o.videoId;
        if (o.lesson0Title && ch.lessons?.length) ch.lessons[0].title = o.lesson0Title;
        if (o.lesson0Dur && ch.lessons?.length) ch.lessons[0].duration = o.lesson0Dur;
        // Extra notes injected at top
        if (o.adminNote) ch._adminNote = o.adminNote;
        // Extra NCERT topics merged
        if (o.extraTopics?.length) ch.ncertTopics = [...(ch.ncertTopics || []), ...o.extraTopics];
        // Extra quiz questions merged
        if (o.extraQuiz?.length) ch.quiz = [...(ch.quiz || []), ...o.extraQuiz];
      });
    });
  },

  /* Save admin override for a built-in chapter */
  saveOverride(sid, cid, patch) {
    const ov = JSON.parse(localStorage.getItem('vm_overrides') || '{}');
    const key = `${sid}::${cid}`;
    ov[key] = { ...(ov[key] || {}), ...patch };
    localStorage.setItem('vm_overrides', JSON.stringify(ov));
    // Reset loaded data so next load picks up changes
    this._data = null;
  },

  getOverride(sid, cid) {
    const ov = JSON.parse(localStorage.getItem('vm_overrides') || '{}');
    return ov[`${sid}::${cid}`] || {};
  },

  getSubject(id) { return (this._data?.subjects || []).find(s => s.id === id) || null },
  getChapter(sid, cid) { return (this.getSubject(sid)?.chapters || []).find(c => c.id === cid) || null },
  getParam(k) { return new URLSearchParams(location.search).get(k) },

  /* Progress */
  getProgress() { return JSON.parse(localStorage.getItem('vm_prog') || '{}') },
  saveProgress(p) { localStorage.setItem('vm_prog', JSON.stringify(p)) },
  markDone(sid, cid) {
    const p = this.getProgress();
    if (!p[sid]) p[sid] = { done: [], scores: {}, last: null };
    if (!p[sid].done.includes(cid)) p[sid].done.push(cid);
    this.saveProgress(p); this.updateStreak();
  },
  saveScore(sid, cid, score, total) {
    const p = this.getProgress();
    if (!p[sid]) p[sid] = { done: [], scores: {}, last: null };
    p[sid].scores[cid] = { score, total, pct: Math.round(score / total * 100), ts: Date.now() };
    this.saveProgress(p);
  },
  setLast(sid, cid, title) {
    const p = this.getProgress();
    if (!p[sid]) p[sid] = { done: [], scores: {}, last: null };
    p[sid].last = { cid, title, ts: Date.now() };
    this.saveProgress(p);
  },
  getSubjPct(sid, subj) {
    const p = this.getProgress()[sid] || {};
    return subj.chapters.length ? Math.round(((p.done || []).length / subj.chapters.length) * 100) : 0;
  },
  updateStreak() {
    const today = new Date().toDateString();
    const last = localStorage.getItem('vm_sdate');
    let s = parseInt(localStorage.getItem('vm_streak') || '0');
    if (last !== today) {
      s = (last === new Date(Date.now() - 86400000).toDateString()) ? s + 1 : 1;
      localStorage.setItem('vm_streak', s);
      localStorage.setItem('vm_sdate', today);
    }
  },

  /* Theme mode */
  applyMode() {
    document.documentElement.setAttribute('data-theme', localStorage.getItem('vm_mode') || 'dark');
  },
  setMode(m) {
    document.documentElement.setAttribute('data-theme', m);
    localStorage.setItem('vm_mode', m);
    document.querySelectorAll('.mt-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
    const btn = document.getElementById('modeBtn');
    if (btn) { btn.textContent = m === 'dark' ? '☀️' : '🌙'; }
  },
  toggleMode() { this.setMode((localStorage.getItem('vm_mode') || 'dark') === 'dark' ? 'light' : 'dark'); },

  /* Navbar */
  navbarHTML() {
    const siteName = localStorage.getItem('vm_site_name') || 'Vidya Mandir';
    return `<nav class="navbar" id="mainNav">
      <button class="mob-burger" onclick="App.toggleSidebar()">☰</button>
      <a href="index.html" class="nav-brand">
        <div class="nav-gem">🪷</div>
        <div class="nav-wordmark">
          <span class="nav-title">${siteName}</span>
          <span class="nav-subtitle">Class 10 · NCERT · CBSE</span>
        </div>
      </a>
      <div class="nav-search-wrap">
        <span class="search-ico">⌕</span>
        <input type="text" id="searchInput" placeholder="Search chapters, topics, subjects…"
          oninput="App.doSearch(this.value)" onfocus="App.showSearch()" onblur="setTimeout(()=>App.hideSearch(),180)">
        <div class="search-results" id="searchDrop"></div>
      </div>
      <div class="nav-actions">
        <button class="nav-ic" onclick="TodoPanel.toggle()" title="My Tasks" id="todoNavBtn">
          ✓<div class="notif-dot" id="todoNDot"></div>
        </button>
        <button class="nav-ic" onclick="ThemeEngine.toggle()" title="Customise">🎨</button>
        <button class="nav-ic" id="modeBtn" onclick="App.toggleMode()" title="Toggle mode">☀️</button>
        <div class="user-pill">
          <div class="user-av">छ</div>
          <span class="user-nm">Chhatra</span>
        </div>
      </div>
    </nav>`;
  },

  /* Sidebar */
  sidebarHTML(active) {
    const p = this.getProgress();
    const subs = [
      { id: 'mathematics',   name: 'Ganit', icon: '📐' },
      { id: 'science',       name: 'Vigyan', icon: '🔬' },
      { id: 'social-science',name: 'Samaj Vigyan', icon: '🌍' },
      { id: 'english',       name: 'Angrezi', icon: '📚' },
    ];
    return `<aside class="sidebar" id="sidebar">
      <span class="sb-section-label">Navigate</span>
      <a href="dashboard.html" class="sb-link ${active === 'dashboard' ? 'active' : ''}"><div class="sb-icon">🏛️</div>Dashboard</a>
      <a href="todo.html" class="sb-link ${active === 'todo' ? 'active' : ''}"><div class="sb-icon">✅</div>My Tasks</a>
      <div class="sb-rule"></div>
      <span class="sb-section-label">Subjects</span>
      ${subs.map(s => {
        const done = (p[s.id]?.done || []).length;
        return `<a href="subject.html?id=${s.id}" class="sb-link ${active === s.id ? 'active' : ''}">
          <div class="sb-icon">${s.icon}</div>${s.name}
          ${done > 0 ? `<span class="sb-count">${done}</span>` : ''}
        </a>`;
      }).join('')}
      <div class="sb-rule"></div>
      <a href="admin.html" class="sb-link ${active === 'admin' ? 'active' : ''}" style="opacity:.5;font-size:.78rem"><div class="sb-icon" style="font-size:12px">⚙️</div>Admin</a>
    </aside>`;
  },

  /* Theme panel */
  themeHTML() {
    return `<div class="slide-panel" id="themePanel">
      <div class="sp-head">
        <h3>🎨 Colours & Theme</h3>
        <button class="btn btn-ghost btn-sm" onclick="ThemeEngine.toggle()">✕</button>
      </div>
      <span class="sp-label">Display Mode</span>
      <div class="mode-toggle" style="margin-bottom:16px">
        <div class="mt-btn active" data-mode="dark" onclick="App.setMode('dark')">🌙 Dark</div>
        <div class="mt-btn" data-mode="light" onclick="App.setMode('light')">☀️ Light</div>
      </div>
      <span class="sp-label">Extract from Photo</span>
      <div class="upload-drop" onclick="document.getElementById('themeFileInp').click()">
        <input type="file" id="themeFileInp" accept="image/*" style="display:none" onchange="ThemeEngine.handleUpload(event)">
        <div style="font-size:28px;margin-bottom:6px">🖼️</div>
        <p style="font-size:.83rem;color:var(--t2);font-weight:600;margin-bottom:2px">Upload any image</p>
        <span style="font-size:.73rem;color:var(--t3)">Colours auto-extracted</span>
      </div>
      <div id="themePreviewWrap" style="display:none;margin-bottom:14px">
        <img id="themePreviewImg" src="" alt="" style="width:100%;height:80px;object-fit:cover;border-radius:8px;margin-bottom:8px">
        <div class="swatches-row" id="swatchRow"></div>
        <button class="btn btn-saffron" style="width:100%;margin-bottom:6px" onclick="ThemeEngine.applyExtracted()">✨ Apply These Colours</button>
        <button class="btn btn-ghost" style="width:100%" onclick="ThemeEngine.reset()">↺ Reset to Default</button>
      </div>
      <span class="sp-label">Preset Themes</span>
      <div class="presets-grid">
        ${[
          { name:'Rajasthani', c:['#C8822A','#B05838','#5A7A52'] },
          { name:'Mughal Blue', c:['#4A5E82','#9A6218','#B05838'] },
          { name:'Meenakari',  c:['#B05838','#5A7A52','#4A5E82'] },
          { name:'Peacock',    c:['#5A7A52','#4A5E82','#C8822A'] },
          { name:'Deep Temple',c:['#E0B040','#9A6218','#7A3040'] },
          { name:'Lotus Dusk', c:['#CC8060','#B05838','#5A7A52'] },
        ].map(t => `<div class="preset-tile" onclick="ThemeEngine.applyPreset('${t.name}',${JSON.stringify(t.c)})">
          <div class="preset-dots">${t.c.map(c => `<div class="p-dot" style="background:${c}"></div>`).join('')}</div>
          <div class="preset-name">${t.name}</div>
        </div>`).join('')}
      </div>
    </div>
    <div class="backdrop" id="themeBack" onclick="ThemeEngine.toggle()"></div>`;
  },

  /* Todo slide panel */
  todoPanelHTML() {
    return `<div class="slide-panel" id="todoPanel">
      <div class="sp-head">
        <h3>📋 मेरे कार्य</h3>
        <button class="btn btn-ghost btn-sm" onclick="TodoPanel.toggle()">✕</button>
      </div>
      <div id="todoPanelBody"></div>
    </div>
    <div class="backdrop" id="todoBack" onclick="TodoPanel.toggle()"></div>`;
  },

  /* Search */
  async doSearch(q) {
    const drop = document.getElementById('searchDrop');
    if (!drop) return;
    if (!q.trim()) { drop.classList.remove('open'); return; }
    const data = await this.loadData();
    const lq = q.toLowerCase();
    const res = [];
    data.subjects.forEach(s => {
      if (s.name.toLowerCase().includes(lq))
        res.push({ icon: s.icon, title: s.name, sub: `${s.chapters.length} chapters`, url: `subject.html?id=${s.id}` });
      s.chapters.forEach(ch => {
        if (ch.title.toLowerCase().includes(lq))
          res.push({ icon: '📄', title: ch.title, sub: s.name, url: `chapter.html?subject=${s.id}&chapter=${ch.id}` });
        (ch.ncertTopics || []).forEach(t => {
          if (t.text.toLowerCase().includes(lq))
            res.push({ icon: '⭐', title: t.text.slice(0, 55), sub: `${s.name} › ${ch.title}`, url: `chapter.html?subject=${s.id}&chapter=${ch.id}` });
        });
      });
    });
    drop.innerHTML = res.length
      ? res.slice(0, 9).map(r => `<div class="sr-item" onclick="location.href='${r.url}'">
          <div class="sr-icon">${r.icon}</div>
          <div><div class="sr-title">${r.title}</div><div class="sr-sub">${r.sub}</div></div>
        </div>`).join('')
      : `<div class="sr-item"><div class="sr-sub">No results for "${q}"</div></div>`;
    drop.classList.add('open');
  },
  showSearch() { const v = document.getElementById('searchInput')?.value; if (v) this.doSearch(v); },
  hideSearch() { document.getElementById('searchDrop')?.classList.remove('open'); },
  toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('open');
    document.getElementById('sbBack')?.classList.toggle('on');
  },
  toast(msg, ico = '✅') {
    let t = document.getElementById('appToast');
    if (!t) { t = document.createElement('div'); t.id = 'appToast'; t.className = 'toast'; document.body.appendChild(t); }
    t.innerHTML = `<span>${ico}</span> ${msg}`;
    t.classList.add('show');
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove('show'), 3000);
  },
  initPage(active) {
    this.applyMode();
    const nb = document.getElementById('nb');
    const sb = document.getElementById('sb');
    if (nb) nb.innerHTML = this.navbarHTML();
    if (sb) sb.innerHTML = this.sidebarHTML(active);
    document.body.insertAdjacentHTML('beforeend', this.themeHTML());
    document.body.insertAdjacentHTML('beforeend', this.todoPanelHTML());
    document.body.insertAdjacentHTML('beforeend', `<div class="backdrop" id="sbBack" onclick="App.toggleSidebar()"></div>`);
    ThemeEngine.init();
    TodoPanel.init();
    const m = localStorage.getItem('vm_mode') || 'dark';
    const btn = document.getElementById('modeBtn');
    if (btn) btn.textContent = m === 'dark' ? '☀️' : '🌙';
    document.querySelectorAll('.mt-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  }
};
