// ── lib/router.js ─────────────────────────────────────────
// Client-side SPA router dengan hash-based routing

const routes = {};
let currentRoute = null;

export function register(path, handler) {
  routes[path] = handler;
}

export function navigate(path, params = {}) {
  const query = new URLSearchParams(params).toString();
  const hash = query ? `#${path}?${query}` : `#${path}`;
  history.pushState(null, '', hash);
  dispatch();
}

export function getParams() {
  const hash = location.hash.slice(1);
  const [path, query] = hash.split('?');
  return Object.fromEntries(new URLSearchParams(query || ''));
}

export function getCurrentPath() {
  const hash = location.hash.slice(1);
  return hash.split('?')[0] || '/';
}

function dispatch() {
  const path = getCurrentPath();
  const handler = routes[path] || routes['*'];
  if (handler) {
    currentRoute = path;
    handler(getParams());
  }
}

export function initRouter() {
  window.addEventListener('hashchange', dispatch);
  window.addEventListener('popstate', dispatch);
  dispatch();
}

// ── lib/components.js ─────────────────────────────────────
// Reusable UI components

export function imgFallback(url) {
  return url || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='270'%3E%3Crect width='180' height='270' fill='%231a1a28'/%3E%3Ctext x='50%25' y='50%25' fill='%237a7a9a' font-size='32' text-anchor='middle' dominant-baseline='middle'%3E🎬%3C/text%3E%3C/svg%3E`;
}

export function skeleton(n = 5, wide = false) {
  return Array(n).fill(0).map(() => `
    <div class="skel-wrap" style="flex-shrink:0;width:${wide ? 240 : 165}px">
      <div class="skel" style="aspect-ratio:${wide ? '16/10' : '2/3'};border-radius:12px;width:100%"></div>
      <div class="skel" style="height:10px;margin-top:8px;border-radius:4px"></div>
      <div class="skel" style="height:8px;margin-top:5px;border-radius:4px;width:60%"></div>
    </div>`).join('');
}

export function cardHTML(d, wide = false, nav) {
  const title = getVal(d, 'title', 'name', 'drama_title', 'judul') || 'Untitled';
  const cover = imgFallback(getVal(d, wide ? 'cover_horizontal' : 'cover_vertical', 'cover_horizontal', 'cover_vertical', 'cover', 'thumbnail', 'image', 'poster', 'img'));
  const rating = getVal(d, 'score', 'rating', 'star', 'imdb');
  const eps = getVal(d, 'total_episode', 'episode_count', 'episodes', 'total_eps');
  const year = getVal(d, 'release_year', 'year', 'tahun');
  const vip = d.is_vip || d.vip || d.needPay;
  const id = getVal(d, 'id', 'book_id', 'bookId', 'drama_id', 'dramaId');
  const safeTitle = title.replace(/'/g, "\\'").replace(/`/g, '\\`');
  const safeCover = cover.replace(/'/g, "\\'");

  return `
  <div class="card${wide ? ' card-wide' : ''}" onclick="window.__nav('/detail', {id:'${id}', title:'${encodeURIComponent(title)}', cover:'${encodeURIComponent(safeCover)}'})">
    <div class="card-img">
      <img src="${cover}" alt="${title}" loading="lazy" onerror="this.src='${imgFallback('')}'">
      ${vip ? '<span class="badge badge-vip">👑 VIP</span>' : ''}
      ${rating ? `<span class="badge badge-rating">★ ${parseFloat(rating).toFixed(1)}</span>` : ''}
      <div class="card-overlay"><div class="play-btn">▶</div></div>
    </div>
    <div class="card-info">
      <div class="card-title">${title}</div>
      <div class="card-sub">${[year, eps ? eps + ' Eps' : ''].filter(Boolean).join(' · ')}</div>
    </div>
  </div>`;
}

function getVal(obj, ...keys) {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  return '';
}

export function rowHTML(id, items, wide = false) {
  return `
  <div class="row-wrap">
    <button class="row-arr left" onclick="document.getElementById('${id}').scrollBy({left:-640,behavior:'smooth'})">‹</button>
    <div class="scroll-row" id="${id}">
      ${items?.length ? items.map(d => cardHTML(d, wide)).join('') : skeleton(5, wide)}
    </div>
    <button class="row-arr right" onclick="document.getElementById('${id}').scrollBy({left:640,behavior:'smooth'})">›</button>
  </div>`;
}

export function sectionHTML(title, rowId, items, wide = false, seeAllPath = null, seeAllParams = {}) {
  const seeAll = seeAllPath
    ? `<button class="see-all" onclick="window.__nav('${seeAllPath}', ${JSON.stringify(seeAllParams)})">Lihat Semua ›</button>`
    : '';
  return `
  <section class="section">
    <div class="section-hd">
      <h2 class="section-title">${title}</h2>
      ${seeAll}
    </div>
    ${rowHTML(rowId, items, wide)}
  </section>`;
}

export function toast(msg, type = 'info') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `toast show toast-${type}`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3000);
}

export function setTitle(t) {
  document.title = t ? `${t} — DramaBox` : 'DramaBox';
}

export function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
