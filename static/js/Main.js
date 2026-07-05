document.addEventListener("DOMContentLoaded", () => {

    // ── Rutas base ───────────────────────────────────────────
    const base = '/';

    // ── Navegación ───────────────────────────────────────────
    function irArtista(nombre) {
        if (!nombre.trim()) return;
        window.location.href = base + `artista/?artista=${encodeURIComponent(nombre.trim())}`;
    }
    function irCancion(artista, cancion) {
        window.location.href = base + `cancion/?artista=${encodeURIComponent(artista)}&cancion=${encodeURIComponent(cancion)}`;
    }
    function irAlbum(artista, album) {
        window.location.href = base + `album/?artista=${encodeURIComponent(artista)}&album=${encodeURIComponent(album)}`;
    }

    // ── Conectar TODOS los inputs del buscador ───────────────
    const inputs  = document.querySelectorAll(".barra-busqueda-texto");
    const buttons = document.querySelectorAll(".barra-busqueda-icono");

    inputs.forEach(input => {
        input.addEventListener("keydown", e => {
            // Navegación por teclado en sugerencias
            const lista = getSugerenciaLista(input);
            if (lista) {
                const items = lista.querySelectorAll('.sugerencia-item');
                const activo = lista.querySelector('.sugerencia-item.activo');
                let idx = activo ? Array.from(items).indexOf(activo) : -1;
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    items.forEach(i => i.classList.remove('activo'));
                    idx = (idx + 1) % items.length;
                    items[idx] && items[idx].classList.add('activo');
                    return;
                }
                if (e.key === "ArrowUp") {
                    e.preventDefault();
                    items.forEach(i => i.classList.remove('activo'));
                    idx = (idx - 1 + items.length) % items.length;
                    items[idx] && items[idx].classList.add('activo');
                    return;
                }
                if (e.key === "Enter" && activo) {
                    activo.dispatchEvent(new MouseEvent('mousedown'));
                    return;
                }
            }
            if (e.key === "Enter" && input.value.trim()) {
                cerrarSugerencias(input);
                irArtista(input.value);
            }
            if (e.key === "Escape") cerrarSugerencias(input);
        });

        let timer;
        input.addEventListener("input", () => {
            clearTimeout(timer);
            const q = input.value.trim();
            if (q.length < 2) { cerrarSugerencias(input); return; }
            timer = setTimeout(() => mostrarSugerencias(input, q), 380);
        });

        input.addEventListener("blur", () => {
            setTimeout(() => cerrarSugerencias(input), 180);
        });
    });

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            const wrapper = btn.closest(".barra-busqueda, .mobile-buscador");
            const input   = wrapper && wrapper.querySelector(".barra-busqueda-texto");
            if (input && input.value.trim()) irArtista(input.value);
        });
    });

    // ── Sugerencias ──────────────────────────────────────────
    async function mostrarSugerencias(input, query) {
        try {
            // Lanzar búsqueda de artistas, canciones y álbumes en paralelo
            const [resArtistas, resCanciones] = await Promise.allSettled([
                searchArtists(query, 4),
                lastfm({ method: 'track.search', track: query, limit: 3 })
            ]);

            const artistas = (resArtistas.status === 'fulfilled' &&
                resArtistas.value?.results?.artistmatches?.artist) || [];
            const canciones = (resCanciones.status === 'fulfilled' &&
                resCanciones.value?.results?.trackmatches?.track) || [];

            if (!artistas.length && !canciones.length) { cerrarSugerencias(input); return; }
            renderSugerencias(input, artistas, canciones);
        } catch {
            cerrarSugerencias(input);
        }
    }

    function renderSugerencias(input, artistas, canciones) {
        cerrarSugerencias(input);

        const lista = document.createElement("ul");
        lista.className = "sugerencias-lista";

        // ── Sección artistas ──
        if (artistas.length) {
            const header = document.createElement('li');
            header.className = 'sugerencia-header';
            header.textContent = (window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('nav.artistas')) || 'Artistas';
            lista.appendChild(header);

            artistas.forEach(a => {
                const li = document.createElement("li");
                li.className = "sugerencia-item";
                const textoOyentes = (window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('unidad.oyentes')) || 'oyentes';
                li.innerHTML = `
                    <span class="sug-icon">🎤</span>
                    <span class="sug-nombre">${a.name}</span>
                    ${a.listeners ? `<span class="sug-listeners">${formatNum(parseInt(a.listeners))} <span data-i18n="unidad.oyentes">${textoOyentes}</span></span>` : ""}
                `;
                li.addEventListener("mousedown", () => irArtista(a.name));
                lista.appendChild(li);
            });
        }

        // ── Sección canciones ──
        if (canciones.length) {
            const header = document.createElement('li');
            header.className = 'sugerencia-header';
            header.textContent = (window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('nav.canciones')) || 'Canciones';
            lista.appendChild(header);

            canciones.forEach(t => {
                const artista = (t.artist) || '';
                const li = document.createElement("li");
                li.className = "sugerencia-item";
                li.innerHTML = `
                    <span class="sug-icon">🎵</span>
                    <span class="sug-nombre">${t.name}</span>
                    ${artista ? `<span class="sug-listeners">${artista}</span>` : ""}
                `;
                li.addEventListener("mousedown", () => irCancion(artista, t.name));
                lista.appendChild(li);
            });
        }

        const wrapper = input.closest(".barra-busqueda, .mobile-buscador");
        if (wrapper) {
            wrapper.style.position = "relative";
            wrapper.appendChild(lista);
        }
    }

    function getSugerenciaLista(input) {
        const wrapper = input.closest(".barra-busqueda, .mobile-buscador");
        return wrapper && wrapper.querySelector('.sugerencias-lista');
    }

    function cerrarSugerencias(input) {
        const wrapper = input.closest(".barra-busqueda, .mobile-buscador");
        const sl = wrapper && wrapper.querySelector('.sugerencias-lista');
        if (sl) sl.remove();
    }

    function formatNum(n) {
        if (!n) return "0";
        if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
        if (n >= 1000)    return Math.round(n / 1000) + "K";
        return n.toString();
    }
});