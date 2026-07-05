document.addEventListener('DOMContentLoaded', async () => {
    const params        = new URLSearchParams(window.location.search);
    const nombreArtista = params.get('artista') || 'Lady Gaga';
    const nombreAlbum   = params.get('album')   || 'MAYHEM';

    const base = '/';

    function fmt(n) {
        const num = parseInt(n) || 0;
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000)    return Math.round(num / 1000) + 'K';
        return num.toString();
    }
    function shimmer(el) { el && el.classList.add('shimmer'); }
    function unshimmer(el) { el && el.classList.remove('shimmer'); }

    document.title = nombreAlbum + ' - ' + nombreArtista + ' | SOULRADE';

    const elTitulo       = document.getElementById('cancion-titulo');
    const elAnio         = document.getElementById('cancion-oyentes');
    const elBio          = document.getElementById('cancion-bio');
    const elPanoramica   = document.querySelector('.presentacion-foto-panoramica img');
    const elArtistaWrap  = document.getElementById('artista-foto-wrap');
    const elArtistaNombre= document.getElementById('artista-nombre-link');
    const elArtistaDesc  = document.getElementById('artista-desc-link');
    const elArtistaImg   = elArtistaWrap && elArtistaWrap.querySelector('img');
    const elArtistaLink  = elArtistaWrap && elArtistaWrap.closest('a');

    if (elTitulo)  elTitulo.textContent   = nombreAlbum;
    if (elAnio)    elAnio.textContent     = (window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('estado.cargando')) || 'Cargando...';
    if (elBio)     elBio.textContent      = '';
    if (elArtistaNombre) elArtistaNombre.textContent = nombreArtista;
    shimmer(elPanoramica);
    shimmer(elArtistaImg);

    if (elArtistaLink) {
        elArtistaLink.href = base + 'artista/?artista=' + encodeURIComponent(nombreArtista);
    }

    const query = encodeURIComponent(nombreAlbum + ' ' + nombreArtista);
    const platLinks = {
        'open.spotify.com':  `https://open.spotify.com/search/${query}`,
        'music.apple.com':   `https://music.apple.com/search?term=${query}`,
        'music.youtube.com': `https://music.youtube.com/search?q=${query}`,
        'music.amazon.com':  `https://music.amazon.com/search/${query}`
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
        const info  = await lastfm({ method: 'album.getinfo', album: nombreAlbum, artist: nombreArtista, autocorrect: 1 });
        const album = info && info.album;
        if (album) {
            const wikiRaw = album.wiki && (album.wiki.summary || album.wiki.content) || '';
            const bioText = cleanBio(wikiRaw);

            let anio = '';
            if (album.wiki && album.wiki.published) {
                const match = album.wiki.published.match(/\d{4}/);
                if (match) anio = match[0];
            }
            if (elAnio)  elAnio.textContent  = anio || '';
            mostrarBio(elBio, bioText);
        } else {
            if (elAnio) elAnio.textContent = '';
            mostrarBio(elBio, '');
        }
    } catch (e) {
        if (elAnio) elAnio.textContent = '';
        mostrarBio(elBio, '');
    }

    try {
        const [coverUrl, artistImgs, infoArt] = await Promise.all([
            getAlbumCover(nombreArtista, nombreAlbum),
            getArtistImage(nombreArtista),
            getArtistInfo(nombreArtista)
        ]);

        if (coverUrl && elPanoramica) {
            elPanoramica.src = coverUrl;
            elPanoramica.alt = nombreAlbum;
        }

        let artistUrl = artistImgs && (artistImgs.thumb || artistImgs.fanart);
        if (artistUrl && coverUrl && artistUrl === coverUrl) {
            const iAlt = await getArtistImageItunes(nombreArtista);
            if (iAlt && iAlt !== coverUrl) artistUrl = iAlt;
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

    const popTrack = document.getElementById('pop-track');
    if (popTrack) {
        popTrack.innerHTML = `<div class="index-loading">${(window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('carga.canciones_del_album')) || 'Cargando canciones del álbum...'}</div>`;
        try {
            const info2  = await lastfm({ method: 'album.getinfo', album: nombreAlbum, artist: nombreArtista, autocorrect: 1 });
            const tracks = (info2 && info2.album && info2.album.tracks && info2.album.tracks.track) || [];
            const lista  = Array.isArray(tracks) ? tracks : [tracks];

            popTrack.innerHTML = '';
            if (!lista.length || !lista[0].name) {
                popTrack.innerHTML = '<div class="index-loading">Sin canciones disponibles.</div>';
            } else {
                lista.forEach((t, i) => {
                    const div = document.createElement('div');
                    div.className = 'media-card';
                    div.style.cursor = 'pointer';
                    div.innerHTML = `
                        <div class="media-thumb-wrap">
                            <img src="assets/Mosaico 1.png" alt="${t.name}" class="media-thumb"
                                 onerror="this.src='assets/Mosaico 1.png'">
                        </div>
                        <div class="media-rating">#${i + 1}</div>
                        <div class="media-titulo">${t.name}</div>
                        <div class="media-artista">${nombreArtista}</div>`;
                    div.addEventListener('click', () => {
                        window.location.href = base + 'cancion/?artista=' +
                            encodeURIComponent(nombreArtista) + '&cancion=' + encodeURIComponent(t.name);
                    });
                    popTrack.appendChild(div);

                    getAlbumCover(nombreArtista, nombreAlbum)
                        .then(url => url && (div.querySelector('img').src = url))
                        .catch(() => {});
                });
            }
        } catch (e) {
            popTrack.innerHTML = '<div class="index-loading">Error al cargar canciones.</div>';
        }
    }

    const albumesTrack = document.getElementById('albumes-track');
    if (albumesTrack) {
        albumesTrack.innerHTML = `<div class="index-loading">${(window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('carga.albumes_similares')) || 'Cargando álbumes similares...'}</div>`;
        try {
            const topAlb = await lastfm({ method: 'artist.gettopalbums', artist: nombreArtista, limit: 15, autocorrect: 1 });
            const todos  = (topAlb && topAlb.topalbums && topAlb.topalbums.album) || [];
            const otros  = todos.filter(a => a.name && a.name !== '(null)' &&
                a.name.toLowerCase() !== nombreAlbum.toLowerCase());

            albumesTrack.innerHTML = '';
            if (!otros.length) {
                albumesTrack.innerHTML = '<div class="index-loading">Sin álbumes similares.</div>';
            } else {
                for (const al of otros) {
                    const div = document.createElement('div');
                    div.className = 'album-card';
                    div.style.cursor = 'pointer';
                    div.innerHTML = `
                        <div class="album-cover-wrap">
                            <img src="assets/Mosaico 1.png" alt="${al.name}" class="album-cover"
                                 onerror="this.src='assets/Mosaico 1.png'">
                        </div>
                        <div class="album-rating">${al.playcount ? fmt(al.playcount) + ' plays' : ''}</div>
                        <div class="album-titulo">${al.name}</div>`;
                    div.addEventListener('click', () => {
                        window.location.href = base + 'album/?artista=' +
                            encodeURIComponent(nombreArtista) + '&album=' + encodeURIComponent(al.name);
                    });
                    albumesTrack.appendChild(div);

                    getAlbumCover(nombreArtista, al.name)
                        .then(url => url && (div.querySelector('img').src = url))
                        .catch(() => {});
                }
            }
        } catch (e) {
            albumesTrack.innerHTML = '<div class="index-loading">Error al cargar álbumes similares.</div>';
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
