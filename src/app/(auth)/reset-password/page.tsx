'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('重置链接无效')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!password) {
      setError('请输入新密码')
      return
    }

    if (password.length < 6) {
      setError('密码至少6位')
      return
    }

    if (password !== confirmPassword) {
      setError('两次密码输入不一致')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      })

      const data = await response.json()

      if (data.success) {
        setSubmitSuccess(true)
        // 3秒后跳转到登录页
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setError(data.error?.message || '重置失败，请稍后重试')
      }
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold">密码重置成功</h1>
            <p className="text-muted-foreground mt-2">您的密码已成功重置，3秒后将跳转到登录页面</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">重置密码</h1>
          <p className="text-muted-foreground mt-2">请输入您的新密码</p>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive rounded-md px-4 py-3">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
              新密码 <span className="text-destructive">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-input focus:ring-ring w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-offset-2 focus:outline-none"
              placeholder="至少6位密码"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium">
              确认新密码 <span className="text-destructive">*</span>
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border-input focus:ring-ring w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-offset-2 focus:outline-none"
              placeholder="再次输入新密码"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-ring w-full rounded-md px-4 py-2 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? '重置中...' : '重置密码'}
          </button>
        </form>

        <div className="text-center">
          <Link href="/login" className="text-primary font-medium hover:underline">
            返回登录
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-screen items-center justify-center">加载中...</div>}
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
