import { 
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ProjectRole } from "./roles-service";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: Date;
  assigneeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  category: string;
  startDate: Date | null;
  dueDate: Date | null;
  teamMembers: TeamMember[];
  tasks: Task[];
  roles: ProjectRole[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  roleId: string; // Reference to project role
  systemRoleIds: string[]; // References to system roles
  joinedAt: Date;
}

export const projectService = {
  // Get all projects
  async getProjects(): Promise<Project[]> {
    try {
      const projectsRef = collection(db, 'projects');
      const q = query(projectsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        startDate: doc.data().startDate?.toDate() || null,
        dueDate: doc.data().dueDate?.toDate() || null,
        teamMembers: doc.data().teamMembers?.map((member: any) => ({
          ...member,
          joinedAt: member.joinedAt?.toDate()
        })) || [],
        tasks: doc.data().tasks?.map((task: any) => ({
          ...task,
          createdAt: task.createdAt?.toDate(),
          updatedAt: task.updatedAt?.toDate(),
          dueDate: task.dueDate?.toDate(),
        })) || [],
      })) as Project[];
    } catch (error) {
      console.error('Error getting projects:', error);
      throw error;
    }
  },

  // Get a single project by ID
  async getProject(id: string): Promise<Project | null> {
    try {
      const projectRef = doc(db, 'projects', id);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        return null;
      }

      const data = projectDoc.data();
      return {
        id: projectDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        startDate: data.startDate?.toDate() || null,
        dueDate: data.dueDate?.toDate() || null,
        teamMembers: data.teamMembers?.map((member: any) => ({
          ...member,
          joinedAt: member.joinedAt?.toDate()
        })) || [],
        tasks: data.tasks?.map((task: any) => ({
          ...task,
          createdAt: task.createdAt?.toDate(),
          updatedAt: task.updatedAt?.toDate(),
          dueDate: task.dueDate?.toDate(),
        })) || [],
      } as Project;
    } catch (error) {
      console.error('Error getting project:', error);
      throw error;
    }
  },

  // Add a new project
  async addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'teamMembers' | 'tasks' | 'roles'>): Promise<Project> {
    try {
      const projectsRef = collection(db, 'projects');
      const now = new Date();
      
      const docRef = await addDoc(projectsRef, {
        ...project,
        teamMembers: [],
        tasks: [],
        roles: [],
        createdAt: now,
        updatedAt: now,
        startDate: project.startDate ? Timestamp.fromDate(project.startDate) : null,
        dueDate: project.dueDate ? Timestamp.fromDate(project.dueDate) : null,
      });

      return {
        id: docRef.id,
        ...project,
        teamMembers: [],
        tasks: [],
        roles: [],
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  },

  // Update a project
  async updateProject(id: string, project: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'teamMembers' | 'tasks' | 'roles'>>): Promise<void> {
    try {
      const projectRef = doc(db, 'projects', id);
      const now = new Date();
      
      await updateDoc(projectRef, {
        ...project,
        startDate: project.startDate ? Timestamp.fromDate(project.startDate) : undefined,
        dueDate: project.dueDate ? Timestamp.fromDate(project.dueDate) : undefined,
        updatedAt: Timestamp.fromDate(now)
      });
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  // Delete a project
  async deleteProject(id: string): Promise<void> {
    try {
      const projectRef = doc(db, 'projects', id);
      await deleteDoc(projectRef);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  // Add a task to a project
  async addTask(projectId: string, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const now = new Date();
      
      await updateDoc(projectRef, {
        tasks: arrayUnion({
          ...task,
          id: crypto.randomUUID(),
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now)
        })
      });
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  },

  // Update a task in a project
  async updateTask(projectId: string, taskId: string, task: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const tasks = projectDoc.data().tasks || [];
      const updatedTasks = tasks.map((t: Task) => {
        if (t.id === taskId) {
          return {
            ...t,
            ...task,
            dueDate: task.dueDate ? Timestamp.fromDate(task.dueDate) : t.dueDate,
            updatedAt: Timestamp.fromDate(new Date())
          };
        }
        return t;
      });

      await updateDoc(projectRef, {
        tasks: updatedTasks
      });
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  // Delete a task from a project
  async deleteTask(projectId: string, taskId: string): Promise<void> {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const tasks = projectDoc.data().tasks || [];
      const updatedTasks = tasks.filter((t: Task) => t.id !== taskId);

      await updateDoc(projectRef, {
        tasks: updatedTasks
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  // Check if project code exists
  async checkProjectCodeExists(code: string): Promise<boolean> {
    try {
      const projectsRef = collection(db, 'projects');
      const q = query(projectsRef, where('code', '==', code));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking project code:', error);
      throw error;
    }
  },

  // Check if project name exists
  async checkProjectNameExists(name: string): Promise<boolean> {
    try {
      const projectsRef = collection(db, 'projects');
      const q = query(projectsRef, where('name', '==', name));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking project name:', error);
      throw error;
    }
  },

  // Add a team member to a project
  async addTeamMember(projectId: string, member: Omit<TeamMember, 'id' | 'joinedAt'>): Promise<void> {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const now = new Date();
      
      await updateDoc(projectRef, {
        teamMembers: arrayUnion({
          ...member,
          id: crypto.randomUUID(),
          joinedAt: Timestamp.fromDate(now)
        })
      });
    } catch (error) {
      console.error('Error adding team member:', error);
      throw error;
    }
  },

  // Remove a team member from a project
  async removeTeamMember(projectId: string, memberId: string): Promise<void> {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const teamMembers = projectDoc.data().teamMembers || [];
      const updatedMembers = teamMembers.filter((member: TeamMember) => member.id !== memberId);

      await updateDoc(projectRef, {
        teamMembers: updatedMembers
      });
    } catch (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
  },
}; 