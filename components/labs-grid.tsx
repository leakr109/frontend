"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

type Lab = {
  labId: string
  location: string
  occupactionType: string | null
}


// get labs
export function LabsGrid() {
  const [labs, setLabs] = useState<Lab[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // explicit localhost endpoint
    fetch("http://localhost:8080/labs")
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText)
        return res.json()
      })
      .then((data: Lab[]) => setLabs(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading labs...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="grid grid-cols-3 gap-4">
      {labs.map((lab) => (
        <Link key={lab.labId} href={`/lab/${lab.labId}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{lab.labId}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Location: {lab.location}
                  </p>
                </div>
                <Badge
                  variant={lab.occupactionType === "Available" ? "default" : "secondary"}
                  className={lab.occupactionType === "Available" ? "bg-accent text-accent-foreground" : ""}
                >
                  {lab.occupactionType === "Available" ? "available" : "occupied"}
                </Badge>
              </div>
            </CardHeader>
            {/*
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Equipment:</p>
                <div className="flex flex-wrap gap-2">
                  {lab.equipment.map((item, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
            */}
          </Card>
        </Link>
      ))}
    </div>
  )
}
