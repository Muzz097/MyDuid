import { useState } from 'react'
import {
  getCategoryCustomImage,
  getCategoryEmoji,
} from '@/lib/categoryVisuals'
import { cn } from '@/lib/cn'
import { getIcon } from '@/lib/icons'
import type { TransactionType } from '@/types'

type CategoryAvatarProps = {
  categoryId?: number | null
  name?: string | null
  iconKey?: string | null
  type?: TransactionType
  emojiOverride?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASSES = {
  sm: 'size-9 rounded-xl text-base',
  md: 'size-10 rounded-xl text-lg',
  lg: 'size-11 rounded-xl text-xl',
} as const

const ICON_SIZES = {
  sm: 16,
  md: 19,
  lg: 20,
} as const

export function CategoryAvatar({
  categoryId,
  name,
  iconKey,
  type = 'expense',
  emojiOverride,
  size = 'md',
  className,
}: CategoryAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const customImage = getCategoryCustomImage(iconKey, name)
  const emoji =
    emojiOverride !== undefined ? emojiOverride : getCategoryEmoji(categoryId)
  const Icon = getIcon(iconKey ?? 'default')

  const toneClass =
    type === 'income'
      ? 'bg-income-50 text-income-600 dark:bg-income-950/40 dark:text-income-400'
      : 'bg-expense-50 text-expense-500 dark:bg-expense-950/40 dark:text-expense-400'

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden transition duration-150',
        SIZE_CLASSES[size],
        toneClass,
        className,
      )}
      aria-hidden
    >
      {customImage && !imgFailed ? (
        <img
          src={customImage}
          alt=""
          className="size-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : emoji ? (
        <span className="leading-none select-none">{emoji}</span>
      ) : (
        <Icon size={ICON_SIZES[size]} strokeWidth={1.75} />
      )}
    </span>
  )
}
