import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Lock, RefreshCw, Share2 } from 'lucide-react'
import { Button, Sheet, Skeleton, useToast } from '@/components/ui'
import { cn } from '@/lib/cn'
import { formatMonthYear } from './copy'
import { renderShareCard, type ShareCardFormat } from './shareCard'
import type { WrappedDetail } from './types'

type ShareSheetProps = {
  open: boolean
  onClose: () => void
  detail: WrappedDetail
}

export function ShareSheet({ open, onClose, detail }: ShareSheetProps) {
  const { show } = useToast()
  const [format, setFormat] = useState<ShareCardFormat>('9:16')
  const [blob, setBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [renderKey, setRenderKey] = useState(0)

  const canShareFiles = useMemo(() => {
    if (typeof navigator === 'undefined') return false
    if (typeof navigator.share !== 'function') return false
    if (typeof navigator.canShare !== 'function') return false
    try {
      const probe = new File([''], 'wrapped.png', { type: 'image/png' })
      return navigator.canShare({ files: [probe] })
    } catch {
      return false
    }
  }, [])

  const retry = useCallback(() => {
    setRenderKey((k) => k + 1)
  }, [])

  useEffect(() => {
    if (!open) return

    let active = true
    let createdUrl: string | null = null

    async function generate() {
      try {
        setRendering(true)
        setError(null)
        const nextBlob = await renderShareCard(detail, format)
        if (!active) return
        createdUrl = URL.createObjectURL(nextBlob)
        setBlob(nextBlob)
        setPreviewUrl(createdUrl)
      } catch (err) {
        if (!active) return
        setBlob(null)
        setPreviewUrl(null)
        setError(
          err instanceof Error ? err.message : 'Gagal membuat gambar pratinjau.',
        )
      } finally {
        if (active) {
          setRendering(false)
        }
      }
    }

    void generate()

    return () => {
      active = false
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl)
      }
    }
  }, [open, detail, format, renderKey])

  const fileName = `myduid-wrapped-${detail.month}.png`

  function handleDownload() {
    if (!blob || !previewUrl) return
    const link = document.createElement('a')
    link.href = previewUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    show({ message: 'Gambar Wrapped berhasil diunduh.', type: 'success' })
  }

  async function handleWebShare() {
    if (!blob) return
    try {
      const file = new File([blob], fileName, { type: 'image/png' })
      await navigator.share({
        title: `MyDuid Wrapped ${formatMonthYear(detail.month)}`,
        files: [file],
      })
      show({ message: 'Wrapped berhasil dibagikan.', type: 'success' })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return
      }
      show({ message: 'Tidak dapat membagikan gambar.', type: 'error' })
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Bagikan Wrapped">
      <div className="space-y-4">
        {/* Format toggle */}
        <div
          role="group"
          aria-label="Pilih rasio gambar"
          className="grid grid-cols-2 gap-2 rounded-[var(--radius-control)] bg-muted p-1"
        >
          {(['9:16', '1:1'] as const).map((opt) => {
            const active = format === opt
            return (
              <button
                key={opt}
                type="button"
                aria-pressed={active}
                onClick={() => setFormat(opt)}
                className={cn(
                  'min-h-11 rounded-[calc(var(--radius-control)-2px)] text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
                  active
                    ? 'bg-card text-ink shadow-sm'
                    : 'text-ink-soft hover:text-ink',
                )}
              >
                {opt === '9:16' ? 'Story (9:16)' : 'Persegi (1:1)'}
              </button>
            )
          })}
        </div>

        {/* Preview area */}
        <div className="flex items-center justify-center rounded-[var(--radius-card)] border border-line bg-muted/50 p-3">
          {rendering ? (
            <Skeleton
              className={cn(
                'w-full max-w-[240px]',
                format === '9:16' ? 'aspect-[9/16]' : 'aspect-square',
              )}
              rounded="card"
            />
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm font-medium text-ink">{error}</p>
              <Button onClick={retry} variant="secondary" size="sm">
                <RefreshCw className="size-4" aria-hidden="true" />
                Coba lagi
              </Button>
            </div>
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt={`Pratinjau kartu MyDuid Wrapped ${formatMonthYear(detail.month)}`}
              className={cn(
                'max-h-[340px] w-auto rounded-xl object-contain shadow-md',
                format === '9:16' ? 'aspect-[9/16]' : 'aspect-square',
              )}
            />
          ) : null}
        </div>

        {/* Privacy note */}
        <p className="flex items-center justify-center gap-1.5 text-xs text-ink-soft">
          <Lock className="size-3.5 shrink-0" aria-hidden="true" />
          <span>Nominal tidak disertakan demi privasi.</span>
        </p>

        {/* Actions */}
        <div className={cn('grid gap-2', canShareFiles ? 'grid-cols-2' : 'grid-cols-1')}>
          {canShareFiles && (
            <Button
              type="button"
              variant="primary"
              disabled={rendering || !blob}
              onClick={() => void handleWebShare()}
            >
              <Share2 className="size-4" aria-hidden="true" />
              Bagikan
            </Button>
          )}
          <Button
            type="button"
            variant={canShareFiles ? 'secondary' : 'primary'}
            disabled={rendering || !blob}
            onClick={handleDownload}
          >
            <Download className="size-4" aria-hidden="true" />
            Unduh PNG
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
