from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

Usuario = get_user_model()

class RegistroForm(forms.Form):
    nombre = forms.CharField(max_length=50)
    apellido = forms.CharField(max_length=50)
    email = forms.EmailField(max_length=100)
    password = forms.CharField(widget=forms.PasswordInput, max_length=100)

    def clean_email(self):
        email = self.cleaned_data['email'].lower().strip()
        if Usuario.objects.filter(email__iexact=email).exists():
            raise ValidationError('Ya existe una cuenta con este correo electrónico.')
        return email

    def clean_password(self):
        password = self.cleaned_data['password']
        validate_password(password)
        return password

    def save(self):
        usuario = Usuario(
            email=self.cleaned_data['email'],
            username=self.cleaned_data['email'],
            first_name=self.cleaned_data['nombre'],
            last_name=self.cleaned_data['apellido'],
        )
        usuario.set_password(self.cleaned_data['password'])
        usuario.save()
        return usuario


class LoginForm(forms.Form):
    email = forms.EmailField(max_length=100)
    password = forms.CharField(widget=forms.PasswordInput, max_length=100)


class ComentarioForm(forms.Form):
    texto = forms.CharField(max_length=1000, widget=forms.Textarea)