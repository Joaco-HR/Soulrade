document.addEventListener("DOMContentLoaded", async () => {
    const base = '/';
    const params    = new URLSearchParams(window.location.search);
    const categoria = (params.get("categoria") || "populares").trim().toLowerCase();

    const CATEGORIA_MAP = {
        "populares": {
            label: "MÁS POPULARES",
            labelKey: "filtro.populares",
            fetch: async () => {
                const d = await lastfm({ method: "chart.gettopartists", limit: 9 });
                return (d?.artists?.artist || []).map(a => ({
                    nombre:    a.name,
                    listeners: a.listeners,
                    sub:       fmtNum(a.listeners) + ` <span data-i18n="unidad.oyentes">${(window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('unidad.oyentes')) || 'oyentes'}</span>`
                }));
            }
        },
        "nuevos": {
            label: "NUEVOS TALENTOS",
            labelKey: "filtro.nuevos",
            fetch: async () => {
                const d = await lastfm({ method: "tag.gettopartists", tag: "new", limit: 9 });
                return (d?.topartists?.artist || []).map(a => ({
                    nombre:    a.name,
                    listeners: a.listeners || 0,
                    sub:       fmtNum(a.listeners) + ` <span data-i18n="unidad.oyentes">${(window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('unidad.oyentes')) || 'oyentes'}</span>`
                }));
            }
        },
        "internacionales": {
            label: "INTERNACIONALES",
            labelKey: "filtro.internacionales",
            fetch: async () => {
                const d = await lastfm({ method: "chart.gettopartists", limit: 18 });
                return (d?.artists?.artist || []).slice(9, 18).map(a => ({
                    nombre: a.name,
                    listeners: a.listeners,
                    sub:    fmtNum(a.listeners) + ` <span data-i18n="unidad.oyentes">${(window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('unidad.oyentes')) || 'oyentes'}</span>`
                }));
            }
        },
        "locales": {
            label: "ARTISTAS LOCALES",
            labelKey: "filtro.locales",
            fetch: async () => {
                const d = await lastfm({ method: "geo.gettopartists", country: "Argentina", limit: 9 });
                return (d?.topartists?.artist || []).map(a => ({
                    nombre: a.name,
                    listeners: a.listeners || 0,
                    sub:    fmtNum(a.listeners) + ` <span data-i18n="unidad.oyentes">${(window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('unidad.oyentes')) || 'oyentes'}</span>`
                }));
            }
        },
        "solistas": {
            label: "SOLISTAS",
            labelKey: "filtro.solistas",
            fetch: async () => {
                const d = await lastfm({ method: "tag.gettopartists", tag: "singer-songwriter", limit: 9 });
                return (d?.topartists?.artist || []).map(a => ({
                    nombre: a.name,
                    listeners: a.listeners || 0,
                    sub:    fmtNum(a.listeners) + ` <span data-i18n="unidad.oyentes">${(window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('unidad.oyentes')) || 'oyentes'}</span>`
                }));
            }
        },
        "bandas": {
            label: "BANDAS",
            labelKey: "filtro.bandas",
            fetch: async () => {
                const d = await lastfm({ method: "tag.gettopartists", tag: "bands", limit: 9 });
                return (d?.topartists?.artist || []).map(a => ({
                    nombre: a.name,
                    listeners: a.listeners || 0,
                    sub:    fmtNum(a.listeners) + ` <span data-i18n="unidad.oyentes">${(window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('unidad.oyentes')) || 'oyentes'}</span>`
                }));
            }
        },
        "djs": {
            label: "DJs / PRODUCTORES",
            labelKey: "filtro.djs",
            fetch: async () => {
                const d = await lastfm({ method: "tag.gettopartists", tag: "electronic", limit: 9 });
                return (d?.topartists?.artist || []).map(a => ({
                    nombre: a.name,
                    listeners: a.listeners || 0,
                    sub:    fmtNum(a.listeners) + ` <span data-i18n="unidad.oyentes">${(window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('unidad.oyentes')) || 'oyentes'}</span>`
                }));
            }
        }
    };

    function fmtNum(n) {
        const num = parseInt(n) || 0;
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
        if (num >= 1_000)    return Math.round(num / 1_000) + "K";
        return num.toString();
    }

    async function getImgArtista(nombre) {
        try {
            const imgs = await getArtistImage(nombre);
            if (imgs && imgs.thumb) return imgs.thumb;
        } catch {}
        return "../assets/Artista 1.jfif";
    }

    const cfg = CATEGORIA_MAP[categoria] || CATEGORIA_MAP["populares"];
    const tituloEl = document.getElementById("titulo-categoria");
    if (tituloEl) tituloEl.textContent = (window.SOULRADE_IDIOMA && cfg.labelKey && window.SOULRADE_IDIOMA.t(cfg.labelKey)) || cfg.label;

    const mosaico = document.getElementById("artistas-mosaico");
    mosaico.innerHTML = `<div class="index-loading">${(window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('carga.artistas')) || 'Cargando artistas...'}</div>`;

    try {
        const artistas = await cfg.fetch();

        if (!artistas.length) {
            mosaico.innerHTML = `<div class="index-loading">${(window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('buscador.sin_artistas')) || 'No se encontraron artistas.'}</div>`;
            return;
        }

        mosaico.innerHTML = "";

        artistas.forEach((a, i) => {
            const div = document.createElement("div");
            div.className = "artista-card";
            div.dataset.artistaIdx = i;
            div.style.cursor = "pointer";
            div.innerHTML = `
                <div class="artista-foto-wrap">
                    <img class="artista-foto"
                         src="../assets/Artista 1.jfif"
                         alt="${a.nombre}"
                         onerror="this.src='../assets/Artista 1.jfif'">
                </div>
                <div class="artista-rating">${a.sub}</div>
                <div class="artista-nombre">${a.nombre}</div>`;
            div.addEventListener("click", () => {
                window.location.href = base + `artista/?artista=${encodeURIComponent(a.nombre)}`;
            });
            mosaico.appendChild(div);
        });

        artistas.forEach(async (a, i) => {
            try {
                const foto = await getImgArtista(a.nombre);
                const img  = mosaico.querySelector(`[data-artista-idx="${i}"] .artista-foto`);
                if (img && foto) img.src = foto;
            } catch {}
        });

    } catch (e) {
        console.error(e);
        mosaico.innerHTML = '<div class="index-loading">Error cargando artistas.</div>';
    }

});