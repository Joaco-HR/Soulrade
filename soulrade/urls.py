from django.contrib import admin
from django.urls import path, include
from cuentas import views

urlpatterns = [
    path('admin/', admin.site.urls),

    path('', views.index, name='index'),
    path('cancion/', views.pagina_cancion, name='cancion'),
    path('album/', views.pagina_album, name='album'),
    path('artista/', views.pagina_artista, name='artista'),
    path('buscar/artistas/', views.buscador_artistas, name='buscador_artistas'),
    path('buscar/generos/', views.buscador_generos, name='buscador_generos'),

    path('cuentas/', include('cuentas.urls')),

    path('api/cancion/estado/', views.api_estado_cancion, name='api_estado_cancion'),
    path('api/cancion/calificar/', views.api_calificar, name='api_calificar'),
    path('api/cancion/comentar/', views.api_comentar, name='api_comentar'),
    path('api/cancion/comentario/<int:comentario_id>/editar/', views.api_editar_comentario, name='api_editar_comentario'),
    path('api/cancion/comentario/<int:comentario_id>/eliminar/', views.api_eliminar_comentario, name='api_eliminar_comentario'),
    path('api/album/estado/', views.api_estado_album, name='api_estado_album'),
    path('api/album/calificar/', views.api_calificar_album, name='api_calificar_album'),
    path('api/album/comentar/', views.api_comentar_album, name='api_comentar_album'),
    path('api/album/comentario/<int:comentario_id>/editar/', views.api_editar_comentario_album, name='api_editar_comentario_album'),
    path('api/album/comentario/<int:comentario_id>/eliminar/', views.api_eliminar_comentario_album, name='api_eliminar_comentario_album'),
    path('api/favorito/', views.api_favorito, name='api_favorito'),
    path('api/traducir/', views.api_traducir, name='api_traducir'),
]
