"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { 
  ChevronLeft, 
  CalendarIcon, 
  Clock, 
  Tag, 
  Users, 
  Clipboard, 
  CheckCircle2, 
  AlertTriangle,
  Edit,
  Plus,
  Mail
} from "lucide-react";

import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AddTaskModal } from "@/components/projects/add-task-modal";
import { AddMemberModal } from "@/components/projects/add-member-modal";
import { projectService, Project, TeamMember } from "@/services/project-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoles } from "@/contexts/roles-context";
import { usePermissions } from "@/hooks/use-permissions";
import { ManageRolesModal } from "@/components/projects/manage-roles-modal";
import { ManageTeamModal } from "@/components/projects/manage-team-modal";
import { WithProjectPermissions } from "@/components/auth/with-permissions";

interface ProjectWithRoles extends Project {
  teamMembers: Array<TeamMember & { roleId: string }>;
}

// Helper function to format dates
const formatDate = (date: Date | null | undefined) => {
  if (!date) return "N/A";
  return format(date, "MMM d, yyyy");
};

// Helper function to get status badge variant
const getStatusVariant = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "secondary";
    case "IN_PROGRESS":
      return "outline";
    case "NOT_STARTED":
      return "default";
    default:
      return "default";
  }
};

// Helper function to get priority badge variant
const getPriorityVariant = (priority: string) => {
  switch (priority) {
    case "HIGH":
      return "destructive";
    case "MEDIUM":
      return "outline";
    case "LOW":
      return "secondary";
    default:
      return "default";
  }
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = typeof params.id === "string" ? params.id : params.id?.[0];
  const { projectRoles } = useRoles();
  const { hasProjectPermission } = usePermissions();
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function fetchProject() {
      if (!projectId) return;
      
      try {
        const projectData = await projectService.getProject(projectId);
        setProject(projectData);
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
    
    // Set active tab based on query parameter
    const tabParam = searchParams.get("tab");
    if (tabParam && ["overview", "tasks", "team"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [projectId, searchParams]);

  // Handle changing tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update URL without page reload
    router.push(`/projects/${projectId}?tab=${value}`);
  };

  // Show loading state
  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/projects">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="space-y-1">
              <Skeleton className="h-8 w-[200px]" />
              <Skeleton className="h-4 w-[300px]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-1">
                  <Skeleton className="h-4 w-[100px]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-6 w-[120px]" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
              <Skeleton className="h-4 w-[300px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Handle case where project is not found
  if (!project || !projectId) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-6">The project you're looking for doesn't exist or has been deleted.</p>
          <Button asChild>
            <Link href="/projects">
              Go to Projects
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  // At this point, we know projectId is a string
  const safeProjectId = projectId as string;
  const roles = projectRoles[safeProjectId] || [];
  const canManageRoles = hasProjectPermission(safeProjectId, "MANAGE_ROLES");
  const canManageTeam = hasProjectPermission(safeProjectId, "MANAGE_TEAM");

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projects">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-muted-foreground">{project.code}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={getStatusVariant(project.status)}>
                {project.status.replace(/_/g, " ")}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium">Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={getPriorityVariant(project.priority)}>
                {project.priority}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium">Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Tag className="mr-2 h-4 w-4" />
                {project.category.replace(/_/g, " ")}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>{formatDate(project.startDate)} - {formatDate(project.dueDate)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project details tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
                <CardDescription>Project overview and details</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {project.description || "No description provided."}
                </p>
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Latest Updates</h3>
                  <p className="text-sm text-muted-foreground">
                    Last updated on {formatDate(project.updatedAt)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Task Summary</CardTitle>
                  <CardDescription>Overview of project tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Tasks</span>
                      <span className="font-medium">{project.tasks?.length || 0}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Completed</span>
                      <span className="font-medium">
                        {project.tasks?.filter(t => t.status === "DONE").length || 0}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm">In Progress</span>
                      <span className="font-medium">
                        {project.tasks?.filter(t => t.status === "IN_PROGRESS").length || 0}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm">To Do</span>
                      <span className="font-medium">
                        {project.tasks?.filter(t => t.status === "TODO").length || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/projects/${project.id}?tab=tasks`} onClick={(e) => {
                      e.preventDefault();
                      handleTabChange("tasks");
                    }}>
                      <Clipboard className="mr-2 h-4 w-4" />
                      View All Tasks
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Project team and collaborators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {project.teamMembers?.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No team members assigned yet.</p>
                    ) : (
                      project.teamMembers?.map((member) => {
                        return (
                          <div key={member.id} className="flex items-center gap-4">
                            <Avatar>
                              <AvatarImage src={member.avatarUrl} />
                              <AvatarFallback>{member.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                              {roles.find(r => r.id === member.roleId) && (
                                <span className="text-xs text-muted-foreground">
                                  {roles.find(r => r.id === member.roleId)?.name}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/projects/${project.id}?tab=team`} onClick={(e) => {
                      e.preventDefault();
                      handleTabChange("team");
                    }}>
                      <Users className="mr-2 h-4 w-4" />
                      Manage Team
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tasks</CardTitle>
                    <CardDescription>Manage project tasks</CardDescription>
                  </div>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {project.tasks?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No tasks created yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {project.tasks?.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={getStatusVariant(task.status)}>
                            {task.status.replace(/_/g, " ")}
                          </Badge>
                          {task.dueDate && (
                            <span className="text-sm text-muted-foreground">
                              Due {formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage project team</CardDescription>
                  </div>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {project.teamMembers?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No team members assigned yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {project.teamMembers?.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={member.avatarUrl} />
                            <AvatarFallback>{member.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                            {roles.find(r => r.id === member.roleId) && (
                              <span className="text-xs text-muted-foreground">
                                {roles.find(r => r.id === member.roleId)?.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="mt-8 space-x-4">
        {canManageRoles && (
          <Button onClick={() => setShowRolesModal(true)}>
            Manage Roles
          </Button>
        )}
        {canManageTeam && (
          <Button onClick={() => setShowTeamModal(true)}>
            Manage Team
          </Button>
        )}
      </div>

      <ManageRolesModal
        projectId={safeProjectId}
        open={showRolesModal}
        onOpenChange={setShowRolesModal}
      />
      <ManageTeamModal
        projectId={safeProjectId}
        open={showTeamModal}
        onOpenChange={setShowTeamModal}
        teamMembers={project.teamMembers || []}
      />
    </Layout>
  );
} 