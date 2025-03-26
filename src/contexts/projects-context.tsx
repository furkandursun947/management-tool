import { createContext, useContext, useEffect, useState } from 'react';
import { projectService, Project } from '@/services/project-service';
import { useAuth } from '@/contexts/firebase-context';
import { toast } from 'sonner';

interface ProjectsContextType {
  projects: Project[];
  loading: boolean;
  error: Error | null;
  refreshProjects: () => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
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
      setLoading(true);
      setError(null);
      const fetchedProjects = await projectService.getProjects();
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

  const addProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await projectService.addProject(project);
      await refreshProjects();
      toast.success('Project added successfully');
    } catch (err) {
      toast.error('Failed to add project');
      throw err;
    }
  };

  const updateProject = async (id: string, project: Partial<Project>) => {
    try {
      await projectService.updateProject(id, project);
      await refreshProjects();
      toast.success('Project updated successfully');
    } catch (err) {
      toast.error('Failed to update project');
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await projectService.deleteProject(id);
      await refreshProjects();
      toast.success('Project deleted successfully');
    } catch (err) {
      toast.error('Failed to delete project');
      throw err;
    }
  };

  const addTask = async (projectId: string, task: Omit<Project['tasks'][0], 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await projectService.addTask(projectId, task);
      await refreshProjects();
      toast.success('Task added successfully');
    } catch (err) {
      toast.error('Failed to add task');
      throw err;
    }
  };

  const updateTask = async (projectId: string, taskId: string, task: Partial<Project['tasks'][0]>) => {
    try {
      await projectService.updateTask(projectId, taskId, task);
      await refreshProjects();
      toast.success('Task updated successfully');
    } catch (err) {
      toast.error('Failed to update task');
      throw err;
    }
  };

  const deleteTask = async (projectId: string, taskId: string) => {
    try {
      await projectService.deleteTask(projectId, taskId);
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