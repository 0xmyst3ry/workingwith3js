import { createStage } from './stage.js';
import { chapters } from './chapters/index.js';

const SEEN_KEY = 'threejs-playbook-seen';

const navList = document.getElementById('navList');
const main = document.getElementById('chapter');
const progress = document.getElementById('progress');
const menuBtn = document.getElementById('menuBtn');

// One renderer for the whole site. Its container moves into each chapter as you navigate.
const stageEl = document.createElement('div');
stageEl.className = 'stage';
let statusEl = null;
let errorEl = null;

const stage = createStage({
  host: stageEl,
  onStatus: (text) => { if (statusEl) statusEl.textContent = text; },
  onError: (error) => {
    if (!errorEl) return;
    if (!error) { errorEl.hidden = true; errorEl.textContent = ''; return; }
    errorEl.hidden = false;
    errorEl.textContent = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.error(error);
  },
});

let current = null;
let editor = null;
let params = {};
let rerunTimer = 0;

/* ---------- visited chapters (per browser, optional) ---------- */
function readSeen() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch { return new Set(); }
}
function markSeen(id) {
  const seen = readSeen();
  seen.add(id);
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...seen])); } catch { /* storage can be blocked */ }
}

/* ---------- small helpers ---------- */
function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function defaultParams(chapter) {
  const out = {};
  for (const c of chapter.controls || []) out[c.key] = c.value;
  return out;
}

/* ---------- navigation ---------- */
function renderNav() {
  const seen = readSeen();
  navList.innerHTML = chapters.map((c) =>
    `<li><a href="#/${c.id}" data-id="${c.id}">${esc(c.title)}<span class="seen" aria-hidden="true">${seen.has(c.id) ? '✓' : ''}</span></a></li>`
  ).join('');
  progress.textContent = `${seen.size} of ${chapters.length} visited`;
}

function setCurrentInNav(id) {
  for (const a of navList.querySelectorAll('a')) {
    if (a.dataset.id === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
}

function closeMenu() {
  document.body.classList.remove('nav-open');
  menuBtn.setAttribute('aria-expanded', 'false');
}

menuBtn.addEventListener('click', () => {
  const open = document.body.classList.toggle('nav-open');
  menuBtn.setAttribute('aria-expanded', String(open));
});
navList.addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(); });

/* ---------- running code ---------- */
function runCurrent() {
  stage.run(editor.value, params);
}

function scheduleRerun() {
  clearTimeout(rerunTimer);
  rerunTimer = setTimeout(runCurrent, 120);
}

function controlHtml(c) {
  const id = `ctl-${c.key}`;
  if (c.type === 'checkbox') {
    return `<div class="control check"><input type="checkbox" id="${id}" data-key="${c.key}" ${c.value ? 'checked' : ''}><label for="${id}">${esc(c.label)}</label></div>`;
  }
  if (c.type === 'select') {
    const options = c.options.map((o) => `<option value="${esc(o.value)}" ${String(o.value) === String(c.value) ? 'selected' : ''}>${esc(o.label)}</option>`).join('');
    return `<div class="control"><label for="${id}">${esc(c.label)}</label><select id="${id}" data-key="${c.key}">${options}</select></div>`;
  }
  return `<div class="control"><label for="${id}">${esc(c.label)}<output id="${id}-out">${c.value}</output></label>` +
    `<input type="range" id="${id}" data-key="${c.key}" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.value}"></div>`;
}

function wireControls(chapter) {
  const defs = Object.fromEntries((chapter.controls || []).map((c) => [c.key, c]));
  main.querySelectorAll('[data-key]').forEach((input) => {
    const def = defs[input.dataset.key];
    const update = () => {
      if (input.type === 'checkbox') params[def.key] = input.checked;
      else if (input.type === 'range') {
        params[def.key] = Number(input.value);
        const out = document.getElementById(`${input.id}-out`);
        if (out) out.textContent = input.value;
      } else params[def.key] = input.value;
      if (def.rerun) scheduleRerun();
    };
    input.addEventListener('input', update);
    input.addEventListener('change', update);
  });
}

/* ---------- chapter page ---------- */
function renderChapter(chapter) {
  current = chapter;
  stage.setPaused(false);
  params = defaultParams(chapter);

  const index = chapters.indexOf(chapter);
  const prev = chapters[index - 1];
  const next = chapters[index + 1];
  const src = chapter.code.toString();

  main.innerHTML = `
    <header class="chapter-head">
      <p class="eyebrow">Chapter ${String(index).padStart(2, '0')} of ${String(chapters.length - 1).padStart(2, '0')}</p>
      <h1>${esc(chapter.title)}</h1>
      <p class="summary">${esc(chapter.summary)}</p>
    </header>
    <div class="notes">${chapter.notes.join('')}</div>

    <section class="lab" aria-label="Live example">
      <div class="stage-wrap">
        <div class="panel-bar">
          <span class="panel-title">Live scene</span>
          <button class="btn" id="pauseBtn" type="button" aria-pressed="false">Pause</button>
        </div>
        <div id="stageSlot"></div>
        <div class="status" id="status" aria-live="polite"></div>
        <pre class="error" id="error" role="alert" hidden></pre>
        ${chapter.controls && chapter.controls.length ? `<div class="controls">${chapter.controls.map(controlHtml).join('')}</div>` : ''}
      </div>
      <div class="editor-wrap">
        <div class="panel-bar">
          <span class="panel-title">Code, editable</span>
          <button class="btn" id="copyBtn" type="button">Copy</button>
          <button class="btn" id="resetBtn" type="button">Reset</button>
          <button class="btn primary" id="runBtn" type="button">Run</button>
        </div>
        <textarea class="editor" id="editor" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Chapter code"></textarea>
        <div class="hint"><kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>Enter</kbd> runs the code. <kbd>Tab</kbd> indents.</div>
      </div>
    </section>

    <div class="cols">
      <section class="callout try"><h2>Try this</h2><ul>${chapter.tryThis.map((t) => `<li>${t}</li>`).join('')}</ul></section>
      <section class="callout warn"><h2>Common mistakes</h2><ul>${chapter.gotchas.map((t) => `<li>${t}</li>`).join('')}</ul></section>
    </div>

    <nav class="pager" aria-label="Previous and next chapter">
      ${prev ? `<a class="prev" href="#/${prev.id}"><small>Previous</small>${esc(prev.title)}</a>` : '<span></span>'}
      ${next ? `<a class="next" href="#/${next.id}"><small>Next</small>${esc(next.title)}</a>` : ''}
    </nav>`;

  document.getElementById('stageSlot').appendChild(stageEl);
  statusEl = document.getElementById('status');
  errorEl = document.getElementById('error');
  editor = document.getElementById('editor');
  editor.value = src;

  document.getElementById('runBtn').addEventListener('click', runCurrent);
  document.getElementById('resetBtn').addEventListener('click', () => { editor.value = src; runCurrent(); });
  document.getElementById('copyBtn').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    try { await navigator.clipboard.writeText(editor.value); btn.textContent = 'Copied'; }
    catch { editor.select(); btn.textContent = 'Select + copy'; }
    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
  });
  const pauseBtn = document.getElementById('pauseBtn');
  pauseBtn.addEventListener('click', () => {
    const next = !stage.isPaused();
    stage.setPaused(next);
    pauseBtn.textContent = next ? 'Play' : 'Pause';
    pauseBtn.setAttribute('aria-pressed', String(next));
  });
  editor.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runCurrent(); return; }
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: end } = editor;
      editor.setRangeText('  ', s, end, 'end');
    }
  });

  wireControls(chapter);
  runCurrent();
  markSeen(chapter.id);
  renderNav();
  setCurrentInNav(chapter.id);
  document.title = `${chapter.title} · The Three.js Playbook`;
}

function route() {
  const id = location.hash.replace(/^#\/?/, '');
  const chapter = chapters.find((c) => c.id === id) || chapters[0];
  if (chapter === current) return;
  renderChapter(chapter);
  window.scrollTo({ top: 0 });
  if (document.activeElement !== document.body) main.focus({ preventScroll: true });
}

window.addEventListener('hashchange', route);
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (current) runCurrent(); });

renderNav();
route();
