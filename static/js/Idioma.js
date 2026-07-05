(function () {
    const CLAVE_STORAGE = 'soulrade-idioma';

    const TRADUCCIONES = {
        'nav.artistas':            { es: 'Artistas',             en: 'Artists' },
        'nav.generos':             { es: 'Géneros',              en: 'Genders' },
        'busqueda.placeholder':    { es: 'Buscar...',            en: 'Search...' },
        "unidad.reproducciones":   { es: 'reproducciones',       en: 'plays' },
        "unidad.oyentes":          { es: 'oyentes',              en: 'listeners' },
        'boton.publicar':          { es: 'Publicar',             en: 'Post' },
        'boton.limpiar':           { es: 'Limpiar',              en: 'Clear' },
        'boton.iniciar_sesion':    { es: 'Iniciar sesión',       en: 'Log in' },
        'boton.registrarse':       { es: 'Registrarse',          en: 'Sign up' },
        'boton.mi_perfil':         { es: 'Mi perfil',            en: 'My profile' },
        'boton.cerrar_sesion':     { es: 'Cerrar sesión',        en: 'Log out' },
        'boton.favoritos_agregar': { es: 'Agregar a favoritos',  en: 'Add to favorites' },
        'boton.favoritos_en':      { es: 'En favoritos',         en: 'In favorites' },
        'reviews.titulo':          { es: 'Reseñas',              en: 'Reviews' },
        'reviews.placeholder':     { es: 'Escribe tu reseña...', en: 'Write your review...' },
        'reviews.puntuacion':      { es: 'Tu puntuación:',       en: 'Your rating:' },
        'bio.sin_descripcion':     { es: 'Sin descripción disponible.', en: 'No description available.' },
        'bio.sin_biografia':       { es: 'Sin biografía disponible.',   en: 'No biography available.' },
        'index.mas_popular':               { es: 'Más popular del momento',            en: 'Most popular right now' },
        'sec.plataformas':                 { es: 'Plataformas Disponibles',            en: 'Available Platforms' },
        'sec.canciones_del_album':         { es: 'Canciones del Álbum',                en: 'Album Tracks' },
        'sec.albumes_similares':           { es: 'Álbumes Similares',                  en: 'Similar Albums' },
        'sec.canciones_del_artista':       { es: 'Canciones del Artista',              en: "Artist's Songs" },
        'sec.albumes':                     { es: 'Álbumes',                            en: 'Albums' },
        'sec.artistas_similares':          { es: 'Artistas Similares',                 en: 'Similar Artists' },
        'sec.artistas_populares':          { es: 'Artistas más Populares',             en: 'Most Popular Artists' },
        'sec.canciones_populares':         { es: 'Canciones más Populares',            en: 'Most Popular Songs' },
        'sec.albumes_populares':           { es: 'Álbumes más Populares',              en: 'Most Popular Albums' },
        'sec.canciones_similares':         { es: 'Canciones Similares',                en: 'Similar Songs' },
        'sec.artistas_reconocidos':        { es: 'Artistas Reconocidos Mundialmente',  en: 'World-Renowned Artists' },
        'sec.canciones_reconocidas':       { es: 'Canciones Reconocidas Mundialmente', en: 'World-Renowned Songs' },
        'sec.albumes_populares_index':     { es: 'Álbumes Populares',                  en: 'Popular Albums' },
        'sec.iconos_pop':                  { es: 'Iconos del Pop',                     en: 'Pop Icons' },
        'sec.iconos_rock':                 { es: 'Iconos del Rock',                    en: 'Rock Icons' },
        'sec.iconos_urbano':               { es: 'Iconos del Urbano',                  en: 'Urban Icons' },
        'sec.mis_favoritos':               { es: 'Mis Favoritos',                      en: 'My Favorites' },
        'sec.ultimas_visualizaciones':     { es: 'Últimas Visualizaciones',            en: 'Recently Viewed' },
        'sec.mis_calificaciones':          { es: 'Mis Calificaciones',                 en: 'My Ratings' },
        'auth.iniciar_titulo':      { es: 'Iniciar Sesión',        en: 'Log In' },
        'auth.iniciar_subtitulo':   { es: 'Iniciá sesión y accedé a todos nuestros beneficios', en: 'Log in and unlock all our benefits' },
        'auth.crear_titulo':        { es: 'Crear Cuenta',          en: 'Create Account' },
        'auth.crear_subtitulo':     { es: 'Creá una cuenta y disfrutá de los beneficios de Soulrade', en: 'Create an account and enjoy the benefits of Soulrade' },
        'auth.email':               { es: 'Correo electrónico',    en: 'Email' },
        'auth.contrasena':          { es: 'Contraseña',            en: 'Password' },
        'auth.nombre':              { es: 'Nombre',                en: 'First name' },
        'auth.apellido':            { es: 'Apellido',              en: 'Last name' },
        'auth.registrar':           { es: 'Registrar',             en: 'Register' },
        'auth.crear_cuenta':        { es: 'Crear Cuenta',          en: 'Create Account' },
        'auth.no_tenes_cuenta':     { es: '¿No tenés una cuenta? Creá una.', en: "Don't have an account? Create one." },
        'auth.beneficios_titulo':   { es: 'Beneficios de Crearte una Cuenta/Iniciar Sesión', en: 'Benefits of Creating an Account / Logging In' },
        'auth.beneficio_1':         { es: 'Tu propia lista de votaciones con todos los artistas que hayas calificado.', en: 'Your own ranking list with every artist you have rated.' },
        'auth.beneficio_2':         { es: 'Haz un seguimiento de tus últimas visualizaciones.', en: 'Keep track of what you have recently viewed.' },
        'auth.beneficio_3':         { es: 'Califica y comentá todo lo que escuchás.', en: 'Rate and comment on everything you listen to.' },
        'auth.beneficio_4':         { es: 'Guardá tus canciones favoritas.', en: 'Save your favorite songs.' },
        'auth.beneficio_5':         { es: 'Edita tus servicios de streaming preferidos.', en: 'Edit your preferred streaming services.' },
        'estado.cargando':          { es: 'Cargando...', en: 'Loading...' },
        'reviews.falta_texto':      { es: 'Escribí algo antes de publicar.', en: 'Write something before posting.' },
        'reviews.falta_texto_editar': { es: 'Escribí algo antes de guardar.', en: 'Write something before saving.' },
        'saludo.hola':              { es: 'Hola', en: 'Hi' },
        'perfil.sin_favoritos':          { es: 'Todavía no agregaste nada a favoritos.', en: "You haven't added anything to favorites yet." },
        'perfil.sin_visualizaciones':    { es: 'Todavía no visitaste nada.', en: "You haven't viewed anything yet." },
        'perfil.sin_calificaciones':     { es: 'Todavía no calificaste ninguna canción ni álbum.', en: "You haven't rated any song or album yet." },
        'reviews.sin_reviews':      { es: 'Todavía no hay reviews. ¡Sé el primero en dejar una!', en: 'No reviews yet. Be the first to leave one!' },
        'carga.artistas':               { es: 'Cargando artistas...',              en: 'Loading artists...' },
        'carga.canciones':              { es: 'Cargando canciones...',             en: 'Loading songs...' },
        'carga.albumes':                { es: 'Cargando álbumes...',               en: 'Loading albums...' },
        'carga.reviews':                { es: 'Cargando reviews...',               en: 'Loading reviews...' },
        'carga.canciones_del_album':    { es: 'Cargando canciones del álbum...',   en: 'Loading album tracks...' },
        'carga.albumes_similares':      { es: 'Cargando álbumes similares...',     en: 'Loading similar albums...' },
        'carga.iconos_pop':             { es: 'Cargando iconos del pop...',        en: 'Loading pop icons...' },
        'carga.canciones_rock':         { es: 'Cargando canciones de rock...',     en: 'Loading rock songs...' },
        'carga.urbano':                 { es: 'Cargando urbano...',                en: 'Loading urban...' },
        'carga.canciones_similares':    { es: 'Cargando canciones similares...',   en: 'Loading similar songs...' },
        'carga.artistas_similares':     { es: 'Cargando artistas similares...',    en: 'Loading similar artists...' },
        'titulo-categoria': { es: 'Cargando artistas similares...',    en: 'Loading similar artists...' },
    };

    function idiomaActual() {
        return localStorage.getItem(CLAVE_STORAGE) || 'es';
    }

    function t(clave) {
        const entrada = TRADUCCIONES[clave];
        return entrada ? entrada[idiomaActual()] : '';
    }

    function getCsrfToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.content : '';
    }

    async function traducirTexto(texto, destino) {
        try {
            const resp = await fetch('/api/traducir/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken(),
                },
                body: JSON.stringify({ texto, destino }),
            });
            const data = await resp.json();
            return (data && data.ok && data.texto) || texto;
        } catch (e) {
            return texto;
        }
    }

    async function aplicarBio(el, textoOriginalNuevo) {
        if (!el) return;
        if (textoOriginalNuevo !== undefined) {
            el.dataset.bioOriginal = textoOriginalNuevo;
        }
        const original = el.dataset.bioOriginal;
        if (!original) return;

        if (idiomaActual() === 'es') {
            const traducido = await traducirTexto(original, 'es');
            el.textContent = traducido;
        } else {
            el.textContent = original;
        }
    }

    function aplicarIdioma(lang) {
        document.documentElement.lang = lang;
        localStorage.setItem(CLAVE_STORAGE, lang);

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const entrada = TRADUCCIONES[el.dataset.i18n];
            if (entrada && entrada[lang]) el.textContent = entrada[lang];
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const entrada = TRADUCCIONES[el.dataset.i18nPlaceholder];
            if (entrada && entrada[lang]) el.setAttribute('placeholder', entrada[lang]);
        });

        document.querySelectorAll('.idioma-label').forEach(el => {
            el.textContent = lang.toUpperCase();
        });

        document.querySelectorAll('[data-lang]').forEach(boton => {
            boton.classList.toggle('activo', boton.dataset.lang === lang);
        });

        document.querySelectorAll('[data-bio-original]').forEach(el => aplicarBio(el));
    }

    window.SOULRADE_IDIOMA = { idiomaActual, t, aplicarBio, aplicarIdioma };

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('[data-lang]').forEach(boton => {
            boton.addEventListener('click', () => {
                aplicarIdioma(boton.dataset.lang);
                const dropdown = boton.closest('.collapse');
                if (dropdown && window.bootstrap) {
                    bootstrap.Collapse.getOrCreateInstance(dropdown).hide();
                }
            });
        });

        aplicarIdioma(idiomaActual());
    });
})();
