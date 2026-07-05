import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('cuentas', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ComentarioAlbum',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('texto', models.TextField(max_length=1000)),
                ('creado', models.DateTimeField(auto_now_add=True)),
                ('album', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comentarios', to='cuentas.album')),
                ('usuario', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comentarios_album', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-creado'],
            },
        ),
        migrations.CreateModel(
            name='CalificacionAlbum',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('puntaje', models.PositiveSmallIntegerField()),
                ('creado', models.DateTimeField(auto_now_add=True)),
                ('actualizado', models.DateTimeField(auto_now=True)),
                ('album', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='calificaciones', to='cuentas.album')),
                ('usuario', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='calificaciones_album', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('usuario', 'album')},
            },
        ),
    ]