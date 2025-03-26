import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { rolesService, SystemRole, ProjectRole } from "@/services/roles-service";

interface RolesContextType {
  systemRoles: SystemRole[];
  projectRoles: Record<string, ProjectRole[]>;
  loading: boolean;
  error: Error | null;
  refreshSystemRoles: () => Promise<void>;
  refreshProjectRoles: (projectId: string) => Promise<void>;
}

const RolesContext = createContext<RolesContextType | undefined>(undefined);

export function RolesProvider({ children }: { children: ReactNode }) {
  const [systemRoles, setSystemRoles] = useState<SystemRole[]>([]);
  const [projectRoles, setProjectRoles] = useState<Record<string, ProjectRole[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshSystemRoles = async () => {
    try {
      setLoading(true);
      const roles = await rolesService.getSystemRoles();
      setSystemRoles(roles);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch system roles"));
    } finally {
      setLoading(false);
    }
  };

  const refreshProjectRoles = async (projectId: string) => {
    try {
      setLoading(true);
      const roles = await rolesService.getProjectRoles(projectId);
      setProjectRoles(prev => ({
        ...prev,
        [projectId]: roles
      }));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch project roles"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSystemRoles();
  }, []);

  return (
    <RolesContext.Provider
      value={{
        systemRoles,
        projectRoles,
        loading,
        error,
        refreshSystemRoles,
        refreshProjectRoles,
      }}
    >
      {children}
    </RolesContext.Provider>
  );
}

export function useRoles() {
  const context = useContext(RolesContext);
  if (context === undefined) {
    throw new Error("useRoles must be used within a RolesProvider");
  }
  return context;
} 