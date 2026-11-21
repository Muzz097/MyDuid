import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFieldErrors({})
    setGeneralError(null)
    setSubmitting(true)
    try {
      await register(name, email, password, passwordConfirmation)
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors) setFieldErrors(err.errors)
        setGeneralError(err.message)
      } else {
        setGeneralError('Terjadi kesalahan. Coba lagi.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-page px-4 py-10">
      <div className="animate-pop-in w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-[var(--radius-control)] bg-brand-500 text-2xl font-bold text-white">
            M
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-ink">Daftar</h1>
            <p className="mt-1 text-sm text-ink-soft">
              Buat akun untuk mulai mencatat keuangan.
            </p>
          </div>
        </div>

        <Card>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            {generalError &&
            !fieldErrors.name &&
            !fieldErrors.email &&
            !fieldErrors.password &&
            !fieldErrors.password_confirmation ? (
              <p className="text-sm text-danger-500" role="alert">
                {generalError}
              </p>
            ) : null}

            <Input
              label="Nama"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={fieldErrors.name?.[0]}
              required
            />
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email?.[0]}
              required
            />
            <Input
              label="Kata sandi"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password?.[0]}
              required
            />
            <Input
              label="Konfirmasi kata sandi"
              type="password"
              autoComplete="new-password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              error={fieldErrors.password_confirmation?.[0]}
              required
            />

            <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
              Daftar
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-ink-soft">
          Sudah punya akun?{' '}
          <Link
            to="/masuk"
            className="font-medium text-brand-600 transition duration-200 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            Masuk
          </Link>
        </p>
      </div>
    </div>
  )
}
