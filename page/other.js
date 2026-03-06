// ── pages/search.js ───────────────────────────────────────
import { API, getList } from '../lib/api.js';
import { cardHTML, skeleton, setTitle, toast } from '../lib/components.js';

let debounceT = null;

export async function renderSearch(app, params) {
  const initQ = params.q ? decodeURIComponent(params.q) : '';
  setTitle('Cari Drama');
  app.innerHTML = `
    <div class="page-header">
      <h1>🔍 Cari Drama</h1>
      <p>Temukan drama favorit kamu</p>
    </div>
    <main>
      <input class="search-big" id="searchBig" type="text" placeholder="Ketik judul drama, aktor, atau genre..." value="${initQ}" autocomplete="off">
      <div id="popWrap">
        <p style="font-size:0.78rem;color:var(--muted);margin-bottom:0.8rem;font-weight:500">🔥 Trending Pencarian</p>
        <div class="pop-chips" id="popChips">
          ${['Romance','Action','Comedy','Thriller','Historical','Fantasy','Modern'].map(k =>
            `<button class="chip" onclick="document.getElementById('searchBig').value='${k}';runSearch('${k}')">${k}</button>`
          ).join('')}
        </div>
      </div>
      <div id="searchResultHead" style="display:none;margin-bottom:1rem">
        <h2 style="font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:700" id="searchResultTitle"></h2>
        <p style="font-size:0.8rem;color:var(--muted);margin-top:0.3rem" id="searchResultCount"></p>
      </div>
      <div class="drama-grid" id="searchGrid"></div>
    </main>
    <footer>
      <div><div class="footer-logo">DramaBox</div><p>Nonton drama Asia favoritmu</p></div>
      <div class="footer-links">
        <a onclick="window.__nav('/')">Beranda</a>
        <a onclick="window.__nav('/categories')">Kategori</a>
      </div>
    </footer>
  `;

  const input = document.getElementById('searchBig');
  input.addEventListener('input', e => {
    clearTimeout(debounceT);
    if (e.target.value.length >= 2) debounceT = setTimeout(() => runSearch(e.target.value), 600);
  });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') runSearch(e.target.value); });

  if (initQ) runSearch(initQ);
  else setTimeout(() => input.focus(), 100);
}

async function runSearch(q) {
  q = q.trim();
  if (!q) return;
  document.getElementById('popWrap').style.display = 'none';
  document.getElementById('searchResultHead').style.display = 'block';
  document.getElementById('searchResultTitle').textContent = `Hasil untuk "${q}"`;
  document.getElementById('searchResultCount').textContent = 'Mencari...';
  document.getElementById('searchGrid').innerHTML = skeleton(8);

  const data = await API.search(q);
  const items = getList(data);
  document.getElementById('searchResultCount').textContent = `${items.length} hasil ditemukan`;
  document.getElementById('searchGrid').innerHTML = items.length
    ? items.map(d => cardHTML(d)).join('')
    : `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--muted)">
        <div style="font-size:3rem;margin-bottom:1rem">🔍</div>
        <p>Tidak ada hasil untuk "<strong>${q}</strong>"</p>
        <p style="font-size:0.8rem;margin-top:0.5rem">Coba kata kunci lain</p>
      </div>`;
}

window.runSearch = runSearch;


// ── pages/categories.js ───────────────────────────────────
import { API, getList, getVal } from '../lib/api.js';
import { skeleton, setTitle } from '../lib/components.js';

export async function renderCategories(app) {
  setTitle('Kategori');
  app.innerHTML = `
    <div class="page-header">
      <h1>🗂 Semua Kategori</h1>
      <p>Pilih genre drama yang kamu suka</p>
    </div>
    <main>
      <div class="cat-grid" id="allCatGrid">
        ${Array(12).fill(0).map(()=>`<div class="skel" style="aspect-ratio:3/2;border-radius:10px"></div>`).join('')}
      </div>
    </main>
    <footer>
      <div><div class="footer-logo">DramaBox</div><p>Nonton drama Asia favoritmu</p></div>
      <div class="footer-links"><a onclick="window.__nav('/')">Beranda</a><a onclick="window.__nav('/search')">Cari</a></div>
    </footer>
  `;

  const data = await API.categories();
  const cats = getList(data);
  const icons = ['🎭','💕','⚔️','😂','🔮','🌙','👑','🔥','💔','🎬','🌸','🏃','🧸','🌊','🦋','🎵','🏯','🌺','👻','🦸'];
  const colors = ['rgba(230,57,70,0.15)','rgba(46,196,182,0.15)','rgba(244,196,48,0.15)','rgba(168,85,247,0.15)','rgba(59,130,246,0.15)','rgba(249,115,22,0.15)','rgba(16,185,129,0.15)','rgba(236,72,153,0.15)'];
  
  document.getElementById('allCatGrid').innerHTML = cats.map((c, i) => {
    const name = getVal(c, 'name', 'category_name', 'genre', 'title') || 'Kategori';
    const id = getVal(c, 'id', 'category_id', 'genre_id') || i;
    const count = getVal(c, 'total', 'count', 'drama_count');
    return `<div class="cat-card" style="background:${colors[i%colors.length]}" 
              onclick="window.__nav('/category', {id:'${id}', name:'${encodeURIComponent(name)}'})">
      <span style="font-size:2rem">${icons[i % icons.length]}</span>
      <span class="cat-card-name">${name}</span>
      ${count ? `<span class="cat-card-count">${count} drama</span>` : ''}
    </div>`;
  }).join('') || '<p style="color:var(--muted)">Kategori tidak tersedia.</p>';
}


// ── pages/category.js ─────────────────────────────────────
import { API, getList, getVal } from '../lib/api.js';
import { cardHTML, skeleton, setTitle } from '../lib/components.js';

export async function renderCategory(app, params) {
  const { id, name: nameEnc } = params;
  const name = nameEnc ? decodeURIComponent(nameEnc) : 'Kategori';
  setTitle(name);
  app.innerHTML = `
    <div class="page-header">
      <h1>${name}</h1>
      <p>Drama dalam kategori ini</p>
    </div>
    <main>
      <div class="drama-grid" id="catDramaGrid">${skeleton(12)}</div>
    </main>
    <footer>
      <div><div class="footer-logo">DramaBox</div></div>
      <div class="footer-links"><a onclick="window.__nav('/')">Beranda</a><a onclick="window.__nav('/categories')">← Kategori</a></div>
    </footer>
  `;
  window.scrollTo({top:0});
  const data = await API.category(id);
  const items = getList(data);
  document.getElementById('catDramaGrid').innerHTML = items.length
    ? items.map(d => cardHTML(d)).join('')
    : '<p style="color:var(--muted);padding:2rem 0">Tidak ada drama dalam kategori ini.</p>';
}


// ── pages/vip.js ──────────────────────────────────────────
import { API, getList } from '../lib/api.js';
import { cardHTML, skeleton, setTitle } from '../lib/components.js';

export async function renderVip(app) {
  setTitle('VIP Channel');
  app.innerHTML = `
    <div class="page-header">
      <h1>👑 VIP Channel</h1>
      <p>Konten eksklusif untuk member VIP</p>
    </div>
    <main>
      <div class="vip-banner">
        <div class="vip-crown">👑</div>
        <div class="vip-text">
          <h2>Konten VIP Premium</h2>
          <p>Drama eksklusif dengan kualitas terbaik, subtitle lengkap, tanpa iklan</p>
        </div>
      </div>
      <div class="drama-grid" id="vipGrid">${skeleton(10)}</div>
    </main>
    <footer>
      <div><div class="footer-logo">DramaBox</div></div>
      <div class="footer-links"><a onclick="window.__nav('/')">Beranda</a></div>
    </footer>
  `;
  window.scrollTo({top:0});
  const data = await API.vip();
  const items = getList(data);
  document.getElementById('vipGrid').innerHTML = items.length
    ? items.map(d => cardHTML(d)).join('')
    : '<p style="color:var(--muted);padding:2rem 0">Konten VIP tidak tersedia saat ini.</p>';
}


// ── pages/latest.js ───────────────────────────────────────
import { API, getList } from '../lib/api.js';
import { cardHTML, skeleton, setTitle } from '../lib/components.js';

export async function renderLatest(app) {
  setTitle('Drama Terbaru');
  app.innerHTML = `
    <div class="page-header">
      <h1>🆕 Drama Terbaru</h1>
      <p>Update drama paling baru hari ini</p>
    </div>
    <main>
      <div class="drama-grid" id="latestGrid">${skeleton(12)}</div>
    </main>
    <footer>
      <div><div class="footer-logo">DramaBox</div></div>
      <div class="footer-links"><a onclick="window.__nav('/')">Beranda</a></div>
    </footer>
  `;
  window.scrollTo({top:0});
  const data = await API.home();
  const items = getList(data);
  document.getElementById('latestGrid').innerHTML = items.length
    ? items.map(d => cardHTML(d)).join('')
    : '<p style="color:var(--muted);padding:2rem 0">Tidak ada drama tersedia.</p>';
}


// ── pages/recommend.js ────────────────────────────────────
import { API, getList } from '../lib/api.js';
import { cardHTML, skeleton, setTitle } from '../lib/components.js';

export async function renderRecommend(app) {
  setTitle('Rekomendasi');
  app.innerHTML = `
    <div class="page-header">
      <h1>⭐ Rekomendasi Untukmu</h1>
      <p>Drama pilihan yang mungkin kamu suka</p>
    </div>
    <main>
      <div class="drama-grid" id="recGrid">${skeleton(12)}</div>
    </main>
    <footer>
      <div><div class="footer-logo">DramaBox</div></div>
      <div class="footer-links"><a onclick="window.__nav('/')">Beranda</a></div>
    </footer>
  `;
  window.scrollTo({top:0});
  const data = await API.recommend();
  const items = getList(data);
  document.getElementById('recGrid').innerHTML = items.length
    ? items.map(d => cardHTML(d)).join('')
    : '<p style="color:var(--muted);padding:2rem 0">Tidak ada rekomendasi.</p>';
}
