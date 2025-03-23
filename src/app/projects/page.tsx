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
import { Project, projects as mockProjects } from "@/data/projects";
import { format } from "date-fns";
import { Search, Filter, Plus, Edit, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreateProjectModal } from "@/components/projects/create-project-modal";
import Link from "next/link";

// Helper function to format dates
const formatDate = (date: Date | null) => {
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

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(mockProjects);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Filter projects when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProjects(projects);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = projects.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        project.code.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query)
    );
    
    setFilteredProjects(filtered);
  }, [searchQuery, projects]);

  // Handle new project creation
  const handleCreateProject = (project: Project) => {
    setProjects((prev) => [project, ...prev]);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search projects..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0">
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter projects</span>
          </Button>
        </div>

        {/* Projects table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Code</TableHead>
                <TableHead>Project Name</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Priority</TableHead>
                <TableHead className="hidden lg:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell">Start Date</TableHead>
                <TableHead className="hidden lg:table-cell">Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No projects found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.code}</TableCell>
                    <TableCell>
                      <div className="font-medium">
                        <Link 
                          href={`/projects/${project.id}`}
                          className="hover:underline hover:text-primary transition-colors"
                        >
                          {project.name}
                        </Link>
                      </div>
                      <div className="text-sm text-muted-foreground md:hidden">
                        <Badge variant={getStatusVariant(project.status)}>
                          {project.status.replace(/_/g, " ")}
                        </Badge>
                        {" "}
                        <Badge variant={getPriorityVariant(project.priority)}>
                          {project.priority}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={getStatusVariant(project.status)}>
                        {project.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={getPriorityVariant(project.priority)}>
                        {project.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {project.category.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {formatDate(project.startDate)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {formatDate(project.dueDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/projects/${project.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreateProject={handleCreateProject}
      />
    </Layout>
  );
} 