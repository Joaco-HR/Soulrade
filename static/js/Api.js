const LASTFM_KEY = "575c583beb1193710327f12896a85ad5";
const LASTFM_BASE = "https://ws.audioscrobbler.com/2.0/";
const MB_BASE = "https://musicbrainz.org/ws/2/";
const MB_HEADERS = { headers: { "User-Agent": "Soulrade/1.0 (soulrade@email.com)" } };
const SPOTIFY_CLIENT_ID = "2d126d716b984f7a8f6360e8bc46344b";
const SPOTIFY_CLIENT_SECRET = "63ec833b066849c6972c510e8f52d7f9";

// ── Spotify — token auto-renovable ──────────────────────────
var _spToken = null,
    _spExp = 0,
    _spDead = false;

async function getSpotifyToken() {
    if (_spDead) return null;
    if (_spToken && Date.now() < _spExp) return _spToken;
    try {
        var r = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: "grant_type=client_credentials&client_id=" + SPOTIFY_CLIENT_ID + "&client_secret=" + SPOTIFY_CLIENT_SECRET
        });
        var d = await r.json();
        if (!d.access_token) { _spDead = true; return null; }
        _spToken = d.access_token;
        _spExp = Date.now() + (d.expires_in - 60) * 1000;
        return _spToken;
    } catch (e) { _spDead = true; return null; }
}

async function sp(endpoint) {
    var token = await getSpotifyToken();
    if (!token) return null;
    try {
        var r = await fetch("https://api.spotify.com/v1" + endpoint, {
            headers: { Authorization: "Bearer " + token }
        });
        if (r.status === 429 || r.status === 401 || r.status === 403) {
            _spDead = true;
            return null;
        }
        return r.ok ? r.json() : null;
    } catch (e) { return null; }
}

// ── iTunes — fallback imágenes de artistas (sin CORS) ────────
async function getArtistImageItunes(name) {
    try {
        var r = await fetch(
            "https://itunes.apple.com/search?term=" + encodeURIComponent(name) +
            "&entity=musicArtist&limit=1"
        );
        if (!r.ok) return null;
        var d = await r.json();
        var artist = d && d.results && d.results[0];
        if (!artist) return null;
        // artworkUrl100 existe en algunos artistas; si no, buscamos via álbum
        if (artist.artworkUrl100) return artist.artworkUrl100.replace("100x100", "600x600");
        return null;
    } catch (e) { return null; }
}

// iTunes imagen via álbum del artista (más confiable)
async function getArtistImageViaAlbum(name) {
    try {
        var r = await fetch(
            "https://itunes.apple.com/search?term=" + encodeURIComponent(name) +
            "&entity=album&limit=3"
        );
        if (!r.ok) return null;
        var d = await r.json();
        var results = d && d.results || [];
        for (var i = 0; i < results.length; i++) {
            if (results[i].artworkUrl100) {
                return results[i].artworkUrl100.replace("100x100bb", "600x600bb");
            }
        }
        return null;
    } catch (e) { return null; }
}

// ── Cover Art Archive — fallback portadas de álbumes ─────────
async function getAlbumCoverCAA(artistName, albumName) {
    try {
        var query = encodeURIComponent('"' + albumName + '" AND artist:"' + artistName + '"');
        var r = await fetch(MB_BASE + "release/?query=" + query + "&limit=1&fmt=json", MB_HEADERS);
        if (!r.ok) return null;
        var d = await r.json();
        if (!d.releases || !d.releases[0]) return null;
        var mbid = d.releases[0].id;
        var coverReq = await fetch("https://coverartarchive.org/release/" + mbid + "/front", { redirect: "follow" });
        if (coverReq.ok) return coverReq.url;
        return null;
    } catch (e) { return null; }
}

// ── iTunes — portada de álbum ─────────────────────────────────
async function getAlbumCoverItunes(artistName, albumName) {
    try {
        var r = await fetch(
            "https://itunes.apple.com/search?term=" + encodeURIComponent(artistName + " " + albumName) +
            "&entity=album&limit=3"
        );
        if (!r.ok) return null;
        var d = await r.json();
        var results = d && d.results || [];
        for (var i = 0; i < results.length; i++) {
            var item = results[i];
            if (item.artworkUrl100 &&
                item.artistName.toLowerCase().indexOf(artistName.toLowerCase().substring(0, 4)) !== -1) {
                return item.artworkUrl100.replace("100x100bb", "600x600bb");
            }
        }
        if (results[0] && results[0].artworkUrl100) {
            return results[0].artworkUrl100.replace("100x100bb", "600x600bb");
        }
        return null;
    } catch (e) { return null; }
}

// ── API pública unificada ────────────────────────────────────

async function getArtistImage(name) {
    // 1. Spotify
    if (!_spDead) {
        try {
            var d = await sp("/search?q=" + encodeURIComponent(name) + "&type=artist&limit=1");
            var url = d && d.artists && d.artists.items && d.artists.items[0] &&
                d.artists.items[0].images && d.artists.items[0].images[0] &&
                d.artists.items[0].images[0].url;
            if (url) return { thumb: url, fanart: url };
        } catch (e) {}
    }
    // 2. iTunes via álbum (más confiable que artista directo)
    var itunesUrl = await getArtistImageViaAlbum(name);
    if (!itunesUrl) itunesUrl = await getArtistImageItunes(name);
    return { thumb: itunesUrl, fanart: itunesUrl };
}

async function getSimilarImage(name) {
    if (!_spDead) {
        try {
            var d = await sp("/search?q=" + encodeURIComponent(name) + "&type=artist&limit=1");
            var url = d && d.artists && d.artists.items && d.artists.items[0] &&
                d.artists.items[0].images && d.artists.items[0].images[0] &&
                d.artists.items[0].images[0].url;
            if (url) return url;
        } catch (e) {}
    }
    var itunesUrl = await getArtistImageViaAlbum(name);
    return itunesUrl || await getArtistImageItunes(name);
}

async function getAlbumCover(artistName, albumName) {
    // 1. Spotify
    if (!_spDead) {
        try {
            var q = encodeURIComponent("album:" + albumName + " artist:" + artistName);
            var d = await sp("/search?q=" + q + "&type=album&limit=1");
            var url = d && d.albums && d.albums.items && d.albums.items[0] &&
                d.albums.items[0].images && d.albums.items[0].images[0] &&
                d.albums.items[0].images[0].url;
            if (url) return url;
        } catch (e) {}
    }
    // 2. iTunes
    var itunesUrl = await getAlbumCoverItunes(artistName, albumName);
    if (itunesUrl) return itunesUrl;
    // 3. Cover Art Archive
    return await getAlbumCoverCAA(artistName, albumName);
}

// ── Last.fm ──────────────────────────────────────────────────
async function lastfm(params) {
    var url = new URL(LASTFM_BASE);
    var all = Object.assign({}, params, { api_key: LASTFM_KEY, format: "json" });
    Object.keys(all).forEach(function(k) { url.searchParams.set(k, all[k]); });
    var r = await fetch(url);
    if (!r.ok) throw new Error("Last.fm " + r.status);
    return r.json();
}

async function getArtistInfo(name) { return lastfm({ method: "artist.getinfo", artist: name, autocorrect: 1 }); }
async function getTopTracks(name, limit) { return lastfm({ method: "artist.gettoptracks", artist: name, limit: limit || 10, autocorrect: 1 }); }
async function getSimilarArtists(name, limit) { return lastfm({ method: "artist.getsimilar", artist: name, limit: limit || 8, autocorrect: 1 }); }
async function searchArtists(query, limit) { return lastfm({ method: "artist.search", artist: query, limit: limit || 6 }); }

// ── MusicBrainz — discografía ────────────────────────────────
async function getAlbums(mbid, limit) {
    if (!mbid) return [];
    try {
        var r = await fetch(
            MB_BASE + "release-group?artist=" + mbid + "&type=album&limit=" + (limit || 20) + "&fmt=json",
            MB_HEADERS
        );
        if (!r.ok) return [];
        var d = await r.json();
        return d["release-groups"] || [];
    } catch (e) { return []; }
}

// ── Portada específica de una canción ────────────────────────
// Busca el álbum al que pertenece via Last.fm y luego obtiene su portada
async function getTrackCover(artistName, trackName) {
    try {
        // 1. Last.fm track.getInfo para obtener el álbum al que pertenece
        const info  = await lastfm({ method: 'track.getinfo', track: trackName, artist: artistName, autocorrect: 1 });
        const album = info && info.track && info.track.album;
        if (album && album.title) {
            const cover = await getAlbumCover(artistName, album.title);
            if (cover) return cover;
        }
    } catch (e) { /* ignorar */ }

    // 2. Fallback: buscar directamente por nombre de canción como si fuera álbum
    return await getAlbumCover(artistName, trackName);
}

// ── Helpers ──────────────────────────────────────────────────
function formatNum(n) {
    var num = parseInt(n);
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return Math.round(num / 1000) + "K";
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