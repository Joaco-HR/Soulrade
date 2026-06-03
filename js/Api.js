// ═══════════════════════════════════════════════════════════
//  SOULRADE — api.js
//  Last.fm      → bio, stats, tags, top tracks, similares
//  MusicBrainz  → discografía
//  Spotify      → imágenes de artistas y álbumes
// ═══════════════════════════════════════════════════════════

const LASTFM_KEY            = "575c583beb1193710327f12896a85ad5";
const LASTFM_BASE           = "https://ws.audioscrobbler.com/2.0/";
const MB_BASE               = "https://musicbrainz.org/ws/2/";
const MB_HEADERS            = { headers: { "User-Agent": "Soulrade/1.0 (soulrade@email.com)" } };
const SPOTIFY_CLIENT_ID     = "2d126d716b984f7a8f6360e8bc46344b";
const SPOTIFY_CLIENT_SECRET = "63ec833b066849c6972c510e8f52d7f9";

// ── Spotify — token auto-renovable ──────────────────────────
let _spToken = null, _spExp = 0;
async function getSpotifyToken() {
    if (_spToken && Date.now() < _spExp) return _spToken;
    const r = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=client_credentials&client_id=${SPOTIFY_CLIENT_ID}&client_secret=${SPOTIFY_CLIENT_SECRET}`
    });
    const d = await r.json();
    _spToken = d.access_token;
    _spExp   = Date.now() + (d.expires_in - 60) * 1000;
    return _spToken;
}
async function sp(endpoint) {
    const token = await getSpotifyToken();
    const r = await fetch(`https://api.spotify.com/v1${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return r.ok ? r.json() : null;
}

// ── Spotify — imágenes ───────────────────────────────────────
async function getArtistImage(name) {
    try {
        const d = await sp(`/search?q=${encodeURIComponent(name)}&type=artist&limit=1`);
        const url = d?.artists?.items?.[0]?.images?.[0]?.url || null;
        return { thumb: url, fanart: url };
    } catch { return { thumb: null, fanart: null }; }
}

async function getSimilarImage(name) {
    try {
        const d = await sp(`/search?q=${encodeURIComponent(name)}&type=artist&limit=1`);
        return d?.artists?.items?.[0]?.images?.[0]?.url || null;
    } catch { return null; }
}

async function getAlbumCover(artistName, albumName) {
    try {
        const q = encodeURIComponent(`album:${albumName} artist:${artistName}`);
        const d = await sp(`/search?q=${q}&type=album&limit=1`);
        return d?.albums?.items?.[0]?.images?.[0]?.url || null;
    } catch { return null; }
}

// ── Last.fm ──────────────────────────────────────────────────
async function lastfm(params) {
    const url = new URL(LASTFM_BASE);
    Object.entries({ ...params, api_key: LASTFM_KEY, format: "json" })
          .forEach(([k, v]) => url.searchParams.set(k, v));
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Last.fm ${r.status}`);
    return r.json();
}

async function getArtistInfo(name)                { return lastfm({ method: "artist.getinfo",      artist: name, autocorrect: 1 }); }
async function getTopTracks(name, limit = 10)     { return lastfm({ method: "artist.gettoptracks", artist: name, limit, autocorrect: 1 }); }
async function getSimilarArtists(name, limit = 8) { return lastfm({ method: "artist.getsimilar",   artist: name, limit, autocorrect: 1 }); }
async function searchArtists(query, limit = 6)    { return lastfm({ method: "artist.search",       artist: query, limit }); }

// ── MusicBrainz — discografía ────────────────────────────────
async function getAlbums(mbid, limit = 20) {
    if (!mbid) return [];
    try {
        const r = await fetch(
            `${MB_BASE}release-group?artist=${mbid}&type=album&limit=${limit}&fmt=json`,
            MB_HEADERS
        );
        if (!r.ok) return [];
        const d = await r.json();
        return d["release-groups"] || [];
    } catch { return []; }
}

// ── Helpers ──────────────────────────────────────────────────
function formatNum(n) {
    const num = parseInt(n);
    if (!num) return "0";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000)     return Math.round(num / 1_000) + "K";
    return num.toString();
}

function cleanBio(bio) {
    if (!bio) return "";
    return bio
        .replace(/<a [^>]+>.*?<\/a>/gi, "")
        .replace(/\s*Read more on Last\.fm\.?/gi, "")
        .replace(/<[^>]+>/g, "")
        .trim();
}