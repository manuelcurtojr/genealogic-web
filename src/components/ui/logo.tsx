export default function Logo({ className = 'h-6' }: { className?: string }) {
  return (
    <>
      <img src="/logo.svg" alt="Genealogic" className={`logo-dark ${className}`} />
      <img src="/logo-dark.svg" alt="Genealogic" className={`logo-light ${className}`} />
    </>
  )
}
