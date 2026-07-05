import hashlib
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.contenttypes.models import ContentType
from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.views.decorators.http import require_POST, require_GET
from .forms import RegistroForm, LoginForm
from .models import (
    Cancion, Album, Artista, Comentario, Calificacion,
    ComentarioAlbum, CalificacionAlbum, Favorito, Visualizacion,
    TraduccionCache,
)

Usuario = get_user_model()

def _get_or_create_seguro(modelo, busqueda_exacta, busqueda_iexact, defaults):
    """
    get_or_create robusto ante choques de slug: si ya existe una fila cuyo
    artista/título coincide sin distinguir mayúsculas (o si otra request
    la crea justo antes), reutiliza esa fila en vez de romper con
    IntegrityError por el slug duplicado.
    """
    obj = modelo.objects.filter(**busqueda_exacta).first()
    if obj:
        return obj

    obj = modelo.objects.filter(**busqueda_iexact).first()
    if obj:
        return obj

    try:
        with transaction.atomic():
            return modelo.objects.create(**{**busqueda_exacta, **defaults})
    except IntegrityError:
        # Condición de carrera o variante de mayúsculas/minúsculas que
        # generó el mismo slug: buscamos de nuevo en vez de fallar.
        obj = modelo.objects.filter(**busqueda_iexact).first()
        if obj:
            return obj
        raise


def _obtener_objeto(tipo, data):
    tipo = (tipo or '').strip().lower()

    if tipo == 'cancion':
        artista = (data.get('artista') or '').strip()
        titulo = (data.get('cancion') or '').strip()
        if not artista or not titulo:
            return None
        return _get_or_create_seguro(
            Cancion,
            {'artista': artista, 'titulo': titulo},
            {'artista__iexact': artista, 'titulo__iexact': titulo},
            {},
        )

    if tipo == 'album':
        artista = (data.get('artista') or '').strip()
        titulo = (data.get('album') or '').strip()
        if not artista or not titulo:
            return None
        return _get_or_create_seguro(
            Album,
            {'artista': artista, 'titulo': titulo},
            {'artista__iexact': artista, 'titulo__iexact': titulo},
            {},
        )

    if tipo == 'artista':
        nombre = (data.get('artista') or data.get('nombre') or '').strip()
        if not nombre:
            return None
        return _get_or_create_seguro(
            Artista,
            {'nombre': nombre},
            {'nombre__iexact': nombre},
            {},
        )

    return None


def _marcar_visualizacion(usuario, obj):
    ct = ContentType.objects.get_for_model(obj)
    Visualizacion.objects.update_or_create(usuario=usuario, content_type=ct, object_id=obj.pk)

    historial = Visualizacion.objects.filter(usuario=usuario).order_by("-visto")
    while historial.count() > 10:
        historial.last().delete()


def _es_favorito(usuario, obj):
    ct = ContentType.objects.get_for_model(obj)
    return Favorito.objects.filter(usuario=usuario, content_type=ct, object_id=obj.pk).exists()


def _toggle_favorito(usuario, obj):
    ct = ContentType.objects.get_for_model(obj)
    favorito = Favorito.objects.filter(usuario=usuario, content_type=ct, object_id=obj.pk).first()
    if favorito:
        favorito.delete()
        return False
    Favorito.objects.create(usuario=usuario, content_type=ct, object_id=obj.pk)
    return True

def index(request):
    return render(request, 'index.html')


def pagina_cancion(request):
    artista = request.GET.get('artista', 'Lady Gaga')
    titulo = request.GET.get('cancion', 'Die With a Smile')

    contexto = {}
    if request.user.is_authenticated:
        cancion = _obtener_objeto('cancion', {'artista': artista, 'cancion': titulo})
        _marcar_visualizacion(request.user, cancion)
        mi_calificacion = Calificacion.objects.filter(usuario=request.user, cancion=cancion).first()
        contexto['mi_calificacion'] = mi_calificacion.puntaje if mi_calificacion else 0
        contexto['es_favorito'] = _es_favorito(request.user, cancion)

    return render(request, 'cancion.html', contexto)


def pagina_album(request):
    artista = request.GET.get('artista', '')
    titulo = request.GET.get('album', '')

    contexto = {}
    if request.user.is_authenticated and artista and titulo:
        album = _obtener_objeto('album', {'artista': artista, 'album': titulo})
        _marcar_visualizacion(request.user, album)
        mi_calificacion = CalificacionAlbum.objects.filter(usuario=request.user, album=album).first()
        contexto['mi_calificacion'] = mi_calificacion.puntaje if mi_calificacion else 0
        contexto['es_favorito'] = _es_favorito(request.user, album)

    return render(request, 'album.html', contexto)


def pagina_artista(request):
    nombre = request.GET.get('artista', '')

    contexto = {}
    if request.user.is_authenticated and nombre:
        artista_obj = _obtener_objeto('artista', {'artista': nombre})
        _marcar_visualizacion(request.user, artista_obj)
        contexto['es_favorito'] = _es_favorito(request.user, artista_obj)

    return render(request, 'artista.html', contexto)


def buscador_artistas(request):
    return render(request, 'buscador_artistas.html')


def buscador_generos(request):
    return render(request, 'buscador_generos.html')


def registro(request):
    if request.user.is_authenticated:
        return redirect('index')
    if request.method == 'POST':
        form = RegistroForm(request.POST)
        if form.is_valid():
            usuario = form.save()
            login(request, usuario, backend='cuentas.backends.EmailBackend')
            messages.success(request, f'¡Bienvenido/a, {usuario.first_name}!')
            return redirect('index')
    else:
        form = RegistroForm()
    return render(request, 'crear_cuenta.html', {'form': form})


def iniciar_sesion(request):
    if request.user.is_authenticated:
        return redirect('index')
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            usuario = authenticate(
                request,
                email=form.cleaned_data['email'],
                password=form.cleaned_data['password'],
            )
            if usuario is not None:
                login(request, usuario)
                siguiente = request.GET.get('next') or 'index'
                return redirect(siguiente)
            form.add_error(None, 'Correo o contraseña incorrectos.')
    else:
        form = LoginForm()
    return render(request, 'iniciar_secion.html', {'form': form})


@require_POST
def cerrar_sesion(request):
    logout(request)
    return redirect('index')


@login_required
def perfil(request):
    calif_canciones = Calificacion.objects.filter(usuario=request.user).select_related('cancion')
    calif_albumes = CalificacionAlbum.objects.filter(usuario=request.user).select_related('album')

    calificaciones = sorted(
        [{'objeto': c.cancion, 'puntaje': c.puntaje, 'actualizado': c.actualizado} for c in calif_canciones]
        + [{'objeto': c.album, 'puntaje': c.puntaje, 'actualizado': c.actualizado} for c in calif_albumes],
        key=lambda item: item['actualizado'],
        reverse=True,
    )[:50]

    contexto = {
        'favoritos': Favorito.objects.filter(usuario=request.user).select_related('content_type')[:50],
        'historial': Visualizacion.objects.filter(usuario=request.user).select_related('content_type')[:20],
        'calificaciones': calificaciones,
    }
    return render(request, 'perfil.html', contexto)


def _cuerpo_json(request):
    try:
        return json.loads(request.body.decode('utf-8') or '{}')
    except (json.JSONDecodeError, UnicodeDecodeError):
        return {}



@require_GET
def api_estado_cancion(request):
    artista = request.GET.get('artista', '')
    titulo = request.GET.get('cancion', '')
    cancion = Cancion.objects.filter(artista__iexact=artista.strip(), titulo__iexact=titulo.strip()).first()

    data = {
        'autenticado': request.user.is_authenticated,
        'promedio': None,
        'total_calificaciones': 0,
        'mi_calificacion': 0,
        'es_favorito': False,
        'comentarios': [],
    }
    if cancion:
        data['promedio'] = cancion.promedio_calificacion
        data['total_calificaciones'] = cancion.total_calificaciones
        data['comentarios'] = [
            {
                'id': c.pk,
                'usuario': c.usuario.first_name or c.usuario.email,
                'texto': c.texto,
                'fecha': c.creado.strftime('%d/%m/%Y'),
                'puntaje': getattr(
                    Calificacion.objects.filter(usuario=c.usuario, cancion=cancion).first(),
                    'puntaje', 0,
                ),
                'es_mio': request.user.is_authenticated and c.usuario_id == request.user.id,
            }
            for c in cancion.comentarios.select_related('usuario')[:30]
        ]
        if request.user.is_authenticated:
            mi_calificacion = Calificacion.objects.filter(usuario=request.user, cancion=cancion).first()
            data['mi_calificacion'] = mi_calificacion.puntaje if mi_calificacion else 0
            data['es_favorito'] = _es_favorito(request.user, cancion)

    return JsonResponse(data)


@login_required
@require_POST
def api_calificar(request):
    data = _cuerpo_json(request)
    cancion = _obtener_objeto('cancion', data)
    if cancion is None:
        return JsonResponse({'ok': False, 'error': 'Falta artista o canción.'}, status=400)

    try:
        puntaje = int(data.get('puntaje'))
    except (TypeError, ValueError):
        return JsonResponse({'ok': False, 'error': 'Puntaje inválido.'}, status=400)

    if puntaje < 1 or puntaje > 5:
        return JsonResponse({'ok': False, 'error': 'El puntaje debe ser de 1 a 5.'}, status=400)

    Calificacion.objects.update_or_create(
        usuario=request.user, cancion=cancion, defaults={'puntaje': puntaje}
    )
    return JsonResponse({
        'ok': True,
        'mi_calificacion': puntaje,
        'promedio': cancion.promedio_calificacion,
        'total_calificaciones': cancion.total_calificaciones,
    })


@login_required
@require_POST
def api_comentar(request):
    data = _cuerpo_json(request)
    cancion = _obtener_objeto('cancion', data)
    if cancion is None:
        return JsonResponse({'ok': False, 'error': 'Falta artista o canción.'}, status=400)

    texto = (data.get('texto') or '').strip()
    if not texto:
        return JsonResponse({'ok': False, 'error': 'El comentario no puede estar vacío.'}, status=400)
    if len(texto) > 1000:
        return JsonResponse({'ok': False, 'error': 'El comentario es demasiado largo.'}, status=400)

    comentario = Comentario.objects.create(usuario=request.user, cancion=cancion, texto=texto)
    mi_calificacion = Calificacion.objects.filter(usuario=request.user, cancion=cancion).first()

    return JsonResponse({
        'ok': True,
        'comentario': {
            'id': comentario.pk,
            'usuario': request.user.first_name or request.user.email,
            'texto': comentario.texto,
            'fecha': comentario.creado.strftime('%d/%m/%Y'),
            'puntaje': mi_calificacion.puntaje if mi_calificacion else 0,
            'es_mio': True,
        }
    })


@login_required
@require_POST
def api_editar_comentario(request, comentario_id):
    comentario = Comentario.objects.filter(pk=comentario_id, usuario=request.user).first()
    if comentario is None:
        return JsonResponse({'ok': False, 'error': 'No se encontró el comentario.'}, status=404)

    data = _cuerpo_json(request)
    texto = (data.get('texto') or '').strip()
    if not texto:
        return JsonResponse({'ok': False, 'error': 'El comentario no puede estar vacío.'}, status=400)
    if len(texto) > 1000:
        return JsonResponse({'ok': False, 'error': 'El comentario es demasiado largo.'}, status=400)

    puntaje = None
    if data.get('puntaje') not in (None, ''):
        try:
            puntaje = int(data.get('puntaje'))
        except (TypeError, ValueError):
            return JsonResponse({'ok': False, 'error': 'Puntaje inválido.'}, status=400)
        if puntaje < 1 or puntaje > 5:
            return JsonResponse({'ok': False, 'error': 'El puntaje debe ser de 1 a 5.'}, status=400)

    comentario.texto = texto
    comentario.save(update_fields=['texto'])

    if puntaje is not None:
        Calificacion.objects.update_or_create(
            usuario=request.user, cancion=comentario.cancion, defaults={'puntaje': puntaje}
        )

    mi_calificacion = Calificacion.objects.filter(usuario=request.user, cancion=comentario.cancion).first()

    return JsonResponse({
        'ok': True,
        'comentario': {
            'id': comentario.pk,
            'texto': comentario.texto,
            'puntaje': mi_calificacion.puntaje if mi_calificacion else 0,
        },
        'promedio': comentario.cancion.promedio_calificacion,
        'total_calificaciones': comentario.cancion.total_calificaciones,
    })


@login_required
@require_POST
def api_eliminar_comentario(request, comentario_id):
    comentario = Comentario.objects.filter(pk=comentario_id, usuario=request.user).first()
    if comentario is None:
        return JsonResponse({'ok': False, 'error': 'No se encontró el comentario.'}, status=404)

    cancion = comentario.cancion
    comentario.delete()
    Calificacion.objects.filter(usuario=request.user, cancion=cancion).delete()
    return JsonResponse({'ok': True})

@require_GET
def api_estado_album(request):
    artista = request.GET.get('artista', '')
    titulo = request.GET.get('album', '')
    album = Album.objects.filter(artista__iexact=artista.strip(), titulo__iexact=titulo.strip()).first()

    data = {
        'autenticado': request.user.is_authenticated,
        'promedio': None,
        'total_calificaciones': 0,
        'mi_calificacion': 0,
        'es_favorito': False,
        'comentarios': [],
    }
    if album:
        data['promedio'] = album.promedio_calificacion
        data['total_calificaciones'] = album.total_calificaciones
        data['comentarios'] = [
            {
                'id': c.pk,
                'usuario': c.usuario.first_name or c.usuario.email,
                'texto': c.texto,
                'fecha': c.creado.strftime('%d/%m/%Y'),
                'puntaje': getattr(
                    CalificacionAlbum.objects.filter(usuario=c.usuario, album=album).first(),
                    'puntaje', 0,
                ),
                'es_mio': request.user.is_authenticated and c.usuario_id == request.user.id,
            }
            for c in album.comentarios.select_related('usuario')[:30]
        ]
        if request.user.is_authenticated:
            mi_calificacion = CalificacionAlbum.objects.filter(usuario=request.user, album=album).first()
            data['mi_calificacion'] = mi_calificacion.puntaje if mi_calificacion else 0
            data['es_favorito'] = _es_favorito(request.user, album)

    return JsonResponse(data)


@login_required
@require_POST
def api_calificar_album(request):
    data = _cuerpo_json(request)
    album = _obtener_objeto('album', data)
    if album is None:
        return JsonResponse({'ok': False, 'error': 'Falta artista o álbum.'}, status=400)

    try:
        puntaje = int(data.get('puntaje'))
    except (TypeError, ValueError):
        return JsonResponse({'ok': False, 'error': 'Puntaje inválido.'}, status=400)

    if puntaje < 1 or puntaje > 5:
        return JsonResponse({'ok': False, 'error': 'El puntaje debe ser de 1 a 5.'}, status=400)

    CalificacionAlbum.objects.update_or_create(
        usuario=request.user, album=album, defaults={'puntaje': puntaje}
    )
    return JsonResponse({
        'ok': True,
        'mi_calificacion': puntaje,
        'promedio': album.promedio_calificacion,
        'total_calificaciones': album.total_calificaciones,
    })


@login_required
@require_POST
def api_comentar_album(request):
    data = _cuerpo_json(request)
    album = _obtener_objeto('album', data)
    if album is None:
        return JsonResponse({'ok': False, 'error': 'Falta artista o álbum.'}, status=400)

    texto = (data.get('texto') or '').strip()
    if not texto:
        return JsonResponse({'ok': False, 'error': 'El comentario no puede estar vacío.'}, status=400)
    if len(texto) > 1000:
        return JsonResponse({'ok': False, 'error': 'El comentario es demasiado largo.'}, status=400)

    comentario = ComentarioAlbum.objects.create(usuario=request.user, album=album, texto=texto)
    mi_calificacion = CalificacionAlbum.objects.filter(usuario=request.user, album=album).first()

    return JsonResponse({
        'ok': True,
        'comentario': {
            'id': comentario.pk,
            'usuario': request.user.first_name or request.user.email,
            'texto': comentario.texto,
            'fecha': comentario.creado.strftime('%d/%m/%Y'),
            'puntaje': mi_calificacion.puntaje if mi_calificacion else 0,
            'es_mio': True,
        }
    })


@login_required
@require_POST
def api_editar_comentario_album(request, comentario_id):
    comentario = ComentarioAlbum.objects.filter(pk=comentario_id, usuario=request.user).first()
    if comentario is None:
        return JsonResponse({'ok': False, 'error': 'No se encontró el comentario.'}, status=404)

    data = _cuerpo_json(request)
    texto = (data.get('texto') or '').strip()
    if not texto:
        return JsonResponse({'ok': False, 'error': 'El comentario no puede estar vacío.'}, status=400)
    if len(texto) > 1000:
        return JsonResponse({'ok': False, 'error': 'El comentario es demasiado largo.'}, status=400)

    puntaje = None
    if data.get('puntaje') not in (None, ''):
        try:
            puntaje = int(data.get('puntaje'))
        except (TypeError, ValueError):
            return JsonResponse({'ok': False, 'error': 'Puntaje inválido.'}, status=400)
        if puntaje < 1 or puntaje > 5:
            return JsonResponse({'ok': False, 'error': 'El puntaje debe ser de 1 a 5.'}, status=400)

    comentario.texto = texto
    comentario.save(update_fields=['texto'])

    if puntaje is not None:
        CalificacionAlbum.objects.update_or_create(
            usuario=request.user, album=comentario.album, defaults={'puntaje': puntaje}
        )

    mi_calificacion = CalificacionAlbum.objects.filter(usuario=request.user, album=comentario.album).first()

    return JsonResponse({
        'ok': True,
        'comentario': {
            'id': comentario.pk,
            'texto': comentario.texto,
            'puntaje': mi_calificacion.puntaje if mi_calificacion else 0,
        },
        'promedio': comentario.album.promedio_calificacion,
        'total_calificaciones': comentario.album.total_calificaciones,
    })


@login_required
@require_POST
def api_eliminar_comentario_album(request, comentario_id):
    comentario = ComentarioAlbum.objects.filter(pk=comentario_id, usuario=request.user).first()
    if comentario is None:
        return JsonResponse({'ok': False, 'error': 'No se encontró el comentario.'}, status=404)

    album = comentario.album
    comentario.delete()
    CalificacionAlbum.objects.filter(usuario=request.user, album=album).delete()
    return JsonResponse({'ok': True})


@login_required
@require_POST
def api_favorito(request):
    data = _cuerpo_json(request)
    obj = _obtener_objeto(data.get('tipo'), data)
    if obj is None:
        return JsonResponse({'ok': False, 'error': 'Datos inválidos.'}, status=400)

    es_favorito = _toggle_favorito(request.user, obj)
    return JsonResponse({'ok': True, 'es_favorito': es_favorito})


def _dividir_en_fragmentos(texto, tamano_max=450):
    oraciones = re.split(r'(?<=[.!?])\s+', texto)
    fragmentos, actual = [], ''
    for oracion in oraciones:
        if actual and len(actual) + len(oracion) + 1 > tamano_max:
            fragmentos.append(actual.strip())
            actual = oracion
        else:
            actual = f'{actual} {oracion}'.strip()
    if actual:
        fragmentos.append(actual.strip())
    return fragmentos or [texto]


def _traducir_con_mymemory(texto, origen, destino):
    qs = urllib.parse.urlencode({'q': texto, 'langpair': f'{origen}|{destino}'})
    url = f'https://api.mymemory.translated.net/get?{qs}'
    try:
        with urllib.request.urlopen(url, timeout=8) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        traducido = data.get('responseData', {}).get('translatedText')
        return traducido or texto
    except (urllib.error.URLError, TimeoutError, ValueError, json.JSONDecodeError):
        return texto


@require_POST
def api_traducir(request):
    data = _cuerpo_json(request)
    texto = (data.get('texto') or '').strip()
    destino = (data.get('destino') or '').strip().lower()

    if not texto or destino not in ('es', 'en'):
        return JsonResponse({'ok': False, 'error': 'Datos inválidos.'}, status=400)
    if len(texto) > 4000:
        return JsonResponse({'ok': False, 'error': 'Texto demasiado largo.'}, status=400)

    origen = 'en' if destino == 'es' else 'es'
    texto_hash = hashlib.sha256(texto.encode('utf-8')).hexdigest()

    cache = TraduccionCache.objects.filter(texto_hash=texto_hash, idioma=destino).first()
    if cache:
        return JsonResponse({'ok': True, 'texto': cache.texto_traducido, 'cache': True})

    fragmentos = _dividir_en_fragmentos(texto)
    traducidos = [_traducir_con_mymemory(frag, origen, destino) for frag in fragmentos]
    texto_traducido = ' '.join(traducidos)

    TraduccionCache.objects.update_or_create(
        texto_hash=texto_hash, idioma=destino,
        defaults={'texto_traducido': texto_traducido},
    )
    return JsonResponse({'ok': True, 'texto': texto_traducido, 'cache': False})