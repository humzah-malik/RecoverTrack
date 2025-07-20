import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

import { useAuth } from '../hooks/useAuth'
import AuthLayout from '../layouts/AuthLayout'

/* ── validation schema ─────────────────────────────── */
const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'At least 6 characters' }),
})
type RegisterForm = z.infer<typeof registerSchema>

export default function Register() {
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(data: RegisterForm) {
    setApiError(null)
    try {
      await registerUser(data)
      navigate('/auth/login')
    } catch (err: any) {
      setApiError(
        err?.response?.status === 409
          ? 'An account with that email already exists.'
          : 'Unexpected error — please try again.'
      )
    }
  }

  return (
    <AuthLayout>
      {apiError && <p className="text-sm text-danger">{apiError}</p>}

      <Input
        id="email"
        label="Email"
        type="email"
        placeholder="Enter your email"
        register={register('email')}
        error={errors.email?.message}
        icon="fas fa-envelope"
      />

      <Input
        id="password"
        label="Password"
        type="password"
        placeholder="Enter your password"
        register={register('password')}
        error={errors.password?.message}
        icon="fas fa-lock"
      />

      <button
        type="submit"
        disabled={isSubmitting}
        onClick={handleSubmit(onSubmit)}
        className="btn btn-dark w-full"
      >
        {isSubmitting ? 'Creating…' : 'Register'}
      </button>
    </AuthLayout>
  )
}

/* ─ reusable themed input field ─ */
function Input({
  id,
  label,
  icon,
  register,
  error,
  ...rest
}: {
  id: string
  label: string
  icon: string
  register: any
  error?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold mb-1">
        {label}
      </label>
      <div className="relative">
        <input id={id} {...register} {...rest} className="input w-full pr-10" />
        <i
          className={`${icon} absolute right-3 top-1/2 -translate-y-1/2 text-muted`}
        />
      </div>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  )
}
