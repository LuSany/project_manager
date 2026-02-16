// 缓存实现
interface CacheEntry<T = any> {
  data: T
  expiry: number
  tags?: string[]
}

interface CacheStats {
  hits: number
  misses: number
  size: number
}

class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map()
  private defaultTTL = 5 * 60 * 1000
  private stats: CacheStats = { hits: 0, misses: 0, size: 0 }
  private tagIndex: Map<string, Set<string>> = new Map()

  set<T>(key: string, data: T, ttl?: number, tags?: string[]): void {
    const expiry = Date.now() + (ttl || this.defaultTTL)
    const entry: CacheEntry<T> = { data, expiry, tags }

    const oldEntry = this.cache.get(key)
    if (oldEntry?.tags) {
      oldEntry.tags.forEach((tag) => {
        this.tagIndex.get(tag)?.delete(key)
      })
    }

    this.cache.set(key, entry)
    this.stats.size = this.cache.size

    if (tags) {
      tags.forEach((tag) => {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set())
        }
        this.tagIndex.get(tag)!.add(key)
      })
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) {
      this.stats.misses++
      return null
    }

    if (Date.now() > entry.expiry) {
      this.delete(key)
      this.stats.misses++
      return null
    }

    this.stats.hits++
    return entry.data as T
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (Date.now() > entry.expiry) {
      this.delete(key)
      return false
    }

    return true
  }

  delete(key: string): void {
    const entry = this.cache.get(key)
    if (entry?.tags) {
      entry.tags.forEach((tag) => {
        this.tagIndex.get(tag)?.delete(key)
      })
    }

    this.cache.delete(key)
    this.stats.size = this.cache.size
  }

  invalidateByTag(tag: string): number {
    const keys = this.tagIndex.get(tag)
    if (!keys) return 0

    let count = 0
    keys.forEach((key) => {
      this.delete(key)
      count++
    })

    this.tagIndex.delete(tag)
    return count
  }

  clear(): void {
    this.cache.clear()
    this.tagIndex.clear()
    this.stats = { hits: 0, misses: 0, size: 0 }
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    }
  }

  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    this.cache.forEach((entry, key) => {
      if (now > entry.expiry) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach((key) => this.delete(key))
  }
}

export const cache = new MemoryCache()

setInterval(() => {
  cache.cleanup()
}, 60 * 1000)

export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number,
  tags?: string[]
): Promise<T> {
  const cachedData = cache.get<T>(key)
  if (cachedData !== null) {
    return cachedData
  }

  const data = await fn()
  cache.set(key, data, ttl, tags)
  return data
}
