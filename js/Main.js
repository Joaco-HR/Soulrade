// ═══════════════════════════════════════════════════════════
//  SOULRADE — main.js
//  Buscador del index: redirige a artista.html + sugerencias
//  Requiere api.js cargado antes
// ═══════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {

    // ── Ir a la página del artista ───────────────────────────
    function irArtista(nombre) {
        if (!nombre.trim()) return;
        window.location.href = `artista.html?artista=${encodeURIComponent(nombre.trim())}`;
    }

    // ── Conectar TODOS los inputs del buscador ───────────────
    // (desktop: .barra-busqueda > input, mobile: .mobile-buscador > input)
    const inputs  = document.querySelectorAll(".barra-busqueda-texto");
    const buttons = document.querySelectorAll(".barra-busqueda-icono");

    inputs.forEach(input => {
        // Enter para buscar
        input.addEventListener("keydown", e => {
            if (e.key === "Enter" && input.value.trim()) {
                cerrarSugerencias(input);
                irArtista(input.value);
            }
            if (e.key === "Escape") cerrarSugerencias(input);
        });

        // Sugerencias mientras escribe
        let timer;
        input.addEventListener("input", () => {
            clearTimeout(timer);
            const q = input.value.trim();
            if (q.length < 2) { cerrarSugerencias(input); return; }
            timer = setTimeout(() => mostrarSugerencias(input, q), 380);
        });

        // Cerrar al perder foco
        input.addEventListener("blur", () => {
            setTimeout(() => cerrarSugerencias(input), 180);
        });
    });

    // Botones de búsqueda (lupa)
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            const wrapper = btn.closest(".barra-busqueda, .mobile-buscador");
            const input   = wrapper?.querySelector(".barra-busqueda-texto");
            if (input?.value.trim()) irArtista(input.value);
        });
    });

    // ── Sugerencias ──────────────────────────────────────────
    async function mostrarSugerencias(input, query) {
        try {
            const data     = await searchArtists(query, 6);
            const artistas = data?.results?.artistmatches?.artist || [];
            if (!artistas.length) { cerrarSugerencias(input); return; }
            renderSugerencias(input, artistas);
        } catch {
            cerrarSugerencias(input);
        }
    }

    function renderSugerencias(input, artistas) {
        cerrarSugerencias(input);

        const lista = document.createElement("ul");
        lista.className = "sugerencias-lista";

        artistas.forEach(a => {
            const li = document.createElement("li");
            li.className = "sugerencia-item";
            li.innerHTML = `
                <span class="sug-icon">🎵</span>
                <span class="sug-nombre">${a.name}</span>
                ${a.listeners ? `<span class="sug-listeners">${formatNum(parseInt(a.listeners))} oyentes</span>` : ""}
            `;
            li.addEventListener("mousedown", () => irArtista(a.name));
            lista.appendChild(li);
        });

        const wrapper = input.closest(".barra-busqueda, .mobile-buscador");
        if (wrapper) {
            wrapper.style.position = "relative";
            wrapper.appendChild(lista);
        }
    }

    function cerrarSugerencias(input) {
        const wrapper = input.closest(".barra-busqueda, .mobile-buscador");
        wrapper?.querySelector(".sugerencias-lista")?.remove();
    }

    // Reusar formatNum de api.js si existe, si no definirlo acá
    function formatNum(n) {
        if (!n) return "0";
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
        if (n >= 1_000)     return Math.round(n / 1_000) + "K";
        return n.toString();
    }
});