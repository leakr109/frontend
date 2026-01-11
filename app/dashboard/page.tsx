import { DashboardHeader } from "@/components/dashboard-header"
import { LabsGrid } from "@/components/labs-grid"
import { ProjectsList } from "@/components/projects-list"
import { UsersList } from "@/components/users-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import ManageLabsLink from "@/components/manage-labs-link"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-6 md:px-12 lg:px-20 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Your Lab Complex</h1>
            <p className="text-muted-foreground">View available labs and manage your projects</p>
          </div>
          <Link href="/new-project">
            <Button size="lg" className="gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </Button>
          </Link>
        </div>

        {/* labs list*/}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Available Labs</h2>
            <ManageLabsLink />
          </div>
          <LabsGrid />
        </section>

        {/* projects list*/}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Your Projects</h2>
          <ProjectsList />
        </section>
      </main>
    </div>
  )
}
