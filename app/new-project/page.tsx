import { DashboardHeader } from "@/components/dashboard-header"
import { NewProjectForm } from "@/components/new-project-form"

export default function NewProjectPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-6 md:px-12 lg:px-20 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Create New Project</h1>
            <p className="text-muted-foreground">
              Select your required equipment and we'll find an available lab for you
            </p>
          </div>
          <NewProjectForm />
        </div>
      </main>
    </div>
  )
}
