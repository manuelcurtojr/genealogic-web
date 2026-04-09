import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Home, Search } from 'lucide-react'
import KennelsClient from '@/components/kennels/kennels-client'

export default async function KennelsPage() {
  const supabase = await createClient()

  const { data: kennels } = await supabase
    .from('kennels')
    .select('id, slug, name, logo_url, description, foundation_date')
    .order('name')

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Directorio de Criaderos</h1>
      </div>
      <KennelsClient kennels={kennels || []} />
    </div>
  )
}
