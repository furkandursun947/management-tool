import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { projectService } from "@/services/project-service";
import { useRoles } from "@/contexts/roles-context";
import { toast } from "sonner";
import { useAuth } from "@/contexts/firebase-context";
import { useProjects } from "@/contexts/projects-context";
import { userService } from "@/services/user-service";

const formSchema = z.object({
  userCode: z.string().min(1, "User code is required"),
  roleId: z.string().min(1, "Role is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface ManageTeamModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMembers: Array<{
    id: string;
    name: string;
    email: string;
    roleId: string;
    systemRoleIds: string[];
  }>;
}

export function ManageTeamModal({
  projectId,
  open,
  onOpenChange,
  teamMembers,
}: ManageTeamModalProps) {
  const { projectRoles, refreshProjectRoles } = useRoles();
  const { refreshProjects } = useProjects();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Modal açıldığında proje rollerini yükle
  useEffect(() => {
    if (open && projectId) {
      const loadRoles = async () => {
        try {
          setLoading(true);
          // Rolleri al
          const rolesList = await refreshProjectRoles(projectId);
          console.log("Loaded project roles:", rolesList); // Debug için
        } catch (error) {
          console.error("Error loading project roles:", error);
          toast.error("Failed to load project roles");
        } finally {
          setLoading(false);
        }
      };
      
      loadRoles();
    }
  }, [open, projectId, refreshProjectRoles]);

  // Erişilebilir rolleri memoize et
  const roles = projectRoles[projectId] || [];
  console.log("Current project roles:", roles); // Debug için

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userCode: "",
      roleId: "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      if (!user) {
        toast.error("You must be logged in to perform this action");
        return;
      }
      
      setLoading(true);
      
      // Get the selected user
      const userToAdd = await userService.getUserByCode(values.userCode);
      
      if (!userToAdd) {
        toast.error("User not found");
        setLoading(false);
        return;
      }
      
      // Get the selected role
      const selectedRole = roles.find(role => role.id === values.roleId);
      
      if (!selectedRole) {
        toast.error("Role not found");
        setLoading(false);
        return;
      }
      
      // Check if user is already a member
      const isAlreadyMember = teamMembers.some(member => member.id === userToAdd.id);
      
      if (isAlreadyMember) {
        toast.error("User is already a member of this project");
        setLoading(false);
        return;
      }
      
      // Add the team member - id özelliğini kaldırıyoruz çünkü addTeamMember fonksiyonu otomatik ID oluşturuyor
      await projectService.addTeamMember(user.uid, projectId, {
        name: userToAdd.name,
        email: userToAdd.email,
        roleId: values.roleId,
        systemRoleIds: userToAdd.systemRoleIds || [],
      });
      
      // Refresh the project and roles data
      await refreshProjects();
      await refreshProjectRoles(projectId);
      
      form.reset();
      toast.success("Team member added successfully");
      
      // Close the modal
      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error adding team member:", error);
      toast.error("Failed to add team member");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    try {
      if (!user) {
        toast.error("You must be logged in to perform this action");
        return;
      }
      
      setLoading(true);
      await projectService.removeTeamMember(user.uid, projectId, memberId);
      await refreshProjects();
      toast.success("Team member removed");
    } catch (error) {
      console.error("Error removing team member:", error);
      toast.error("Failed to remove team member");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Team Members</DialogTitle>
          <DialogDescription>
            Add and manage team members for this project. Each member can have a specific role.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Team Members */}
          <div>
            <h3 className="text-sm font-medium mb-2">Current Team Members</h3>
            <div className="space-y-2">
              {teamMembers.map((member) => {
                const role = roles.find((r) => r.id === member.roleId);
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      {role && (
                        <Badge variant="secondary" className="mt-1">
                          {role.name}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
              {teamMembers.length === 0 && (
                <p className="text-sm text-muted-foreground">No team members added yet.</p>
              )}
            </div>
          </div>

          {/* Add Team Member Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="userCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter user code" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Team Member
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 