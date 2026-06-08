// ── Pagina-Cancion.js ────────────────────────────────────────
// Lee ?artista= y ?cancion= de la URL y rellena toda la página

document.addEventListener('DOMContentLoaded', async () => {

    const params       = new URLSearchParams(window.location.search);
    const nombreArtista = params.get('artista') || 'Lady Gaga';
    const nombreCancion = params.get('cancion')  || 'Die With a Smile';

    const base = window.location.pathname.includes('/templates/') ? '../templates/' : 'templates/';

    // ── Helpers ──────────────────────────────────────────────
    function fmt(n) {
        const num = parseInt(n) || 0;
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000)    return Math.round(num / 1000) + 'K';
        return num.toString();
    }
    function shimmer(el) { el && el.classList.add('shimmer'); }
    function unshimmer(el) { el && el.classList.remove('shimmer'); }

    // ── Título de pestaña ────────────────────────────────────
    document.title = nombreCancion + ' - ' + nombreArtista + ' | SOULRADE';

    // ── Elementos del DOM ────────────────────────────────────
    const elTitulo    = document.getElementById('cancion-titulo');
    const elOyentes   = document.getElementById('cancion-oyentes');
    const elBio       = document.getElementById('cancion-bio');
    const elPanoramica= document.querySelector('.presentacion-foto-panoramica img');
    const elArtistaWrap = document.getElementById('artista-foto-wrap');
    const elArtistaNombre = document.getElementById('artista-nombre-link');
    const elArtistaDesc   = document.getElementById('artista-desc-link');
    const elArtistaImg    = elArtistaWrap && elArtistaWrap.querySelector('img');
    const elArtistaLink   = elArtistaWrap && elArtistaWrap.closest('a');

    // ── Mostrar nombres inmediatamente ───────────────────────
    if (elTitulo)   elTitulo.textContent  = nombreCancion;
    if (elOyentes)  elOyentes.textContent = 'Cargando...';
    if (elBio)      elBio.textContent     = '';
    if (elArtistaNombre) elArtistaNombre.textContent = nombreArtista;
    shimmer(elPanoramica);
    shimmer(elArtistaImg);

    // ── Link al artista ──────────────────────────────────────
    if (elArtistaLink) {
        elArtistaLink.href = base + 'artista.html?artista=' + encodeURIComponent(nombreArtista);
    }

    // ── Actualizar links de plataformas ──────────────────────
    const query = encodeURIComponent(nombreCancion + ' ' + nombreArtista);
    const platLinks = {
        'open.spotify.com':   `https://open.spotify.com/search/${query}`,
        'music.apple.com':    `https://music.apple.com/search?term=${query}`,
        'music.youtube.com':  `https://music.youtube.com/search?q=${query}`,
        'music.amazon.com':   `https://music.amazon.com/search/${query}`
    };
    document.querySelectorAll('.plataforma-link').forEach(a => {
        for (const [domain, url] of Object.entries(platLinks)) {
            if (a.href && a.href.includes(domain)) { a.href = url; break; }
        }
    });

    // ── Info de la canción (Last.fm track.getInfo) ───────────
    try {
        const info  = await lastfm({ method: 'track.getinfo', track: nombreCancion, artist: nombreArtista, autocorrect: 1 });
        const track = info && info.track;
        if (track) {
            const plays = track.playcount ? fmt(track.playcount) + ' reproducciones' : '';
            if (elOyentes) elOyentes.textContent = plays;

            const wikiRaw = track.wiki && (track.wiki.summary || track.wiki.content) || '';
            if (elBio) elBio.textContent = cleanBio(wikiRaw) || 'Sin descripción disponible.';
        } else {
            if (elOyentes) elOyentes.textContent = '';
            if (elBio) elBio.textContent = 'Sin descripción disponible.';
        }
    } catch (e) {
        if (elOyentes) elOyentes.textContent = '';
        if (elBio) elBio.textContent = 'Sin descripción disponible.';
    }

    // ── Imagen de portada (cover del álbum o foto del artista) ──
    try {
        const cover = await getAlbumCover(nombreArtista, nombreCancion);
        const url   = cover || (await getArtistImage(nombreArtista)).thumb;
        if (url && elPanoramica) { elPanoramica.src = url; elPanoramica.alt = nombreCancion; }
    } catch (e) { /* mantener placeholder */ }
    unshimmer(elPanoramica);

    // ── Foto del artista (portrait lateral) ──────────────────
    try {
        const imgs = await getArtistImage(nombreArtista);
        const url  = imgs && (imgs.thumb || imgs.fanart);
        if (url && elArtistaImg) { elArtistaImg.src = url; elArtistaImg.alt = nombreArtista; }

        // Bio breve del artista en el overlay
        if (elArtistaDesc) {
            const infoArt = await getArtistInfo(nombreArtista);
            const artObj  = infoArt && infoArt.artist;
            if (artObj) {
                const tags = artObj.tags && artObj.tags.tag;
                const genre = tags && tags[0] && tags[0].name ? tags[0].name : '';
                const oyentes = artObj.stats && artObj.stats.listeners ? fmt(artObj.stats.listeners) + ' oyentes' : '';
                elArtistaDesc.textContent = [genre, oyentes].filter(Boolean).join(' · ') || '';
            }
        }
    } catch (e) { /* mantener placeholder */ }
    unshimmer(elArtistaImg);

    // ── Carrusel: Canciones similares (top tracks del artista, excluyendo la actual) ──
    const cancionesTrack = document.getElementById('canciones-track');
    if (cancionesTrack) {
        cancionesTrack.innerHTML = '<div class="index-loading">Cargando canciones similares...</div>';
        try {
            const data   = await getTopTracks(nombreArtista, 15);
            const tracks = (data && data.toptracks && data.toptracks.track) || [];
            // Excluir la canción actual
            const similares = tracks.filter(t => t.name.toLowerCase() !== nombreCancion.toLowerCase());

            cancionesTrack.innerHTML = '';
            if (!similares.length) {
                cancionesTrack.innerHTML = '<div class="index-loading">Sin canciones similares.</div>';
            } else {
                for (const t of similares) {
                    const div = document.createElement('div');
                    div.className = 'media-card';
                    div.style.cursor = 'pointer';
                    const plays = t.playcount ? fmt(t.playcount) + ' plays' : '';
                    div.innerHTML = `
                        <div class="media-thumb-wrap">
                            <img src="assets/Mosaico 1.png" alt="${t.name}" class="media-thumb"
                                 onerror="this.src='assets/Mosaico 1.png'">
                        </div>
                        <div class="media-rating">${plays}</div>
                        <div class="media-titulo">${t.name}</div>
                        <div class="media-artista">${nombreArtista}</div>`;
                    div.addEventListener('click', () => {
                        window.location.href = base + 'cancion.html?artista=' +
                            encodeURIComponent(nombreArtista) + '&cancion=' + encodeURIComponent(t.name);
                    });
                    cancionesTrack.appendChild(div);

                    getAlbumCover(nombreArtista, t.name)
                        .then(url => url && (div.querySelector('img').src = url))
                        .catch(() => {});
                }
            }
        } catch (e) {
            cancionesTrack.innerHTML = '<div class="index-loading">Error al cargar canciones similares.</div>';
        }
    }

    // ── Carrusel genérico (flechas) ──────────────────────────
    document.querySelectorAll('.carrusel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const trackId = btn.getAttribute('data-target');
            const track   = document.getElementById(trackId);
            if (!track) return;
            const card = track.querySelector('.artista-card, .media-card, .album-card');
            if (!card) return;
            const amount = card.offsetWidth + parseInt(getComputedStyle(track).gap || 24);
            track.scrollBy({ left: btn.classList.contains('carrusel-prev') ? -amount : amount, behavior: 'smooth' });
        });
    });
});