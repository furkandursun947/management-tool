import { usePermissions } from "@/hooks/use-permissions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface WithPermissionsProps {
  permissions: string[];
  requireAll?: boolean;
  children: React.ReactNode;
}

export function WithPermissions({
  permissions,
  requireAll = false,
  children,
}: WithPermissionsProps) {
  const { hasAnyPermission, hasAllPermissions } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!hasAccess) {
      router.push("/unauthorized");
    }
  }, [permissions, requireAll, router, hasAnyPermission, hasAllPermissions]);

  return <>{children}</>;
}

interface WithProjectPermissionsProps {
  projectId: string;
  permissions: string[];
  requireAll?: boolean;
  children: React.ReactNode;
}

export function WithProjectPermissions({
  projectId,
  permissions,
  requireAll = false,
  children,
}: WithProjectPermissionsProps) {
  const { hasAnyProjectPermission, hasAllProjectPermissions } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    const hasAccess = requireAll
      ? hasAllProjectPermissions(projectId, permissions)
      : hasAnyProjectPermission(projectId, permissions);

    if (!hasAccess) {
      router.push("/unauthorized");
    }
  }, [projectId, permissions, requireAll, router, hasAnyProjectPermission, hasAllProjectPermissions]);

  return <>{children}</>;
} 