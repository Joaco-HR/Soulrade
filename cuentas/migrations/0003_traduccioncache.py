from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('cuentas', '0002_comentarioalbum_calificacionalbum'),
    ]

    operations = [
        migrations.CreateModel(
            name='TraduccionCache',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('texto_hash', models.CharField(db_index=True, max_length=64)),
                ('idioma', models.CharField(max_length=5)),
                ('texto_traducido', models.TextField()),
                ('creado', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'unique_together': {('texto_hash', 'idioma')},
            },
        ),
    ]