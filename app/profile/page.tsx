"use client"

import { useEffect, useState } from "react"

export default function ProfilePage() {
  const [user, setUser] = useState<any | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user")
      if (raw) setUser(JSON.parse(raw))
    } catch (e) {
      // ignore
    }
  }, [])
  const [currentProjects, setCurrentProjects] = useState<any[]>([])
  const [pastProjects, setPastProjects] = useState<any[]>([])

  useEffect(() => {
    const fetchUserProjects = async () => {
      try {
        const raw = localStorage.getItem("user")
        const me = raw ? JSON.parse(raw) : null
        if (!me || !me.id) return

        const [resActive, resPast] = await Promise.all([
          fetch(`http://localhost:8082/projects/user/${me.id}/active`),
          fetch(`http://localhost:8082/projects/user/${me.id}/completed`),
        ])

        if (resActive.ok) setCurrentProjects(await resActive.json())
        if (resPast.ok) setPastProjects(await resPast.json())
      } catch (e) {
        // ignore
      }
    }
    fetchUserProjects()
  }, [user])

  // derive display name and initials
  const fullName = user?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
  const nameParts = fullName.split(" ")
  const firstName = nameParts[0] || ""
  const lastName = nameParts.slice(1).join(" ") || ""
  const initials = (firstName[0] || "") + (lastName[0] || "")

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8">
      <div className="w-full max-w-4xl px-6">
        <div className="mb-8">
          <a
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </a>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        </div>

        <div className="grid gap-6 max-w-4xl">
          {/* User Information Card */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center">
                <span className="text-2xl font-semibold text-accent-foreground">
                  {initials || "U"}
                </span>
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="text-lg font-semibold text-foreground">
                      {fullName || "Unknown User"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-foreground">{user?.email || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Position</p>
                    <p className="text-foreground">{user?.position || "-"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Projects */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Current Projects</h2>
            {currentProjects.length > 0 ? (
              <div className="space-y-3">
                {currentProjects.map((project) => {
                  const role = user && project.projectLeader === user.id ? "Project Leader" : "Team Member"
                  return (
                    <a
                      key={project.id}
                      href={`/project/${project.id}`}
                      className="block bg-background rounded-lg p-4 border border-border hover:border-primary transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{project.name}</h3>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                              {role}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                              {project.labId}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              Started {project.startDate ? new Date(project.startDate).toLocaleDateString() : "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </a>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No current projects</p>
            )}
          </div>

          {/* Past Projects */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Past Projects</h2>
            {pastProjects.length > 0 ? (
              <div className="space-y-3">
                {pastProjects.map((project) => {
                  const role = user && project.projectLeader === user.id ? "Project Leader" : "Team Member"
                  return (
                    <a
                      key={project.id}
                      href={`/project/${project.id}`}
                      className="block bg-background rounded-lg p-4 border border-border hover:border-primary transition-colors opacity-75"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{project.name}</h3>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {role}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                              {project.labId}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              {project.startDate ? new Date(project.startDate).toLocaleDateString() : "-"} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </a>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No past projects</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
