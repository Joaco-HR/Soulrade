from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

Usuario = get_user_model()


class EmailBackend(ModelBackend):
    """Permite iniciar sesión usando el email en vez del username."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        email = kwargs.get('email', username)
        if email is None or password is None:
            return None
        try:
            usuario = Usuario.objects.get(email__iexact=email)
        except Usuario.DoesNotExist:
            return None
        if usuario.check_password(password) and self.user_can_authenticate(usuario):
            return usuario
        return None
