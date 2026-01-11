"use client"

import React, { useEffect, useState } from "react"

type User = {
  id?: number
  name?: string
  email?: string
  position?: string
}

export function UsersList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const fetchUsers = async () => {
      try {
        const res = await fetch("http://localhost:8081/users")
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: User[] = await res.json()
        if (mounted) setUsers(data)
      } catch (err: any) {
        if (mounted) setError(err.message || "Failed to fetch users")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchUsers()
    return () => {
      mounted = false
    }
  }, [])

  if (loading) return <div>Loading users...</div>
  if (error) return <div className="text-destructive">Error: {error}</div>

  if (users.length === 0) return <div>No users found.</div>

  return (
    <div className="space-y-3">
      {users.map((u) => (
        <div key={u.id ?? u.email} className="p-4 border rounded-md">
          <div className="font-medium">{u.name ?? "(no name)"}</div>
          <div className="text-sm text-muted-foreground">{u.position ?? "(no position)"}</div>
        </div>
      ))}
    </div>
  )
}
