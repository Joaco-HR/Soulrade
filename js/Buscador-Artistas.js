// ── Buscador-Artistas.js ────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {

    const base = window.location.pathname.includes('/templates/') ? '../templates/' : 'templates/';

    const params    = new URLSearchParams(window.location.search);
    const categoria = (params.get("categoria") || "populares").trim().toLowerCase();

    // ── Mapa de categorías → consulta Last.fm ───────────────
    // Cada entrada define cómo obtener 9 artistas para esa categoría
    const CATEGORIA_MAP = {
        "populares": {
            label: "MÁS POPULARES",
            fetch: async () => {
                const d = await lastfm({ method: "chart.gettopartists", limit: 9 });
                return (d?.artists?.artist || []).map(a => ({
                    nombre:    a.name,
                    listeners: a.listeners,
                    sub:       fmtNum(a.listeners) + " oyentes"
                }));
            }
        },
        "nuevos": {
            label: "NUEVOS TALENTOS",
            fetch: async () => {
                // tag "new" en Last.fm concentra artistas emergentes con tracción reciente
                const d = await lastfm({ method: "tag.gettopartists", tag: "new", limit: 9 });
                return (d?.topartists?.artist || []).map(a => ({
                    nombre:    a.name,
                    listeners: a.listeners || 0,
                    sub:       fmtNum(a.listeners) + " oyentes"
                }));
            }
        },
        "internacionales": {
            label: "INTERNACIONALES",
            fetch: async () => {
                // Top global de Last.fm = los más escuchados internacionalmente
                const d = await lastfm({ method: "chart.gettopartists", limit: 18 });
                // Salteamos los primeros 9 para dar variedad respecto a "populares"
                return (d?.artists?.artist || []).slice(9, 18).map(a => ({
                    nombre: a.name,
                    listeners: a.listeners,
                    sub:    fmtNum(a.listeners) + " oyentes"
                }));
            }
        },
        "locales": {
            label: "ARTISTAS LOCALES",
            fetch: async () => {
                // Top artistas de Argentina vía geo.gettopartists
                const d = await lastfm({ method: "geo.gettopartists", country: "Argentina", limit: 9 });
                return (d?.topartists?.artist || []).map(a => ({
                    nombre: a.name,
                    listeners: a.listeners || 0,
                    sub:    fmtNum(a.listeners) + " oyentes"
                }));
            }
        },
        "solistas": {
            label: "SOLISTAS",
            fetch: async () => {
                // 'singer-songwriter' es el tag más consistente para solistas en Last.fm
                const d = await lastfm({ method: "tag.gettopartists", tag: "singer-songwriter", limit: 9 });
                return (d?.topartists?.artist || []).map(a => ({
                    nombre: a.name,
                    listeners: a.listeners || 0,
                    sub:    fmtNum(a.listeners) + " oyentes"
                }));
            }
        },
        "bandas": {
            label: "BANDAS",
            fetch: async () => {
                const d = await lastfm({ method: "tag.gettopartists", tag: "bands", limit: 9 });
                return (d?.topartists?.artist || []).map(a => ({
                    nombre: a.name,
                    listeners: a.listeners || 0,
                    sub:    fmtNum(a.listeners) + " oyentes"
                }));
            }
        },
        "djs": {
            label: "DJs / PRODUCTORES",
            fetch: async () => {
                const d = await lastfm({ method: "tag.gettopartists", tag: "electronic", limit: 9 });
                return (d?.topartists?.artist || []).map(a => ({
                    nombre: a.name,
                    listeners: a.listeners || 0,
                    sub:    fmtNum(a.listeners) + " oyentes"
                }));
            }
        }
    };

    // ── Helpers ──────────────────────────────────────────────
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
        } catch { /* sigue */ }
        return "../assets/Artista 1.jfif";
    }

    // ── Título ───────────────────────────────────────────────
    const cfg = CATEGORIA_MAP[categoria] || CATEGORIA_MAP["populares"];
    const tituloEl = document.getElementById("titulo-categoria");
    if (tituloEl) tituloEl.textContent = cfg.label;

    // ── Mosaico ──────────────────────────────────────────────
    const mosaico = document.getElementById("artistas-mosaico");
    mosaico.innerHTML = '<div class="index-loading">Cargando artistas...</div>';

    try {
        const artistas = await cfg.fetch();

        if (!artistas.length) {
            mosaico.innerHTML = '<div class="index-loading">No se encontraron artistas.</div>';
            return;
        }

        mosaico.innerHTML = "";

        // 1) Render inmediato con placeholder (mismo patrón que Carruseles-Index)
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
                window.location.href = base + `artista.html?artista=${encodeURIComponent(a.nombre)}`;
            });
            mosaico.appendChild(div);
        });

        // 2) Imágenes en paralelo — actualizar cada una ni bien llega
        artistas.forEach(async (a, i) => {
            try {
                const foto = await getImgArtista(a.nombre);
                const img  = mosaico.querySelector(`[data-artista-idx="${i}"] .artista-foto`);
                if (img && foto) img.src = foto;
            } catch { /* mantener placeholder */ }
        });

    } catch (e) {
        console.error(e);
        mosaico.innerHTML = '<div class="index-loading">Error cargando artistas.</div>';
    }

});