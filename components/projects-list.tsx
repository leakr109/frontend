"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"

type Project = {
  id: number
  name: string
  labId: string
  description?: string
  startDate?: string
  endDate?: string | null
  projectLeader?: number
  status?: string
  participants?: number[]
  equipment?: Array<{ id?: number; name: string; stock: number }>
}

export function ProjectsList() {
  const [activeProjects, setActiveProjects] = useState<Project[]>([])
  const [pastProjects, setPastProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [usersMap, setUsersMap] = useState<Record<number, string>>({})

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true)
      try {
        const [resActive, resPast] = await Promise.all([
          fetch("http://localhost:8082/projects"),
          fetch("http://localhost:8082/projects/completed"),
        ])

        if (resActive.ok) setActiveProjects(await resActive.json())
        if (resPast.ok) setPastProjects(await resPast.json())

        // fetch users to map leader IDs to names
        try {
          const resUsers = await fetch("http://localhost:8081/users")
          if (resUsers.ok) {
            const users = await resUsers.json()
            const map: Record<number, string> = {}
            users.forEach((u: any) => {
              const display = u.name ?? u.fullName ?? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
              if (u.id != null) map[u.id] = display
            })
            setUsersMap(map)
          }
        } catch (e) {
          // ignore
        }
      } catch (e) {
        // ignore for now
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  if (loading) {
    return <div>Loading projects...</div>
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Active Projects</h3>
        {activeProjects.length > 0 ? (
          <div className="space-y-4">
            {activeProjects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription>
                        Led by {usersMap[project.projectLeader ?? -1] ?? project.projectLeader ?? "-"} • {project.labId} • Started {project.startDate ? new Date(project.startDate).toLocaleDateString() : "-"}
                      </CardDescription>
                    </div>
                    <Badge className="bg-accent text-accent-foreground">ACTIVE</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {(project.equipment || []).map((item, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {item.name}
                        </Badge>
                      ))}
                    </div>
                    <Link href={`/project/${project.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">No active projects</CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Past Projects</h3>
        {pastProjects.length > 0 ? (
          <div className="space-y-4">
            {pastProjects.map((project) => (
              <Card key={project.id} className="opacity-75">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription>
                        Led by {usersMap[project.projectLeader ?? -1] ?? project.projectLeader ?? "-"} • {project.labId} • Started {project.startDate ? new Date(project.startDate).toLocaleDateString() : "-"}
                      </CardDescription>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        project.status === "COMPLETED"
                          ? "bg-green-500 text-white"
                          : project.status === "CANCELLED"
                            ? "bg-red-500 text-white"
                            : ""
                      }
                    >
                      {(project.status || "").toString().toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {(project.equipment || []).map((item, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {item.name}
                        </Badge>
                      ))}
                    </div>
                    <Link href={`/project/${project.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">No past projects</CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
