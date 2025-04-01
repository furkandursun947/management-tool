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
import { rolesService, SystemRole } from "@/services/roles-service";
import { useRoles } from "@/contexts/roles-context";
import { useFirebase } from "@/contexts/firebase-context";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().min(1, "Description is required"),
  permissions: z.array(z.string()).min(1, "At least one permission is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface ManageSystemRolesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageSystemRolesModal({
  open,
  onOpenChange,
}: ManageSystemRolesModalProps) {
  const { systemRoles, refreshSystemRoles } = useRoles();
  const { user } = useFirebase();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      if (!user) {
        toast.error("You must be logged in to create roles");
        return;
      }
      
      setLoading(true);
      await rolesService.createSystemRole(user.uid, values);
      await refreshSystemRoles();
      form.reset();
      toast.success("System role created successfully");
    } catch (error) {
      console.error("Error creating system role:", error);
      toast.error("Failed to create system role");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteRole(roleId: string) {
    try {
      if (!user) {
        toast.error("You must be logged in to delete roles");
        return;
      }
      
      setLoading(true);
      await rolesService.deleteSystemRole(user.uid, roleId);
      await refreshSystemRoles();
      toast.success("System role deleted successfully");
    } catch (error) {
      console.error("Error deleting system role:", error);
      toast.error("Failed to delete system role");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage System Roles</DialogTitle>
          <DialogDescription>
            Create and manage system-wide roles. These roles control access to the entire application.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing System Roles */}
          <div>
            <h3 className="text-sm font-medium mb-2">Current System Roles</h3>
            <div className="space-y-2">
              {systemRoles.map((role) => (
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
              {systemRoles.length === 0 && (
                <p className="text-sm text-muted-foreground">No system roles created yet.</p>
              )}
            </div>
          </div>

          {/* Create New System Role Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Administrator, Manager" {...field} />
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
                name="permissions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permissions</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {[
                          "MANAGE_USERS",
                          "MANAGE_PROJECTS",
                          "MANAGE_ROLES",
                          "VIEW_ANALYTICS",
                          "MANAGE_SETTINGS",
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
                  <Plus className="mr-2 h-4 w-4" />
                  Create System Role
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 