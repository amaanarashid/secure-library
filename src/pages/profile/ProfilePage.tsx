import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Lock, Activity } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { profileService } from '@/services/profile/profileService'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuditLogs } from '@/hooks/useAudit'
import { formatDateTime, getRoleBadgeVariant, AUDIT_ACTION_LABELS } from '@/utils'
import { ROLE_LABELS } from '@/constants'
import { updateProfileSchema, changePasswordSchema } from '@/utils/validation'
import type { UpdateProfileData, ChangePasswordData } from '@/utils/validation'
import type { AuditAction } from '@/types'

export function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth()
  const { data: myActivity } = useAuditLogs({ user_id: user?.id, limit: 10 })

  // Profile form
  const profileForm = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { full_name: profile?.full_name ?? '' },
  })

  const onUpdateProfile = async (data: UpdateProfileData) => {
    await profileService.updateProfile(data.full_name)
    await refreshProfile()
    toast.success('Profile updated')
  }

  // Password form
  const [changingPw, setChangingPw] = useState(false)
  const pwForm = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onChangePassword = async (data: ChangePasswordData) => {
    await profileService.changePassword(data.new_password)
    pwForm.reset()
    setChangingPw(false)
    toast.success('Password updated')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle mt-1">Manage your account information</p>
      </div>

      {/* Profile info */}
      <Card>
        <CardHeader title="Account Information" />
        <CardBody className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xl font-bold">
              {profile?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{profile?.full_name}</p>
              <p className="text-sm text-slate-500">{profile?.email}</p>
              <Badge variant={getRoleBadgeVariant(profile?.role ?? 'student')} className="mt-1">
                {ROLE_LABELS[profile?.role ?? 'student']}
              </Badge>
            </div>
          </div>

          <div className="divider" />

          <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
            <Input
              label="Full name"
              required
              error={profileForm.formState.errors.full_name?.message}
              {...profileForm.register('full_name')}
            />
            <Input label="Email" value={profile?.email ?? ''} disabled />
            <p className="text-xs text-slate-500">
              Email address cannot be changed. Contact an administrator if needed.
            </p>
            <Button type="submit" loading={profileForm.formState.isSubmitting}>
              <User className="h-4 w-4" /> Save Changes
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader
          title="Password"
          action={
            !changingPw ? (
              <Button variant="secondary" size="sm" onClick={() => setChangingPw(true)}>
                <Lock className="h-3.5 w-3.5" /> Change Password
              </Button>
            ) : undefined
          }
        />
        <CardBody>
          {!changingPw ? (
            <p className="text-sm text-slate-500">
              Password last changed — stored securely via Supabase Auth (bcrypt).
            </p>
          ) : (
            <form onSubmit={pwForm.handleSubmit(onChangePassword)} className="space-y-4" noValidate>
              <Input
                label="Current password"
                type="password"
                required
                error={pwForm.formState.errors.current_password?.message}
                {...pwForm.register('current_password')}
              />
              <Input
                label="New password"
                type="password"
                required
                hint="Min 8 chars with uppercase, lowercase, number, and special character"
                error={pwForm.formState.errors.new_password?.message}
                {...pwForm.register('new_password')}
              />
              <Input
                label="Confirm new password"
                type="password"
                required
                error={pwForm.formState.errors.confirm_password?.message}
                {...pwForm.register('confirm_password')}
              />
              <div className="flex gap-3">
                <Button type="submit" loading={pwForm.formState.isSubmitting}>
                  Update Password
                </Button>
                <Button variant="secondary" type="button" onClick={() => { setChangingPw(false); pwForm.reset() }}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardBody>
      </Card>

      {/* Activity log */}
      <Card>
        <CardHeader title="My Activity" subtitle="Your recent actions in the system" />
        <CardBody className="p-0">
          {!myActivity?.data.length ? (
            <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
              <Activity className="h-5 w-5" />
              <p className="text-sm">No activity recorded yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {myActivity.data.map(log => (
                <li key={log.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm text-slate-700">{log.description}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(log.created_at)}</p>
                  </div>
                  <Badge variant="slate" className="ml-4">
                    {AUDIT_ACTION_LABELS[log.action as AuditAction] ?? log.action}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
