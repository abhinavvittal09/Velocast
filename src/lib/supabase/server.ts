import { createServerClient, type CookieMethodsServer } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

function cookieMethods(): CookieMethodsServer {
  const cookieStore = cookies() as ReturnType<typeof cookies> extends Promise<infer T> ? T : ReturnType<typeof cookies>
  return {
    getAll() {
      return (cookieStore as any).getAll()
    },
    setAll(cookiesToSet: Array<{ name: string; value: string; options?: object }>) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          (cookieStore as any).set(name, value, options)
        )
      } catch {
        // Server component — cookies will be set by middleware
      }
    },
  }
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: object }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as any)
            )
          } catch {
            // Server component — cookies will be set by middleware
          }
        },
      },
    }
  )
}

export async function createAdminClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: object }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as any)
            )
          } catch {}
        },
      },
    }
  )
}
