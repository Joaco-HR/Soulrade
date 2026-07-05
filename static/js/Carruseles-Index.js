const base = '/';

function fmtNum(n) {
    const num = parseInt(n) || 0;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return Math.round(num / 1000) + 'K';
    return num.toString();
}

async function getImgArtista(nombre, fallback = 'assets/Artista 1.jfif') {
    try {
        const imgs = await getArtistImage(nombre);
        if (imgs && imgs.thumb) return imgs.thumb;
    } catch {}
    return fallback;
}

(async() => {
    const PH = 'assets/Mosaico 1.png';
    let mosaicItems = [];
    let offset = 0, animando = false, autoTimer = null;
    try {
        const data = await lastfm({ method: 'chart.gettoptracks', limit: 10 });
        const tracks = (data && data.tracks && data.tracks.track) || [];
        mosaicItems = tracks.map(function(t, i) {
            return {
                img: PH,
                titulo: t.name,
                artista: (t.artist && t.artist.name) || t.artist || '',
                rating: '#' + (i + 1),
                link: base + 'cancion/?artista=' + encodeURIComponent((t.artist && t.artist.name) || t.artist || '') + '&cancion=' + encodeURIComponent(t.name)
            };
        });
    } catch (e) {
        console.warn('Mosaico API error', e);
    }
    var track = document.getElementById('mosaico-track');
    mosaicItems.forEach(function(item) {
        var slide = document.createElement('div');
        slide.className = 'mosaico-slide';
        slide.innerHTML =
            '<img src="' + PH + '" class="card-img" alt="' + item.titulo + '" onerror="this.src=\'' + PH + '\'">' +
            '<div class="card-img-overlay">' +
                '<p class="mosaico-rating">' + item.rating + '</p>' +
                '<h5 class="card-title">' + item.titulo + '</h5>' +
                '<p class="card-text">' + item.artista + '</p>' +
            '</div>';
        if (item.link && item.link !== '#')
            slide.addEventListener('click', function(l) { return function() { window.location.href = l; }; }(item.link));
        track.appendChild(slide);
    });
    mosaicItems.forEach(function(item, ci) {
        (async function() {
            try {
                var cover = await getAlbumCover(item.artista, item.titulo);
                var img = cover || await getImgArtista(item.artista, PH);
                if (img && img !== PH) {
                    item.img = img;
                    var slides = track.querySelectorAll('.mosaico-slide');
                    if (slides[ci]) slides[ci].querySelector('img').src = img;
                    var caida = document.getElementById('fotos-caida');
                    if (caida) {
                        var minis = caida.querySelectorAll('.mosaico-mini img');
                        for (var mi = 1; mi <= 3; mi++) {
                            var idx = (offset + mi) % mosaicItems.length;
                            if (idx === ci && minis[mi - 1]) minis[mi - 1].src = img;
                        }
                    }
                }
            } catch(e) {}
        })();
    });
    var indicadores = document.getElementById('mosaico-indicadores');
    mosaicItems.forEach(function(_, i) {
        var dot = document.createElement('button');
        dot.className = 'mosaico-dot' + (i === 0 ? ' activo' : '');
        dot.addEventListener('click', function(idx) { return function() { irA(idx); }; }(i));
        indicadores.appendChild(dot);
    });
    function renderMiniaturas() {
        var caida = document.getElementById('fotos-caida');
        caida.innerHTML = '';
        for (var mi = 1; mi <= 3; mi++) {
            var item = mosaicItems[(offset + mi) % mosaicItems.length];
            var mini = document.createElement('div');
            mini.className = 'card text-bg-dark mosaico-mini';
            mini.style.cursor = 'pointer';
            mini.innerHTML =
                '<img src="' + item.img + '" class="card-img" alt="' + item.titulo + '" onerror="this.src=\'' + PH + '\'">' +
                '<div class="card-img-overlay">' +
                    '<h5 class="card-title">' + item.titulo + '</h5>' +
                    '<p class="card-text">' + item.artista + '</p>' +
                '</div>';
            (function(idx) {
                mini.addEventListener('click', function() { irA(idx); });
            })((offset + mi) % mosaicItems.length);
            caida.appendChild(mini);
        }
    }
    function actualizarDots() {
        var dots = indicadores.querySelectorAll('.mosaico-dot');
        dots.forEach(function(d, i) {
            d.className = 'mosaico-dot' + (i === offset ? ' activo' : '');
        });
    }
    function irA(idx) {
        if (animando || idx === offset) return;
        animando = true;
        track.style.transition = 'transform 0.35s cubic-bezier(0.4,0,0.2,1)';
        track.style.transform = 'translateX(-' + (idx * 100) + '%)';
        offset = idx;
        actualizarDots();
        renderMiniaturas();
        setTimeout(function() { animando = false; }, 370);
        reiniciarAuto();
    }
    function rotar(dir) {
        var siguiente = ((offset + dir) % mosaicItems.length + mosaicItems.length) % mosaicItems.length;
        irA(siguiente);
    }
    function reiniciarAuto() {
        clearInterval(autoTimer);
        autoTimer = setInterval(function() { rotar(1); }, 6000);
    }
    renderMiniaturas();
    track.style.transition = 'none';
    track.style.transform = 'translateX(0)';
    document.getElementById('mosaico-next').addEventListener('click', function() { rotar(1); });
    document.getElementById('mosaico-prev').addEventListener('click', function() { rotar(-1); });
    reiniciarAuto();
})();
(async() => {
    const trackEl = document.getElementById('artistas-track');
    trackEl.innerHTML = `<div class="index-loading">${(window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('carga.artistas')) || 'Cargando artistas...'}</div>`;
    let nombres = [];
    try {
        const data = await lastfm({
            method: 'chart.gettopartists',
            limit: 12
        });
        const artistas = (data && data.artists && data.artists.artist) || [];
        nombres = artistas.map(a => ({
            nombre: a.name,
            listeners: a.listeners
        }));
    } catch (e) {
        console.warn('chart.gettopartists error', e);
        nombres = [{
            nombre: 'The Weeknd',
            listeners: '0'
        }, {
            nombre: 'Taylor Swift',
            listeners: '0'
        }, {
            nombre: 'Drake',
            listeners: '0'
        }, {
            nombre: 'Bad Bunny',
            listeners: '0'
        }, {
            nombre: 'Billie Eilish',
            listeners: '0'
        }, {
            nombre: 'Doja Cat',
            listeners: '0'
        }, {
            nombre: 'Olivia Rodrigo',
            listeners: '0'
        }, {
            nombre: 'Post Malone',
            listeners: '0'
        }, ];
    }
    const cards = await Promise.all(nombres.map(async({
        nombre,
        listeners
    }) => {
        const foto = await getImgArtista(nombre, 'assets/Artista 1.jfif');
        return {
            nombre,
            listeners,
            foto
        };
    }));
    trackEl.innerHTML = '';
    cards.forEach(({
        nombre,
        listeners,
        foto
    }) => {
        const div = document.createElement('div');
        div.className = 'artista-card';
        div.style.cursor = 'pointer';
        div.innerHTML = `
        <div class="artista-foto-wrap">
            <img src="${foto}" alt="${nombre}" class="artista-foto"
                 onerror="this.src='assets/Artista 1.jfif'">
        </div>
        <div class="artista-rating">${fmtNum(listeners)} <span data-i18n="unidad.oyentes">${(window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('unidad.oyentes')) || 'oyentes'}</span></div>
        <div class="artista-nombre">${nombre}</div>`;
        div.addEventListener('click', () =>
            window.location.href = `${base}artista/?artista=${encodeURIComponent(nombre)}`);
        trackEl.appendChild(div);
    });
})();
(async() => {
    const PH = 'assets/Mosaico 1.png';
    const trackEl = document.getElementById('albumes-track');
    trackEl.innerHTML = `<div class="index-loading">${(window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('carga.albumes')) || 'Cargando álbumes...'}</div>`;
    let albumsData = [];
    try {
        const data = await lastfm({
            method: 'chart.gettopartists',
            limit: 10
        });
        const artistas = (data && data.artists && data.artists.artist) || [];
        for (var i = 0; i < artistas.length; i++) {
            if (albumsData.length >= 10) break;
            try {
                var nombreArtista = artistas[i].name;
                var topAlbums = await lastfm({
                    method: 'artist.gettopalbums',
                    artist: nombreArtista,
                    limit: 1,
                    autocorrect: 1
                });
                var album = topAlbums && topAlbums.topalbums && topAlbums.topalbums.album && topAlbums.topalbums.album[0];
                if (album && album.name && album.name !== '(null)') {
                    albumsData.push({
                        titulo: nombreArtista + ' - ' + album.name,
                        artista: nombreArtista,
                        album: album.name,
                        playcount: parseInt(album.playcount) || 0
                    });
                }
            } catch (e) {}
        }
    } catch (e) {
        console.warn('albumes API error', e);
    }
    if (albumsData.length === 0) {
        albumsData = [{
            titulo: 'The Weeknd - After Hours',
            artista: 'The Weeknd',
            album: 'After Hours',
            playcount: 0
        }, {
            titulo: 'Taylor Swift - Midnights',
            artista: 'Taylor Swift',
            album: 'Midnights',
            playcount: 0
        }, {
            titulo: 'Drake - Certified Lover Boy',
            artista: 'Drake',
            album: 'Certified Lover Boy',
            playcount: 0
        }, {
            titulo: 'Bad Bunny - Un Verano Sin Ti',
            artista: 'Bad Bunny',
            album: 'Un Verano Sin Ti',
            playcount: 0
        }, {
            titulo: 'Billie Eilish - Happier Than Ever',
            artista: 'Billie Eilish',
            album: 'Happier Than Ever',
            playcount: 0
        }, {
            titulo: 'Doja Cat - Planet Her',
            artista: 'Doja Cat',
            album: 'Planet Her',
            playcount: 0
        }, ];
    }
    const covers = await Promise.all(albumsData.map(function(item) {
        return getAlbumCover(item.artista, item.album).catch(function() {
            return null;
        });
    }));
    trackEl.innerHTML = '';
    albumsData.forEach(function(item, i) {
        const src = covers[i] || PH;
        const div = document.createElement('div');
        div.className = 'album-card';
        div.style.cursor = 'pointer';
        const playcountLabel = item.playcount > 0 ?
            fmtNum(item.playcount) + ' plays' :
            '';
        div.innerHTML =
            '<div class="album-cover-wrap">' +
            '<img src="' + src + '" alt="' + item.titulo + '" class="album-cover" onerror="this.src=\'' + PH + '\'">' +
            '</div>' +
            '<div class="album-rating">' + playcountLabel + '</div>' +
            '<div class="album-titulo">' + item.titulo + '</div>';
        div.addEventListener('click', function() {
            window.location.href = base + 'album/?artista=' + encodeURIComponent(item.artista) + '&album=' + encodeURIComponent(item.album);
        });
        trackEl.appendChild(div);
    });
})();
async function cargarTrackCards(trackId, tracks, badgeFn) {
    const el = document.getElementById(trackId);
    if (!el) return;
    el.innerHTML = `<div class="index-loading">${(window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('estado.cargando')) || 'Cargando...'}</div>`;
    const enriched = await Promise.all(tracks.map(async(t, i) => {
        const foto = await getImgArtista(t.artista, 'assets/Mosaico 1.png');
        return {...t,
            foto,
            pos: i + 1
        };
    }));
    el.innerHTML = '';
    enriched.forEach(item => {
                const badge = badgeFn ? badgeFn(item.pos) : null;
                const div = document.createElement('div');
                div.className = 'media-card';
                div.style.cursor = 'pointer';
                div.innerHTML = `
        <div class="media-thumb-wrap">
            <img src="${item.foto}" alt="${item.titulo}" class="media-thumb"
                 onerror="this.src='assets/Mosaico 1.png'">
            ${badge ? `<span class="media-badge ${badge.clase}">${badge.texto}</span>` : ''}
        </div>
        <div class="media-rating">#${item.pos}</div>
        <div class="media-titulo">${item.titulo}</div>
        <div class="media-artista">${item.artista}</div>`;
    div.addEventListener('click', () =>
        window.location.href = `${base}cancion/?artista=${encodeURIComponent(item.artista)}&cancion=${encodeURIComponent(item.titulo)}`);
    el.appendChild(div);
});
}
 
function parseTracks(raw) {
    return (raw || []).map(t => ({
        titulo:  t.name,
        artista: (t.artist && t.artist.name) || t.artist || '',
        image:   t.image || []
    }));
}

(async () => {
    try {
        const d = await lastfm({ method: 'chart.gettoptracks', limit: 10 });
        await cargarTrackCards('canciones-track', parseTracks(d && d.tracks && d.tracks.track),
            pos => pos <= 3 ? { clase: 'vevo', texto: 'vevo' } : null);
    } catch (e) { console.warn('canciones-track', e); }
})();

(async () => {
    try {
        const d = await lastfm({ method: 'tag.gettopartists', tag: 'pop', limit: 10 });
        const artistas = (d && d.topartists && d.topartists.artist) || [];

        const tracks = [];
        for (const a of artistas) {
            try {
                const t = await lastfm({ method: 'artist.gettoptracks', artist: a.name, limit: 1, autocorrect: 1 });
                const topTrack = t && t.toptracks && t.toptracks.track && t.toptracks.track[0];
                if (topTrack) {
                    tracks.push({ titulo: topTrack.name, artista: a.name });
                }
            } catch {}
            if (tracks.length >= 10) break;
        }

        await cargarTrackCards('pop-track', tracks,
            () => ({ clase: 'vevo', texto: 'vevo' }));
    } catch (e) { console.warn('pop-track', e); }
})();

(async () => {
    try {
        const d = await lastfm({ method: 'tag.gettopartists', tag: 'classic rock', limit: 10 });
        const artistas = (d && d.topartists && d.topartists.artist) || [];

        const tracks = [];
        for (const a of artistas) {
            try {
                const t = await lastfm({ method: 'artist.gettoptracks', artist: a.name, limit: 1, autocorrect: 1 });
                const topTrack = t && t.toptracks && t.toptracks.track && t.toptracks.track[0];
                if (topTrack) {
                    tracks.push({ titulo: topTrack.name, artista: a.name });
                }
            } catch {}
            if (tracks.length >= 10) break;
        }

        await cargarTrackCards('rock-track', tracks,
            () => ({ clase: 'vevo', texto: 'vevo' }));
    } catch (e) { console.warn('rock-track', e); }
})();

(async () => {
    try {
        const d = await lastfm({ method: 'tag.gettoptracks', tag: 'latin', limit: 10 });
        await cargarTrackCards('urbano-track', parseTracks(d && d.tracks && d.tracks.track),
            pos => pos % 2 !== 0 ? { clase: 'rimas', texto: 'rimas' } : null);
    } catch (e) { console.warn('urbano-track', e); }
})();

document.querySelectorAll('.carrusel-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        var trackId = btn.getAttribute('data-target');
        var track = document.getElementById(trackId);
        if (!track) return;
        var card = track.querySelector('.artista-card, .media-card, .album-card');
        if (!card) return;
        var scrollAmount = card.offsetWidth + parseInt(getComputedStyle(track).gap || 24);
        if (btn.classList.contains('carrusel-prev')) {
            track.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        } else {
            track.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }
    });
});