interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export function rateLimit(config: RateLimitConfig) {
  return (identifier: string): { allowed: boolean; remaining: number; resetTime: number } => {
    const now = Date.now()
    const entry = rateLimitStore.get(identifier)

    if (!entry || now > entry.resetTime) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + config.windowMs,
      }
      rateLimitStore.set(identifier, newEntry)
      return { allowed: true, remaining: config.maxRequests - 1, resetTime: newEntry.resetTime }
    }

    if (entry.count >= config.maxRequests) {
      return { allowed: false, remaining: 0, resetTime: entry.resetTime }
    }

    entry.count++
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    }
  }
}

export const apiRateLimit = rateLimit({ windowMs: 60000, maxRequests: 100 })
export const authRateLimit = rateLimit({ windowMs: 60000, maxRequests: 10 })

interface CircuitBreakerConfig {
  failureThreshold: number
  resetTimeout: number
}

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

interface CircuitBreakerState {
  failures: number
  state: CircuitState
  lastFailureTime: number
}

const circuitBreakerStore = new Map<string, CircuitBreakerState>()

export function circuitBreaker(name: string, config: CircuitBreakerConfig) {
  return {
    canExecute: (): boolean => {
      const state = circuitBreakerStore.get(name)

      if (!state) {
        return true
      }

      if (state.state === 'OPEN') {
        if (Date.now() - state.lastFailureTime > config.resetTimeout) {
          state.state = 'HALF_OPEN'
          return true
        }
        return false
      }

      return true
    },

    recordSuccess: (): void => {
      const state = circuitBreakerStore.get(name)
      if (state) {
        state.failures = 0
        state.state = 'CLOSED'
      }
    },

    recordFailure: (): void => {
      let state = circuitBreakerStore.get(name)

      if (!state) {
        state = { failures: 0, state: 'CLOSED', lastFailureTime: 0 }
        circuitBreakerStore.set(name, state)
      }

      state.failures++
      state.lastFailureTime = Date.now()

      if (state.failures >= config.failureThreshold) {
        state.state = 'OPEN'
      }
    },

    getState: (): CircuitState => {
      return circuitBreakerStore.get(name)?.state || 'CLOSED'
    },
  }
}

export const onlyofficeCircuitBreaker = circuitBreaker('onlyoffice', {
  failureThreshold: 5,
  resetTimeout: 30000,
})

export const kkfileviewCircuitBreaker = circuitBreaker('kkfileview', {
  failureThreshold: 5,
  resetTimeout: 30000,
})

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000)
