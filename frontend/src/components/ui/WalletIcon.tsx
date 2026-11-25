import { cn } from '@/lib/cn'
import { getIcon } from '@/lib/icons'
import type { WalletIconType } from '@/types'

export interface WalletIconProps {
  iconType?: WalletIconType
  iconKey?: string | null
  size?: number
  strokeWidth?: number
  className?: string
}

export function WalletIcon({
  iconType = 'preset',
  iconKey,
  size = 18,
  strokeWidth = 1.75,
  className,
}: WalletIconProps) {
  if (iconType === 'emoji' && iconKey) {
    return (
      <span
        role="img"
        aria-hidden="true"
        className={cn(
          'inline-flex items-center justify-center leading-none select-none',
          className,
        )}
        style={{ fontSize: `${size}px` }}
      >
        {iconKey}
      </span>
    )
  }

  const Icon = getIcon(iconKey || 'default')
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden
    />
  )
}
