type PlaceholderPageProps = {
  title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-ink">{title}</h1>
      <p className="text-ink-soft">Segera hadir</p>
    </div>
  )
}
