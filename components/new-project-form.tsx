"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

// available equipment will be loaded from backend
// GET /labs/equipment -> returns List<String>
const initialAvailableEquipment: string[] = []

type Employee = {
  id: number
  name: string
  position?: string
}

const initialEmployees: Employee[] = []

export function NewProjectForm() {
  const router = useRouter()
  const [projectName, setProjectName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedEquipment, setSelectedEquipment] = useState<Record<string, number>>({})
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([])
  const [matchedLabs, setMatchedLabs] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [availableEquipment, setAvailableEquipment] = useState<string[]>(initialAvailableEquipment)
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>(initialEmployees)
  const [currentUser, setCurrentUser] = useState<any | null>(null)

  const toggleEquipment = (equipment: string) => {
    setSelectedEquipment((prev) => {
      const copy = { ...prev }
      if (copy[equipment] !== undefined) {
        delete copy[equipment]
      } else {
        copy[equipment] = 1
      }
      return copy
    })
  }

  const setEquipmentQuantity = (equipment: string, qty: number) => {
    setSelectedEquipment((prev) => {
      if (!prev[equipment]) return prev
      const copy = { ...prev }
      copy[equipment] = Math.max(1, qty)
      return copy
    })
  }

  const toggleEmployee = (employeeId: number) => {
    // prevent selecting the currently logged-in user as a team member
    if (currentUser && employeeId === currentUser.id) return
    setSelectedEmployees((prev) =>
      prev.includes(employeeId) ? prev.filter((id) => id !== employeeId) : [...prev, employeeId],
    )
  }

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const res = await fetch("http://localhost:8080/labs/equipment")
        if (!res.ok) return
        const data: string[] = await res.json()
        setAvailableEquipment(data)
      } catch (e) {
        // ignore for now
      }
    }
    fetchEquipment()
    // fetch available employees from users-service
    const fetchEmployees = async () => {
      try {
        const res = await fetch("http://localhost:8081/users")
        if (!res.ok) return
        const data: Employee[] = await res.json()
        // backend may return `name` or `fullName` — prefer `name`, fallback to `fullName`
        const mapped = data.map((u: any) => ({ id: u.id, name: u.name ?? u.fullName ?? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim(), position: u.position }))
        // load current user from localStorage and filter them out from selectable employees
        const raw = localStorage.getItem("user")
        const me = raw ? JSON.parse(raw) : null
        setCurrentUser(me)
        const filtered = me ? mapped.filter((e) => e.id !== me.id) : mapped
        setAvailableEmployees(filtered)
      } catch (e) {
        // ignore for now
      }
    }
    fetchEmployees()
  }, [])

  const findAvailableLabs = () => {
    setIsSearching(true)

    const payload = Object.entries(selectedEquipment).map(([name, qty]) => ({ name, stock: qty }))

    // POST payload to /labs/reservation to get matching labs
    fetch("http://localhost:8080/labs/reservation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`network:${res.status}`)
        return res.json()
      })
      .then((data) => setMatchedLabs(data || []))
      .catch(() => setMatchedLabs([]))
      .finally(() => setIsSearching(false))
  }

  const handleReserve = async (labId: string) => {
    // Build project object and equipmentRequests payload
    const project = {
      name: projectName,
      labId,
      description,
      startDate: new Date().toISOString().split("T")[0],
      endDate: null,
      projectLeader: currentUser?.id ?? null,
      participants: selectedEmployees.filter((id) => id !== currentUser?.id),
    }

    const equipmentRequests = Object.entries(selectedEquipment).map(([name, qty]) => ({ name, stock: qty }))

    try {
      const res = await fetch("http://localhost:8082/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project, equipmentRequests }),
      })

      if (res.status === 201) {
        // created
        router.push("/dashboard")
        return
      }

      if (res.status === 409) {
        alert("Reservation failed: not enough equipment available in selected lab")
        return
      }

      // other errors
      const text = await res.text()
      alert(`Reservation failed: ${res.status} ${text}`)
    } catch (err) {
      // network or other
      // eslint-disable-next-line no-console
      console.error(err)
      alert("Failed to contact projects backend (http://localhost:8082/projects)")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>Provide information about your research project</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="e.g., Protein Analysis Study"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of your research project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between w-full">
            <div>
              <CardTitle>Required Equipment</CardTitle>
              <CardDescription>Select all equipment needed for your project</CardDescription>
            </div>
            <div className="flex items-start">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  if (!description || description.trim() === "") {
                    alert("Please add a project description first")
                    return
                  }
                  setIsGenerating(true)
                  try {
                    const res = await fetch("http://localhost:8082/projects/generateEquipment", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ description, availableEquipment }),
                    })
                    if (!res.ok) {
                      const txt = await res.text()
                      console.error("generateEquipment failed", res.status, txt)
                      alert("Failed to generate equipment suggestions")
                      return
                    }
                    const data: Array<{ name: string; stock?: number }> = await res.json()
                    if (!Array.isArray(data) || data.length === 0) {
                      alert("No suggestions returned")
                      return
                    }
                    // merge into selectedEquipment: check availability (case-insensitive) and set qty
                    setSelectedEquipment((prev) => {
                      const copy: Record<string, number> = { ...prev }
                      // build lowercase lookup from availableEquipment -> original name
                      const lookup: Record<string, string> = {}
                      availableEquipment.forEach((e) => {
                        if (e) lookup[e.toLowerCase().trim()] = e
                      })

                      data.forEach((item) => {
                        if (!item || !item.name) return
                        const key = String(item.name).toLowerCase().trim()
                        const matched = lookup[key]
                        if (!matched) return
                        copy[matched] = Math.max(1, item.stock ?? 1)
                      })
                      return copy
                    })
                  } catch (e) {
                    console.error(e)
                    alert("Error generating equipment")
                  } finally {
                    setIsGenerating(false)
                  }
                }}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate from description"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableEquipment.map((equipment) => (
              <div key={equipment} className="flex items-center space-x-2">
                <Checkbox
                  id={equipment}
                  checked={selectedEquipment[equipment] !== undefined}
                  onCheckedChange={() => toggleEquipment(equipment)}
                />
                <Label htmlFor={equipment} className="text-sm font-normal cursor-pointer">
                  {equipment}
                </Label>
                {selectedEquipment[equipment] !== undefined && (
                  <div className="ml-2">
                    <Input
                      type="number"
                      min={1}
                      value={selectedEquipment[equipment]}
                      onChange={(e) => setEquipmentQuantity(equipment, parseInt(e.target.value || "1", 10))}
                      className="w-20"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {Object.keys(selectedEquipment).length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm font-medium mb-3">Selected Equipment ({Object.keys(selectedEquipment).length}):</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(selectedEquipment).map(([name, qty]) => (
                  <Badge key={name} variant="secondary">
                    {name} x{qty}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Select employees to work on this project. You will be added as project leader.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {availableEmployees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/5 transition-colors"
              >
                <Checkbox
                  id={`employee-${employee.id}`}
                  checked={selectedEmployees.includes(employee.id)}
                  onCheckedChange={() => toggleEmployee(employee.id)}
                />
                <Label htmlFor={`employee-${employee.id}`} className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">
                        {employee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{employee.name}</p>
                      <p className="text-xs text-muted-foreground">{employee.position ?? "(no position)"}</p>
                    </div>
                  </div>
                </Label>
              </div>
            ))}
          </div>

          {selectedEmployees.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm font-medium mb-3">Selected Team Members ({selectedEmployees.length + 1}):</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default" className="bg-primary">
                  You (Project Leader)
                </Badge>
                {selectedEmployees.map((employeeId) => {
                  const employee = availableEmployees.find((e) => e.id === employeeId)
                  return (
                    <Badge key={employeeId} variant="secondary">
                      {employee?.name}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="w-full"
        onClick={findAvailableLabs}
        disabled={!projectName || Object.keys(selectedEquipment).length === 0 || isSearching}
      >
        {isSearching ? "Finding Available Labs..." : "Find Available Labs"}
      </Button>

      {matchedLabs.length > 0 && (
        <Card className="border-accent">
          <CardHeader>
            <CardTitle>Available Labs</CardTitle>
            <CardDescription>We found {matchedLabs.length} labs that match your requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {matchedLabs.map((lab: any) => (
              <div
                key={lab.labId}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{lab.labId}</h3>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm text-muted-foreground">{lab.location}</p>
                  </div>
                </div>
                <Button onClick={() => handleReserve(lab.labId)}>Reserve Lab</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
