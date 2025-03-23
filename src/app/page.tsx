"use client";

import { useState } from "react";
import Link from "next/link";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, PlusCircle } from "lucide-react";
import { CreateProjectModal } from "@/components/projects/create-project-modal";

export default function Home() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section / Hero */}
        <section className="space-y-4">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Welcome to Life Manager</h2>
            <p className="text-muted-foreground mb-4">
              Your personal project management tool. Start by creating a new project or check your recent tasks.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setCreateModalOpen(true)}>Create Project</Button>
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Projects</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/projects">View All</Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Project Card */}
            {[1, 2, 3].map((project) => (
              <div key={project} className="rounded-lg border bg-card overflow-hidden">
                <div className="bg-primary/10 p-4">
                  <h3 className="font-medium">Project {project}</h3>
                </div>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    This is a sample project description. Replace with actual project data.
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      <span>Updated 2d ago</span>
                    </div>
                    <div className="flex items-center">
                      <CalendarDays className="mr-1 h-3 w-3" />
                      <span>Due in 5d</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
          </div>
          <div className="rounded-lg border divide-y">
            {[1, 2, 3, 4, 5].map((activity) => (
              <div key={activity} className="p-4 flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {activity}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Activity {activity} Title</p>
                  <p className="text-xs text-muted-foreground">
                    Short description of the activity. This is a placeholder.
                  </p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Create Project Modal */}
        <CreateProjectModal 
          open={createModalOpen} 
          onOpenChange={setCreateModalOpen} 
        />
      </div>
    </Layout>
  );
}
