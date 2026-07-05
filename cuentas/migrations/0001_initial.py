import django.contrib.auth.models
import django.contrib.auth.validators
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models

class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
        ('contenttypes', '0002_remove_content_type_name'),
    ]

    operations = [
        migrations.CreateModel(
            name='Artista',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=255, unique=True)),
                ('slug', models.SlugField(blank=True, max_length=280, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Usuario',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('username', models.CharField(error_messages={'unique': 'A user with that username already exists.'}, help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.', max_length=150, unique=True, validators=[django.contrib.auth.validators.UnicodeUsernameValidator()], verbose_name='username')),
                ('first_name', models.CharField(blank=True, max_length=150, verbose_name='first name')),
                ('last_name', models.CharField(blank=True, max_length=150, verbose_name='last name')),
                ('is_staff', models.BooleanField(default=False, help_text='Designates whether the user can log into this admin site.', verbose_name='staff status')),
                ('is_active', models.BooleanField(default=True, help_text='Designates whether this user should be treated as active. Unselect this instead of deleting accounts.', verbose_name='active')),
                ('date_joined', models.DateTimeField(default=django.utils.timezone.now, verbose_name='date joined')),
                ('email', models.EmailField(max_length=254, unique=True, verbose_name='correo electrónico')),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'verbose_name': 'user',
                'verbose_name_plural': 'users',
                'abstract': False,
            },
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name='Album',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('artista', models.CharField(max_length=255)),
                ('titulo', models.CharField(max_length=255)),
                ('slug', models.SlugField(blank=True, max_length=550, unique=True)),
            ],
            options={
                'indexes': [models.Index(fields=['artista', 'titulo'], name='cuentas_alb_artista_252133_idx')],
                'unique_together': {('artista', 'titulo')},
            },
        ),
        migrations.CreateModel(
            name='Cancion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('artista', models.CharField(max_length=255)),
                ('titulo', models.CharField(max_length=255)),
                ('slug', models.SlugField(blank=True, max_length=550, unique=True)),
            ],
            options={
                'indexes': [models.Index(fields=['artista', 'titulo'], name='cuentas_can_artista_2aa2ca_idx')],
                'unique_together': {('artista', 'titulo')},
            },
        ),
        migrations.CreateModel(
            name='Comentario',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('texto', models.TextField(max_length=1000)),
                ('creado', models.DateTimeField(auto_now_add=True)),
                ('cancion', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comentarios', to='cuentas.cancion')),
                ('usuario', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comentarios', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-creado'],
            },
        ),
        migrations.CreateModel(
            name='Calificacion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('puntaje', models.PositiveSmallIntegerField()),
                ('creado', models.DateTimeField(auto_now_add=True)),
                ('actualizado', models.DateTimeField(auto_now=True)),
                ('usuario', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='calificaciones', to=settings.AUTH_USER_MODEL)),
                ('cancion', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='calificaciones', to='cuentas.cancion')),
            ],
            options={
                'unique_together': {('usuario', 'cancion')},
            },
        ),
        migrations.CreateModel(
            name='Favorito',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('object_id', models.PositiveIntegerField()),
                ('creado', models.DateTimeField(auto_now_add=True)),
                ('content_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='contenttypes.contenttype')),
                ('usuario', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favoritos', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-creado'],
                'unique_together': {('usuario', 'content_type', 'object_id')},
            },
        ),
        migrations.CreateModel(
            name='Visualizacion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('object_id', models.PositiveIntegerField()),
                ('visto', models.DateTimeField(auto_now=True)),
                ('content_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='contenttypes.contenttype')),
                ('usuario', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='visualizaciones', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-visto'],
                'unique_together': {('usuario', 'content_type', 'object_id')},
            },
        ),
    ]