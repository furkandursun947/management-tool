"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ChevronLeft,
  Clock,
  Calendar,
  CheckCircle2,
  Edit,
  Trash2,
  AlertCircle,
  User
} from "lucide-react";

import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Project, Task, projects } from "@/data/projects";

// Helper function to format dates
const formatDate = (date: Date | null | undefined) => {
  if (!date) return "N/A";
  return format(date, "MMM d, yyyy");
};

// Helper function to get task status variant
const getTaskStatusVariant = (status: string) => {
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

// Helper function to get task status icon
const getTaskStatusIcon = (status: string) => {
  switch (status) {
    case "TODO":
      return <Clock className="h-4 w-4" />;
    case "IN_PROGRESS":
      return <Clock className="h-4 w-4 text-blue-500" />;
    case "DONE":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "BLOCKED":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch the task from an API
    const projectId = typeof params.id === 'string' ? params.id : params.id?.[0];
    const taskId = typeof params.taskId === 'string' ? params.taskId : params.taskId?.[0];
    
    const foundProject = projects.find(p => p.id === projectId);
    
    if (foundProject) {
      setProject(foundProject);
      
      const foundTask = foundProject.tasks?.find(t => t.id === taskId);
      
      if (foundTask) {
        setTask(foundTask);
      }
    }
    
    setLoading(false);
  }, [params.id, params.taskId]);

  // Handle case where project or task is not found
  if (!loading && (!project || !task)) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold mb-4">Task Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The task you're looking for doesn't exist or has been deleted.
          </p>
          <Button asChild>
            <Link href={project ? `/projects/${project.id}?tab=tasks` : "/projects"}>
              Go to {project ? "Project Tasks" : "Projects"}
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
          <p>Loading task details...</p>
        </div>
      </Layout>
    );
  }

  // Find assignee if task has one
  const assignee = project?.teamMembers?.find(m => m.id === task?.assigneeId);

  return (
    <Layout>
      <div className="space-y-6">

        {/* Task header */}
        <div className="space-y-2 flex justify-between items-center">
            <div>
                <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{task?.title}</h1>
                <Badge variant={getTaskStatusVariant(task?.status || "TODO")} className="ml-2">
                {task?.status}
                </Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium">Project:</span>
                <Link 
                href={`/projects/${project?.id}`} 
                className="hover:text-primary hover:underline transition-colors"
                >
                {project?.name}
                </Link>
                <span className="text-xs">({project?.code})</span>
            </div>
            </div>
            <div>
            <div className="flex gap-2">
                <Button>
                <Edit className="mr-2 h-4 w-4" />
                Edit Task
                </Button>
                <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
                </Button>
            </div>
            </div>
        </div>

        {/* Task details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main task details card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
              <CardDescription>
                Comprehensive information about this task
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{task?.description}</p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Timeline</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">Created Date</p>
                      <p className="text-sm text-muted-foreground">{formatDate(task?.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">Due Date</p>
                      <p className="text-sm text-muted-foreground">{formatDate(task?.dueDate)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">Status</h3>
                <div className="flex items-center">
                  {getTaskStatusIcon(task?.status || "TODO")}
                  <span className="ml-2">
                    <Badge variant={getTaskStatusVariant(task?.status || "TODO")}>
                      {task?.status}
                    </Badge>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar with assignee & related info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Assignee</CardTitle>
              </CardHeader>
              <CardContent>
                {assignee ? (
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={assignee.avatarUrl} />
                      <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{assignee.name}</p>
                      <p className="text-sm text-muted-foreground">{assignee.role}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>No assignee</span>
                  </div>
                )}
              </CardContent>
              {assignee && (
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Contact Assignee
                  </Button>
                </CardFooter>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark as Complete
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <User className="mr-2 h-4 w-4" />
                  Reassign Task
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related information */}
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>Recent activity related to this task</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 text-muted-foreground">
              <p>No activity recorded for this task yet.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 