import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { authService } from '@/services/auth/authService'
import { resetPasswordSchema, type ResetPasswordData } from '@/utils/validation'
import { ROUTES } from '@/constants'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [done, setDone] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ResetPasswordData>({ resolver: zodResolver(resetPasswordSchema) })

  const onSubmit = async (data: ResetPasswordData) => {
    try {
      await authService.updatePassword(data.password)
      setDone(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset password')
    }
  }

  if (done) {
    return (
      <AuthLayout title="Password updated" subtitle="">
        <div className="text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <p className="text-sm text-slate-600">
            Your password has been updated. You can now sign in with your new password.
          </p>
          <Button onClick={() => navigate(ROUTES.LOGIN)} className="w-full">Go to Sign In</Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Set new password" subtitle="Choose a strong password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Input
          label="New password"
          type="password"
          placeholder="Min 8 chars, upper, lower, number, symbol"
          required
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm new password"
          type="password"
          placeholder="Repeat password"
          required
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">Update password</Button>
      </form>
    </AuthLayout>
  )
}
