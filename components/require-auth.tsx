"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // pages that don't require auth
    const publicPaths = ["/", "/login", "/register"]
    // allow static assets and api calls through
    if (!pathname) return
    const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))
    try {
      const raw = localStorage.getItem("user")
      const user = raw ? JSON.parse(raw) : null
      if (!user && !isPublic) {
        router.replace("/") // assume login is at /
      } else {
        setChecked(true)
      }
    } catch (e) {
      if (!isPublic) router.replace("/")
    }
  }, [pathname, router])

  // while checking, don't render children to avoid flashing protected content
  if (!checked) return null
  return <>{children}</>
}
