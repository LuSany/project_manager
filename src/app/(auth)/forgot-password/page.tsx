'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!email) {
      setError('请输入邮箱')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.success) {
        setSubmitSuccess(true)
      } else {
        setError(data.error?.message || '发送失败，请稍后重试')
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
            <h1 className="text-3xl font-bold">邮件已发送</h1>
            <p className="text-muted-foreground mt-2">
              我们已向 <span className="font-medium">{email}</span> 发送密码重置邮件。
            </p>
            <p className="text-muted-foreground mt-4 text-sm">
              请检查您的邮箱并按照邮件中的说明重置密码。
            </p>
          </div>

          <div className="text-center">
            <Link href="/login" className="text-primary font-medium hover:underline">
              返回登录
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">忘记密码</h1>
          <p className="text-muted-foreground mt-2">输入您的注册邮箱，我们将发送密码重置链接</p>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive rounded-md px-4 py-3">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              邮箱
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-input focus:ring-ring w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
              placeholder="your@email.com"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-ring w-full rounded-md px-4 py-2 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? '发送中...' : '发送重置邮件'}
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
