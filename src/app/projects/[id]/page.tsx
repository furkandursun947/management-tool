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
import { Project, Task, projects } from "@/data/projects";
import { AddTaskModal } from "@/components/projects/add-task-modal";

// Helper function to format dates
const formatDate = (date: Date | null | undefined) => {
  if (!date) return "N/A";
  return format(date, "MMM d, yyyy");
};

// Helper function to get status badge variant
const getStatusVariant = (status: Project["status"]) => {
  switch (status) {
    case "NOT_STARTED":
      return "outline";
    case "IN_PROGRESS":
      return "secondary";
    case "COMPLETED":
      return "default";
    case "ON_HOLD":
      return "destructive";
    default:
      return "outline";
  }
};

// Helper function to get priority badge variant
const getPriorityVariant = (priority: Project["priority"]) => {
  switch (priority) {
    case "LOW":
      return "outline";
    case "MEDIUM":
      return "secondary";
    case "HIGH":
      return "destructive";
    default:
      return "outline";
  }
};

// Helper function to get task status variant
const getTaskStatusVariant = (status: Task["status"]) => {
  switch (status) {
    case "TODO":
      return "outline";
    case "IN_PROGRESS":
      return "secondary";
    case "DONE":
      return "default";
    case "BLOCKED":
      return "destructive";
    default:
      return "outline";
  }
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // In a real app, you would fetch the project from an API
    const id = typeof params.id === 'string' ? params.id : params.id?.[0];
    const foundProject = projects.find(p => p.id === id);
    
    if (foundProject) {
      setProject(foundProject);
    }
    
    // Set active tab based on query parameter
    const tabParam = searchParams.get("tab");
    if (tabParam && ["overview", "tasks", "team"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    
    setLoading(false);
  }, [params.id, searchParams]);

  // Handle changing tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update URL without page reload
    const id = typeof params.id === 'string' ? params.id : params.id?.[0];
    router.push(`/projects/${id}?tab=${value}`);
  };

  // Handle case where project is not found
  if (!loading && !project) {
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

  // Show loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <p>Loading project details...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="space-y-6">

          {/* Project header */}
          <div className="flex items-center gap-2 justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{project?.name}</h1>
                <Badge className="ml-2">{project?.code}</Badge>
              </div>
              <p className="text-muted-foreground">{project?.description}</p>
            </div>
            <Button
                size="sm"
                className="flex items-center gap-1"
                asChild
            >
                <Link href={`/projects/${project?.id}/edit`}>
                <Edit className="h-4 w-4" />
                Edit Project
                </Link>
            </Button>
          </div>

          {/* Project summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={getStatusVariant(project?.status || "NOT_STARTED")}>
                  {project?.status.replace(/_/g, " ")}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium">Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={getPriorityVariant(project?.priority || "MEDIUM")}>
                  {project?.priority}
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
                  {project?.category.replace(/_/g, " ")}
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
                  <span>{formatDate(project?.startDate)} - {formatDate(project?.dueDate)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Project details tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
            </TabsList>

            {/* Overview tab */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                  <CardDescription>
                    Comprehensive information about this project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground">{project?.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Timeline</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <div>
                          <p className="text-sm font-medium">Start Date</p>
                          <p className="text-sm text-muted-foreground">{formatDate(project?.startDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <div>
                          <p className="text-sm font-medium">Due Date</p>
                          <p className="text-sm text-muted-foreground">{formatDate(project?.dueDate)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Latest Updates</h3>
                    <p className="text-sm text-muted-foreground">
                      Last updated on {formatDate(project?.updatedAt)}
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
                        <span className="font-medium">{project?.tasks?.length || 0}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Completed</span>
                        <span className="font-medium">
                          {project?.tasks?.filter(t => t.status === "DONE").length || 0}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm">In Progress</span>
                        <span className="font-medium">
                          {project?.tasks?.filter(t => t.status === "IN_PROGRESS").length || 0}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm">To Do</span>
                        <span className="font-medium">
                          {project?.tasks?.filter(t => t.status === "TODO").length || 0}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Blocked</span>
                        <span className="font-medium">
                          {project?.tasks?.filter(t => t.status === "BLOCKED").length || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/projects/${project?.id}?tab=tasks`} onClick={(e) => {
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
                    <CardDescription>People working on this project</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {project?.teamMembers?.map((member) => (
                        <div key={member.id} className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.avatarUrl} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/projects/${project?.id}?tab=team`} onClick={(e) => {
                        e.preventDefault();
                        handleTabChange("team");
                      }}>
                        <Users className="mr-2 h-4 w-4" />
                        View All Team Members
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            {/* Tasks tab */}
            <TabsContent value="tasks" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Project Tasks</CardTitle>
                      <CardDescription>All tasks for this project</CardDescription>
                    </div>
                    <AddTaskModal projectId={project?.id || ""} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {project?.tasks && project.tasks.length > 0 ? (
                      project.tasks.map((task) => (
                        <div key={task.id} className="border rounded-md p-4 hover:border-primary transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <Link 
                                href={`/projects/${project.id}/tasks/${task.id}`}
                                className="font-medium hover:text-primary hover:underline transition-colors"
                              >
                                {task.title}
                              </Link>
                              <p className="text-sm text-muted-foreground">{task.description}</p>
                            </div>
                            <Badge variant={getTaskStatusVariant(task.status)}>
                              {task.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center">
                                <Clock className="mr-1 h-3 w-3" />
                                <span>Due: {task.dueDate ? formatDate(task.dueDate) : "No due date"}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {project.teamMembers && task.assigneeId && (
                                <div className="flex items-center">
                                  <Avatar className="h-6 w-6 mr-1">
                                    <AvatarImage 
                                      src={project.teamMembers.find(m => m.id === task.assigneeId)?.avatarUrl} 
                                    />
                                    <AvatarFallback className="text-xs">
                                      {project.teamMembers.find(m => m.id === task.assigneeId)?.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>
                                    {project.teamMembers.find(m => m.id === task.assigneeId)?.name}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-4">
                        <p className="text-muted-foreground">No tasks found for this project.</p>
                        <AddTaskModal 
                          projectId={project?.id || ""} 
                          trigger={
                            <Button variant="outline" className="mt-4">
                              <Plus className="mr-2 h-4 w-4" />
                              Add First Task
                            </Button>
                          }
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Team tab */}
            <TabsContent value="team" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Team Members</CardTitle>
                      <CardDescription>People assigned to this project</CardDescription>
                    </div>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Member
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {project?.teamMembers && project.teamMembers.length > 0 ? (
                      project.teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between border rounded-md p-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member.avatarUrl} />
                              <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-muted-foreground">{member.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Mail className="mr-2 h-4 w-4" />
                              Contact
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-4">
                        <p className="text-muted-foreground">No team members assigned to this project.</p>
                        <Button variant="outline" className="mt-4">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Team Member
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
} 