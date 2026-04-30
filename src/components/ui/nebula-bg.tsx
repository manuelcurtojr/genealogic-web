/**
 * Background "tech nebulae" — 4 radial blobs with heavy blur, animated in
 * long, desynced loops. Pure CSS, no images. A subtle HUD grid sits on top
 * with a radial mask for editorial depth.
 *
 * Usage: parent must have `position: relative; overflow: hidden`.
 * Wrap your own content with `className="relative z-10"` so it sits above.
 */
export function NebulaBg() {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        {/* Brand orange — top-left */}
        <div
          className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full opacity-[0.35]"
          style={{
            background:
              'radial-gradient(closest-side, rgba(215,71,9,0.9), rgba(215,71,9,0) 70%)',
            filter: 'blur(60px)',
            animation: 'nebula-float-a 18s ease-in-out infinite',
          }}
        />
        {/* Deep purple — middle right */}
        <div
          className="absolute -right-32 top-20 h-[520px] w-[520px] rounded-full opacity-[0.32]"
          style={{
            background:
              'radial-gradient(closest-side, rgba(124,58,237,0.85), rgba(124,58,237,0) 70%)',
            filter: 'blur(70px)',
            animation: 'nebula-float-b 22s ease-in-out infinite',
          }}
        />
        {/* Tech cyan — bottom center */}
        <div
          className="absolute bottom-[-120px] left-[30%] h-[480px] w-[480px] rounded-full opacity-[0.22]"
          style={{
            background:
              'radial-gradient(closest-side, rgba(6,182,212,0.8), rgba(6,182,212,0) 70%)',
            filter: 'blur(80px)',
            animation: 'nebula-float-c 26s ease-in-out infinite',
          }}
        />
        {/* Pink accent — top-right corner */}
        <div
          className="absolute -top-20 right-[25%] h-[320px] w-[320px] rounded-full opacity-[0.25]"
          style={{
            background:
              'radial-gradient(closest-side, rgba(236,72,153,0.8), rgba(236,72,153,0) 70%)',
            filter: 'blur(60px)',
            animation: 'nebula-float-d 20s ease-in-out infinite',
          }}
        />
        {/* HUD grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage:
              'radial-gradient(ellipse at center, black 40%, transparent 75%)',
            WebkitMaskImage:
              'radial-gradient(ellipse at center, black 40%, transparent 75%)',
          }}
        />
      </div>
      <style>{`
        @keyframes nebula-float-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(60px, 30px) scale(1.08); }
        }
        @keyframes nebula-float-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, 60px) scale(1.05); }
        }
        @keyframes nebula-float-c {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(80px, -40px) scale(0.95); }
        }
        @keyframes nebula-float-d {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-50px, 40px) scale(1.1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [aria-hidden="true"] > * { animation: none !important; }
        }
      `}</style>
    </>
  )
}
