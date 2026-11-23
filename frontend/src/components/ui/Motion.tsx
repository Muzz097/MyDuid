import {
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/cn'

/* =========================================================================
   1. PageTransition: Seamless Route Level Animations
   ========================================================================= */

export type PageTransitionProps = {
  children: ReactNode
  className?: string
  /**
   * Optional key to force re-render/animate on route or param change.
   */
  transitionKey?: string
}

export function PageTransition({
  children,
  className,
  transitionKey,
}: PageTransitionProps) {
  return (
    <div
      key={transitionKey}
      className={cn(
        'w-full motion-safe:animate-page-enter',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* =========================================================================
   2. PageHeaderMotion: Blur-to-sharp title with soft fade-in
   ========================================================================= */

export type PageHeaderMotionProps = {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
}

export function PageHeaderMotion({
  title,
  subtitle,
  action,
  className,
}: PageHeaderMotionProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="motion-safe:animate-header-enter">
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-ink-soft sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="shrink-0 motion-safe:animate-fade-up motion-safe:[animation-delay:120ms]">
          {action}
        </div>
      )}
    </div>
  )
}

/* =========================================================================
   3. SectionMotion: Entrance for dashboard widgets, cards, containers
   ========================================================================= */

export type SectionMotionProps<T extends ElementType = 'div'> = {
  as?: T
  children: ReactNode
  className?: string
  /** Delay in milliseconds or Tailwind delay class if desired */
  delay?: number
} & ComponentPropsWithoutRef<T>

export function SectionMotion<T extends ElementType = 'div'>({
  as,
  children,
  className,
  delay = 0,
  style,
  ...props
}: SectionMotionProps<T>) {
  const Component = as || 'div'

  const customStyle =
    delay > 0
      ? {
          ...style,
          animationDelay: `${delay}ms`,
        }
      : style

  return (
    <Component
      style={customStyle}
      className={cn(
        'motion-safe:animate-section-enter',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

/* =========================================================================
   4. StaggerContainer & StaggerItem: Light staggered lists
   ========================================================================= */

export type StaggerContainerProps = {
  children: ReactNode
  className?: string
  as?: ElementType
}

export function StaggerContainer({
  children,
  className,
  as: Component = 'div',
}: StaggerContainerProps) {
  return (
    <Component className={cn('space-y-3', className)}>
      {children}
    </Component>
  )
}

export type StaggerItemProps = {
  children: ReactNode
  index?: number
  className?: string
  as?: ElementType
}

export function StaggerItem({
  children,
  index = 0,
  className,
  as: Component = 'div',
}: StaggerItemProps) {
  // Stagger cap: keep delays under 300ms total so fast interaction remains crisp
  const delayMs = Math.min(index * 40, 280)

  return (
    <Component
      style={{ animationDelay: `${delayMs}ms` }}
      className={cn(
        'motion-safe:animate-stagger-item',
        className,
      )}
    >
      {children}
    </Component>
  )
}
