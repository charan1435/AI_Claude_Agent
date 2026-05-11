'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface LoginFormValues {
  email: string
  password: string
}

/**
 * LoginForm — email + password sign-in via Supabase browser client.
 * On success: router.refresh() + push('/').
 * On failure: oxblood inline error above submit button.
 */
export function LoginForm() {
  const router = useRouter()
  const [serverError, setServerError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>()

  async function onSubmit(values: LoginFormValues) {
    setServerError(null)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) {
      setServerError(error.message)
      return
    }

    router.refresh()
    router.push('/')
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
      noValidate
      data-testid="login-form"
    >
      {/* Email field */}
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="login-email"
          className="text-xs font-medium tracking-widest uppercase text-ink-muted font-sans"
        >
          Email
        </Label>
        <Input
          id="login-email"
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
          htmlFor="login-password"
          className="text-xs font-medium tracking-widest uppercase text-ink-muted font-sans"
        >
          Password
        </Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••••"
          aria-invalid={!!errors.password}
          {...register('password', {
            required: 'Password is required',
          })}
          className="rounded-sm border-hairline bg-surface font-sans text-ink focus-visible:ring-ochre focus-visible:border-ochre"
        />
        {errors.password && (
          <p className="text-xs text-oxblood font-sans" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Server-side error (oxblood, above submit) */}
      {serverError && (
        <p
          className="text-sm text-oxblood font-sans"
          role="alert"
          data-testid="login-error"
        >
          {serverError}
        </p>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
        data-testid="login-submit"
      >
        {isSubmitting ? 'signing in…' : 'sign in'}
      </Button>

      {/* Switch to sign-up */}
      <p className="text-center text-sm text-ink-muted font-sans">
        new here?{' '}
        <Link
          href="/signup"
          className="text-ink underline underline-offset-2 hover:text-ochre transition-colors"
        >
          create an account
        </Link>
      </p>
    </form>
  )
}
