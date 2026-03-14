/* ══ ADMIN ENGINE v2 — Full Control ══ */
const Admin = {
  PASS: '6610',

  init() {
    if (localStorage.getItem('vm_admin') === '1') this._show();
    else this._showLogin();
  },
  _showLogin() {
    document.getElementById('loginWall').style.display = 'flex';
    document.getElementById('adminBody').style.display = 'none';
  },
  _show() {
    document.getElementById('loginWall').style.display = 'none';
    document.getElementById('adminBody').style.display = 'block';
    this.refresh();
  },
  tryLogin() {
    const val = document.getElementById('adminPass')?.value;
    if (val === this.PASS) { localStorage.setItem('vm_admin', '1'); this._show(); }
    else { document.getElementById('loginErr')?.classList.add('show'); }
  },
  logout() { localStorage.removeItem('vm_admin'); location.reload(); },

  /* ── Data store ── */
  getData() {
    return JSON.parse(localStorage.getItem('vm_admin_data') || JSON.stringify({
      subjects: [], chapters: [], quiz: [], pdfs: [], ncertTopics: [], announcements: []
    }));
  },
  saveData(d) { localStorage.setItem('vm_admin_data', JSON.stringify(d)); },

  switchSection(id) {
    document.querySelectorAll('.a-panel').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.an-link').forEach(l => l.classList.remove('active'));
    document.getElementById('ap-' + id)?.classList.add('active');
    document.getElementById('al-' + id)?.classList.add('active');
    this.refresh();
  },

  refresh() {
    this._renderStats();
    this._renderBuiltinEditTable();
    this._renderSubjTable();
    this._renderChTable();
    this._renderPDFTable();
    this._renderNCERTTable();
    this._renderQuizTable();
    this._renderAnnounceTable();
    this._renderProgressTable();
    this._renderTodosTable();
    this._renderSettingsInfo();
  },

  _renderStats() {
    const d = this.getData();
    const p = App.getProgress();
    let done = 0; Object.values(p).forEach(s => done += (s.done || []).length);
    const el = document.getElementById('admin-stats');
    if (!el) return;
    el.innerHTML = `
      <div class="stat-tile"><div class="stat-icon">📚</div><div><div class="stat-num">${4 + d.subjects.length}</div><div class="stat-label">Subjects</div></div></div>
      <div class="stat-tile"><div class="stat-icon">📁</div><div><div class="stat-num">${d.pdfs.length}</div><div class="stat-label">PDFs</div></div></div>
      <div class="stat-tile"><div class="stat-icon">⭐</div><div><div class="stat-num">${d.ncertTopics.length}</div><div class="stat-label">NCERT Topics</div></div></div>
      <div class="stat-tile"><div class="stat-icon">📢</div><div><div class="stat-num">${d.announcements.length}</div><div class="stat-label">Announcements</div></div></div>`;
  },

  /* ── Built-in Chapter Editor (THE KEY FIX) ── */
  _renderBuiltinEditTable() {
    const el = document.getElementById('builtin-tbody'); if (!el) return;
    const BUILTIN = [
      { sid: 'mathematics', chapters: ['real-numbers','polynomials','linear-equations','triangles','trigonometry'] },
      { sid: 'science', chapters: ['chemical-reactions','acids-bases','life-processes','metals-nonmetals','carbon-compounds'] },
      { sid: 'social-science', chapters: ['nationalism-europe','resources-development','power-sharing','development'] },
      { sid: 'english', chapters: ['a-letter-to-god','nelson-mandela','grammar-writing','his-first-flight'] },
    ];
    const names = {
      'real-numbers': 'Real Numbers', 'polynomials': 'Polynomials', 'linear-equations': 'Pair of Linear Equations',
      'triangles': 'Triangles', 'trigonometry': 'Trigonometry', 'chemical-reactions': 'Chemical Reactions',
      'acids-bases': 'Acids, Bases & Salts', 'life-processes': 'Life Processes', 'metals-nonmetals': 'Metals & Non-metals',
      'carbon-compounds': 'Carbon Compounds', 'nationalism-europe': 'Nationalism in Europe',
      'resources-development': 'Resources & Development', 'power-sharing': 'Power Sharing',
      'development': 'Development', 'a-letter-to-god': 'A Letter to God', 'nelson-mandela': 'Nelson Mandela',
      'grammar-writing': 'Grammar & Writing', 'his-first-flight': 'His First Flight',
    };
    let html = '';
    BUILTIN.forEach(({ sid, chapters }) => {
      chapters.forEach(cid => {
        const ov = App.getOverride(sid, cid);
        html += `<tr>
          <td><strong>${names[cid] || cid}</strong><br><span style="font-size:.69rem;color:var(--t3)">${sid}</span></td>
          <td>
            <input class="fc" style="font-size:.8rem;margin-bottom:4px" placeholder="YouTube Video ID"
              value="${ov.videoId || ''}" onchange="Admin.saveBuiltinField('${sid}','${cid}','videoId',this.value)">
            <input class="fc" style="font-size:.8rem" placeholder="Lesson title (optional)"
              value="${ov.lesson0Title || ''}" onchange="Admin.saveBuiltinField('${sid}','${cid}','lesson0Title',this.value)">
          </td>
          <td>
            <textarea class="fc fc-ta" style="font-size:.79rem;min-height:55px" placeholder="Admin note added to top of notes…"
              onchange="Admin.saveBuiltinField('${sid}','${cid}','adminNote',this.value)">${ov.adminNote || ''}</textarea>
          </td>
          <td>
            <a href="chapter.html?subject=${sid}&chapter=${cid}" target="_blank" class="btn btn-ghost btn-sm">View →</a>
          </td>
        </tr>`;
      });
    });
    el.innerHTML = html || '<tr><td colspan="4" style="text-align:center;color:var(--t3)">No built-in chapters</td></tr>';
  },

  saveBuiltinField(sid, cid, field, value) {
    App.saveOverride(sid, cid, { [field]: value });
    App.toast(`Saved! Changes will appear in chapter view. 💾`);
  },

  /* ── Subjects ── */
  _renderSubjTable() {
    const d = this.getData(); const el = document.getElementById('subj-tbody'); if (!el) return;
    const builtin = [['Mathematics','📐','mathematics'],['Science','🔬','science'],['Social Science','🌍','social-science'],['English','📚','english']];
    el.innerHTML = builtin.map(([n,i,id]) => `<tr><td>${i} <strong>${n}</strong></td><td><span class="tag tag-saffron">Built-in</span></td><td><a href="subject.html?id=${id}" class="btn btn-ghost btn-sm">View →</a></td></tr>`).join('')
      + d.subjects.map((s, i) => `<tr><td>${s.icon||'📖'} <strong>${s.name}</strong></td><td><span class="tag tag-indigo">Custom</span></td><td><button class="btn btn-danger btn-sm" onclick="Admin._delSubj(${i})">Delete</button></td></tr>`).join('');
  },
  addSubject() {
    const name = document.getElementById('ns-name')?.value.trim();
    const icon = document.getElementById('ns-icon')?.value.trim() || '📖';
    const desc = document.getElementById('ns-desc')?.value.trim();
    if (!name) { App.toast('Name required', '⚠️'); return; }
    const d = this.getData(); d.subjects.push({ name, icon, desc, date: Date.now() }); this.saveData(d);
    App.toast(`"${name}" added! ✅`); document.getElementById('ns-name').value = ''; this.refresh();
  },
  _delSubj(i) {
    if (!confirm('Delete this subject?')) return;
    const d = this.getData(); d.subjects.splice(i, 1); this.saveData(d); this.refresh(); App.toast('Deleted 🗑️');
  },

  /* ── Custom Chapters ── */
  _renderChTable() {
    const d = this.getData(); const el = document.getElementById('ch-tbody'); if (!el) return;
    el.innerHTML = !d.chapters.length
      ? '<tr><td colspan="5" style="text-align:center;color:var(--t3)">No custom chapters yet</td></tr>'
      : d.chapters.map((c, i) => `<tr>
          <td><strong>${c.title}</strong></td>
          <td>${c.subject}</td>
          <td>${c.videoId ? '<span class="tag tag-sage">✓ Video</span>' : '—'}</td>
          <td>${c.notes ? '<span class="tag tag-indigo">✓ Notes</span>' : '—'}</td>
          <td><button class="btn btn-danger btn-sm" onclick="Admin._delCh(${i})">Delete</button></td>
        </tr>`).join('');
  },
  addChapter() {
    const title = document.getElementById('nc-title')?.value.trim();
    const subject = document.getElementById('nc-subj')?.value;
    const videoId = document.getElementById('nc-vid')?.value.trim();
    const notes = document.getElementById('nc-notes')?.value.trim();
    const duration = document.getElementById('nc-dur')?.value.trim() || '40 min';
    if (!title || !subject) { App.toast('Title & subject required', '⚠️'); return; }
    const d = this.getData();
    d.chapters.push({ title, subject, videoId, notes, duration, date: Date.now() });
    this.saveData(d); App.toast(`Chapter "${title}" added! ✅`);
    ['nc-title','nc-vid','nc-notes','nc-dur'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    this.refresh();
  },
  _delCh(i) {
    if (!confirm('Delete?')) return;
    const d = this.getData(); d.chapters.splice(i, 1); this.saveData(d); this.refresh(); App.toast('Deleted 🗑️');
  },

  /* ── PDFs ── */
  _renderPDFTable() {
    const d = this.getData(); const el = document.getElementById('pdf-tbody'); if (!el) return;
    el.innerHTML = !d.pdfs.length
      ? '<tr><td colspan="5" style="text-align:center;color:var(--t3)">No PDFs yet. Upload below!</td></tr>'
      : d.pdfs.map((p, i) => `<tr>
          <td>📄 <strong>${p.name}</strong></td>
          <td>${p.subject}</td>
          <td>${p.chapter || 'General'}</td>
          <td><span class="tag tag-indigo">${p.type || 'Notes'}</span></td>
          <td>
            <a href="${p.url}" target="_blank" class="btn btn-ghost btn-sm">View</a>
            <button class="btn btn-danger btn-sm" onclick="Admin._delPDF(${i})">Delete</button>
          </td>
        </tr>`).join('');
  },
  addPDF() {
    const file = document.getElementById('pdf-file')?.files[0];
    const name = document.getElementById('pdf-name')?.value.trim();
    const subject = document.getElementById('pdf-subj')?.value;
    const chapter = document.getElementById('pdf-ch')?.value.trim();
    const type = document.getElementById('pdf-type')?.value;
    const urlField = document.getElementById('pdf-url')?.value.trim();
    if (!name || !subject) { App.toast('Name and subject required', '⚠️'); return; }
    const save = (url, size) => {
      const d = this.getData();
      d.pdfs.push({ name, subject, chapter: chapter || '', type: type || 'Notes', url, size: size || '—', date: Date.now() });
      this.saveData(d); App.toast(`PDF "${name}" added! 📁`);
      ['pdf-name','pdf-ch','pdf-url'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
      const fi = document.getElementById('pdf-file'); if (fi) fi.value = '';
      this.refresh();
    };
    if (file) {
      const reader = new FileReader();
      reader.onload = e => save(e.target.result, Math.round(file.size / 1024) + 'KB');
      reader.readAsDataURL(file);
    } else if (urlField) {
      save(urlField, '—');
    } else { App.toast('Upload a file or enter a URL', '⚠️'); }
  },
  _delPDF(i) {
    if (!confirm('Delete?')) return;
    const d = this.getData(); d.pdfs.splice(i, 1); this.saveData(d); this.refresh(); App.toast('Deleted 🗑️');
  },

  /* ── NCERT Topics ── */
  _renderNCERTTable() {
    const d = this.getData(); const el = document.getElementById('ncert-tbody'); if (!el) return;
    el.innerHTML = !d.ncertTopics.length
      ? '<tr><td colspan="6" style="text-align:center;color:var(--t3)">No topics yet. Add below!</td></tr>'
      : d.ncertTopics.map((t, i) => `<tr>
          <td style="max-width:200px">${t.text.slice(0,70)}${t.text.length>70?'…':''}</td>
          <td>${t.subject}</td>
          <td>${t.chapter || '—'}</td>
          <td>${t.marks ? `<span class="tag tag-terra">${t.marks}M</span>` : '—'}</td>
          <td>${t.important ? '⭐' : '—'}</td>
          <td><button class="btn btn-danger btn-sm" onclick="Admin._delNCERT(${i})">Delete</button></td>
        </tr>`).join('');
  },
  addNCERT() {
    const text = document.getElementById('nt-text')?.value.trim();
    const subject = document.getElementById('nt-subj')?.value;
    const chapter = document.getElementById('nt-ch')?.value.trim();
    const marks = document.getElementById('nt-marks')?.value.trim();
    const important = document.getElementById('nt-imp')?.checked || false;
    const type = document.getElementById('nt-type')?.value;
    if (!text || !subject) { App.toast('Text and subject required', '⚠️'); return; }
    const d = this.getData();
    d.ncertTopics.push({ text, subject, chapter: chapter || '', marks, important, type, date: Date.now() });
    this.saveData(d); App.toast('NCERT topic added! ⭐');
    ['nt-text','nt-ch','nt-marks'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const imp = document.getElementById('nt-imp'); if (imp) imp.checked = false;
    this.refresh();
  },
  _delNCERT(i) {
    if (!confirm('Delete?')) return;
    const d = this.getData(); d.ncertTopics.splice(i, 1); this.saveData(d); this.refresh(); App.toast('Deleted 🗑️');
  },

  /* ── Quiz ── */
  _renderQuizTable() {
    const d = this.getData(); const el = document.getElementById('quiz-tbody'); if (!el) return;
    el.innerHTML = !d.quiz.length
      ? '<tr><td colspan="4" style="text-align:center;color:var(--t3)">No custom questions yet</td></tr>'
      : d.quiz.map((q, i) => `<tr>
          <td style="max-width:180px">${q.q.slice(0,60)}…</td>
          <td>${q.subject}</td>
          <td>${q.chapter || '—'}</td>
          <td><button class="btn btn-danger btn-sm" onclick="Admin._delQuiz(${i})">Delete</button></td>
        </tr>`).join('');
  },
  addQuiz() {
    const q = document.getElementById('nq-q')?.value.trim();
    const subject = document.getElementById('nq-subj')?.value;
    const chapter = document.getElementById('nq-ch')?.value.trim();
    const opts = [1,2,3,4].map(i => document.getElementById('nq-o'+i)?.value.trim()).filter(Boolean);
    const correct = parseInt(document.getElementById('nq-ans')?.value || '0');
    const marks = document.getElementById('nq-marks')?.value || '1';
    if (!q || opts.length < 2) { App.toast('Question and 2+ options required', '⚠️'); return; }
    const d = this.getData();
    d.quiz.push({ q, subject, chapter: chapter || '', options: opts, answer: correct, marks, date: Date.now() });
    this.saveData(d); App.toast('Quiz question added! 🧠');
    ['nq-q','nq-ch','nq-o1','nq-o2','nq-o3','nq-o4'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    this.refresh();
  },
  _delQuiz(i) {
    if (!confirm('Delete?')) return;
    const d = this.getData(); d.quiz.splice(i, 1); this.saveData(d); this.refresh(); App.toast('Deleted 🗑️');
  },

  /* ── Announcements ── */
  _renderAnnounceTable() {
    const d = this.getData(); const el = document.getElementById('ann-tbody'); if (!el) return;
    el.innerHTML = !d.announcements.length
      ? '<tr><td colspan="4" style="text-align:center;color:var(--t3)">No announcements</td></tr>'
      : d.announcements.map((a, i) => `<tr>
          <td><strong>${a.title}</strong></td>
          <td style="max-width:180px">${a.text.slice(0,60)}</td>
          <td><span class="tag tag-${a.type==='exam'?'terra':a.type==='info'?'indigo':'saffron'}">${a.type}</span></td>
          <td><button class="btn btn-danger btn-sm" onclick="Admin._delAnn(${i})">Delete</button></td>
        </tr>`).join('');
  },
  addAnnouncement() {
    const title = document.getElementById('na-title')?.value.trim();
    const text = document.getElementById('na-text')?.value.trim();
    const type = document.getElementById('na-type')?.value;
    if (!title || !text) { App.toast('Title and message required', '⚠️'); return; }
    const d = this.getData();
    d.announcements.unshift({ title, text, type, date: new Date().toLocaleDateString('en-IN') });
    this.saveData(d); App.toast('Posted! 📢');
    ['na-title','na-text'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    this.refresh();
  },
  _delAnn(i) {
    if (!confirm('Delete?')) return;
    const d = this.getData(); d.announcements.splice(i, 1); this.saveData(d); this.refresh(); App.toast('Deleted 🗑️');
  },

  /* ── Progress ── */
  _renderProgressTable() {
    const p = App.getProgress(); const el = document.getElementById('prog-tbody'); if (!el) return;
    const subs = [
      { id:'mathematics', name:'Mathematics', total:5 },
      { id:'science', name:'Science', total:5 },
      { id:'social-science', name:'Social Science', total:4 },
      { id:'english', name:'English', total:4 },
    ];
    el.innerHTML = subs.map(s => {
      const sp = p[s.id] || {};
      const done = (sp.done || []).length, pct = Math.round(done/s.total*100), qz = Object.keys(sp.scores||{}).length;
      return `<tr>
        <td><strong>${s.name}</strong></td>
        <td>${done}/${s.total}</td>
        <td><div class="pbar" style="width:80px"><div class="pfill" style="width:${pct}%"></div></div></td>
        <td>${qz} quizzes</td>
        <td><button class="btn btn-ghost btn-sm" onclick="Admin._clearSubj('${s.id}')">Clear</button></td>
      </tr>`;
    }).join('');
  },
  _clearSubj(id) {
    if (!confirm('Clear progress for this subject?')) return;
    const p = App.getProgress(); delete p[id]; App.saveProgress(p); this.refresh(); App.toast('Cleared! 🗑️');
  },
  clearAll() {
    if (!confirm('Clear ALL progress? This cannot be undone.')) return;
    App.saveProgress({}); this.refresh(); App.toast('All progress cleared 🗑️');
  },
  clearAllOverrides() {
    if (!confirm('Clear ALL admin edits to built-in chapters?')) return;
    localStorage.removeItem('vm_overrides'); this.refresh(); App.toast('Overrides cleared 🗑️');
  },

  /* ── Todos ── */
  _renderTodosTable() {
    const todos = TodoPanel.getData(); const el = document.getElementById('todos-tbody'); if (!el) return;
    el.innerHTML = !todos.length
      ? '<tr><td colspan="6" style="text-align:center;color:var(--t3)">No tasks yet</td></tr>'
      : todos.map(t => `<tr>
          <td style="max-width:180px">${t.text.slice(0,55)}</td>
          <td>${t.subject||'—'}</td>
          <td>${t.priority==='high'?'<span class="tag tag-terra">High</span>':'Normal'}</td>
          <td>${t.due ? new Date(t.due).toLocaleDateString('en-IN') : '—'}</td>
          <td>${t.marks||'—'}</td>
          <td>${t.done?'<span class="tag tag-sage">Done</span>':'<span class="tag tag-saffron">Pending</span>'}</td>
        </tr>`).join('');
  },

  /* ── Settings ── */
  _renderSettingsInfo() {
    const el = document.getElementById('settings-info'); if (!el) return;
    const d = this.getData();
    el.innerHTML = `
      Built-in subjects: <strong>4</strong><br>
      Custom subjects: <strong>${d.subjects.length}</strong><br>
      Custom chapters: <strong>${d.chapters.length}</strong><br>
      PDFs: <strong>${d.pdfs.length}</strong><br>
      NCERT topics (custom): <strong>${d.ncertTopics.length}</strong><br>
      Quiz questions (custom): <strong>${d.quiz.length}</strong><br>
      Announcements: <strong>${d.announcements.length}</strong><br>
      Student tasks: <strong>${TodoPanel.getData().length}</strong>`;
    // Load saved settings into fields
    const sn = localStorage.getItem('vm_site_name');
    const mo = localStorage.getItem('vm_motd');
    if (sn) { const el2 = document.getElementById('s-name'); if (el2) el2.value = sn; }
    if (mo) { const el2 = document.getElementById('s-motd'); if (el2) el2.value = mo; }
  },
  saveSiteSettings() {
    const name = document.getElementById('s-name')?.value.trim();
    const motd = document.getElementById('s-motd')?.value.trim();
    if (name) localStorage.setItem('vm_site_name', name);
    if (motd) localStorage.setItem('vm_motd', motd);
    App.toast('Settings saved! ✅');
  },
  exportData() {
    const all = {
      adminData: this.getData(),
      progress: App.getProgress(),
      todos: TodoPanel.getData(),
      overrides: JSON.parse(localStorage.getItem('vm_overrides')||'{}'),
    };
    const blob = new Blob([JSON.stringify(all, null, 2)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'vidyamandir-backup-' + new Date().toISOString().slice(0,10) + '.json';
    a.click(); App.toast('Data exported! 💾');
  },
  importData(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const d = JSON.parse(ev.target.result);
        if (d.adminData) this.saveData(d.adminData);
        if (d.progress) App.saveProgress(d.progress);
        if (d.todos) TodoPanel.saveData(d.todos);
        if (d.overrides) localStorage.setItem('vm_overrides', JSON.stringify(d.overrides));
        App.toast('Data imported! 🎉'); this.refresh();
      } catch(err) { App.toast('Invalid backup file', '❌'); }
    };
    reader.readAsText(file);
  },
};

document.addEventListener('DOMContentLoaded', () => {
  App.initPage('admin');
  Admin.init();
});
