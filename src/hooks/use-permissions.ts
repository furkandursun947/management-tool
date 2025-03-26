import { useRoles } from "@/contexts/roles-context";
import { useAuth } from "@/contexts/auth-context";

interface Project {
  id: string;
  role: {
    id: string;
    name: string;
    permissions: string[];
  };
}

export function usePermissions() {
  const { systemRoles } = useRoles();
  const { user } = useAuth();

  const hasPermission = (permission: string) => {
    if (!user) return false;

    // Check if user has any system roles with the required permission
    const userSystemRoles = systemRoles.filter((role) =>
      user.systemRoleIds.includes(role.id)
    );

    return userSystemRoles.some((role) => role.permissions.includes(permission));
  };

  const hasProjectPermission = (projectId: string, permission: string) => {
    if (!user) return false;

    // Get the user's project role
    const project = user.projects?.find((p: Project) => p.id === projectId);
    if (!project) return false;

    // Check if the project role has the required permission
    const projectRole = project.role;
    return projectRole?.permissions.includes(permission) || false;
  };

  const hasAnyPermission = (permissions: string[]) => {
    return permissions.some((permission) => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: string[]) => {
    return permissions.every((permission) => hasPermission(permission));
  };

  const hasAnyProjectPermission = (projectId: string, permissions: string[]) => {
    return permissions.some((permission) =>
      hasProjectPermission(projectId, permission)
    );
  };

  const hasAllProjectPermissions = (projectId: string, permissions: string[]) => {
    return permissions.every((permission) =>
      hasProjectPermission(projectId, permission)
    );
  };

  return {
    hasPermission,
    hasProjectPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasAnyProjectPermission,
    hasAllProjectPermissions,
  };
} 