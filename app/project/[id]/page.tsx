"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"



export default function ProjectDetailPage() {
  const params = useParams()
  const rawId = params?.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId
  const [project, setProject] = useState<any | null>(null)
  const [usersMap, setUsersMap] = useState<Record<number, { name: string; position?: string }>>({})
  const [currentUser, setCurrentUser] = useState<{ id?: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    const fetchData = async () => {
      try {
        const [resProject, resUsers] = await Promise.all([
          fetch(`http://localhost:8082/projects/${id}`),
          fetch(`http://localhost:8081/users`),
        ])
        if (resProject.ok) setProject(await resProject.json())
        if (resUsers.ok) {
          const users = await resUsers.json()
          const map: Record<number, { name: string; position?: string }> = {}
          users.forEach((u: any) => {
            const display = u.name ?? u.fullName ?? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
            if (u.id != null) map[u.id] = { name: display, position: u.position ?? u.role }
          })
          setUsersMap(map)
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    try {
      const raw = localStorage.getItem("user")
      if (raw) setCurrentUser(JSON.parse(raw))
    } catch (e) {
      // ignore
    }
  }, [id])

  if (loading) return <div>Loading...</div>
  if (!project) return <div>Project not found</div>

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-6 md:px-12 lg:px-20 py-8">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-6 gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Button>
        </Link>

        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{project.name}</h1>
              <p className="text-muted-foreground">{project.labId || project.lab}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant={project.status === "active" ? "default" : "secondary"}
                className={
                  project.status === "active"
                    ? "bg-accent text-accent-foreground"
                    : project.status === "completed"
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                }
              >
                {(project.status || "").toString().toUpperCase()}
              </Badge>
              {currentUser && currentUser.id === project.projectLeader ? (
                <StatusChangeDialog projectId={id} currentStatus={project.status} onSaved={(p: any) => setProject(p)} />
              ) : null}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Project Leader</p>
                  <p className="text-base">{usersMap[project.projectLeader]?.name ?? project.projectLeader ?? project.leader ?? "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                  <p className="text-base">{project.startDate ? new Date(project.startDate).toLocaleDateString() : "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p className="text-base">{project.labId || project.lab}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Equipment Used</CardTitle>
                <CardDescription>Equipment reserved for this project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(project.equipment || []).map((item: any, index: number) => (
                    <Badge key={index} variant="outline">
                      {item.name ?? item}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{project.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>People working on this project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(project.participants || []).length === 0 ? (
                  <p className="text-muted-foreground">No participants</p>
                ) : (
                  (project.participants || []).map((pid: number) => (
                    <div key={pid} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                            {(usersMap[pid]?.name || "?")
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{usersMap[pid]?.name ?? pid}</p>
                          <p className="text-sm text-muted-foreground">{pid === project.projectLeader ? "Project Leader" : (usersMap[pid]?.position ?? "Team Member")}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

function StatusChangeDialog({ projectId, currentStatus, onSaved }: { projectId?: string; currentStatus?: string; onSaved?: (p: any) => void }) {
  const [open, setOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>(currentStatus ?? "active")

  const handleSave = () => {
    if (!projectId) {
      alert("Missing project id")
      return
    }

    const doUpdate = async () => {
      try {
        const enumStatus = (selectedStatus || "active").toUpperCase()
        const res = await fetch(`http://localhost:8082/projects/${projectId}/status?status=${encodeURIComponent(enumStatus)}`, {
          method: "PUT",
        })
        if (!res.ok) {
          const txt = await res.text()
          console.error("Failed to update status", res.status, txt)
          alert("Failed to update project status")
          return
        }
        const updated = await res.json()
        if (onSaved) onSaved(updated)
        setOpen(false)
      } catch (e) {
        console.error(e)
        alert("Error updating project status")
      }
    }

    doUpdate()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Change Status
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Project Status</DialogTitle>
          <DialogDescription>Select the new status for this project</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <RadioGroup value={selectedStatus} onValueChange={setSelectedStatus}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="active" id="active" />
              <Label htmlFor="active" className="flex items-center gap-2 cursor-pointer">
                <Badge className="bg-accent text-accent-foreground">ACTIVE</Badge>
                <span className="text-sm text-muted-foreground">Project is currently ongoing</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="completed" id="completed" />
              <Label htmlFor="completed" className="flex items-center gap-2 cursor-pointer">
                <Badge className="bg-green-500 text-white">COMPLETED</Badge>
                <span className="text-sm text-muted-foreground">Project has been finished</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="canceled" id="canceled" />
              <Label htmlFor="canceled" className="flex items-center gap-2 cursor-pointer">
                <Badge className="bg-red-500 text-white">CANCELED</Badge>
                <span className="text-sm text-muted-foreground">Project has been canceled</span>
              </Label>
            </div>
          </RadioGroup>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
