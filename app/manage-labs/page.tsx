"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { useState, useEffect } from "react"

interface Equipment {
  id: number
  labId: string
  name: string
  stock: number
  currentUsage: number
}

interface Lab {
  labId: string
  location: string
  occupactionType?: string
  equipment?: Equipment[]
}

export default function ManageLabsPage() {
  const [labs, setLabs] = useState<Lab[]>([])
  const [loadingLabs, setLoadingLabs] = useState(false)
  const [labsError, setLabsError] = useState<string | null>(null)

  // fetch labs from backend
  useEffect(() => {
    setLoadingLabs(true)
    fetch("http://localhost:8080/labs")
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText)
        return res.json()
      })
      .then((data: Lab[]) => setLabs(data))
      .catch((err) => setLabsError(err.message))
      .finally(() => setLoadingLabs(false))
  }, [])

  const [selectedLab, setSelectedLab] = useState<string | null>(null)
  const [showAddLab, setShowAddLab] = useState(false)
  const [showAddEquipment, setShowAddEquipment] = useState(false)
  const [showOccupyDialog, setShowOccupyDialog] = useState(false)
  const [equipmentLoading, setEquipmentLoading] = useState(false)
  const [showRemoveEquipmentDialog, setShowRemoveEquipmentDialog] = useState(false)
  const [equipmentToRemove, setEquipmentToRemove] = useState<Equipment | null>(null)
  const [removeQuantity, setRemoveQuantity] = useState(1)
  const [labToDelete, setLabToDelete] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // New lab form
  const [newLabName, setNewLabName] = useState("")
  const [newLabLocation, setNewLabLocation] = useState("")

  // New equipment form
  const [newEquipmentName, setNewEquipmentName] = useState("")
  const [newEquipmentQuantity, setNewEquipmentQuantity] = useState(1)

  // Occupy form
  const [occupyReason, setOccupyReason] = useState("")

  // add lab (POST)
  const handleAddLab = async () => {
    if (!newLabName || !newLabLocation) return

    const payload = {
      labId: newLabName,
      name: newLabName,
      location: newLabLocation,
    }

    try {
      const res = await fetch("http://localhost:8080/labs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const txt = await res.text()
        setLabsError(txt || res.statusText)
        return
      }

      const created: Lab = await res.json()
      setLabs((prev) => [...prev, created])
      setNewLabName("")
      setNewLabLocation("")
      setShowAddLab(false)
      setLabsError(null)
    } catch (err: any) {
      setLabsError(err?.message || String(err))
    }
  }

  // remove Lab
  const handleRemoveLab = (labId: string) => {
    // local removal helper (keeps backward compatibility)
    setLabs((prev) => prev.filter((lab) => lab.labId !== labId))
    if (selectedLab === labId) setSelectedLab(null)
  }

  // perform DELETE request to backend for labId
  const performDeleteLab = async () => {
    if (!labToDelete) return
    try {
      const res = await fetch(`http://localhost:8080/labs?labId=${encodeURIComponent(labToDelete)}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const txt = await res.text()
        setLabsError(txt || res.statusText)
        setShowDeleteConfirm(false)
        setLabToDelete(null)
        return
      }

      // remove from UI
      handleRemoveLab(labToDelete)
      setShowDeleteConfirm(false)
      setLabToDelete(null)
      setLabsError(null)
    } catch (err: any) {
      setLabsError(err?.message || String(err))
      setShowDeleteConfirm(false)
      setLabToDelete(null)
    }
  }

  // add equipment
  const handleAddEquipment = async () => {
    if (!selectedLab || !newEquipmentName) return

    const payload = [
      {
        name: newEquipmentName,
        stock: newEquipmentQuantity,
      },
    ]

    try {
      const res = await fetch(`http://localhost:8080/labs/${encodeURIComponent(selectedLab)}/equipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const txt = await res.text()
        setLabsError(txt || res.statusText)
        return
      }

      // backend returns boolean success; refresh equipment list from backend
      const ok = await res.json()
      if (ok) {
        try {
          const eqRes = await fetch(
            `http://localhost:8080/labs/${encodeURIComponent(selectedLab)}/equipment`,
          )

          if (!eqRes.ok) {
            const txt = await eqRes.text()
            setLabsError(txt || eqRes.statusText)
            return
          }

          const equipmentData: Equipment[] = await eqRes.json()
          setLabs((prev) => prev.map((lab) => (lab.labId === selectedLab ? { ...lab, equipment: equipmentData } : lab)))
          setNewEquipmentName("")
          setNewEquipmentQuantity(1)
          setShowAddEquipment(false)
          setLabsError(null)
        } catch (err: any) {
          setLabsError(err?.message || String(err))
        }
      } else {
        setLabsError("Failed to add equipment")
      }
    } catch (err: any) {
      setLabsError(err?.message || String(err))
    }
  }

  const openRemoveEquipmentDialog = (equipment: Equipment) => {
    setEquipmentToRemove(equipment)
    setRemoveQuantity(1)
    setShowRemoveEquipmentDialog(true)
  }

  const handleRemoveEquipment = async () => {
    if (!selectedLab || !equipmentToRemove) return

    try {
      const res = await fetch(
        `http://localhost:8080/labs/${encodeURIComponent(selectedLab)}/equipment/${equipmentToRemove.id}?quantity=${removeQuantity}`,
        { method: "DELETE" },
      )

      if (!res.ok) {
        const txt = await res.text()
        setLabsError(txt || res.statusText)
        setShowRemoveEquipmentDialog(false)
        return
      }

      const ok = await res.json()
      if (!ok) {
        setLabsError("Failed to remove equipment")
        setShowRemoveEquipmentDialog(false)
        return
      }

      // update UI on success
      setLabs(
        labs.map((lab) => {
          if (lab.labId === selectedLab) {
            return {
              ...lab,
              equipment: (lab.equipment ?? [])
                .map((eq) => {
                  if (eq.id === equipmentToRemove.id) {
                    const newStock = eq.stock - removeQuantity
                    if (newStock <= 0) return null
                    return { ...eq, stock: newStock }
                  }
                  return eq
                })
                .filter((eq): eq is Equipment => eq !== null),
            }
          }
          return lab
        }),
      )

      setShowRemoveEquipmentDialog(false)
      setEquipmentToRemove(null)
      setRemoveQuantity(1)
      setLabsError(null)
    } catch (err: any) {
      setLabsError(err?.message || String(err))
      setShowRemoveEquipmentDialog(false)
      setEquipmentToRemove(null)
    }

  }

  const handleToggleOccupied = async () => {
    if (!selectedLab) return

    const currentlyAvailable = (selectedLabData?.occupactionType ?? "").toLowerCase() === "available"
    setLoadingLabs(true)

    try {
      if (currentlyAvailable) {
        // Occupy: send JSON body { occupactionType }
        const occ = occupyReason?.trim() || "Occupied"
        const payload = { occupactionType: occ }
        const res = await fetch(
          `http://localhost:8080/labs/${encodeURIComponent(selectedLab)}/occupation`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        )

        if (!res.ok) {
          const txt = await res.text()
          setLabsError(txt || res.statusText)
          return
        }

        setLabs((prev) => prev.map((lab) => (lab.labId === selectedLab ? { ...lab, occupactionType: occ } : lab)))
      } else {
        // Free: PATCH without body
        const res = await fetch(
          `http://localhost:8080/labs/${encodeURIComponent(selectedLab)}/occupation`,
          { method: "PATCH" },
        )

        if (!res.ok) {
          const txt = await res.text()
          setLabsError(txt || res.statusText)
          return
        }

        setLabs((prev) => prev.map((lab) => (lab.labId === selectedLab ? { ...lab, occupactionType: "Available" } : lab)))
      }

      setOccupyReason("")
      setShowOccupyDialog(false)
      setLabsError(null)
    } catch (err: any) {
      setLabsError(err?.message || String(err))
    } finally {
      setLoadingLabs(false)
    }
  }

  const selectedLabData = labs.find((lab) => lab.labId === selectedLab)

  // fetch equipment for selected lab
  useEffect(() => {
    if (!selectedLab) return
    let cancelled = false
    setEquipmentLoading(true)
    fetch(`http://localhost:8080/labs/${encodeURIComponent(selectedLab)}/equipment`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText)
        return res.json()
      })
      .then((data: Equipment[]) => {
        if (cancelled) return
        setLabs((prev) => prev.map((l) => (l.labId === selectedLab ? { ...l, equipment: data } : l)))
      })
      .catch((err) => {
        if (!cancelled) setLabsError(err.message)
      })
      .finally(() => {
        if (!cancelled) setEquipmentLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedLab])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 md:px-12 lg:px-20 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Manage Labs</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 md:px-12 lg:px-20 py-8">
        <div className="grid lg:grid-cols-[300px_1fr] gap-6">
          {/* Labs List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Labs</h2>
              {/* Add lab */}
              <Button onClick={() => setShowAddLab(true)} size="sm" className="gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {labs.map((lab) => (
                <Card
                  key={lab.labId}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedLab === lab.labId ? "border-primary bg-accent" : ""
                  }`}
                  onClick={() => setSelectedLab(lab.labId)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{(lab as any).name ?? lab.labId}</h3>
                      <p className="text-sm text-muted-foreground">location: {lab.location}</p>
                      {(((lab as any).occupied) || ((lab.occupactionType ?? "").toLowerCase() !== "available")) && (
                        <span className="inline-flex items-center gap-1 text-xs text-destructive mt-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Occupied
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setLabToDelete(lab.labId)
                        setShowDeleteConfirm(true)
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Delete confirmation dialog */}
          {showDeleteConfirm && labToDelete && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => {
                setShowDeleteConfirm(false)
                setLabToDelete(null)
              }}
            >
              <Card className="p-6 w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-semibold mb-4">Confirm delete</h3>
                <p className="mb-4">Are you sure you want to permanently delete this lab?</p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setLabToDelete(null) }}>
                    Cancel
                  </Button>
                  <Button onClick={performDeleteLab} variant="destructive">
                    Delete
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Lab Details */}
          <div>
            {selectedLabData ? (
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">{(selectedLabData as any).name ?? selectedLabData.labId}</h2>
                      <p className="text-muted-foreground">location: {selectedLabData.location}</p>
                    </div>
                    <Button
                      variant={(((selectedLabData as any).occupied) || ((selectedLabData.occupactionType ?? "").toLowerCase() !== "available")) ? "destructive" : "outline"}
                      onClick={() => setShowOccupyDialog(true)}
                      className="gap-2"
                    >
                      {(((selectedLabData as any).occupied) || ((selectedLabData.occupactionType ?? "").toLowerCase() !== "available")) ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                            />
                          </svg>
                          Mark as Available
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                          Occupy Lab
                        </>
                      )}
                    </Button>
                  </div>

                  {((((selectedLabData as any).occupied) || ((selectedLabData.occupactionType ?? "").toLowerCase() !== "available")) && selectedLabData.occupactionType) && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-destructive mb-1">Occupied - Reason:</p>
                      <p className="text-sm">{selectedLabData.occupactionType}</p>
                    </div>
                  )}
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Equipment</h3>
                    <Button onClick={() => setShowAddEquipment(true)} size="sm" className="gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Equipment
                    </Button>
                  </div>

                  {equipmentLoading ? (
                    <p className="text-center text-muted-foreground py-8">Loading equipment...</p>
                  ) : selectedLabData.equipment && selectedLabData.equipment.length > 0 ? (
                    <div className="space-y-2">
                      {selectedLabData.equipment.map((eq) => (
                        <div
                          key={eq.id}
                          className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                        >
                          <div>
                            <p className="font-medium">{eq.name}</p>
                            <p className="text-sm text-muted-foreground">Stock: {eq.stock} — In use: {eq.currentUsage}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openRemoveEquipmentDialog(eq)}
                            className="text-destructive hover:text-destructive"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No equipment added yet</p>
                  )}
                </Card>
              </div>
            ) : (
              <Card className="p-12">
                <div className="text-center text-muted-foreground">
                  <svg
                    className="w-12 h-12 mx-auto mb-4 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <p className="text-lg">Select a lab to manage its details</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Add Lab Dialog */}
        {showAddLab && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowAddLab(false)}
          >
            <Card className="p-6 w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-semibold mb-4">Add New Lab</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="lab-name">Lab Name</Label>
                  <Input
                    id="lab-name"
                    placeholder="e.g. Lab A-103"
                    value={newLabName}
                    onChange={(e) => setNewLabName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lab-location">location:</Label>
                  <Input
                    id="lab-location"
                    placeholder="e.g. Building A, Floor 1"
                    value={newLabLocation}
                    onChange={(e) => setNewLabLocation(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddLab(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddLab}>Add Lab</Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Add Equipment Dialog */}
        {showAddEquipment && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowAddEquipment(false)}
          >
            <Card className="p-6 w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-semibold mb-4">Add Equipment</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="equipment-name">Equipment Name</Label>
                  <Input
                    id="equipment-name"
                    placeholder="e.g. Microscope"
                    value={newEquipmentName}
                    onChange={(e) => setNewEquipmentName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="equipment-quantity">Quantity</Label>
                  <Input
                    id="equipment-quantity"
                    type="number"
                    min="1"
                    value={newEquipmentQuantity}
                    onChange={(e) => setNewEquipmentQuantity(Number.parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddEquipment(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddEquipment}>Add Equipment</Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {showRemoveEquipmentDialog && equipmentToRemove && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowRemoveEquipmentDialog(false)}
          >
            <Card className="p-6 w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-semibold mb-4">Remove Equipment</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    How many <span className="font-semibold">{equipmentToRemove.name}</span> units would you like to
                    remove?
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Current stock: <span className="font-semibold">{equipmentToRemove.stock}</span>
                  </p>
                  <Label htmlFor="remove-quantity">Remove Quantity</Label>
                  <Input
                    id="remove-quantity"
                    type="number"
                    min="1"
                    max={equipmentToRemove.stock}
                    value={removeQuantity}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value) || 1
                      setRemoveQuantity(Math.min(value, equipmentToRemove.stock))
                    }}
                  />
                  {removeQuantity >= equipmentToRemove.stock && (
                    <p className="text-sm text-destructive mt-2">
                      This will remove all units and delete this equipment.
                    </p>
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowRemoveEquipmentDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleRemoveEquipment} variant="destructive">
                    Remove
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Occupy Lab Dialog */}
        {showOccupyDialog && selectedLabData && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowOccupyDialog(false)}
          >
            <Card className="p-6 w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-semibold mb-4">
                {(((selectedLabData as any).occupied) || ((selectedLabData.occupactionType ?? "").toLowerCase() !== "available")) ? "Mark Lab as Available" : "Occupy Lab"}
              </h3>
              {!((((selectedLabData as any).occupied) || ((selectedLabData.occupactionType ?? "").toLowerCase() !== "available"))) ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="occupy-reason">Reason</Label>
                    <Textarea
                      id="occupy-reason"
                      placeholder="e.g. Scheduled maintenance, Equipment upgrade, Cleaning..."
                      value={occupyReason}
                      onChange={(e) => setOccupyReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowOccupyDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleToggleOccupied} variant="destructive">
                      Occupy Lab
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">This will mark the lab as available for reservations.</p>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowOccupyDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleToggleOccupied}>Mark as Available</Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
