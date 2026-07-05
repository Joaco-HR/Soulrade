from django.urls import path
from . import views

app_name = 'cuentas'

urlpatterns = [
    path('registrarse/', views.registro, name='registro'),
    path('iniciar-sesion/', views.iniciar_sesion, name='iniciar_sesion'),
    path('salir/', views.cerrar_sesion, name='cerrar_sesion'),
    path('perfil/', views.perfil, name='perfil'),
]
