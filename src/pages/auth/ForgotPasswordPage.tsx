import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { authService } from '@/services/auth/authService'
import { forgotPasswordSchema, type ForgotPasswordData } from '@/utils/validation'
import { ROUTES } from '@/constants'

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ForgotPasswordData>({ resolver: zodResolver(forgotPasswordSchema) })

  const onSubmit = async (data: ForgotPasswordData) => {
    try {
      await authService.resetPassword(data.email)
      setSent(true)
    } catch {
      // Always show success (don't leak whether email exists — security best practice)
      setSent(true)
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Email sent" subtitle="Check your inbox">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
              <Mail className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          <p className="text-sm text-slate-600">
            If an account with that email exists, you'll receive a password reset link shortly.
          </p>
          <Link to={ROUTES.LOGIN} className="btn-secondary inline-flex">
            Back to Sign In
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We'll send you a reset link">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          required
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          Send reset link
        </Button>
        <p className="text-center text-sm text-slate-500">
          <Link to={ROUTES.LOGIN} className="font-medium text-primary-600">
            Back to Sign In
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
