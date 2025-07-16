// src/pages/ConfirmEmailSent.tsx
import React from 'react'
import { Link } from 'react-router-dom'

export default function ConfirmEmailSent() {
  return (
    <div className="bg-white min-h-screen flex items-center justify-center p-4">
      <main className="max-w-md w-full space-y-8">
        <h1 className="text-2xl font-bold text-center">Check Your Email</h1>
        <p className="text-center text-gray-600">
          If an account with that email exists, you’ll receive a message with a link to reset your password. Please check your inbox (and spam folder).
        </p>
        <div className="text-center">
          <Link to="/auth/login" className="text-blue-600 hover:underline">
            Back to log in
          </Link>
        </div>
      </main>
    </div>
  )
}