// src/pages/ForgotPassword.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPassword } from '../api/auth';
import { useNavigate, Link } from 'react-router-dom';

const schema = z.object({ email: z.string().email({ message: 'Invalid email address' }) });
export type ForgotPasswordData = z.infer<typeof schema>;

export default function ForgotPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordData>({ resolver: zodResolver(schema) });

  const navigate = useNavigate();

  async function onSubmit(data: ForgotPasswordData) {
    try {
      await forgotPassword(data.email);
      // Redirect to a confirmation page or show a banner
      navigate('/auth/confirm-email-sent');
    } catch (err) {
      console.error('Failed to send reset link', err);
    }
  }

  return (
    <div className="bg-white min-h-screen flex items-center justify-center p-4">
      <main className="max-w-md w-full space-y-8">
        <h1 className="text-2xl font-bold text-center">Forgot Password</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
          >
            Send Reset Link
          </button>
        </form>

        <div className="text-center text-sm text-gray-500">
          <Link to="/auth/login" className="text-blue-600 hover:underline">
            Back to log in
          </Link>
        </div>
      </main>
    </div>
  );
}