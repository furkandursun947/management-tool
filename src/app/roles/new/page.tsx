"use client";

import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { rolesService } from "@/services/roles-service";
import { useProjects } from "@/contexts/projects-context";
import { toast } from "sonner";
import { useRoles } from "@/contexts/roles-context";

// Define available permissions
const PERMISSIONS = [
  {
    id: "manage_tasks",
    label: "Manage Tasks",
    description: "Create, edit, and delete tasks",
    subPermissions: [
      { id: "create_tasks", label: "Create Tasks" },
      { id: "edit_tasks", label: "Edit Tasks" },
      { id: "delete_tasks", label: "Delete Tasks" },
      { id: "close_tasks", label: "Close Tasks" },
      { id: "reopen_tasks", label: "Reopen Tasks" },
    ],
  },
  {
    id: "manage_projects",
    label: "Manage Projects",
    description: "Create, edit, and delete projects",
    subPermissions: [
      { id: "create_projects", label: "Create Projects" },
      { id: "edit_projects", label: "Edit Projects" },
      { id: "delete_projects", label: "Delete Projects" },
      { id: "close_projects", label: "Close Projects" },
      { id: "reopen_projects", label: "Reopen Projects" },
    ],
  },
  {
    id: "manage_team",
    label: "Manage Team",
    description: "Manage team members and roles",
    subPermissions: [
      { id: "add_members", label: "Add Team Members" },
      { id: "remove_members", label: "Remove Team Members" },
      { id: "manage_roles", label: "Manage Roles" },
    ],
  },
  {
    id: "view_analytics",
    label: "View Analytics",
    description: "Access project and team analytics",
    subPermissions: [
      { id: "view_project_analytics", label: "View Project Analytics" },
      { id: "view_team_analytics", label: "View Team Analytics" },
    ],
  },
];

// Form schema
const roleFormSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().min(1, "Description is required"),
  permissions: z.array(z.string()).optional(),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

export default function NewRolePage() {
  const router = useRouter();
  const { projects } = useProjects();
  const { refreshSystemRoles } = useRoles();
  const [loading, setLoading] = useState(false);
  
  // Initialize form
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
    },
  });

  // Handle form submission
  async function onSubmit(values: RoleFormValues) {
    console.log("Form submitted with values:", values);
    try {
      setLoading(true);
      
      // Create the role
      await rolesService.createSystemRole({
        name: values.name,
        description: values.description,
        permissions: values.permissions || [],
      });

      toast.success("Role created successfully");
      
      try {
        // Rolleri yenile ve sonrasında sayfaya yönlendir
        await refreshSystemRoles();
      } catch (error) {
        console.error("Error refreshing roles:", error);
        // Hata olursa bile sayfaya yönlendir
      }
      
      // Rol oluşturma başarılı ise sayfaya yönlendir
      router.push("/roles");
    } catch (error) {
      console.error("Error creating role:", error);
      toast.error("Failed to create role");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Create New Role</h1>
              <p className="text-muted-foreground">
                Define a new role and assign permissions
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main form */}
            <div className="lg:col-span-2 space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Project Manager, Developer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Describe the role's responsibilities" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                          Creating...
                        </>
                      ) : (
                        "Create Role"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>

            {/* Permissions panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <div className="rounded-lg border bg-card p-4">
                  <h2 className="font-semibold mb-4">Permissions</h2>
                  <ScrollArea className="h-[calc(100vh-300px)]">
                    <div className="space-y-4">
                      {PERMISSIONS.map((permission) => (
                        <div key={permission.id} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={permission.id}
                              checked={form.watch("permissions")?.includes(permission.id) ?? false}
                              onCheckedChange={(checked) => {
                                const currentPermissions = form.getValues("permissions") ?? [];
                                if (checked) {
                                  form.setValue("permissions", [...currentPermissions, permission.id]);
                                } else {
                                  form.setValue(
                                    "permissions",
                                    currentPermissions.filter((p) => p !== permission.id)
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={permission.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {permission.label}
                            </label>
                          </div>
                          <p className="text-sm text-muted-foreground ml-6">
                            {permission.description}
                          </p>
                          <div className="ml-6 space-y-1">
                            {permission.subPermissions.map((subPermission) => (
                              <div key={subPermission.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={subPermission.id}
                                  checked={form.watch("permissions")?.includes(subPermission.id) ?? false}
                                  onCheckedChange={(checked) => {
                                    const currentPermissions = form.getValues("permissions") ?? [];
                                    if (checked) {
                                      form.setValue("permissions", [...currentPermissions, subPermission.id]);
                                    } else {
                                      form.setValue(
                                        "permissions",
                                        currentPermissions.filter((p) => p !== subPermission.id)
                                      );
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={subPermission.id}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {subPermission.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 