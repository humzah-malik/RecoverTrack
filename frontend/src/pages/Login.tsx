import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

import AuthLayout from '../layouts/AuthLayout'

const schema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'At least 6 characters' }),
})
type FormData = z.infer<typeof schema>

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const { login } = useAuth()
  const navigate = useNavigate()

  async function onSubmit(data: FormData) {
    const profile = await login(data)
    navigate(profile.has_completed_onboarding ? '/dashboard' : '/onboarding')
  }

  return (
    <AuthLayout>
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
        {isSubmitting ? 'Logging in…' : 'Login'}
      </button>
    </AuthLayout>
  )
}

/* same themed input helper */
function Input({ id, label, icon, register, error, ...rest }: any) {
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
