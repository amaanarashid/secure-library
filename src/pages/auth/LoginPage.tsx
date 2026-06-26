import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { authService } from '@/services/auth/authService'
import { loginSchema, type LoginFormData } from '@/utils/validation'
import { ROUTES } from '@/constants'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export function LoginPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = (location.state as { from?: { pathname: string } })?.from?.pathname ?? ROUTES.DASHBOARD
  const [showPw, setShowPw] = useState(false)

  const {
    register, handleSubmit, formState: { errors, isSubmitting }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) as any })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await authService.signIn(data)
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign in failed')
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your library account">
      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-5" noValidate>
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
              autoComplete="current-password"
              placeholder="••••••••"
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

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              {...register('remember_me')}
            />
            <span className="text-sm text-slate-600">Remember me</span>
          </label>
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full">
          Sign in
        </Button>

        <p className="text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <Link to={ROUTES.REGISTER} className="font-medium text-primary-600 hover:text-primary-700">
            Create account
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
