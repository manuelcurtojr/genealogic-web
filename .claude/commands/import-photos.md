---
name: import-photos
description: Import photos from presadb.com for dogs in the Genealogic database. Use when the user says "import photos", "download photos", "get photos from presadb", "run photo finder", "buscar fotos", or wants to enrich dog profiles with photos from external databases. Runs locally from the user's Mac to bypass IP blocks.
---

# Import Photos — Presadb Photo Scraper

Downloads photos from presadb.com in 1000x1000 quality and uploads them to Supabase Storage. Runs from the user's Mac (not Vercel) because presadb blocks datacenter IPs.

## Usage

Run the script from the project root:

```bash
cd /Users/trabajo/Documents/Proyectos/genealogic-web
node scripts/import-photos.mjs --limit 50
```

### Options

- `--limit N` — Process N dogs (default: 50). Use `--limit 5000` for all.
- `--dry-run` — Search only, don't download or upload anything.

## What it does

1. Queries Supabase for dogs without photos or with low-quality presadb thumbnails (100x100)
2. For each dog, builds a presadb URL from the dog's name slug
3. Fetches the presadb profile page and extracts all gallery photos (350x350 or 1000x1000)
4. Downloads each photo in 1000x1000 quality
5. Uploads to Supabase Storage (`dog-photos` bucket)
6. Sets the first photo as `thumbnail_url` on the dog
7. Adds all photos to the `dog_photos` table with positions

## Output

The script shows progress for each dog:
- 📸 = photos found and imported
- ❌ = not found in presadb (404 or name mismatch)
- ⚪ = found but no gallery photos
- ⚠️ = error

Final summary shows: processed, found, imported, not found, errors.

## Limitations

- Only searches presadb.com (Presa Canario Database)
- Dogs with numeric IDs in presadb URLs (e.g., `dumbo-de-reganados-6578`) won't be found by slug alone
- Requires the user's Mac to have internet access (not blocked by presadb)
- Reads credentials from `.env.local`

## Running in background

For large batches, run in background:
```bash
node scripts/import-photos.mjs --limit 5000 2>&1 | tee import-log.txt &
```
