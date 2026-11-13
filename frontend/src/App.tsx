
function App() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <section className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500 text-xl font-bold text-white">
            M
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">MyDuid</h1>
            <p className="text-sm text-slate-400">Personal Finance Management</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium text-slate-400">
            Welcome to
          </p>
          <h2 className="mt-1 text-3xl font-bold text-white">
            MyDuid Project
          </h2>
          <p className="mt-3 leading-relaxed text-slate-400">
            Your financial journey starts here. Manage your money,
            track your expenses, and achieve your financial goals.
          </p>
        </div>

        <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4">
          <p className="font-semibold text-green-400">
            Tailwind CSS 4 is working!
          </p>
          <p className="mt-1 text-sm text-green-300/70">
            React + TypeScript + Vite + Tailwind CSS
          </p>
        </div>

        <button
          type="button"
          className="mt-6 w-full rounded-xl bg-pink-500 px-5 py-3 font-semibold text-white transition hover:bg-pink-600 active:scale-[0.98]"
        >
          Get Started
        </button>
      </section>
    </main>
  )
}

export default App
