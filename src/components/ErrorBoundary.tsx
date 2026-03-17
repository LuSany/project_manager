'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
            <h2 className="mb-4 text-xl font-semibold text-red-600">出现错误</h2>
            <p className="mb-4 text-gray-600">{this.state.error?.message || '未知错误'}</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              重试
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}
