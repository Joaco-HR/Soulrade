// ── Buscador-Generos.js ─────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {

    const params = new URLSearchParams(window.location.search);
    const genero = (params.get("genero") || "").trim();

    const tituloGenero =
        document.querySelector(".busq-titulo, #titulo-genero");

    if (tituloGenero && genero) {
        tituloGenero.textContent = genero.toUpperCase();
    }

    const artistasTrack = document.getElementById("artistas-track");
    const cancionesTrack = document.getElementById("canciones-track");
    const albumesTrack = document.getElementById("albumes-track");

    function setMsg(track, msg) {
        if (track) {
            track.innerHTML =
                `<div class="index-loading">${msg}</div>`;
        }
    }

    function formatNum(n) {
        n = parseInt(n) || 0;

        if (n >= 1000000)
            return (n / 1000000).toFixed(1) + "M";

        if (n >= 1000)
            return Math.round(n / 1000) + "K";

        return n.toString();
    }

    if (!genero) {

        setMsg(artistasTrack, "Seleccioná un género.");
        setMsg(cancionesTrack, "Seleccioná un género.");
        setMsg(albumesTrack, "Seleccioná un género.");

        return;
    }

    setMsg(artistasTrack, "Cargando artistas...");
    setMsg(cancionesTrack, "Cargando canciones...");
    setMsg(albumesTrack, "Cargando álbumes...");

    try {

        const [
            artistasRes,
            cancionesRes
        ] = await Promise.all([
            lastfm({
                method: "tag.gettopartists",
                tag: genero,
                limit: 15
            }),

            lastfm({
                method: "tag.gettoptracks",
                tag: genero,
                limit: 15
            })
        ]);

        // ─────────────────────────────
        // ARTISTAS
        // ─────────────────────────────

        artistasTrack.innerHTML = "";

        const artistas =
            artistasRes?.topartists?.artist || [];

        artistas.forEach((a, i) => {

            const card = document.createElement("div");

            card.className = "artista-card";
            card.dataset.artistaIdx = i;

            card.innerHTML = `
                <div class="artista-foto-wrap">
                    <img
                        class="artista-foto"
                        src="../assets/Artista 1.jfif"
                        alt="${a.name}">
                </div>

                <div class="artista-rating">
                    ${formatNum(a.listeners)} oyentes
                </div>

                <div class="artista-nombre">
                    ${a.name}
                </div>
            `;

            card.addEventListener("click", () => {

                window.location.href =
                    `artista.html?artista=${encodeURIComponent(a.name)}`;
            });

            artistasTrack.appendChild(card);
        });

        artistas.forEach(async (a, i) => {

            try {

                const imgData =
                    await getArtistImage(a.name);

                const img =
                    artistasTrack.querySelector(
                        `[data-artista-idx="${i}"] .artista-foto`
                    );

                if (img && imgData?.thumb) {
                    img.src = imgData.thumb;
                }

            } catch {}
        });

        // ─────────────────────────────
        // CANCIONES
        // ─────────────────────────────

        cancionesTrack.innerHTML = "";

        const canciones =
            cancionesRes?.tracks?.track || [];

        canciones.forEach((t, i) => {

            const artista =
                t.artist?.name ||
                t.artist ||
                "";

            const card = document.createElement("div");

            card.className = "media-card";
            card.dataset.cancionIdx = i;

            card.innerHTML = `
                <div class="media-thumb-wrap">
                    <img
                        class="media-thumb"
                        src="../assets/Mosaico 1.png"
                        alt="${t.name}">
                </div>

                <div class="media-rating">
                    #${i + 1}
                </div>

                <div class="media-titulo">
                    ${t.name}
                </div>

                <div class="media-artista">
                    ${artista}
                </div>
            `;

            card.addEventListener("click", () => {

                window.location.href =
                    `cancion.html?artista=${encodeURIComponent(artista)}&cancion=${encodeURIComponent(t.name)}`;
            });

            cancionesTrack.appendChild(card);
        });

        canciones.forEach(async (t, i) => {

            try {

                const artista =
                    t.artist?.name ||
                    t.artist ||
                    "";

                const portada =
                    await getTrackCover(
                        artista,
                        t.name
                    );

                const img =
                    cancionesTrack.querySelector(
                        `[data-cancion-idx="${i}"] .media-thumb`
                    );

                if (img && portada) {
                    img.src = portada;
                }

            } catch {}
        });

        // ─────────────────────────────
        // ÁLBUMES
        // ─────────────────────────────

        albumesTrack.innerHTML = "";

        const albumes = [];

        for (let i = 0; i < Math.min(10, artistas.length); i++) {

            try {

                const artista =
                    artistas[i].name;

                const topAlbums =
                    await lastfm({
                        method: "artist.gettopalbums",
                        artist: artista,
                        limit: 1,
                        autocorrect: 1
                    });

                const album =
                    topAlbums?.topalbums?.album?.[0];

                if (album) {

                    albumes.push({
                        artista,
                        nombre: album.name
                    });
                }

            } catch {}
        }

        albumes.forEach((al, i) => {

            const card =
                document.createElement("div");

            card.className = "album-card";
            card.dataset.albumIdx = i;

            card.innerHTML = `
                <div class="album-cover-wrap">
                    <img
                        class="album-cover"
                        src="../assets/Mosaico 1.png"
                        alt="${al.nombre}">
                </div>

                <div class="album-rating">
                    Top álbum
                </div>

                <div class="album-titulo">
                    ${al.nombre}
                </div>
            `;

            card.addEventListener("click", () => {

                window.location.href =
                    `album.html?artista=${encodeURIComponent(al.artista)}&album=${encodeURIComponent(al.nombre)}`;
            });

            albumesTrack.appendChild(card);
        });

        albumes.forEach(async (al, i) => {

            try {

                const portada =
                    await getAlbumCover(
                        al.artista,
                        al.nombre
                    );

                const img =
                    albumesTrack.querySelector(
                        `[data-album-idx="${i}"] .album-cover`
                    );

                if (img && portada) {
                    img.src = portada;
                }

            } catch {}
        });

    } catch (e) {

        console.error(e);

        setMsg(
            artistasTrack,
            "Error cargando artistas."
        );

        setMsg(
            cancionesTrack,
            "Error cargando canciones."
        );

        setMsg(
            albumesTrack,
            "Error cargando álbumes."
        );
    }
    document.querySelectorAll('.carrusel-btn').forEach(btn => {

    btn.addEventListener('click', () => {

        const trackId =
            btn.dataset.target;

        const track =
            document.getElementById(trackId);

        if (!track) return;

        const card =
            track.querySelector(
                '.artista-card, .media-card, .album-card'
            );

        if (!card) return;

        const gap =
            parseInt(
                getComputedStyle(track).gap
            ) || 24;

        const scrollAmount =
            card.offsetWidth + gap;

        track.scrollBy({
            left: btn.classList.contains('carrusel-prev')
                ? -scrollAmount * 3
                : scrollAmount * 3,
            behavior: 'smooth'
        });
    });
});
});