// ═══════════════════════════════════════════════════════════
//  SOULRADE — api.js
//  Last.fm        → bio, stats, tags, top tracks, similares
//  MusicBrainz    → discografía
//  Cover Art Archive → imágenes de álbumes
//  TheAudioDB     → fotos de artistas
// ═══════════════════════════════════════════════════════════

const LASTFM_KEY  = "575c583beb1193710327f12896a85ad5";
const LASTFM_BASE = "https://ws.audioscrobbler.com/2.0/";
const MB_BASE     = "https://musicbrainz.org/ws/2/";
const MB_HEADERS  = { headers: { "User-Agent": "Soulrade/1.0 (soulrade@email.com)" } };
const AUDIODB_BASE = "https://www.theaudiodb.com/api/v1/json/2/";

// ── Last.fm ──────────────────────────────────────────────────
async function lastfm(params) {
    const url = new URL(LASTFM_BASE);
    Object.entries({ ...params, api_key: LASTFM_KEY, format: "json" })
          .forEach(([k, v]) => url.searchParams.set(k, v));
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Last.fm ${r.status}`);
    return r.json();
}

async function getArtistInfo(name)             { return lastfm({ method: "artist.getinfo",      artist: name, autocorrect: 1 }); }
async function getTopTracks(name, limit = 10)  { return lastfm({ method: "artist.gettoptracks", artist: name, limit, autocorrect: 1 }); }
async function getSimilarArtists(name, limit = 8) { return lastfm({ method: "artist.getsimilar", artist: name, limit, autocorrect: 1 }); }
async function searchArtists(query, limit = 6) { return lastfm({ method: "artist.search",       artist: query, limit }); }

// ── TheAudioDB — fotos de artistas ──────────────────────────
async function getArtistImage(name) {
    try {
        const r = await fetch(`${AUDIODB_BASE}search.php?s=${encodeURIComponent(name)}`);
        const d = await r.json();
        const a = d?.artists?.[0];
        if (!a) return { thumb: null, fanart: null };
        return {
            thumb:  a.strArtistThumb   || null,
            fanart: a.strArtistFanart  || a.strArtistFanart2 || a.strArtistBanner || null
        };
    } catch { return { thumb: null, fanart: null }; }
}

async function getSimilarImage(name) {
    try {
        const r = await fetch(`${AUDIODB_BASE}search.php?s=${encodeURIComponent(name)}`);
        const d = await r.json();
        return d?.artists?.[0]?.strArtistThumb || null;
    } catch { return null; }
}

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

// ── Cover Art Archive — imágenes de álbumes ──────────────────
async function getAlbumCover(mbid) {
    try {
        const r = await fetch(`https://coverartarchive.org/release-group/${mbid}`, {
            headers: { "User-Agent": "Soulrade/1.0" }
        });
        if (!r.ok) return null;
        const d = await r.json();
        const front = d.images?.find(i => i.front) || d.images?.[0];
        return front?.thumbnails?.large || front?.image || null;
    } catch { return null; }
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