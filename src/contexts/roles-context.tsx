import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { rolesService, SystemRole, ProjectRole } from "@/services/roles-service";
import { useAuth } from "@/contexts/firebase-context";

interface RolesContextType {
  systemRoles: SystemRole[];
  projectRoles: Record<string, ProjectRole[]>;
  loading: boolean;
  error: Error | null;
  refreshSystemRoles: () => Promise<SystemRole[]>;
  refreshProjectRoles: (projectId: string) => Promise<ProjectRole[]>;
}

const RolesContext = createContext<RolesContextType | undefined>(undefined);

export function RolesProvider({ children }: { children: ReactNode }) {
  const [systemRoles, setSystemRoles] = useState<SystemRole[]>([]);
  const [projectRoles, setProjectRoles] = useState<Record<string, ProjectRole[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const defaultRoleCreatedRef = useRef(false);
  
  // Promise döndüren ve rolleri doğrudan döndüren refreshSystemRoles
  const refreshSystemRoles = async (): Promise<SystemRole[]> => {
    if (!user) {
      setSystemRoles([]);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const roles = await rolesService.getSystemRoles(user.uid);
      setSystemRoles(roles);
      return roles;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch system roles");
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshProjectRoles = async (projectId: string): Promise<ProjectRole[]> => {
    if (!user) {
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const roles = await rolesService.getProjectRoles(user.uid, projectId);
      setProjectRoles(prev => ({
        ...prev,
        [projectId]: roles
      }));
      return roles;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch project roles");
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcı giriş yaptığında, default role oluştur
  useEffect(() => {
    const createDefaultRoleIfNeeded = async () => {
      if (user && !defaultRoleCreatedRef.current) {
        try {
          await rolesService.createDefaultSystemRole(user.uid);
          defaultRoleCreatedRef.current = true;
        } catch (error) {
          console.error("Error ensuring default role:", error);
        }
      }
    };

    createDefaultRoleIfNeeded();
  }, [user]);

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