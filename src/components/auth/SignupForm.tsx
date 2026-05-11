'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SignupFormValues {
  email: string
  password: string
  confirmPassword: string
}

/**
 * SignupForm — creates a new account via Supabase signUp.
 * On success with session: push '/'.
 * On success without session (email confirmation): shows muted confirmation message.
 * On failure: oxblood inline error.
 */
export function SignupForm() {
  const router = useRouter()
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [awaitingConfirmation, setAwaitingConfirmation] = React.useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>()

  async function onSubmit(values: SignupFormValues) {
    setServerError(null)
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    })

    if (error) {
      setServerError(error.message)
      return
    }

    if (data.session) {
      // Auto-confirmed — go straight to dashboard
      router.refresh()
      router.push('/')
    } else {
      // Email confirmation required
      setAwaitingConfirmation(true)
    }
  }

  if (awaitingConfirmation) {
    return (
      <div
        className="flex flex-col gap-3 text-center"
        data-testid="signup-confirmation"
      >
        <p className="text-sm text-ink font-sans">
          Check your email to confirm your account.
        </p>
        <p className="text-xs text-ink-muted font-sans">
          Once confirmed, you can{' '}
          <Link
            href="/login"
            className="text-ink underline underline-offset-2 hover:text-ochre"
          >
            sign in
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
      noValidate
      data-testid="signup-form"
    >
      {/* Email field */}
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="signup-email"
          className="text-xs font-medium tracking-widest uppercase text-ink-muted font-sans"
        >
          Email
        </Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Enter a valid email address',
            },
          })}
          className="rounded-sm border-hairline bg-surface font-sans text-ink placeholder:text-ink-muted/60 focus-visible:ring-ochre focus-visible:border-ochre"
        />
        {errors.email && (
          <p className="text-xs text-oxblood font-sans" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password field */}
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="signup-password"
          className="text-xs font-medium tracking-widest uppercase text-ink-muted font-sans"
        >
          Password
        </Label>
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          placeholder="at least 8 characters"
          aria-invalid={!!errors.password}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'Password must be at least 8 characters' },
          })}
          className="rounded-sm border-hairline bg-surface font-sans text-ink focus-visible:ring-ochre focus-visible:border-ochre"
        />
        {errors.password && (
          <p className="text-xs text-oxblood font-sans" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm password field */}
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="signup-confirm"
          className="text-xs font-medium tracking-widest uppercase text-ink-muted font-sans"
        >
          Confirm Password
        </Label>
        <Input
          id="signup-confirm"
          type="password"
          autoComplete="new-password"
          placeholder="repeat password"
          aria-invalid={!!errors.confirmPassword}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) =>
              value === getValues('password') || 'Passwords do not match',
          })}
          className="rounded-sm border-hairline bg-surface font-sans text-ink focus-visible:ring-ochre focus-visible:border-ochre"
        />
        {errors.confirmPassword && (
          <p className="text-xs text-oxblood font-sans" role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Server error */}
      {serverError && (
        <p
          className="text-sm text-oxblood font-sans"
          role="alert"
          data-testid="signup-error"
        >
          {serverError}
        </p>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
        data-testid="signup-submit"
      >
        {isSubmitting ? 'creating account…' : 'create account'}
      </Button>

      {/* Switch to login */}
      <p className="text-center text-sm text-ink-muted font-sans">
        already have an account?{' '}
        <Link
          href="/login"
          className="text-ink underline underline-offset-2 hover:text-ochre transition-colors"
        >
          sign in
        </Link>
      </p>
    </form>
  )
}
