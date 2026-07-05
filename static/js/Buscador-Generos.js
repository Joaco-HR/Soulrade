document.addEventListener("DOMContentLoaded", async () => {
    const base = '/';
    const params = new URLSearchParams(window.location.search);
    const genero = (params.get("genero") || "").trim();

    const TAG_MAP = {
        "pop":        "pop",
        "rock":       "classic rock",   
        "hip-hop":    "hip hop",        
        "electronic": "electronic",
        "jazz":       "jazz",
        "classical":  "classical",
        "soul":       "rnb",            
        "metal":      "heavy metal",    
        "indie":      "indie",
        "latin":      "latin",
    };

    const tagApi = TAG_MAP[genero.toLowerCase()] || genero;

    const tituloGenero = document.querySelector(".busq-titulo, #titulo-genero");
    if (tituloGenero && genero) {
        tituloGenero.textContent = genero.toUpperCase();
    }

    function fmtNum(n) {
        const num = parseInt(n) || 0;
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
        if (num >= 1_000)    return Math.round(num / 1_000) + "K";
        return num.toString();
    }

    function setMsg(trackEl, msg) {
        if (trackEl) trackEl.innerHTML = `<div class="index-loading">${msg}</div>`;
    }

    async function getImgArtista(nombre, fallback = "../assets/Artista 1.jfif") {
        try {
            const imgs = await getArtistImage(nombre);
            if (imgs && imgs.thumb) return imgs.thumb;
        } catch {}
        return fallback;
    }

    const artistasTrack = document.getElementById("artistas-track");
    const cancionesTrack = document.getElementById("canciones-track");
    const albumesTrack   = document.getElementById("albumes-track");

    if (!genero) {
        setMsg(artistasTrack,  "Seleccioná un género.");
        setMsg(cancionesTrack, "Seleccioná un género.");
        setMsg(albumesTrack,   "Seleccioná un género.");
        return;
    }

    setMsg(artistasTrack,  `${(window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('carga.artistas')) || 'Cargando artistas...'}`);
    setMsg(cancionesTrack, `${(window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('carga.canciones')) || 'Cargando canciones...'}`);
    setMsg(albumesTrack,   `${(window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('carga.albumes')) || 'Cargando álbumes...'}`);

    try {
        const [artistasRes, cancionesRes] = await Promise.all([
            lastfm({ method: "tag.gettopartists", tag: tagApi, limit: 15 }),
            lastfm({ method: "tag.gettoptracks",  tag: tagApi, limit: 15 })
        ]);

        const artistas  = artistasRes?.topartists?.artist || [];
        const canciones = cancionesRes?.tracks?.track     || [];

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
                <div class="artista-rating">${fmtNum(a.listeners)} <span data-i18n="unidad.oyentes">${(window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('unidad.oyentes')) || 'oyentes'}</span></div>
                <div class="artista-nombre">${a.name}</div>`;
            div.addEventListener("click", () => {
                window.location.href = base + `artista/?artista=${encodeURIComponent(a.name)}`;
            });
            artistasTrack.appendChild(div);
        });

        artistas.forEach(async (a, i) => {
            try {
                const foto = await getImgArtista(a.name, "../assets/Artista 1.jfif");
                const img  = artistasTrack.querySelector(`[data-artista-idx="${i}"] .artista-foto`);
                if (img && foto) img.src = foto;
            } catch {}
        });

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
                    `cancion/?artista=${encodeURIComponent(artista)}&cancion=${encodeURIComponent(t.name)}`;
            });
            cancionesTrack.appendChild(div);
        });

        canciones.forEach(async (t, i) => {
            try {
                const artista = t.artist?.name || t.artist || "";
                const portada = await getTrackCover(artista, t.name);
                const img     = cancionesTrack.querySelector(`[data-cancion-idx="${i}"] .media-thumb`);
                if (img && portada) img.src = portada;
            } catch {}
        });

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
            } catch {}
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
                    `album/?artista=${encodeURIComponent(item.artista)}&album=${encodeURIComponent(item.album)}`;
            });
            albumesTrack.appendChild(div);
        });

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