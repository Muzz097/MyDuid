function App() {
  return (
    <main className="min-h-screen bg-page p-6 text-ink">
      <div className="mx-auto max-w-md space-y-3 rounded-[var(--radius-card)] bg-card p-6 shadow-[var(--shadow-card)]">
        <h1 className="text-2xl font-extrabold">MyDuid</h1>
        <p className="text-ink-soft">Token berhasil dimuat.</p>
        <p className="tabular text-income-600 font-bold">+ Rp1.250.000</p>
        <p className="tabular text-expense-500 font-bold">− Rp75.000</p>
        <button className="w-full rounded-[var(--radius-control)] bg-brand-500 py-3 font-bold text-white hover:bg-brand-600">
          Catat Transaksi
        </button>
      </div>
    </main>
  )
}
export default App