'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // 清除该字段的错误
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = '请输入邮箱'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '邮箱格式不正确'
    }

    if (!formData.password) {
      newErrors.password = '请输入密码'
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少6位'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次密码输入不一致'
    }

    if (!formData.name) {
      newErrors.name = '请输入姓名'
    } else if (formData.name.length < 2) {
      newErrors.name = '姓名至少2位'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSubmitSuccess(true)
        // 3秒后重定向到登录页
        setTimeout(() => {
          window.location.href = '/login'
        }, 3000)
      } else {
        setErrors({ general: data.error?.message || '注册失败' })
      }
    } catch {
      setErrors({ general: '网络错误，请稍后重试' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">注册成功</h1>
            <p className="text-muted-foreground mt-2">您的账号已创建，请等待管理员审批后登录</p>
            <p className="text-muted-foreground text-sm">{Math.floor(3)}秒后自动跳转到登录页...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">注册账号</h1>
          <p className="text-muted-foreground">创建您的项目管理账号</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="bg-destructive/15 text-destructive rounded-md px-4 py-3">
              {errors.general}
            </div>
          )}

          <div className="space-y-2">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium">
                姓名 <span className="text-destructive">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="border-input focus:ring-ring w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
                placeholder="请输入您的姓名"
              />
              {errors.name && <p className="text-destructive mt-1 text-sm">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                邮箱 <span className="text-destructive">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="border-input focus:ring-ring w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
                placeholder="your@email.com"
              />
              {errors.email && <p className="text-destructive mt-1 text-sm">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium">
                密码 <span className="text-destructive">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="border-input focus:ring-ring w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
                placeholder="至少6位密码"
              />
              {errors.password && (
                <p className="text-destructive mt-1 text-sm">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium">
                确认密码 <span className="text-destructive">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="border-input focus:ring-ring w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
                placeholder="再次输入密码"
              />
              {errors.confirmPassword && (
                <p className="text-destructive mt-1 text-sm">{errors.confirmPassword}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium">
                手机号（可选）
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="border-input focus:ring-ring w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
                placeholder="请输入手机号"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-sm">
              已有账号？
              <Link href="/login" className="text-primary ml-1 font-medium hover:underline">
                立即登录
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-ring w-full rounded-md px-4 py-2 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? '注册中...' : '注册'}
          </button>
        </form>
      </div>
    </div>
  )
}
