import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { rolesService, ProjectRole } from "@/services/roles-service";
import { useRoles } from "@/contexts/roles-context";
import { useProjects } from "@/contexts/projects-context";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { projectService } from "@/services/project-service";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/firebase-context";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, "Select at least one permission"),
  teamMemberId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ManageRolesModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageRolesModal({ projectId, open, onOpenChange }: ManageRolesModalProps) {
  const { projectRoles, refreshProjectRoles } = useRoles();
  const { projects } = useProjects();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const project = projects.find(p => p.id === projectId);
  const roles = projectRoles[projectId] || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
      teamMemberId: "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      if (!user) {
        toast.error("You must be logged in to perform this action");
        return;
      }
      
      setLoading(true);
      
      // Create the role
      const newRole = await rolesService.createProjectRole(user.uid, projectId, {
        name: values.name,
        description: values.description || "",
        permissions: values.permissions,
      });

      // Assign the role to the team member if one was selected
      if (project && values.teamMemberId) {
        const teamMember = project.teamMembers.find(member => member.id === values.teamMemberId);
        if (teamMember) {
          await projectService.addTeamMember(user.uid, projectId, {
            ...teamMember,
            roleId: newRole.id,
          });
        }
      }

      await refreshProjectRoles(projectId);
      form.reset();
      toast.success("Role created and assigned successfully");
      onOpenChange(false); // Close the modal after successful creation
    } catch (error) {
      console.error("Error creating role:", error);
      toast.error("Failed to create role");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteRole(roleId: string) {
    try {
      if (!user) {
        toast.error("You must be logged in to perform this action");
        return;
      }
      
      setLoading(true);
      await rolesService.deleteProjectRole(user.uid, projectId, roleId);
      await refreshProjectRoles(projectId);
      toast.success("Role deleted successfully");
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.error("Failed to delete role");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Project Roles</DialogTitle>
          <DialogDescription>
            Create and manage roles for this project. Each role can have specific permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Roles */}
          <div>
            <h3 className="text-sm font-medium mb-2">Current Roles</h3>
            <div className="space-y-2">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{role.name}</p>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {role.permissions.map((permission) => (
                        <Badge key={permission} variant="secondary">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteRole(role.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {roles.length === 0 && (
                <p className="text-sm text-muted-foreground">No roles created yet.</p>
              )}
            </div>
          </div>

          {/* Create New Role Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Developer, Designer" {...field} />
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
                      <Textarea
                        placeholder="Describe the responsibilities and permissions for this role"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="teamMemberId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Team Member</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a team member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {project?.teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permissions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permissions</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {[
                          "VIEW",
                          "EDIT",
                          "DELETE",
                          "MANAGE_TASKS",
                          "MANAGE_TEAM",
                          "MANAGE_ROLES",
                          "MANAGE_PROJECT",
                        ].map((permission) => (
                          <div key={permission} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={permission}
                              checked={field.value.includes(permission)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  field.onChange([...field.value, permission]);
                                } else {
                                  field.onChange(
                                    field.value.filter((p) => p !== permission)
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={permission}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {permission.replace(/_/g, " ")}
                            </label>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Role
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 