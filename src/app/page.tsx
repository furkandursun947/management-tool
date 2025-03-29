"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CalendarDays, Clock, CheckCircle2, Circle, AlertCircle, Users, Crown, UserPlus } from "lucide-react";
import Link from "next/link";
import { useProjects } from "@/contexts/projects-context";
import { ProjectsSkeleton } from "@/components/dashboard/projects-skeleton";
import { useEffect } from "react";
import Layout from "@/components/layout";
import { CreateProjectModal } from "@/components/projects/create-project-modal";
import { useAuth } from "@/contexts/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamInvitations } from "@/components/dashboard/team-invitations";
import { useTeams } from "@/contexts/teams-context";

export default function HomePage() {
  const { projects, loading, refreshProjects } = useProjects();
  const { user } = useAuth();
  const { teams, loading: teamsLoading } = useTeams();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    refreshProjects();
  }, []); // Only run once when component mounts

  // Get tasks assigned to current user
  const assignedTasks = projects.flatMap(project => 
    project.tasks
      .filter(task => task.assigneeId === user?.id)
      .map(task => ({
        ...task,
        projectId: project.id,
        projectName: project.name
      }))
  ).slice(0, 3);

  // Kendi oluşturduğu takımları hesapla
  const ownedTeams = teams.filter(team => team.ownerId === user?.id);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section / Hero */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Welcome to Life Manager</h2>
            <p className="text-muted-foreground mb-4">
              Your personal project management tool. Start by creating a new project or check your recent tasks.
            </p>
          </div>
        </section>

        {/* Team Invitations Section */}
        <TeamInvitations />

        {/* Teams Statistics Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Teams</h2>
            <Link href="/team">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          
          {teamsLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="p-6 flex flex-col items-center justify-center">
                <div className="rounded-full bg-primary/10 p-3 mb-2">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold mb-1">Total Teams</h2>
                <p className="text-3xl font-bold">{teams.length}</p>
              </Card>
              
              <Card className="p-6 flex flex-col items-center justify-center">
                <div className="rounded-full bg-primary/10 p-3 mb-2">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold mb-1">Owned Teams</h2>
                <p className="text-3xl font-bold">{ownedTeams.length}</p>
              </Card>
              
              <Card className="p-6 flex flex-col items-center justify-center">
                <div className="rounded-full bg-primary/10 p-3 mb-2">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold mb-1">Member Teams</h2>
                <p className="text-3xl font-bold">{teams.length - ownedTeams.length}</p>
              </Card>
            </div>
          )}
        </section>

        {/* Project Statistics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-2">Total Projects</h2>
            <p className="text-3xl font-bold">{projects.length}</p>
          </Card>
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-2">Active Projects</h2>
            <p className="text-3xl font-bold">
              {projects.filter(p => p.status === 'IN_PROGRESS').length}
            </p>
          </Card>
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-2">Completed Projects</h2>
            <p className="text-3xl font-bold">
              {projects.filter(p => p.status === 'COMPLETED').length}
            </p>
          </Card>
        </div>

        {/* Projects Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Projects</h2>
            <Link href="/projects">
              <Button variant="outline">View All</Button>
            </Link>
          </div>

          {loading ? (
            <ProjectsSkeleton />
          ) : projects.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No projects found.</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 3).map((project) => (
                <Card key={project.id} className="overflow-hidden">
                  <div className="bg-primary/10 p-4">
                    <h3 className="font-medium">{project.name}</h3>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      {project.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <CalendarDays className="mr-1 h-3 w-3" />
                        <span>{project.tasks.length} tasks</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {project.teamMembers.slice(0, 3).map((member) => (
                          <div
                            key={member.id}
                            className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium"
                          >
                            {member.name[0]}
                          </div>
                        ))}
                        {project.teamMembers.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            +{project.teamMembers.length - 3}
                          </div>
                        )}
                      </div>
                      <Link href={`/projects/${project.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Your Tasks Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Tasks</h2>
            <Link href="/tasks">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          <Card className="divide-y">
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : assignedTasks.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-muted-foreground">No tasks assigned to you.</p>
              </div>
            ) : (
              assignedTasks.map((task) => (
                <div key={task.id} className="p-4 flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {task.projectName[0]}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{task.title}</p>
                      <div className="flex items-center gap-2">
                        {task.status === 'DONE' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : task.status === 'IN_PROGRESS' ? (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400" />
                        )}
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {task.projectName}
                    </p>
                  </div>
                  <Link href={`/projects/${task.projectId}/tasks/${task.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </div>
              ))
            )}
          </Card>
        </section>

        {/* Recent Activity Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
          </div>
          <Card className="divide-y">
            {projects.slice(0, 5).map((project) => (
              <div key={project.id} className="p-4 flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {project.name[0]}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {project.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </Card>
        </section>
      </div>
      
      <CreateProjectModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen} 
      />
    </Layout>
  );
}
