'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, AlertCircle } from 'lucide-react'
import GenotypeEditor from '@/components/genetica/genotype-editor'
import { useT } from '@/components/i18n/locale-provider'

interface Props {
  dogId: string
  userId: string
}

interface Dog {
  id: string
  name: string
  slug: string | null
  sex: string
  thumbnail_url: string | null
  breed_id?: string | null
  color_id?: string | null
  breed?: { name: string } | null
}

/**
 * Tab "Genética" del edit panel de perro.
 * Reusa el GenotypeEditor de /genetica cargando todo client-side.
 * Evita que el criador tenga que salir a otra ruta para gestionar genotipos.
 */
export default function GeneticaTab({ dogId }: Props) {
  const t = useT()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dog, setDog] = useState<Dog | null>(null)
  const [genotypes, setGenotypes] = useState<any[]>([])
  const [observation, setObservation] = useState<any>(null)
  const [breedColors, setBreedColors] = useState<{ id: string; name: string }[]>([])
  const [allColors, setAllColors] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      try {
        const [dogRes, allColorsRes] = await Promise.all([
          supabase
            .from('dogs')
            .select('id, name, slug, sex, thumbnail_url, breed_id, color_id, breed:breeds(name)')
            .eq('id', dogId)
            .maybeSingle(),
          supabase.from('colors').select('id, name').order('name'),
        ])

        if (cancelled) return
        if (dogRes.error) throw dogRes.error
        if (!dogRes.data) throw new Error(t('Perro no encontrado'))

        const dogData = dogRes.data as any
        const normalizedDog: Dog = {
          id: dogData.id,
          name: dogData.name,
          slug: dogData.slug,
          sex: dogData.sex,
          thumbnail_url: dogData.thumbnail_url,
          breed_id: dogData.breed_id,
          color_id: dogData.color_id,
          breed: Array.isArray(dogData.breed) ? dogData.breed[0] || null : dogData.breed || null,
        }
        setDog(normalizedDog)
        setAllColors(allColorsRes.data || [])

        const [gtRes, obsRes, bcRes] = await Promise.all([
          supabase
            .from('dog_genotypes')
            .select('id, locus, allele_1, allele_2, source, confidence, notes')
            .eq('dog_id', dogId),
          supabase
            .from('dog_color_observations')
            .select('id, color_id, coat_length, white_pattern, has_merle, has_mask, has_tan_points, has_brindle, is_diluted, notes')
            .eq('dog_id', dogId)
            .maybeSingle(),
          normalizedDog.breed_id
            ? supabase
                .from('breed_colors')
                .select('color:colors(id, name)')
                .eq('breed_id', normalizedDog.breed_id)
            : Promise.resolve({ data: [] as any[] }),
        ])

        if (cancelled) return

        setGenotypes(gtRes.data || [])
        setObservation(obsRes.data || null)
        setBreedColors(
          ((bcRes.data || []) as any[])
            .map((r) => r.color)
            .filter((c: any): c is { id: string; name: string } => !!c)
            .sort((a: any, b: any) => a.name.localeCompare(b.name, 'es'))
        )
      } catch (err: any) {
        if (!cancelled) setError(err.message || t('Error cargando datos genéticos'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [dogId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-red-500/30 bg-red-500/[0.06] px-4 py-3.5 text-[13px] text-red-600">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        {error}
      </div>
    )
  }

  if (!dog) return null

  return (
    <GenotypeEditor
      dog={dog}
      initialGenotypes={genotypes}
      breedColors={breedColors}
      allColors={allColors}
      initialObservation={observation}
    />
  )
}
