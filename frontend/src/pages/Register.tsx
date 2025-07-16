import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

import { useAuth } from '../hooks/useAuth'
import AuthLayout from '../layouts/AuthLayout'

/* ──────────────────────────────────────────────────────────
   Validation
   ────────────────────────────────────────────────────────── */
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

  /* ──────────────────────────────────────────────────────── */
  const onSubmit = async (data: RegisterForm) => {
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

  /* ──────────────────────────────────────────────────────── */
  return (
    <AuthLayout>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        noValidate
      >
        {apiError && (
          <p className="text-sm text-danger">{apiError}</p>
        )}

        {/* ── Email ─────────────────────────────────────── */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold mb-1"
          >
            Email
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...register('email')}
              className="w-full rounded-md border border-gray-300 py-2.5 pl-3 pr-10
                         text-gray-700 placeholder-gray-400
                         focus:border-primary focus:ring-1 focus:ring-primary
                         dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200
                         dark:placeholder-gray-500"
            />
            <i
              className="fas fa-envelope absolute right-3 top-1/2 -translate-y-1/2
                         text-gray-400 text-lg pointer-events-none"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-danger">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* ── Password ──────────────────────────────────── */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-semibold mb-1"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...register('password')}
              className="w-full rounded-md border border-gray-300 py-2.5 pl-3 pr-10
                         text-gray-700 placeholder-gray-400
                         focus:border-primary focus:ring-1 focus:ring-primary
                         dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200
                         dark:placeholder-gray-500"
            />
            <i
              className="fas fa-lock absolute right-3 top-1/2 -translate-y-1/2
                         text-gray-400 text-lg pointer-events-none"
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-danger">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* ── Submit ────────────────────────────────────── */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-black py-2.5 text-white
                     transition-opacity disabled:opacity-50"
        >
          {isSubmitting ? 'Creating…' : 'Register'}
        </button>
      </form>
    </AuthLayout>
  )
}