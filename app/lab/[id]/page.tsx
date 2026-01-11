import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const labsData = {
  "1": {
    name: "Lab A-101",
    status: "available",
    equipment: ["Microscope", "Centrifuge", "PCR Machine"],
    projects: [
      {
        id: 1,
        name: "Protein Analysis Study",
        leader: "Dr. Sarah Chen",
        startDate: "2025-10-20",
        status: "active",
      },
    ],
  },
  "2": {
    name: "Lab A-102",
    status: "occupied",
    equipment: ["Spectrophotometer", "Incubator", "Autoclave"],
    projects: [
      {
        id: 4,
        name: "Microbial Growth Analysis",
        leader: "Dr. James Wilson",
        startDate: "2025-11-01",
        status: "active",
      },
      {
        id: 5,
        name: "Enzyme Kinetics Study",
        leader: "Dr. Lisa Anderson",
        startDate: "2025-10-28",
        status: "active",
      },
    ],
  },
  "3": {
    name: "Lab A-103",
    status: "available",
    equipment: ["HPLC", "Mass Spectrometer", "Chromatography"],
    projects: [
      {
        id: 3,
        name: "Chemical Synthesis",
        leader: "Dr. Emily Johnson",
        startDate: "2025-10-15",
        status: "completed",
      },
    ],
  },
  "5": {
    name: "Lab A-105",
    status: "available",
    equipment: ["Flow Cytometer", "Cell Counter", "Biosafety Cabinet"],
    projects: [
      {
        id: 2,
        name: "Cell Culture Research",
        leader: "Dr. Michael Roberts",
        startDate: "2025-10-22",
        status: "active",
      },
    ],
  },
}

export default async function LabDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lab = labsData[id as keyof typeof labsData]

  if (!lab) {
    return <div>Lab not found</div>
  }

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
              <h1 className="text-3xl font-bold text-foreground mb-2">{lab.name}</h1>
            </div>
            <Badge
              variant={lab.status === "available" ? "default" : lab.status === "occupied" ? "secondary" : "outline"}
              className={lab.status === "available" ? "bg-accent text-accent-foreground" : ""}
            >
              {lab.status}
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Equipment</CardTitle>
              <CardDescription>Available equipment in this lab</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {lab.equipment.map((item, index) => (
                  <Badge key={index} variant="outline">
                    {item}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-semibold mb-4">Projects in This Lab</h2>
            {lab.projects.length > 0 ? (
              <div className="space-y-4">
                {lab.projects.map((project) => (
                  <Card key={project.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <CardDescription>Led by {project.leader}</CardDescription>
                        </div>
                        <Badge
                          variant={project.status === "active" ? "default" : "secondary"}
                          className={project.status === "active" ? "bg-accent text-accent-foreground" : ""}
                        >
                          {project.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Start Date: {new Date(project.startDate).toLocaleDateString()}
                        </p>
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
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No projects currently in this lab</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
