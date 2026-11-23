import { useId } from 'react'
import { cn } from '@/lib/cn'

export type MyDuidLoaderVariant = 'inline' | 'section' | 'full'
export type MyDuidLoaderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type MyDuidLoaderProps = {
  /** Variant of the loader depending on layout context */
  variant?: MyDuidLoaderVariant
  /** Dimension size (inline usually xs or sm, section usually md or lg, full usually lg or xl) */
  size?: MyDuidLoaderSize
  /** Optional descriptive message (e.g. "Menyiapkan keuanganmu...") */
  message?: string
  /** Custom className for container */
  className?: string
  /** Accessible label for screen readers */
  label?: string
}

const sizeConfig: Record<
  MyDuidLoaderSize,
  { box: number; flapW: number; flapH: number; coinR: number; textClass: string }
> = {
  xs: { box: 18, flapW: 8, flapH: 5, coinR: 2.5, textClass: 'text-xs' },
  sm: { box: 24, flapW: 10, flapH: 7, coinR: 3.5, textClass: 'text-xs' },
  md: { box: 36, flapW: 15, flapH: 10, coinR: 5, textClass: 'text-sm' },
  lg: { box: 48, flapW: 20, flapH: 14, coinR: 6.5, textClass: 'text-sm' },
  xl: { box: 64, flapW: 26, flapH: 18, coinR: 8.5, textClass: 'text-base' },
}

export function MyDuidLoader({
  variant = 'section',
  size = variant === 'inline' ? 'sm' : variant === 'full' ? 'xl' : 'md',
  message,
  className,
  label = 'Memuat...',
}: MyDuidLoaderProps) {
  const labelId = useId()
  const cfg = sizeConfig[size]

  // Wallet SVG graphic with 3D/folding coin interaction:
  // Using pure SVG geometry styled with theme variables var(--color-brand-500), var(--color-brand-600), var(--color-income-500)
  const walletVisual = (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: cfg.box, height: cfg.box }}
      aria-hidden="true"
    >
      {/* Ambient soft glow / pulse behind wallet for larger sizes */}
      {(size === 'lg' || size === 'xl') && (
        <div
          className="absolute -inset-1 rounded-full bg-brand-500/15 blur-md animate-pulse pointer-events-none"
          style={{ animationDuration: '2.5s' }}
        />
      )}

      {/* SVG 3D-folding Wallet & Floating Coin */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          'w-full h-full myduid-loader-svg drop-shadow-xs',
          variant === 'inline' ? 'myduid-loader-inline' : 'myduid-loader-3d',
        )}
      >
        {/* Shadow under wallet */}
        <ellipse
          cx="24"
          cy="43"
          rx="17"
          ry="3.5"
          className="fill-ink/10 dark:fill-black/30 myduid-wallet-shadow"
        />

        {/* Back Wallet Layer */}
        <rect
          x="7"
          y="15"
          width="34"
          height="24"
          rx="5"
          className="fill-brand-600 dark:fill-brand-700"
        />

        {/* Glowing Coin emerging from inside wallet */}
        <g className="myduid-wallet-coin">
          {/* Outer coin circle */}
          <circle
            cx="24"
            cy="15"
            r="8"
            className="fill-income-500 stroke-income-100/40"
            strokeWidth="1.5"
          />
          {/* Inner ring */}
          <circle
            cx="24"
            cy="15"
            r="5.5"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1"
            fill="none"
            strokeDasharray="2 1.5"
          />
          {/* Center currency glyph "D" / dot */}
          <text
            x="24"
            y="17.5"
            fontSize="6.5"
            fontWeight="bold"
            textAnchor="middle"
            fill="#ffffff"
            fontFamily="sans-serif"
          >
            D
          </text>
        </g>

        {/* Front Wallet Pocket */}
        <path
          d="M7 21C7 18.2386 9.23858 16 12 16H36C38.7614 16 41 18.2386 41 21V34C41 36.7614 38.7614 39 36 39H12C9.23858 39 7 36.7614 7 34V21Z"
          className="fill-brand-500"
        />

        {/* Subtle decorative stitched curve */}
        <path
          d="M8.5 24C12 26 17 27 24 27C31 27 36 26 39.5 24"
          stroke="rgba(255, 255, 255, 0.25)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeDasharray="2 2"
          fill="none"
        />

        {/* Wallet Flap with Clasp */}
        <g className="myduid-wallet-clasp">
          <path
            d="M33 22H42C43.1046 22 44 22.8954 44 24V28C44 29.1046 43.1046 30 42 30H33V22Z"
            className="fill-brand-700 dark:fill-brand-800"
          />
          {/* Golden / Brass Button Clasp */}
          <circle
            cx="40.5"
            cy="26"
            r="2"
            fill="#FBBF24"
            className="drop-shadow-xs"
          />
        </g>
      </svg>
    </div>
  )

  if (variant === 'inline') {
    return (
      <span
        role="status"
        aria-live="polite"
        aria-label={label}
        className={cn('inline-flex items-center gap-2 align-middle', className)}
      >
        {walletVisual}
        {message ? (
          <span className={cn('text-ink-soft select-none font-medium', cfg.textClass)}>
            {message}
          </span>
        ) : (
          <span className="sr-only">{label}</span>
        )}
      </span>
    )
  }

  if (variant === 'full') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-labelledby={message ? labelId : undefined}
        aria-label={!message ? label : undefined}
        className={cn(
          'fixed inset-0 z-40 flex flex-col items-center justify-center bg-page/90 backdrop-blur-xs px-4',
          'motion-reduce:backdrop-blur-none animate-fade-in',
          className,
        )}
      >
        <div className="flex flex-col items-center justify-center p-6 text-center">
          {walletVisual}
          {message && (
            <p
              id={labelId}
              className={cn(
                'mt-4 font-medium text-ink tracking-tight animate-fade-up',
                cfg.textClass,
              )}
            >
              {message}
            </p>
          )}
          <span className="sr-only">{label}</span>
        </div>
      </div>
    )
  }

  // Variant: section (default)
  return (
    <div
      role="status"
      aria-live="polite"
      aria-labelledby={message ? labelId : undefined}
      aria-label={!message ? label : undefined}
      className={cn(
        'flex flex-col items-center justify-center py-10 px-4 text-center w-full min-h-[140px]',
        className,
      )}
    >
      {walletVisual}
      {message && (
        <p
          id={labelId}
          className={cn(
            'mt-3.5 font-medium text-ink-soft tracking-tight',
            cfg.textClass,
          )}
        >
          {message}
        </p>
      )}
      <span className="sr-only">{label}</span>
    </div>
  )
}
