// ── Buscador-Generos.js ─────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {

    const base = window.location.pathname.includes('/templates/') ? '../templates/' : 'templates/';

    const params = new URLSearchParams(window.location.search);
    const genero = (params.get("genero") || "").trim();

    // ── Mapeo de tags: el tag del URL → el tag real de Last.fm que da mejores resultados ──
    // Igual que Carruseles-Index usa 'classic rock' en vez de 'rock' para obtener Queen, AC/DC, etc.
    const TAG_MAP = {
        "pop":        "pop",
        "rock":       "classic rock",   // 'rock' genérico trae indie moderno; 'classic rock' trae Queen, Led Zeppelin, AC/DC
        "hip-hop":    "hip hop",        // guión no funciona bien en Last.fm
        "electronic": "electronic",
        "jazz":       "jazz",
        "classical":  "classical",
        "soul":       "rnb",            // 'soul' trae resultados mixtos; 'rnb' es más consistente en Last.fm
        "metal":      "heavy metal",    // 'metal' trae resultados muy variados; 'heavy metal' focaliza mejor
        "indie":      "indie",
        "latin":      "latin",
    };

    // Tag real que se manda a la API
    const tagApi = TAG_MAP[genero.toLowerCase()] || genero;

    // ── Título del género ────────────────────────────────────
    const tituloGenero = document.querySelector(".busq-titulo, #titulo-genero");
    if (tituloGenero && genero) {
        tituloGenero.textContent = genero.toUpperCase();
    }

    // ── Helpers ──────────────────────────────────────────────
    function fmtNum(n) {
        const num = parseInt(n) || 0;
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
        if (num >= 1_000)    return Math.round(num / 1_000) + "K";
        return num.toString();
    }

    function setMsg(trackEl, msg) {
        if (trackEl) trackEl.innerHTML = `<div class="index-loading">${msg}</div>`;
    }

    // Imagen de artista via Spotify → iTunes (idéntico a Carruseles-Index)
    async function getImgArtista(nombre, fallback = "../assets/Artista 1.jfif") {
        try {
            const imgs = await getArtistImage(nombre);
            if (imgs && imgs.thumb) return imgs.thumb;
        } catch { /* sigue */ }
        return fallback;
    }

    // ── Refs a los tracks ────────────────────────────────────
    const artistasTrack = document.getElementById("artistas-track");
    const cancionesTrack = document.getElementById("canciones-track");
    const albumesTrack   = document.getElementById("albumes-track");

    if (!genero) {
        setMsg(artistasTrack,  "Seleccioná un género.");
        setMsg(cancionesTrack, "Seleccioná un género.");
        setMsg(albumesTrack,   "Seleccioná un género.");
        return;
    }

    setMsg(artistasTrack,  "Cargando artistas...");
    setMsg(cancionesTrack, "Cargando canciones...");
    setMsg(albumesTrack,   "Cargando álbumes...");

    try {
        // ── Fetch inicial en paralelo con el tag correcto ────
        const [artistasRes, cancionesRes] = await Promise.all([
            lastfm({ method: "tag.gettopartists", tag: tagApi, limit: 15 }),
            lastfm({ method: "tag.gettoptracks",  tag: tagApi, limit: 15 })
        ]);

        const artistas  = artistasRes?.topartists?.artist || [];
        const canciones = cancionesRes?.tracks?.track     || [];

        // ════════════════════════════════════════════════════
        // ARTISTAS
        // 1) Render inmediato con placeholder
        // 2) Imágenes en paralelo — actualizar cada una ni bien llega
        // ════════════════════════════════════════════════════
        artistasTrack.innerHTML = "";

        artistas.forEach((a, i) => {
            const div = document.createElement("div");
            div.className = "artista-card";
            div.dataset.artistaIdx = i;
            div.style.cursor = "pointer";
            div.innerHTML = `
                <div class="artista-foto-wrap">
                    <img class="artista-foto"
                         src="../assets/Artista 1.jfif"
                         alt="${a.name}"
                         onerror="this.src='../assets/Artista 1.jfif'">
                </div>
                <div class="artista-rating">${fmtNum(a.listeners)} oyentes</div>
                <div class="artista-nombre">${a.name}</div>`;
            div.addEventListener("click", () => {
                window.location.href = base + `artista.html?artista=${encodeURIComponent(a.name)}`;
            });
            artistasTrack.appendChild(div);
        });

        artistas.forEach(async (a, i) => {
            try {
                const foto = await getImgArtista(a.name, "../assets/Artista 1.jfif");
                const img  = artistasTrack.querySelector(`[data-artista-idx="${i}"] .artista-foto`);
                if (img && foto) img.src = foto;
            } catch { /* mantener placeholder */ }
        });

        // ════════════════════════════════════════════════════
        // CANCIONES
        // 1) Render inmediato con placeholder
        // 2) Portadas en paralelo — actualizar cada una ni bien llega
        // ════════════════════════════════════════════════════
        const PH_CANCION = "../assets/Mosaico 1.png";
        cancionesTrack.innerHTML = "";

        canciones.forEach((t, i) => {
            const artista = t.artist?.name || t.artist || "";
            const div = document.createElement("div");
            div.className = "media-card";
            div.dataset.cancionIdx = i;
            div.style.cursor = "pointer";
            div.innerHTML = `
                <div class="media-thumb-wrap">
                    <img class="media-thumb"
                         src="${PH_CANCION}"
                         alt="${t.name}"
                         onerror="this.src='${PH_CANCION}'">
                </div>
                <div class="media-rating">#${i + 1}</div>
                <div class="media-titulo">${t.name}</div>
                <div class="media-artista">${artista}</div>`;
            div.addEventListener("click", () => {
                window.location.href = base +
                    `cancion.html?artista=${encodeURIComponent(artista)}&cancion=${encodeURIComponent(t.name)}`;
            });
            cancionesTrack.appendChild(div);
        });

        canciones.forEach(async (t, i) => {
            try {
                const artista = t.artist?.name || t.artist || "";
                const portada = await getTrackCover(artista, t.name);
                const img     = cancionesTrack.querySelector(`[data-cancion-idx="${i}"] .media-thumb`);
                if (img && portada) img.src = portada;
            } catch { /* mantener placeholder */ }
        });

        // ════════════════════════════════════════════════════
        // ÁLBUMES — idéntico a "Álbumes Populares" de Carruseles-Index:
        // 1) Por cada artista del tag → artist.gettopalbums (top 1)
        // 2) Render inmediato con placeholder
        // 3) Promise.all de getAlbumCover → actualizar todas las portadas
        // ════════════════════════════════════════════════════
        const PH_ALBUM = "../assets/Mosaico 1.png";
        albumesTrack.innerHTML = "";

        const albumsData = [];
        for (let i = 0; i < Math.min(10, artistas.length); i++) {
            try {
                const nombreArtista = artistas[i].name;
                const topAlbums = await lastfm({
                    method:      "artist.gettopalbums",
                    artist:      nombreArtista,
                    limit:       1,
                    autocorrect: 1
                });
                const album = topAlbums?.topalbums?.album?.[0];
                if (album && album.name && album.name !== "(null)") {
                    albumsData.push({
                        titulo:    `${nombreArtista} - ${album.name}`,
                        artista:   nombreArtista,
                        album:     album.name,
                        playcount: parseInt(album.playcount) || 0
                    });
                }
            } catch { /* skip este artista */ }
        }

        albumsData.forEach((item, i) => {
            const div = document.createElement("div");
            div.className = "album-card";
            div.dataset.albumIdx = i;
            div.style.cursor = "pointer";
            const playcountLabel = item.playcount > 0 ? fmtNum(item.playcount) + " plays" : "";
            div.innerHTML = `
                <div class="album-cover-wrap">
                    <img class="album-cover"
                         src="${PH_ALBUM}"
                         alt="${item.titulo}"
                         onerror="this.src='${PH_ALBUM}'">
                </div>
                <div class="album-rating">${playcountLabel}</div>
                <div class="album-titulo">${item.titulo}</div>`;
            div.addEventListener("click", () => {
                window.location.href = base +
                    `album.html?artista=${encodeURIComponent(item.artista)}&album=${encodeURIComponent(item.album)}`;
            });
            albumesTrack.appendChild(div);
        });

        // Promise.all para todas las portadas a la vez (igual que Carruseles-Index)
        const covers = await Promise.all(
            albumsData.map(item =>
                getAlbumCover(item.artista, item.album).catch(() => null)
            )
        );
        covers.forEach((src, i) => {
            if (!src) return;
            const img = albumesTrack.querySelector(`[data-album-idx="${i}"] .album-cover`);
            if (img) img.src = src;
        });

    } catch (e) {
        console.error(e);
        setMsg(artistasTrack,  "Error cargando artistas.");
        setMsg(cancionesTrack, "Error cargando canciones.");
        setMsg(albumesTrack,   "Error cargando álbumes.");
    }

    // ── Carrusel genérico (mismo listener que Carruseles-Index) ──
    document.querySelectorAll(".carrusel-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const trackId = btn.getAttribute("data-target");
            const track   = document.getElementById(trackId);
            if (!track) return;
            const card = track.querySelector(".artista-card, .media-card, .album-card");
            if (!card) return;
            const scrollAmount = card.offsetWidth + parseInt(getComputedStyle(track).gap || 24);
            if (btn.classList.contains("carrusel-prev")) {
                track.scrollBy({ left: -scrollAmount, behavior: "smooth" });
            } else {
                track.scrollBy({ left: scrollAmount, behavior: "smooth" });
            }
        });
    });

});