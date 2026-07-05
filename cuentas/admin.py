from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import (
    Usuario, Cancion, Album, Artista,
    Comentario, Calificacion, ComentarioAlbum, CalificacionAlbum,
    Favorito, Visualizacion, TraduccionCache,
)


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    ordering = ('email',)
    list_display = ('email', 'first_name', 'last_name', 'is_staff')
    search_fields = ('email', 'first_name', 'last_name')
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Datos personales', {'fields': ('first_name', 'last_name')}),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Fechas', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2'),
        }),
    )


@admin.register(Cancion)
class CancionAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'artista', 'promedio_calificacion', 'total_calificaciones')
    search_fields = ('titulo', 'artista')


@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'artista', 'promedio_calificacion', 'total_calificaciones')
    search_fields = ('titulo', 'artista')


@admin.register(Artista)
class ArtistaAdmin(admin.ModelAdmin):
    list_display = ('nombre',)
    search_fields = ('nombre',)


@admin.register(Comentario)
class ComentarioAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'cancion', 'creado')
    list_filter = ('creado',)


@admin.register(Calificacion)
class CalificacionAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'cancion', 'puntaje', 'creado')


@admin.register(ComentarioAlbum)
class ComentarioAlbumAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'album', 'creado')
    list_filter = ('creado',)


@admin.register(CalificacionAlbum)
class CalificacionAlbumAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'album', 'puntaje', 'creado')


@admin.register(Favorito)
class FavoritoAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'content_object', 'creado')
    list_filter = ('content_type',)


@admin.register(Visualizacion)
class VisualizacionAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'content_object', 'visto')
    list_filter = ('content_type',)


@admin.register(TraduccionCache)
class TraduccionCacheAdmin(admin.ModelAdmin):
    list_display = ('idioma', 'texto_traducido', 'creado')
    list_filter = ('idioma',)
    search_fields = ('texto_traducido',)
