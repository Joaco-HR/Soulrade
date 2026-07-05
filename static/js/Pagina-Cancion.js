document.addEventListener('DOMContentLoaded', async () => {

    const params       = new URLSearchParams(window.location.search);
    const nombreArtista = params.get('artista') || 'Lady Gaga';
    const nombreCancion = params.get('cancion')  || 'Die With a Smile';

    const base = '/';

    function fmt(n) {
        const num = parseInt(n) || 0;
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000)    return Math.round(num / 1000) + 'K';
        return num.toString();
    }
    function shimmer(el) { el && el.classList.add('shimmer'); }
    function unshimmer(el) { el && el.classList.remove('shimmer'); }

    document.title = nombreCancion + ' - ' + nombreArtista + ' | SOULRADE';

    const elTitulo    = document.getElementById('cancion-titulo');
    const elOyentes   = document.getElementById('cancion-oyentes');
    const elBio       = document.getElementById('cancion-bio');
    const elPanoramica= document.querySelector('.presentacion-foto-panoramica img');
    const elArtistaWrap = document.getElementById('artista-foto-wrap');
    const elArtistaNombre = document.getElementById('artista-nombre-link');
    const elArtistaDesc   = document.getElementById('artista-desc-link');
    const elArtistaImg    = elArtistaWrap && elArtistaWrap.querySelector('img');
    const elArtistaLink   = elArtistaWrap && elArtistaWrap.closest('a');

    if (elTitulo)   elTitulo.textContent  = nombreCancion;
    if (elOyentes)  elOyentes.textContent = (window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('estado.cargando')) || 'Cargando...';
    if (elBio)      elBio.textContent     = '';
    if (elArtistaNombre) elArtistaNombre.textContent = nombreArtista;
    shimmer(elPanoramica);
    shimmer(elArtistaImg);

    if (elArtistaLink) {
        elArtistaLink.href = base + 'artista/?artista=' + encodeURIComponent(nombreArtista);
    }

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

    function mostrarBio(el, bioLimpia) {
        if (!el) return;
        if (bioLimpia && window.SOULRADE_IDIOMA) {
            window.SOULRADE_IDIOMA.aplicarBio(el, bioLimpia);
        } else if (bioLimpia) {
            el.textContent = bioLimpia;
        } else {
            el.textContent = (window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('bio.sin_descripcion')) || 'Sin descripción disponible.';
        }
    }

    try {
        const info  = await lastfm({ method: 'track.getinfo', track: nombreCancion, artist: nombreArtista, autocorrect: 1 });
        const track = info && info.track;
        if (track) {
            const plays = track.playcount
                ? `${fmt(track.playcount)} <span data-i18n="unidad.reproducciones">${(window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('unidad.reproducciones')) || 'reproducciones'}</span>`
                : '';
            if (elOyentes) elOyentes.innerHTML = plays;

            const wikiRaw = track.wiki && (track.wiki.summary || track.wiki.content) || '';
            mostrarBio(elBio, cleanBio(wikiRaw));
        } else {
            if (elOyentes) elOyentes.textContent = '';
            mostrarBio(elBio, '');
        }
    } catch (e) {
        if (elOyentes) elOyentes.textContent = '';
        mostrarBio(elBio, '');
    }

    try {
        const [coverUrl, artistImgs, infoArt] = await Promise.all([
            getTrackCover(nombreArtista, nombreCancion),
            getArtistImage(nombreArtista),
            getArtistInfo(nombreArtista)
        ]);

        const panUrl = coverUrl || (artistImgs && (artistImgs.thumb || artistImgs.fanart));
        if (panUrl && elPanoramica) {
            elPanoramica.src = panUrl;
            elPanoramica.alt = nombreCancion;
        }

        let artistUrl = artistImgs && (artistImgs.thumb || artistImgs.fanart);
        if (artistUrl && panUrl && artistUrl === panUrl) {
            const iAlt = await getArtistImageItunes(nombreArtista);
            if (iAlt && iAlt !== panUrl) artistUrl = iAlt;
        }
        if (artistUrl && elArtistaImg) {
            elArtistaImg.src = artistUrl;
            elArtistaImg.alt = nombreArtista;
        }

        if (elArtistaDesc) {
            const artObj = infoArt && infoArt.artist;
            if (artObj) {
                const tags    = artObj.tags && artObj.tags.tag;
                const genre   = tags && tags[0] && tags[0].name ? tags[0].name : '';
                const genreHtml = genre.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const oyentes = artObj.stats && artObj.stats.listeners
                    ? `${fmt(artObj.stats.listeners)} <span data-i18n="unidad.oyentes">${(window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('unidad.oyentes')) || 'oyentes'}</span>`
                    : '';
                elArtistaDesc.innerHTML = [genreHtml, oyentes].filter(Boolean).join(' · ') || '';
            }
        }
    } catch (e) {}
    unshimmer(elPanoramica);
    unshimmer(elArtistaImg);

    const cancionesTrack = document.getElementById('canciones-track');
    if (cancionesTrack) {
        cancionesTrack.innerHTML = `<div class="index-loading">${(window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('carga.canciones_similares')) || 'Cargando canciones similares...'}</div>`;
        try {
            const data   = await getTopTracks(nombreArtista, 15);
            const tracks = (data && data.toptracks && data.toptracks.track) || [];
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
                        window.location.href = base + 'cancion/?artista=' +
                            encodeURIComponent(nombreArtista) + '&cancion=' + encodeURIComponent(t.name);
                    });
                    cancionesTrack.appendChild(div);

                    getTrackCover(nombreArtista, t.name)
                        .then(url => url && (div.querySelector('img').src = url))
                        .catch(() => {});
                }
            }
        } catch (e) {
            cancionesTrack.innerHTML = '<div class="index-loading">Error al cargar canciones similares.</div>';
        }
    }

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
