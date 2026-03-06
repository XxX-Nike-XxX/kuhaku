// ── pages/home.js ─────────────────────────────────────────
import { API, getList, getVal } from '../lib/api.js';
import { skeleton, cardHTML, sectionHTML, toast, setTitle, imgFallback } from '../lib/components.js';

let heroItems = [], heroCur = 0, heroTimer = null;

export async function renderHome(app) {
  setTitle('Beranda');
  app.innerHTML = `
    <!-- HERO -->
    <section class="hero" id="hero">
      <div class="hero-bg" id="heroBg"></div>
      <div class="hero-vignette"></div>
      <div class="hero-content">
        <div class="hero-badge">✦ Pilihan Terbaik</div>
        <h1 class="hero-title" id="heroTitle">Memuat...</h1>
        <div class="hero-meta">
          <span class="star" id="heroRating">★ —</span>
          <span class="hero-dot-sep"></span>
          <span id="heroYear"></span>
          <span class="hero-dot-sep"></span>
          <span id="heroEp"></span>
        </div>
        <p class="hero-desc" id="heroDesc">Menemukan drama terbaik untukmu...</p>
        <div class="hero-btns">
          <button class="btn btn-red" id="heroBtnWatch">▶ Tonton Sekarang</button>
          <button class="btn btn-ghost" id="heroBtnInfo">ℹ Info Drama</button>
        </div>
      </div>
      <div class="hero-indicators" id="heroDots"></div>
    </section>

    <!-- CATEGORY FILTER BAR -->
    <div class="filter-bar" id="catBar">
      <button class="filter-pill active" data-cat="">Semua</button>
    </div>

    <main>
      <!-- RECOMMEND -->
      <section class="section" id="recommendSection">
        <div class="section-hd">
          <h2 class="section-title">⭐ <em>Rekomendasi</em></h2>
          <button class="see-all" onclick="window.__nav('/recommend')">Lihat Semua ›</button>
        </div>
        <div class="row-wrap">
          <button class="row-arr left" onclick="document.getElementById('recRow').scrollBy({left:-640,behavior:'smooth'})">‹</button>
          <div class="scroll-row" id="recRow">${skeleton(6)}</div>
          <button class="row-arr right" onclick="document.getElementById('recRow').scrollBy({left:640,behavior:'smooth'})">›</button>
        </div>
      </section>

      <!-- HOME / TERBARU -->
      <section class="section" id="homeSection">
        <div class="section-hd">
          <h2 class="section-title">🆕 Drama <em>Terbaru</em></h2>
          <button class="see-all" onclick="window.__nav('/latest')">Lihat Semua ›</button>
        </div>
        <div class="row-wrap">
          <button class="row-arr left" onclick="document.getElementById('homeRow').scrollBy({left:-640,behavior:'smooth'})">‹</button>
          <div class="scroll-row" id="homeRow">${skeleton(6)}</div>
          <button class="row-arr right" onclick="document.getElementById('homeRow').scrollBy({left:640,behavior:'smooth'})">›</button>
        </div>
      </section>

      <!-- VIP -->
      <section class="section" id="vipSection">
        <div class="section-hd">
          <h2 class="section-title">👑 <em>VIP</em> Channel</h2>
          <button class="see-all" onclick="window.__nav('/vip')">Lihat Semua ›</button>
        </div>
        <div class="row-wrap">
          <button class="row-arr left" onclick="document.getElementById('vipRow').scrollBy({left:-640,behavior:'smooth'})">‹</button>
          <div class="scroll-row" id="vipRow">${skeleton(5)}</div>
          <button class="row-arr right" onclick="document.getElementById('vipRow').scrollBy({left:640,behavior:'smooth'})">›</button>
        </div>
      </section>

      <!-- CATEGORIES PREVIEW -->
      <section class="section" id="catSection">
        <div class="section-hd">
          <h2 class="section-title">🗂 <em>Kategori</em></h2>
          <button class="see-all" onclick="window.__nav('/categories')">Semua Kategori ›</button>
        </div>
        <div class="cat-grid" id="catGrid">${skeleton(8)}</div>
      </section>
    </main>

    <footer>
      <div>
        <div class="footer-logo">DramaBox</div>
        <p>Nonton drama Asia favoritmu kapan saja</p>
      </div>
      <div class="footer-links">
        <a onclick="window.__nav('/')">Beranda</a>
        <a onclick="window.__nav('/categories')">Kategori</a>
        <a onclick="window.__nav('/search')">Cari</a>
        <a onclick="window.__nav('/vip')">VIP</a>
      </div>
    </footer>
  `;

  // Load all data in parallel
  const [homeData, recData, vipData, catData] = await Promise.all([
    API.home(),
    API.recommend(),
    API.vip(),
    API.categories(),
  ]);

  // HERO from home/recommend
  const homeItems = getList(homeData);
  const recItems = getList(recData);
  heroItems = (recItems.length ? recItems : homeItems).slice(0, 7);
  if (heroItems.length) {
    buildHeroDots(heroItems.length);
    goHero(0);
  }

  // Rows
  renderToRow('recRow', recItems);
  renderToRow('homeRow', homeItems);
  renderToRow('vipRow', getList(vipData));

  // Categories grid
  const cats = getList(catData);
  const catGrid = document.getElementById('catGrid');
  if (cats.length) {
    const colors = ['#e63946','#2ec4b6','#f4c430','#a855f7','#3b82f6','#f97316','#10b981','#ec4899'];
    catGrid.innerHTML = cats.slice(0, 12).map((c, i) => {
      const name = getVal(c, 'name', 'category_name', 'genre', 'title') || 'Kategori';
      const id = getVal(c, 'id', 'category_id', 'genre_id') || i;
      return `<div class="cat-card" onclick="window.__nav('/category', {id:'${id}', name:'${encodeURIComponent(name)}'})">
        <span style="font-size:1.5rem">${['🎭','💕','⚔️','😂','🔮','🌙','👑','🔥','💔','🎬','🌸','🏃'][i % 12]}</span>
        <span class="cat-card-name">${name}</span>
      </div>`;
    });

    // Also fill filter bar
    const catBar = document.getElementById('catBar');
    cats.slice(0, 10).forEach(c => {
      const name = getVal(c, 'name', 'category_name', 'genre', 'title') || '';
      const id = getVal(c, 'id', 'category_id', 'genre_id') || '';
      const btn = document.createElement('button');
      btn.className = 'filter-pill';
      btn.textContent = name;
      btn.dataset.cat = id;
      btn.onclick = () => {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        if (id) window.__nav('/category', { id, name: encodeURIComponent(name) });
      };
      catBar.appendChild(btn);
    });
  }
}

function renderToRow(id, items) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = items?.length
    ? items.map(d => cardHTML(d)).join('')
    : '<p style="color:var(--muted);font-size:0.85rem;padding:1rem 0">Konten tidak tersedia.</p>';
}

function buildHeroDots(n) {
  const wrap = document.getElementById('heroDots');
  if (!wrap) return;
  wrap.innerHTML = Array(n).fill(0).map((_, i) =>
    `<div class="h-dot${i === 0 ? ' active' : ''}" onclick="window.__goHero(${i})"></div>`
  ).join('');
}

function goHero(i) {
  if (!heroItems.length) return;
  heroCur = ((i % heroItems.length) + heroItems.length) % heroItems.length;
  const d = heroItems[heroCur];
  const title = getVal(d, 'title', 'name', 'drama_title') || 'DramaBox';
  const desc = getVal(d, 'introduction', 'description', 'synopsis', 'summary') || '';
  const cover = imgFallback(getVal(d, 'cover_horizontal', 'coverHorizontalUrl', 'cover', 'thumbnail'));
  const rating = getVal(d, 'score', 'rating', 'star');
  const eps = getVal(d, 'total_episode', 'episode_count');
  const year = getVal(d, 'release_year', 'year');
  const id = getVal(d, 'id', 'book_id', 'drama_id');

  const bg = document.getElementById('heroBg');
  const titleEl = document.getElementById('heroTitle');
  const descEl = document.getElementById('heroDesc');
  const ratingEl = document.getElementById('heroRating');
  const yearEl = document.getElementById('heroYear');
  const epEl = document.getElementById('heroEp');
  const watchBtn = document.getElementById('heroBtnWatch');
  const infoBtn = document.getElementById('heroBtnInfo');

  if (bg) bg.style.backgroundImage = `url('${cover}')`;
  if (titleEl) titleEl.textContent = title;
  if (descEl) descEl.textContent = desc || 'Klik untuk lihat detail drama ini.';
  if (ratingEl) ratingEl.textContent = rating ? `★ ${parseFloat(rating).toFixed(1)}` : '';
  if (yearEl) yearEl.textContent = year || '';
  if (epEl) epEl.textContent = eps ? `${eps} Episode` : '';
  if (watchBtn) watchBtn.onclick = () => window.__nav('/detail', { id, title: encodeURIComponent(title), cover: encodeURIComponent(cover) });
  if (infoBtn) infoBtn.onclick = () => window.__nav('/detail', { id, title: encodeURIComponent(title), cover: encodeURIComponent(cover) });

  document.querySelectorAll('.h-dot').forEach((dot, j) => dot.classList.toggle('active', j === heroCur));
  clearInterval(heroTimer);
  heroTimer = setInterval(() => goHero(heroCur + 1), 7000);
}

// expose for dot clicks
window.__goHero = goHero;
