import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email, role, avatar_url')
    .eq('id', user.id)
    .single()

  const { data: kennel } = await supabase
    .from('kennels')
    .select('name, logo_url')
    .eq('owner_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Sidebar user={profile} kennel={kennel} />
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  )
}
