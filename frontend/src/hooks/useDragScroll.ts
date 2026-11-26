import { useCallback, useRef, useState, type MouseEvent, type PointerEvent } from 'react'

const DRAG_THRESHOLD_PX = 5

export interface UseDragScrollResult<T extends HTMLElement = HTMLDivElement> {
  ref: React.RefObject<T | null>
  isDragging: boolean
  dragProps: {
    onPointerDown: (e: PointerEvent<T>) => void
    onPointerMove: (e: PointerEvent<T>) => void
    onPointerUp: (e: PointerEvent<T>) => void
    onPointerCancel: (e: PointerEvent<T>) => void
    onClickCapture: (e: MouseEvent<T>) => void
  }
}

/**
 * Enables mouse click-and-drag horizontal scrolling on a container while
 * keeping touch scrolling and keyboard navigation native.
 */
export function useDragScroll<T extends HTMLElement = HTMLDivElement>(): UseDragScrollResult<T> {
  const ref = useRef<T | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const stateRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startScrollLeft: 0,
    didDrag: false,
  })

  const onPointerDown = useCallback((e: PointerEvent<T>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    const el = ref.current
    if (!el) return

    stateRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startScrollLeft: el.scrollLeft,
      didDrag: false,
    }
    el.setPointerCapture(e.pointerId)
    setIsDragging(true)
  }, [])

  const onPointerMove = useCallback((e: PointerEvent<T>) => {
    const state = stateRef.current
    if (!state.active || e.pointerType !== 'mouse') return
    const el = ref.current
    if (!el) return

    const deltaX = e.clientX - state.startX
    if (Math.abs(deltaX) > DRAG_THRESHOLD_PX) {
      state.didDrag = true
    }

    el.scrollLeft = state.startScrollLeft - deltaX
  }, [])

  const endDrag = useCallback((e: PointerEvent<T>) => {
    const state = stateRef.current
    if (!state.active) return
    const el = ref.current
    if (el && el.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId)
    }
    state.active = false
    setIsDragging(false)
  }, [])

  const onClickCapture = useCallback((e: MouseEvent<T>) => {
    if (stateRef.current.didDrag) {
      e.preventDefault()
      e.stopPropagation()
      stateRef.current.didDrag = false
    }
  }, [])

  return {
    ref,
    isDragging,
    dragProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onClickCapture,
    },
  }
}
