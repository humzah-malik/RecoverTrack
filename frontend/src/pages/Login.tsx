// src/pages/Login.tsx
import React from "react";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const schema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(6, { message: 'At least 6 characters' }),
  });
  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const { login } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(data: FormData) {
    const profile = await login(data);
    navigate(profile.has_completed_onboarding ? '/dashboard' : '/onboarding');
  }

  return (
    <div className="bg-white min-h-screen flex items-center justify-center p-4">
      <main className="max-w-md w-full">
        <header className="flex items-center justify-center space-x-2 mb-4">
          <i className="fas fa-wave-square text-2xl" />
          <h1 className="text-2xl font-semibold">RecoverTrack</h1>
        </header>

        <section className="text-center mb-6">
          <h2 className="text-lg font-semibold mb-1">Welcome to RecoverTrack</h2>
          <p className="text-gray-500 text-sm">
            Track your fitness recovery journey
          </p>
        </section>

        <section className="bg-white rounded-lg shadow-sm border border-gray-100">
          <nav className="flex border-b border-gray-200 rounded-t-lg">
            <button
              type="button"
              onClick={() => navigate('/auth/login')}
              aria-current="page"
              className="flex-1 py-3 text-center font-semibold text-black bg-white rounded-t-lg border-b-2 border-black"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => navigate('/auth/register')}
              className="flex-1 py-3 text-center font-semibold text-gray-500 rounded-t-lg hover:text-gray-700"
            >
              Register
            </button>
          </nav>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-6 space-y-5"
            noValidate
          >
            {/* ── Email field ─────────────────────────────────── */}
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
                  className="w-full border border-gray-300 rounded-md py-2.5 pl-3 pr-10
                             text-gray-600 placeholder-gray-400
                             focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                />
                <i
                  className="fas fa-envelope absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-400 text-lg pointer-events-none"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* ── Password field ──────────────────────────────── */}
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
                  className="w-full border border-gray-300 rounded-md py-2.5 pl-3 pr-10
                             text-gray-600 placeholder-gray-400
                             focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                />
                <i
                  className="fas fa-lock absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-400 text-lg pointer-events-none"
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white rounded-md py-2.5 text-center font-normal"
            >
              {isSubmitting ? 'Logging in…' : 'Log In'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}