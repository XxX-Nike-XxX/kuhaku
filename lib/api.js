// ── lib/api.js ────────────────────────────────────────────
// Request ke /api/* → di-proxy Vercel ke https://api.dramaku.biz.id/api/*
// Tidak ada CORS karena request ke domain sendiri

async function req(path, params = {}) {
  try {
    const url = new URL(path, location.origin);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn('[API Error]', path, e.message);
    return null;
  }
}

// Smart list extractor
export function getList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const tries = [
    data?.data?.list, data?.data?.dramas, data?.data?.items, data?.data?.results,
    data?.result?.list, data?.result?.dramas, data?.result,
    data?.list, data?.dramas, data?.items, data?.results, data?.data,
  ];
  for (const t of tries) {
    if (Array.isArray(t) && t.length) return t;
  }
  for (const v of Object.values(data)) {
    if (Array.isArray(v) && v.length) return v;
    if (v && typeof v === 'object') {
      for (const v2 of Object.values(v)) {
        if (Array.isArray(v2) && v2.length) return v2;
      }
    }
  }
  return [];
}

export function getVal(obj, ...keys) {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  return '';
}

// ── Endpoints ─────────────────────────────────────────────
export const API = {
  home:       ()       => req('/api/home'),
  recommend:  ()       => req('/api/recommend'),
  categories: ()       => req('/api/categories'),
  vip:        ()       => req('/api/vip'),
  search:     (q)      => req('/api/search', { q }),
  category:   (id)     => req(`/api/category/${id}`),
  detail:     (bookId) => req(`/api/detail/${bookId}/v2`),
  chapters:   (bookId) => req(`/api/chapters/${bookId}`),
  stream:     (params) => req('/api/stream', params),
};
