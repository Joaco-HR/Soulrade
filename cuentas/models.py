from urllib.parse import urlencode
from django.contrib.auth.models import AbstractUser
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.urls import reverse
from django.utils.text import slugify


class Usuario(AbstractUser):
    email = models.EmailField('correo electrónico', unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

class Cancion(models.Model):
    artista = models.CharField(max_length=255)
    titulo = models.CharField(max_length=255)
    slug = models.SlugField(max_length=550, unique=True, blank=True)

    tipo = 'cancion'
    tipo_icono = '🎵'
    tipo_label = 'Canción'

    class Meta:
        unique_together = ('artista', 'titulo')
        indexes = [models.Index(fields=['artista', 'titulo'])]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.artista}-{self.titulo}")[:540]
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.titulo} — {self.artista}"

    @property
    def titulo_display(self):
        return self.titulo

    @property
    def subtitulo_display(self):
        return self.artista

    def get_absolute_url(self):
        qs = urlencode({'artista': self.artista, 'cancion': self.titulo})
        return f"{reverse('cancion')}?{qs}"

    @property
    def promedio_calificacion(self):
        agg = self.calificaciones.aggregate(prom=models.Avg('puntaje'))
        return round(agg['prom'], 2) if agg['prom'] else None

    @property
    def total_calificaciones(self):
        return self.calificaciones.count()


class Album(models.Model):
    artista = models.CharField(max_length=255)
    titulo = models.CharField(max_length=255)
    slug = models.SlugField(max_length=550, unique=True, blank=True)

    tipo = 'album'
    tipo_icono = '💿'
    tipo_label = 'Álbum'

    class Meta:
        unique_together = ('artista', 'titulo')
        indexes = [models.Index(fields=['artista', 'titulo'])]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.artista}-{self.titulo}-album")[:540]
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.titulo} — {self.artista}"

    @property
    def titulo_display(self):
        return self.titulo

    @property
    def subtitulo_display(self):
        return self.artista

    def get_absolute_url(self):
        qs = urlencode({'artista': self.artista, 'album': self.titulo})
        return f"{reverse('album')}?{qs}"

    @property
    def promedio_calificacion(self):
        agg = self.calificaciones.aggregate(prom=models.Avg('puntaje'))
        return round(agg['prom'], 2) if agg['prom'] else None

    @property
    def total_calificaciones(self):
        return self.calificaciones.count()


class Artista(models.Model):
    nombre = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=280, unique=True, blank=True)

    tipo = 'artista'
    tipo_icono = '🎤'
    tipo_label = 'Artista'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nombre)[:270]
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nombre

    @property
    def titulo_display(self):
        return self.nombre

    @property
    def subtitulo_display(self):
        return ''

    def get_absolute_url(self):
        qs = urlencode({'artista': self.nombre})
        return f"{reverse('artista')}?{qs}"


class Comentario(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='comentarios')
    cancion = models.ForeignKey(Cancion, on_delete=models.CASCADE, related_name='comentarios')
    texto = models.TextField(max_length=1000)
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-creado']

    def __str__(self):
        return f"{self.usuario} sobre {self.cancion}: {self.texto[:30]}"


class Calificacion(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='calificaciones')
    cancion = models.ForeignKey(Cancion, on_delete=models.CASCADE, related_name='calificaciones')
    puntaje = models.PositiveSmallIntegerField()
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('usuario', 'cancion')

    def __str__(self):
        return f"{self.usuario} calificó {self.cancion} con {self.puntaje}"

    @property
    def objeto(self):
        return self.cancion


class ComentarioAlbum(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='comentarios_album')
    album = models.ForeignKey(Album, on_delete=models.CASCADE, related_name='comentarios')
    texto = models.TextField(max_length=1000)
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-creado']

    def __str__(self):
        return f"{self.usuario} sobre {self.album}: {self.texto[:30]}"


class CalificacionAlbum(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='calificaciones_album')
    album = models.ForeignKey(Album, on_delete=models.CASCADE, related_name='calificaciones')
    puntaje = models.PositiveSmallIntegerField()
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('usuario', 'album')

    def __str__(self):
        return f"{self.usuario} calificó {self.album} con {self.puntaje}"

    @property
    def objeto(self):
        return self.album


class Favorito(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='favoritos')
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('usuario', 'content_type', 'object_id')
        ordering = ['-creado']

    def __str__(self):
        return f"{self.usuario} ♥ {self.content_object}"


class Visualizacion(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='visualizaciones')
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    visto = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('usuario', 'content_type', 'object_id')
        ordering = ['-visto']

    def __str__(self):
        return f"{self.usuario} vio {self.content_object} el {self.visto}"


class TraduccionCache(models.Model):
    texto_hash = models.CharField(max_length=64, db_index=True)
    idioma = models.CharField(max_length=5)
    texto_traducido = models.TextField()
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('texto_hash', 'idioma')

    def __str__(self):
        return f"[{self.idioma}] {self.texto_traducido[:40]}"