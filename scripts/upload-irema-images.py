#!/usr/bin/env python3
"""
Descarga las imágenes de iremacurto.com y las sube al bucket 'kennels' de
Supabase bajo el path 'irema-curto/site/'. Genera un mapping URL antigua →
URL nueva para usar en el import SQL.
"""
import json, os, sys, urllib.request, urllib.error, urllib.parse, mimetypes

ANON_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL') or os.environ.get('SUPABASE_URL')
SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
if not ANON_URL or not SERVICE_KEY:
    print('Faltan env vars SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY', file=sys.stderr)
    sys.exit(1)

SRC_HOST = 'https://iremacurto.com'
BUCKET = 'kennels'
PREFIX = 'irema-curto/site/'

with open('/tmp/irema-imgs.json') as f:
    imgs_by_page = json.load(f)

# Recoger URLs únicas
all_urls = set()
for arr in imgs_by_page.values():
    for u in arr:
        all_urls.add(u)

print(f'URLs únicas: {len(all_urls)}')

mapping = {}
ok = 0
skipped = 0
errored = 0

for original in sorted(all_urls):
    # 1) Si ya está en supabase del propio Genealogic, dejar tal cual
    if 'elhwppumacnyhovkapeb.supabase.co' in original:
        mapping[original] = original
        skipped += 1
        continue

    # 2) Construir URL absoluta para descarga
    src_url = original
    if not original.startswith('http'):
        src_url = SRC_HOST + original

    # 3) Nombre destino: aplanar el path, mantener extensión
    parsed = urllib.parse.urlparse(src_url)
    path_parts = [p for p in parsed.path.split('/') if p and p != 'seed' and p != 'irema']
    filename = '_'.join(path_parts).lower()
    if not any(filename.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp', '.avif']):
        # Fallback ext
        filename += '.jpg'

    dest_path = PREFIX + filename
    dest_url = f'{ANON_URL}/storage/v1/object/public/{BUCKET}/{dest_path}'

    # 4) ¿Ya está subida? HEAD request
    try:
        head = urllib.request.Request(dest_url, method='HEAD')
        urllib.request.urlopen(head, timeout=5)
        # 200 OK → ya existe
        mapping[original] = dest_url
        skipped += 1
        continue
    except urllib.error.HTTPError as e:
        if e.code != 404:
            print(f'  HEAD {dest_url}: HTTP {e.code}')
    except Exception as e:
        pass

    # 5) Descargar el original
    try:
        req = urllib.request.Request(src_url, headers={'User-Agent': 'Mozilla/5.0 GenealogicImporter/1.0'})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read()
            content_type = r.headers.get('Content-Type', mimetypes.guess_type(filename)[0] or 'image/jpeg')
    except Exception as e:
        print(f'  ✗ descarga fallida {src_url}: {e}')
        errored += 1
        continue

    # 6) Subir a Supabase Storage
    upload_url = f'{ANON_URL}/storage/v1/object/{BUCKET}/{dest_path}'
    up_req = urllib.request.Request(
        upload_url, data=data, method='POST',
        headers={
            'Authorization': f'Bearer {SERVICE_KEY}',
            'Content-Type': content_type,
            'x-upsert': 'true',
        },
    )
    try:
        urllib.request.urlopen(up_req, timeout=60)
        mapping[original] = dest_url
        ok += 1
        print(f'  ✓ {original} → {dest_path}  ({len(data)//1024}KB)')
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace')[:200]
        print(f'  ✗ upload fallido {dest_path}: HTTP {e.code} {body}')
        errored += 1
    except Exception as e:
        print(f'  ✗ upload error {dest_path}: {e}')
        errored += 1

print()
print(f'Resumen: {ok} subidas · {skipped} saltadas · {errored} errores')

with open('/tmp/irema-img-mapping.json', 'w') as f:
    json.dump(mapping, f, indent=2, sort_keys=True)
print(f'Mapping guardado en /tmp/irema-img-mapping.json ({len(mapping)} entradas)')
