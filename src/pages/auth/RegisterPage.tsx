import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { CheckCircle, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { authService } from '@/services/auth/authService'
import { registerSchema, type RegisterFormData } from '@/utils/validation'
import { ROUTES } from '@/constants'

export function RegisterPage() {
  const [registered, setRegistered] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const {
    register, handleSubmit, formState: { errors, isSubmitting }
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await authService.signUp(data)
      setRegistered(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  if (registered) {
    return (
      <AuthLayout title="Check your email" subtitle="One more step">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <div>
            <p className="text-slate-700">
              We've sent a verification link to your email address.
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Click the link in the email to activate your account, then sign in.
            </p>
          </div>
          <Link to={ROUTES.LOGIN} className="btn-primary inline-flex">
            Go to Sign In
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Create your account" subtitle="Join the library management system">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Input
          label="Full name"
          placeholder="Jane Smith"
          autoComplete="name"
          required
          error={errors.full_name?.message}
          {...register('full_name')}
        />
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="space-y-1.5">
          <label className="label">
            Password <span className="text-danger-500 ml-0.5">*</span>
          </label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Min 8 chars, upper, lower, number, symbol"
              className={`input-field pr-10 ${errors.password ? 'input-error' : ''}`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="error-text">{errors.password.message}</p>}
        </div>

        <Input
          label="Confirm password"
          type="password"
          placeholder="Repeat password"
          autoComplete="new-password"
          required
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />

        <Button type="submit" loading={isSubmitting} className="w-full">
          Create account
        </Button>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className="font-medium text-primary-600 hover:text-primary-700">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
