// ── pages/detail.js ───────────────────────────────────────
import { API, getList, getVal } from '../lib/api.js';
import { skeleton, cardHTML, toast, setTitle, imgFallback } from '../lib/components.js';

export async function renderDetail(app, params) {
  const { id, title: titleEnc, cover: coverEnc } = params;
  const title = titleEnc ? decodeURIComponent(titleEnc) : 'Drama';
  const cover = coverEnc ? decodeURIComponent(coverEnc) : '';

  setTitle(title);

  app.innerHTML = `
    <div class="detail-hero">
      <div class="detail-hero-bg" id="detailBg" style="background-image:url('${imgFallback(cover)}')"></div>
      <div class="detail-hero-vignette"></div>
      <div class="detail-hero-content">
        <div class="detail-poster">
          <img id="detailPoster" src="${imgFallback(cover)}" alt="${title}" onerror="this.src='${imgFallback('')}'">
        </div>
        <div class="detail-info">
          <h1 class="detail-title" id="detailTitle">${title}</h1>
          <div class="detail-tags" id="detailTags">
            <div class="skel" style="height:24px;width:80px;border-radius:100px"></div>
            <div class="skel" style="height:24px;width:60px;border-radius:100px"></div>
          </div>
          <div class="hero-btns" id="detailBtns">
            <button class="btn btn-red" id="watchEp1Btn">⏳ Memuat...</button>
          </div>
        </div>
      </div>
    </div>

    <div class="detail-body">
      <p class="detail-desc" id="detailDesc">
        <span class="skel" style="display:block;height:14px;border-radius:4px;margin-bottom:8px"></span>
        <span class="skel" style="display:block;height:14px;border-radius:4px;margin-bottom:8px;width:80%"></span>
        <span class="skel" style="display:block;height:14px;border-radius:4px;width:60%"></span>
      </p>

      <!-- PLAYER -->
      <div id="playerSection" style="display:none">
        <div class="player-wrap" id="playerWrap"></div>
      </div>

      <!-- EPISODES -->
      <div class="eps-title" id="epsTitleEl">Episode</div>
      <div class="eps-grid" id="epsGrid">
        ${Array(6).fill(0).map(() => `<div class="skel" style="height:60px;border-radius:9px"></div>`).join('')}
      </div>

      <!-- RELATED / RECOMMEND -->
      <section class="section" style="margin-top:3rem">
        <div class="section-hd">
          <h2 class="section-title">🎯 Drama <em>Terkait</em></h2>
        </div>
        <div class="row-wrap">
          <button class="row-arr left" onclick="document.getElementById('relRow').scrollBy({left:-640,behavior:'smooth'})">‹</button>
          <div class="scroll-row" id="relRow">${skeleton(5)}</div>
          <button class="row-arr right" onclick="document.getElementById('relRow').scrollBy({left:640,behavior:'smooth'})">›</button>
        </div>
      </section>
    </div>

    <footer>
      <div><div class="footer-logo">DramaBox</div><p>Nonton drama Asia favoritmu kapan saja</p></div>
      <div class="footer-links">
        <a onclick="window.__nav('/')">Beranda</a>
        <a onclick="window.__nav('/categories')">Kategori</a>
        <a onclick="window.__nav('/search')">Cari</a>
      </div>
    </footer>
  `;

  window.scrollTo({ top: 0 });

  if (!id) {
    toast('ID drama tidak ditemukan', 'error');
    return;
  }

  // Load detail + chapters + related in parallel
  const [detailRes, chapRes, relRes] = await Promise.all([
    API.detail(id),
    API.chapters(id),
    API.recommend(),
  ]);

  // Parse detail
  const dd = detailRes?.data || detailRes?.result || detailRes || {};
  const info = dd.drama || dd.detail || dd.info || dd.book || dd;
  const realTitle = getVal(info, 'title', 'name', 'drama_title') || title;
  const desc = getVal(info, 'introduction', 'description', 'synopsis', 'summary') || 'Tidak ada sinopsis tersedia.';
  const rating = getVal(info, 'score', 'rating');
  const year = getVal(info, 'release_year', 'year');
  const status = getVal(info, 'status', 'drama_status');
  const tags = info.tags || info.tagList || info.genres || info.categories || [];
  const hCover = imgFallback(getVal(info, 'cover_horizontal', 'coverHorizontalUrl') || cover);
  const vCover = imgFallback(getVal(info, 'cover_vertical', 'coverVerticalUrl') || cover);

  // Update UI
  document.getElementById('detailBg').style.backgroundImage = `url('${hCover}')`;
  document.getElementById('detailPoster').src = vCover;
  document.getElementById('detailTitle').textContent = realTitle;
  document.getElementById('detailDesc').textContent = desc;
  setTitle(realTitle);

  // Tags
  const tagArr = Array.isArray(tags) ? tags.map(t => t.tagName || t.name || t.genre || String(t)).filter(Boolean) : [];
  const metaTags = [
    rating && `★ ${parseFloat(rating).toFixed(1)}`,
    year && `📅 ${year}`,
    status && `📺 ${status}`,
  ].filter(Boolean);
  document.getElementById('detailTags').innerHTML = [...metaTags, ...tagArr.slice(0, 4)].map(t => `<span class="tag">${t}</span>`).join('');

  // Episodes
  const eps = getList(chapRes?.data || chapRes?.result || chapRes);
  const sorted = eps.sort((a, b) => (+getVal(a,'episode_no','ep','num','order',0)) - (+getVal(b,'episode_no','ep','num','order',0)));
  
  const epsGrid = document.getElementById('epsGrid');
  document.getElementById('epsTitleEl').textContent = `Episode (${sorted.length})`;

  if (sorted.length) {
    epsGrid.innerHTML = sorted.slice(0, 60).map(ep => {
      const no = getVal(ep, 'episode_no', 'ep', 'num', 'order') || '?';
      const epName = getVal(ep, 'name', 'title', 'episode_title') || `Episode ${no}`;
      const epId = getVal(ep, 'id', 'chapter_id', 'episode_id') || no;
      const url = getVal(ep, 'play_url', 'playUrl', 'video_url', 'stream_url', 'url');
      return `<div class="ep-item" onclick="window.__playEp('${encodeURIComponent(url)}','${encodeURIComponent(epName)}','${epId}','${id}')">
        <div class="ep-num">${no}</div>
        <div class="ep-info">
          <div class="ep-name">${epName}</div>
          <div class="ep-meta">${ep.duration ? ep.duration + 'm' : 'Tap untuk tonton'}</div>
        </div>
        <div class="ep-play-btn">▶</div>
      </div>`;
    }).join('');
    if (sorted.length > 60) {
      epsGrid.innerHTML += `<div style="grid-column:1/-1;text-align:center;color:var(--muted);font-size:0.78rem;padding:0.5rem">+${sorted.length - 60} episode lainnya</div>`;
    }

    // Watch Ep 1 button
    const ep1 = sorted[0];
    const ep1Url = getVal(ep1, 'play_url', 'playUrl', 'video_url', 'stream_url', 'url');
    const ep1Id = getVal(ep1, 'id', 'chapter_id', 'episode_id');
    document.getElementById('watchEp1Btn').textContent = '▶ Tonton Episode 1';
    document.getElementById('watchEp1Btn').onclick = () =>
      window.__playEp(encodeURIComponent(ep1Url), encodeURIComponent('Episode 1'), ep1Id, id);
  } else {
    epsGrid.innerHTML = '<p style="color:var(--muted);font-size:0.85rem">Episode tidak ditemukan.</p>';
    document.getElementById('watchEp1Btn').textContent = '▶ Tonton';
    document.getElementById('watchEp1Btn').onclick = () => toast('Episode tidak tersedia', 'error');
  }

  // Action buttons
  document.getElementById('detailBtns').innerHTML = `
    <button class="btn btn-red" id="watchEp1Btn" onclick="document.getElementById('epsGrid').scrollIntoView({behavior:'smooth'})">▶ Pilih Episode</button>
    <button class="btn btn-ghost" onclick="window.__nav('/')">← Kembali</button>
  `;

  // Related
  const relItems = getList(relRes);
  const relRow = document.getElementById('relRow');
  relRow.innerHTML = relItems.length ? relItems.slice(0, 10).map(d => cardHTML(d)).join('') : '<p style="color:var(--muted)">Tidak ada rekomendasi.</p>';
}

// Player
window.__playEp = async function(urlEnc, nameEnc, epId, bookId) {
  const rawUrl = decodeURIComponent(urlEnc);
  const name = decodeURIComponent(nameEnc);

  // Try to get stream URL from API
  let streamUrl = rawUrl;
  if (!rawUrl || rawUrl === 'undefined') {
    toast('Mengambil stream URL...', 'info');
    const streamRes = await API.stream({ bookId, chapterId: epId });
    const data = streamRes?.data || streamRes?.result || streamRes || {};
    streamUrl = getVal(data, 'stream_url', 'play_url', 'url', 'hls_url', 'mp4_url');
  }

  const playerSection = document.getElementById('playerSection');
  const playerWrap = document.getElementById('playerWrap');
  playerSection.style.display = 'block';
  playerSection.scrollIntoView({ behavior: 'smooth' });

  if (streamUrl && streamUrl !== 'undefined') {
    // Try HLS/MP4
    if (streamUrl.includes('.m3u8') || streamUrl.includes('.mp4') || streamUrl.startsWith('http')) {
      playerWrap.innerHTML = `
        <video controls autoplay style="width:100%;height:100%;background:#000" playsinline>
          <source src="${streamUrl}" type="${streamUrl.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4'}">
          Browser kamu tidak mendukung video ini.
        </video>`;
      toast(`Memutar: ${name}`, 'success');
    } else {
      // External URL — open in new tab
      window.open(streamUrl, '_blank');
      playerSection.style.display = 'none';
      toast('Membuka di tab baru...', 'success');
    }
  } else {
    playerWrap.innerHTML = `
      <div class="player-placeholder">
        <div class="play-icon">🎬</div>
        <p>Stream URL tidak tersedia untuk episode ini.</p>
        <button class="btn btn-outline btn-sm" onclick="document.getElementById('playerSection').style.display='none'">Tutup Player</button>
      </div>`;
    toast('Stream tidak tersedia', 'error');
  }
};
