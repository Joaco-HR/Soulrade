document.addEventListener('DOMContentLoaded', () => {

    function getCsrfToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.content : '';
    }

    async function apiFetch(url, options = {}) {
        const headers = Object.assign({
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
        }, options.headers || {});
        const resp = await fetch(url, Object.assign({}, options, { headers }));
        let data = null;
        try { data = await resp.json(); } catch (e) {}
        return { ok: resp.ok, status: resp.status, data };
    }

    const params = new URLSearchParams(window.location.search);

    const btnFavorito = document.getElementById('btn-favorito');
    if (btnFavorito) {
        const tipo = btnFavorito.dataset.tipo;
        btnFavorito.addEventListener('click', async () => {
            const payload = { tipo };
            if (tipo === 'cancion') {
                payload.artista = params.get('artista') || '';
                payload.cancion = params.get('cancion') || '';
            } else if (tipo === 'album') {
                payload.artista = params.get('artista') || '';
                payload.album = params.get('album') || '';
            } else if (tipo === 'artista') {
                payload.artista = params.get('artista') || '';
            }

            const { ok, data } = await apiFetch('/api/favorito/', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            if (ok && data && data.ok) {
                const icono = btnFavorito.querySelector('.icono-favorito');
                const texto = btnFavorito.querySelector('.texto-favorito');
                btnFavorito.dataset.favorito = data.es_favorito ? '1' : '0';
                if (icono) icono.textContent = data.es_favorito ? '♥' : '♡';
                if (texto) {
                    const clave = data.es_favorito ? 'boton.favoritos_en' : 'boton.favoritos_agregar';
                    texto.dataset.i18n = clave;
                    texto.textContent = (window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t(clave))
                        || (data.es_favorito ? 'En favoritos' : 'Agregar a favoritos');
                }
            }
        });
    }

    const reviewsLista = document.getElementById('reviews-lista');
    if (!reviewsLista) return;

    const tipo = reviewsLista.dataset.tipo === 'album' ? 'album' : 'cancion';
    const artista = params.get('artista') || (tipo === 'cancion' ? 'Lady Gaga' : '');
    const itemTitulo = params.get(tipo) || (tipo === 'cancion' ? 'Die With a Smile' : '');

    function urlEstado() {
        return `/api/${tipo}/estado/?artista=${encodeURIComponent(artista)}&${tipo}=${encodeURIComponent(itemTitulo)}`;
    }

    const circulos = Array.from(document.querySelectorAll('.ranking-circulo'));
    const promedioEl = document.getElementById('promedio-calificacion');
    const textarea = document.getElementById('review-textarea');
    const btnPublicar = document.getElementById('btn-publicar-review');
    const btnLimpiar = document.getElementById('btn-limpiar-review');
    const mensajeEl = document.getElementById('review-mensaje');
    const estrellaDorada = '/static/assets/estrella-dorada.png';
    const estrellaVacia = '/static/assets/estrella-vacia.png';

    function pintarCirculos(valor) {
        circulos.forEach(c => {
            const val = parseInt(c.dataset.val, 10);
            c.classList.toggle('activo', val <= valor);
        });
    }

    function pintarEstrellas(puntaje) {
        const llenas = ('<img src="' + estrellaDorada + '" class="estrella-img" alt="★">').repeat(puntaje);
        const vacias = ('<img src="' + estrellaVacia + '" class="estrella-img" alt="☆">').repeat(5 - puntaje);
        return llenas + vacias;
    }

    function renderPromedio(promedio, total) {
        if (!promedioEl) return;
        if (promedio) {
            promedioEl.textContent = `· ${promedio} / 5 (${total} ${total === 1 ? 'calificación' : 'calificaciones'})`;
        } else {
            promedioEl.textContent = '';
        }
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function recargarComentarios() {
        return apiFetch(urlEstado())
            .then(({ data }) => {
                if (!data) return;
                renderComentarios(data.comentarios || []);
                renderPromedio(data.promedio, data.total_calificaciones);
                pintarCirculos(data.mi_calificacion || 0);
            });
    }

    function renderComentarios(comentarios) {
        if (!comentarios.length) {
            reviewsLista.innerHTML = `<p class="perfil-vacio">${(window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('reviews.sin_reviews')) || 'Todavía no hay reviews. ¡Sé el primero en dejar una!'}</p>`;
            return;
        }
        reviewsLista.innerHTML = comentarios.map(c => `
            <div class="review-item-row" data-comentario-id="${c.id}" data-puntaje="${c.puntaje || 0}">
                <div class="review-avatar-wrap">🎵</div>
                <div class="review-contenido">
                    <div class="review-user-row">
                        <span class="review-user">${escapeHtml(c.usuario)}</span>
                        <div class="review-estrellas">${pintarEstrellas(c.puntaje || 0)}</div>
                    </div>
                    <p class="review-txt" data-role="texto">${escapeHtml(c.texto)}</p>
                    ${c.es_mio ? `
                    <div class="review-acciones">
                        <button type="button" class="review-accion-btn" data-accion="editar">Editar</button>
                        <button type="button" class="review-accion-btn review-accion-eliminar" data-accion="eliminar">Eliminar</button>
                    </div>` : ''}
                </div>
            </div>
        `).join('');
    }

    function entrarModoEdicion(fila) {
        const id = fila.dataset.comentarioId;
        const puntajeActual = parseInt(fila.dataset.puntaje, 10) || 0;
        const parrafoTexto = fila.querySelector('[data-role="texto"]');
        const acciones = fila.querySelector('.review-acciones');
        const textoActual = parrafoTexto.textContent;

        parrafoTexto.style.display = 'none';
        acciones.style.display = 'none';

        const wrap = document.createElement('div');
        wrap.className = 'review-edicion';
        wrap.innerHTML = `
            <div class="review-ranking-row review-edicion-ranking">
                <span class="review-ranking-label">Tu puntuación:</span>
                <div class="ranking-circulo" data-val="1"></div>
                <div class="ranking-circulo" data-val="2"></div>
                <div class="ranking-circulo" data-val="3"></div>
                <div class="ranking-circulo" data-val="4"></div>
                <div class="ranking-circulo" data-val="5"></div>
            </div>
            <textarea class="review-textarea review-edicion-textarea" rows="3">${escapeHtml(textoActual)}</textarea>
            <p class="review-mensaje review-edicion-mensaje"></p>
            <div class="review-edicion-acciones">
                <button type="button" class="review-accion-btn" data-accion="guardar">Guardar</button>
                <button type="button" class="review-accion-btn" data-accion="cancelar">Cancelar</button>
            </div>
        `;
        fila.querySelector('.review-contenido').appendChild(wrap);

        const textarea = wrap.querySelector('textarea');
        const mensajeEdicion = wrap.querySelector('.review-edicion-mensaje');
        const circulosEdicion = Array.from(wrap.querySelectorAll('.ranking-circulo'));
        let puntajeSeleccionado = puntajeActual;

        function pintarCirculosEdicion(valor) {
            circulosEdicion.forEach(c => {
                const val = parseInt(c.dataset.val, 10);
                c.classList.toggle('activo', val <= valor);
            });
        }
        pintarCirculosEdicion(puntajeSeleccionado);

        circulosEdicion.forEach(c => {
            c.addEventListener('click', () => {
                puntajeSeleccionado = parseInt(c.dataset.val, 10);
                pintarCirculosEdicion(puntajeSeleccionado);
            });
        });

        textarea.focus();

        wrap.querySelector('[data-accion="cancelar"]').addEventListener('click', () => {
            wrap.remove();
            parrafoTexto.style.display = '';
            acciones.style.display = '';
        });

        wrap.querySelector('[data-accion="guardar"]').addEventListener('click', async () => {
            const nuevoTexto = (textarea.value || '').trim();
            if (!nuevoTexto) {
                mensajeEdicion.textContent = (window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('reviews.falta_texto_editar')) || 'Escribí algo antes de guardar.';
                return;
            }
            const { ok, data } = await apiFetch(`/api/${tipo}/comentario/${id}/editar/`, {
                method: 'POST',
                body: JSON.stringify({ texto: nuevoTexto, puntaje: puntajeSeleccionado || null }),
            });
            if (ok && data && data.ok) {
                if (typeof data.promedio !== 'undefined') renderPromedio(data.promedio, data.total_calificaciones);
                if (data.comentario && data.comentario.puntaje) pintarCirculos(data.comentario.puntaje);
                await recargarComentarios();
            } else {
                mensajeEdicion.textContent = (data && data.error) || 'No se pudo guardar el comentario.';
            }
        });
    }

    async function eliminarComentario(fila) {
        const id = fila.dataset.comentarioId;
        if (!window.confirm('¿Eliminar este comentario? Esta acción no se puede deshacer.')) return;
        const { ok, data } = await apiFetch(`/api/${tipo}/comentario/${id}/eliminar/`, {
            method: 'POST',
        });
        if (ok && data && data.ok) {
            await recargarComentarios();
        } else {
            window.alert((data && data.error) || 'No se pudo eliminar el comentario.');
        }
    }

    reviewsLista.addEventListener('click', (evento) => {
        const boton = evento.target.closest('[data-accion]');
        if (!boton) return;
        const fila = boton.closest('.review-item-row');
        if (!fila) return;
        const accion = boton.dataset.accion;
        if (accion === 'editar') entrarModoEdicion(fila);
        if (accion === 'eliminar') eliminarComentario(fila);
    });

    apiFetch(urlEstado())
        .then(({ data }) => {
            if (!data) return;
            renderPromedio(data.promedio, data.total_calificaciones);
            renderComentarios(data.comentarios || []);
            if (data.mi_calificacion) pintarCirculos(data.mi_calificacion);
        });

    if (circulos.length) {
        circulos.forEach(c => {
            c.style.cursor = 'pointer';
            c.addEventListener('click', async () => {
                const puntaje = parseInt(c.dataset.val, 10);
                pintarCirculos(puntaje);
                const { ok, data } = await apiFetch(`/api/${tipo}/calificar/`, {
                    method: 'POST',
                    body: JSON.stringify({ artista, [tipo]: itemTitulo, puntaje }),
                });
                if (ok && data && data.ok) {
                    renderPromedio(data.promedio, data.total_calificaciones);
                }
            });
        });
    }

    if (btnPublicar) {
        btnPublicar.addEventListener('click', async () => {
            const texto = (textarea.value || '').trim();
            if (!texto) {
                if (mensajeEl) mensajeEl.textContent = (window.SOULRADE_IDIOMA && window.SOULRADE_IDIOMA.t('reviews.falta_texto')) || 'Escribí algo antes de publicar.';
                return;
            }
            btnPublicar.disabled = true;
            const { ok, data } = await apiFetch(`/api/${tipo}/comentar/`, {
                method: 'POST',
                body: JSON.stringify({ artista, [tipo]: itemTitulo, texto }),
            });
            btnPublicar.disabled = false;
            if (ok && data && data.ok) {
                if (mensajeEl) mensajeEl.textContent = '';
                textarea.value = '';
                await recargarComentarios();
            } else if (mensajeEl) {
                mensajeEl.textContent = (data && data.error) || 'No se pudo publicar el comentario.';
            }
        });
    }

    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', () => {
            if (textarea) textarea.value = '';
            if (mensajeEl) mensajeEl.textContent = '';
        });
    }
});
