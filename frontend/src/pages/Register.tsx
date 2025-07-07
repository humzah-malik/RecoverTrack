// src/pages/Register.tsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { useState } from 'react';

const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email' }),
  password: z.string().min(6, { message: 'At least 6 characters' }),
});
type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterForm) => {
    setApiError(null);
    try {
      await registerUser(data);
      navigate('/auth/login');
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 409) {
        setApiError('An account with that email already exists.');
      } else {
        setApiError('Unexpected error—please try again.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-heading">Create Account</h1>

      {apiError && <p className="text-red-500">{apiError}</p>}

      <div>
        <label className="block font-medium">Email</label>
        <input type="email" {...register('email')} className="input w-full" />
        {errors.email && <p className="text-red-500">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block font-medium">Password</label>
        <input type="password" {...register('password')} className="input w-full" />
        {errors.password && <p className="text-red-500">{errors.password.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full py-2 mt-4"
      >
        {isSubmitting ? 'Creating…' : 'Register'}
      </button>
    </form>
  );
}