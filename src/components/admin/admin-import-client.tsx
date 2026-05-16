'use client'

import { Globe } from 'lucide-react'
import ImportPedigreeTab from '@/components/dogs/import-pedigree-tab'

interface Props { userId: string }

export default function AdminImportClient({ userId }: Props) {
  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-surface-card flex items-center justify-center">
          <Globe className="w-5 h-5 text-ink" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Importar genealogía</h1>
          <p className="text-xs text-muted">Importa genealogías sin propietario para aumentar la base de datos de Genealogic</p>
        </div>
      </div>

      <div className="max-w-xl">
        <ImportPedigreeTab userId={userId} isAdmin />
      </div>
    </div>
  )
}
