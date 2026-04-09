// Generate URL-friendly slug from a name
export function generateSlug(name: string): string {
  return name
    .normalize('NFD')                    // Decompose accents: é → e + ́
    .replace(/[\u0300-\u036f]/g, '')     // Remove combining diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')        // Remove non-alphanumeric chars
    .replace(/\s+/g, '-')               // Spaces → hyphens
    .replace(/-+/g, '-')                // Collapse multiple hyphens
    .replace(/^-|-$/g, '')              // Trim leading/trailing hyphens
    .slice(0, 120)                      // Max length
}

// Check if a string looks like a UUID
export function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}
