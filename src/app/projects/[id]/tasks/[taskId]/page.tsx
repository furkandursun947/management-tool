"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ChevronLeft,
  Clock,
  Calendar as CalendarIcon2,
  CheckCircle2,
  Trash2,
  AlertCircle,
  User,
  Loader2,
  Save,
  CalendarIcon,
  PencilIcon
} from "lucide-react";
import { toast } from "sonner";

import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProjects } from "@/contexts/projects-context";
import { useAuth } from "@/contexts/firebase-context";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Project, TeamMember } from "@/services/project-service";

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
  const { projects, updateTask, deleteTask } = useProjects();
  const { user } = useAuth();
  
  const [project, setProject] = useState<any | null>(null);
  const [task, setTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Editable fields state
  const [editableTitle, setEditableTitle] = useState("");
  const [editableDescription, setEditableDescription] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingAssignee, setEditingAssignee] = useState(false);
  const [editingDueDate, setEditingDueDate] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  // Load data from Firebase
  useEffect(() => {
    if (!projects || projects.length === 0) {
      setLoading(true);
      return;
    }
    
    const projectId = typeof params.id === 'string' ? params.id : params.id?.[0];
    const taskId = typeof params.taskId === 'string' ? params.taskId : params.taskId?.[0];
    
    // Find project from projects context
    const foundProject = projects.find(p => p.id === projectId);
    
    if (foundProject) {
      setProject(foundProject);
      
      // Find task in the project
      const foundTask = foundProject.tasks?.find(t => t.id === taskId);
      
      if (foundTask) {
        setTask(foundTask);
        setEditableTitle(foundTask.title);
        setEditableDescription(foundTask.description || '');
        setSelectedDate(foundTask.dueDate ? new Date(foundTask.dueDate) : undefined);
      }
    }
    
    setLoading(false);
  }, [params.id, params.taskId, projects]);

  // Handle local task updates
  const handleLocalTaskUpdate = (updatedFields: Partial<any>) => {
    if (!project || !task) return;
    
    setSaving(true);
    
    // Create updated task
    const updatedTask = {
      ...task,
      ...updatedFields
    };
    
    // Update local state
    setTask(updatedTask);
    
    // In Firebase implementation, call updateTask
    try {
      updateTask(project.id, task.id, updatedFields)
        .then(() => {
          // Do nothing, toast is handled by the context
        })
        .catch((error) => {
          console.error("Failed to update task:", error);
        })
        .finally(() => {
          setTimeout(() => {
            setSaving(false);
          }, 500);
        });
    } catch (error) {
      console.error("Failed to update task:", error);
      setSaving(false);
    }
  };
  
  // Handle status change
  const handleStatusChange = (status: string) => {
    handleLocalTaskUpdate({ status });
  };
  
  // Handle assignee change
  const handleAssigneeChange = (assigneeId: string) => {
    // If value is "unassigned", set assigneeId to undefined
    handleLocalTaskUpdate({ assigneeId: assigneeId === "unassigned" ? undefined : assigneeId });
    setEditingAssignee(false);
  };
  
  // Handle title change
  const handleTitleSave = () => {
    if (editableTitle !== task?.title) {
      handleLocalTaskUpdate({ title: editableTitle });
    }
    setEditingTitle(false);
  };
  
  // Handle description change
  const handleDescriptionSave = () => {
    if (editableDescription !== task?.description) {
      handleLocalTaskUpdate({ description: editableDescription });
    }
    setEditingDescription(false);
  };
  
  // Handle date change
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      handleLocalTaskUpdate({ dueDate: date });
    } else {
      setSelectedDate(undefined);
      handleLocalTaskUpdate({ dueDate: undefined });
    }
    setEditingDueDate(false);
  };
  
  // Handle delete task
  const handleDeleteTask = () => {
    if (!project || !task) return;
    
    setSaving(true);
    
    try {
      deleteTask(project.id, task.id)
        .then(() => {
          // Navigate back to project
          router.push(`/projects/${project.id}?tab=tasks`);
        })
        .catch((error) => {
          console.error("Failed to delete task:", error);
          setSaving(false);
        });
    } catch (error) {
      console.error("Failed to delete task:", error);
      setSaving(false);
    }
  };

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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading task details...</span>
        </div>
      </Layout>
    );
  }

  // Find assignee if task has one
  const assignee = project?.teamMembers?.find((m: TeamMember) => m.id === task?.assigneeId);

  return (
    <Layout>
      <div className="space-y-6 relative">
        {saving && (
          <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span>Saving changes...</span>
            </div>
          </div>
        )}

        {/* Task header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {editingTitle ? (
                <div className="flex items-center space-x-2">
                  <Input
                    value={editableTitle}
                    onChange={(e) => setEditableTitle(e.target.value)}
                    className="text-2xl font-bold py-2 border-primary"
                    autoFocus
                  />
                  <Button onClick={handleTitleSave} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              ) : (
                <div 
                  className="group relative cursor-pointer rounded-md px-2 py-1 hover:bg-muted/50 hover:border-dashed hover:border"
                  onClick={() => setEditingTitle(true)}
                >
                  <h1 className="text-3xl font-bold tracking-tight">{task?.title}</h1>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <PencilIcon className="h-4 w-4 text-muted-foreground" />
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Select 
                value={task?.status} 
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-[140px]">
                  <div className="flex items-center gap-2">
                    {getTaskStatusIcon(task?.status || "TODO")}
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                </SelectContent>
              </Select>
              
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="cursor-pointer">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the task
                      and remove it from the project.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteTask} className="cursor-pointer bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-2 text-muted-foreground">
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
                {editingDescription ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editableDescription}
                      onChange={(e) => setEditableDescription(e.target.value)}
                      className="min-h-[150px] border-primary"
                      autoFocus
                    />
                    <Button onClick={handleDescriptionSave} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="group relative rounded-md px-3 py-2 hover:bg-muted/50 hover:border-dashed hover:border cursor-pointer"
                    onClick={() => setEditingDescription(true)}
                  >
                    <p className="text-sm text-muted-foreground">{task?.description}</p>
                    <span className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <PencilIcon className="h-4 w-4 text-muted-foreground" />
                    </span>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-2">Timeline</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <CalendarIcon2 className="mr-2 h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">Created Date</p>
                      <p className="text-sm text-muted-foreground">{formatDate(task?.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="flex flex-col space-y-1 w-full">
                      <span className="text-sm font-medium">Due Date</span>
                      {editingDueDate ? (
                        <Popover open={editingDueDate} onOpenChange={setEditingDueDate}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "justify-start text-left font-normal w-full",
                                !selectedDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedDate ? format(selectedDate, "PPP") : "Set due date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={handleDateChange}
                              initialFocus
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            />
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <div 
                          className="group relative rounded-md px-3 py-2 hover:bg-muted/50 hover:border-dashed hover:border cursor-pointer"
                          onClick={() => setEditingDueDate(true)}
                        >
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            <p className="text-sm">{selectedDate ? format(selectedDate, "PPP") : "No due date set"}</p>
                          </div>
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <PencilIcon className="h-4 w-4 text-muted-foreground" />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
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
                {editingAssignee ? (
                  <Select 
                    defaultValue={task?.assigneeId || "unassigned"} 
                    onValueChange={handleAssigneeChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Assign to someone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {project?.teamMembers?.map((member: TeamMember) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div 
                    className="group relative rounded-md px-3 py-2 hover:bg-muted/50 hover:border-dashed hover:border cursor-pointer"
                    onClick={() => setEditingAssignee(true)}
                  >
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
                        <span>Unassigned - Click to assign someone</span>
                      </div>
                    )}
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <PencilIcon className="h-4 w-4 text-muted-foreground" />
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {task?.status !== "DONE" && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start cursor-pointer" 
                    onClick={() => handleStatusChange("DONE")}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Complete
                  </Button>
                )}
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