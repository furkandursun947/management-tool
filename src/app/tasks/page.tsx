"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Search, Filter, Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjects } from "@/contexts/projects-context";
import { useAuth } from "@/contexts/firebase-context";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function TasksPage() {
  const { projects, loading } = useProjects();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);

  // Get all tasks from Firebase projects
  useEffect(() => {
    const tasks = projects.flatMap(project => 
      project.tasks
        .filter(task => task.assigneeId === user?.uid)
        .map(task => ({
          ...task,
          projectId: project.id,
          projectName: project.name
        }))
    );
    setAllTasks(tasks);
  }, [projects, user?.uid]);

  // Apply filters when search query or status filter changes
  useEffect(() => {
    let filtered = allTasks;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        task => 
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          task.projectName.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter && statusFilter !== "ALL") {
      filtered = filtered.filter(task => task.status === statusFilter);
    }
    
    setFilteredTasks(filtered);
  }, [searchQuery, statusFilter, allTasks]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tasks..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter || "ALL"}
            onValueChange={(value) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
              <SelectItem value="BLOCKED">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tasks table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Due Date</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No tasks found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="font-medium">
                        <Link 
                          href={`/projects/${task.projectId}/tasks/${task.id}`}
                          className="hover:underline hover:text-primary transition-colors"
                        >
                          {task.title}
                        </Link>
                      </div>
                      <div className="text-sm text-muted-foreground md:hidden line-clamp-1">
                        {task.description}
                      </div>
                      <div className="text-sm md:hidden mt-1">
                        <Badge variant={getTaskStatusVariant(task.status)}>
                          {task.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link 
                        href={`/projects/${task.projectId}`}
                        className="text-sm hover:underline hover:text-primary transition-colors"
                      >
                        {task.projectName}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={getTaskStatusVariant(task.status)}>
                        {task.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {task.dueDate ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDate(task.dueDate)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">No due date</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/projects/${task.projectId}/tasks/${task.id}`}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
} 