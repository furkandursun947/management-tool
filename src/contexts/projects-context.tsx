import { createContext, useContext, useEffect, useState } from 'react';
import { projectService, Project } from '@/services/project-service';
import { useAuth } from '@/contexts/firebase-context';
import { toast } from 'sonner';

interface ProjectsContextType {
  projects: Project[];
  loading: boolean;
  error: Error | null;
  refreshProjects: () => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'teamMembers' | 'tasks' | 'roles' | 'createdBy'>) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addTask: (projectId: string, task: Omit<Project['tasks'][0], 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (projectId: string, taskId: string, task: Partial<Project['tasks'][0]>) => Promise<void>;
  deleteTask: (projectId: string, taskId: string) => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const refreshProjects = async () => {
    try {
      if (!user) {
        setProjects([]);
        return;
      }
      
      setLoading(true);
      setError(null);
      const fetchedProjects = await projectService.getProjects(user.uid);
      setProjects(fetchedProjects);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch projects'));
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshProjects();
    }
  }, [user]);

  const addProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'teamMembers' | 'tasks' | 'roles' | 'createdBy'>) => {
    try {
      if (!user) {
        toast.error('You must be logged in to add a project');
        throw new Error('User not authenticated');
      }
      
      // Kullanıcı bilgilerini al
      const userId = user.uid;
      const userName = user.displayName || 'Anonymous';
      const userEmail = user.email || '';
      
      await projectService.addProject(project, userId, userName, userEmail);
      await refreshProjects();
      toast.success('Project added successfully');
    } catch (err) {
      toast.error('Failed to add project');
      throw err;
    }
  };

  const updateProject = async (id: string, project: Partial<Project>) => {
    try {
      if (!user) {
        toast.error('You must be logged in to update a project');
        throw new Error('User not authenticated');
      }
      
      await projectService.updateProject(user.uid, id, project);
      await refreshProjects();
      toast.success('Project updated successfully');
    } catch (err) {
      toast.error('Failed to update project');
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      if (!user) {
        toast.error('You must be logged in to delete a project');
        throw new Error('User not authenticated');
      }
      
      await projectService.deleteProject(user.uid, id);
      await refreshProjects();
      toast.success('Project deleted successfully');
    } catch (err) {
      toast.error('Failed to delete project');
      throw err;
    }
  };

  const addTask = async (projectId: string, task: Omit<Project['tasks'][0], 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (!user) {
        toast.error('You must be logged in to add a task');
        throw new Error('User not authenticated');
      }
      
      await projectService.addTask(user.uid, projectId, task);
      await refreshProjects();
      toast.success('Task added successfully');
    } catch (err) {
      toast.error('Failed to add task');
      throw err;
    }
  };

  // Update Task ve Delete Task fonksiyonlarını proje servisinden kaldırdık, 
  // ancak burada ara yüz tutarlılığı için bunları koruyalım
  const updateTask = async (projectId: string, taskId: string, task: Partial<Project['tasks'][0]>) => {
    try {
      if (!user) {
        toast.error('You must be logged in to update a task');
        throw new Error('User not authenticated');
      }
      
      await projectService.updateTask(user.uid, projectId, taskId, task);
      await refreshProjects();
      toast.success('Task updated successfully');
    } catch (err) {
      toast.error('Failed to update task');
      throw err;
    }
  };

  const deleteTask = async (projectId: string, taskId: string) => {
    try {
      if (!user) {
        toast.error('You must be logged in to delete a task');
        throw new Error('User not authenticated');
      }
      
      await projectService.deleteTask(user.uid, projectId, taskId);
      await refreshProjects();
      toast.success('Task deleted successfully');
    } catch (err) {
      toast.error('Failed to delete task');
      throw err;
    }
  };

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        loading,
        error,
        refreshProjects,
        addProject,
        updateProject,
        deleteProject,
        addTask,
        updateTask,
        deleteTask,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
} 