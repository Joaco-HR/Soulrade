// ── Pagina-Artista.js ────────────────────────────────────────
// Lee ?artista= de la URL y rellena toda la página con datos reales
// de Last.fm + imágenes de Spotify/iTunes

document.addEventListener('DOMContentLoaded', async () => {

    // ── 1. Leer parámetro ────────────────────────────────────
    const params   = new URLSearchParams(window.location.search);
    const nombreArtista = params.get('artista') || 'Lady Gaga';

    // Ruta base para links internos (funciona desde /templates/ o raíz)
    const base = window.location.pathname.includes('/templates/') ? '../templates/' : 'templates/';

    // ── 2. Helpers ───────────────────────────────────────────
    function fmt(n) {
        const num = parseInt(n) || 0;
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000)    return Math.round(num / 1000) + 'K';
        return num.toString();
    }

    function shimmer(el) { el && el.classList.add('shimmer'); }
    function unshimmer(el) { el && el.classList.remove('shimmer'); }

    // ── 3. Actualizar título de la pestaña ───────────────────
    document.title = nombreArtista + ' | SOULRADE';

    // ── 4. Mostrar nombre inmediatamente ─────────────────────
    const elNombre    = document.querySelector('.presentacion-nombre h1');
    const elOyentes   = document.querySelector('.presentacion-nombre h2');
    const elBio       = document.querySelector('.presentacion-bio p');
    const elPortrait  = document.querySelector('.presentacion-foto-portrait img');
    const elPanoramica= document.querySelector('.presentacion-foto-panoramica img');

    if (elNombre)  elNombre.textContent = nombreArtista;
    if (elOyentes) elOyentes.textContent = 'Cargando...';
    if (elBio)     elBio.textContent = '';
    shimmer(elPortrait);
    shimmer(elPanoramica);

    // ── 5. Datos de Last.fm (info + oyentes + bio) ───────────
    try {
        const info    = await getArtistInfo(nombreArtista);
        const artist  = info && info.artist;
        if (artist) {
            const oyentes = artist.stats && artist.stats.listeners
                ? fmt(artist.stats.listeners) + ' oyentes'
                : '';
            if (elOyentes) elOyentes.textContent = oyentes;

            const bioRaw  = artist.bio && (artist.bio.summary || artist.bio.content) || '';
            if (elBio) elBio.textContent = cleanBio(bioRaw) || 'Sin biografía disponible.';
        }
    } catch (e) {
        if (elOyentes) elOyentes.textContent = '';
        if (elBio)     elBio.textContent = 'Sin biografía disponible.';
    }

    // ── 6. Imagen del artista ────────────────────────────────
    try {
        const imgs = await getArtistImage(nombreArtista);
        const url  = imgs && (imgs.fanart || imgs.thumb);
        if (url) {
            if (elPortrait)   { elPortrait.src   = url; elPortrait.alt   = nombreArtista; }
            if (elPanoramica) { elPanoramica.src  = url; elPanoramica.alt = nombreArtista + ' concierto'; }
        }
    } catch (e) { /* mantener placeholder */ }
    unshimmer(elPortrait);
    unshimmer(elPanoramica);

    // ── 7. Carrusel: Top canciones del artista ───────────────
    const cancionesTrack = document.getElementById('canciones-track');
    if (cancionesTrack) {
        cancionesTrack.innerHTML = '<div class="index-loading">Cargando canciones...</div>';
        try {
            const data   = await getTopTracks(nombreArtista, 12);
            const tracks = (data && data.toptracks && data.toptracks.track) || [];
            cancionesTrack.innerHTML = '';
            if (!tracks.length) {
                cancionesTrack.innerHTML = '<div class="index-loading">Sin canciones disponibles.</div>';
            } else {
                for (const t of tracks) {
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

                    // Cargar portada en paralelo
                    getAlbumCover(nombreArtista, t.name)
                        .then(url => url && (div.querySelector('img').src = url))
                        .catch(() => {});
                }
            }
        } catch (e) {
            cancionesTrack.innerHTML = '<div class="index-loading">Error al cargar canciones.</div>';
        }
    }

    // ── 8. Carrusel: Álbumes del artista ─────────────────────
    const albumesTrack = document.getElementById('albumes-track');
    if (albumesTrack) {
        albumesTrack.innerHTML = '<div class="index-loading">Cargando álbumes...</div>';
        try {
            const info2  = await getArtistInfo(nombreArtista);
            const mbid   = info2 && info2.artist && info2.artist.mbid;
            let albums   = [];

            if (mbid) {
                albums = await getAlbums(mbid, 20);
            }

            // Fallback: artist.gettopalbums de Last.fm
            if (!albums.length) {
                const topAlb = await lastfm({ method: 'artist.gettopalbums', artist: nombreArtista, limit: 12, autocorrect: 1 });
                albums = ((topAlb && topAlb.topalbums && topAlb.topalbums.album) || [])
                    .filter(a => a.name && a.name !== '(null)')
                    .map(a => ({ title: a.name }));
            }

            albumesTrack.innerHTML = '';
            if (!albums.length) {
                albumesTrack.innerHTML = '<div class="index-loading">Sin álbumes disponibles.</div>';
            } else {
                for (const al of albums) {
                    const albumName = al.title || al['title'] || al.name || '';
                    if (!albumName || albumName === '(null)') continue;
                    const div = document.createElement('div');
                    div.className = 'album-card';
                    div.style.cursor = 'pointer';
                    div.innerHTML = `
                        <div class="album-cover-wrap">
                            <img src="assets/Mosaico 1.png" alt="${albumName}" class="album-cover"
                                 onerror="this.src='assets/Mosaico 1.png'">
                        </div>
                        <div class="album-rating"></div>
                        <div class="album-titulo">${albumName}</div>`;
                    div.addEventListener('click', () => {
                        window.location.href = base + 'album.html?artista=' +
                            encodeURIComponent(nombreArtista) + '&album=' + encodeURIComponent(albumName);
                    });
                    albumesTrack.appendChild(div);

                    // Cargar portada en paralelo
                    getAlbumCover(nombreArtista, albumName)
                        .then(url => url && (div.querySelector('img').src = url))
                        .catch(() => {});
                }
            }
        } catch (e) {
            albumesTrack.innerHTML = '<div class="index-loading">Error al cargar álbumes.</div>';
        }
    }

    // ── 9. Carrusel: Artistas similares ──────────────────────
    const artistasTrack = document.getElementById('artistas-track');
    if (artistasTrack) {
        artistasTrack.innerHTML = '<div class="index-loading">Cargando artistas similares...</div>';
        try {
            const data     = await getSimilarArtists(nombreArtista, 12);
            const similares = (data && data.similarartists && data.similarartists.artist) || [];
            artistasTrack.innerHTML = '';
            if (!similares.length) {
                artistasTrack.innerHTML = '<div class="index-loading">Sin artistas similares.</div>';
            } else {
                for (const s of similares) {
                    const div = document.createElement('div');
                    div.className = 'artista-card';
                    div.style.cursor = 'pointer';
                    div.innerHTML = `
                        <div class="artista-foto-wrap">
                            <img src="assets/Artista 1.jfif" alt="${s.name}" class="artista-foto"
                                 onerror="this.src='assets/Artista 1.jfif'">
                        </div>
                        <div class="artista-rating"></div>
                        <div class="artista-nombre">${s.name}</div>`;
                    div.addEventListener('click', () => {
                        window.location.href = base + 'artista.html?artista=' + encodeURIComponent(s.name);
                    });
                    artistasTrack.appendChild(div);

                    // Cargar imagen en paralelo
                    getSimilarImage(s.name)
                        .then(url => url && (div.querySelector('img').src = url))
                        .catch(() => {});
                }
            }
        } catch (e) {
            artistasTrack.innerHTML = '<div class="index-loading">Error al cargar artistas similares.</div>';
        }
    }

    // ── 10. Carrusel genérico (flechas) ──────────────────────
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
