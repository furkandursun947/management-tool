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
import { userService } from './user-service';

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
  createdBy: string;
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
  // Get all projects for a user
  async getProjects(userId?: string): Promise<Project[]> {
    try {
      if (!userId) {
        return [];
      }
      
      // Kullanıcının kendi projeleri
      const userProjectsRef = collection(db, `users/${userId}/projects`);
      const userProjectsQuery = query(userProjectsRef, orderBy('createdAt', 'desc'));
      const userProjectsSnapshot = await getDocs(userProjectsQuery);
      
      const projects = userProjectsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
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
        };
      });
      
      return projects as Project[];
    } catch (error) {
      console.error('Error getting projects:', error);
      throw error;
    }
  },

  // Get a single project by ID
  async getProject(userId: string, projectId: string): Promise<Project | null> {
    try {
      const projectRef = doc(db, `users/${userId}/projects`, projectId);
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
  async addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'teamMembers' | 'tasks' | 'roles' | 'createdBy'>, userId: string, userName: string, userEmail: string): Promise<Project> {
    try {
      const userProjectsRef = collection(db, `users/${userId}/projects`);
      const now = new Date();
      
      // Projenin varsayılan "Owner" rolünü oluştur
      const ownerRole = {
        id: crypto.randomUUID(),
        projectId: "", // Bu değer döküman oluşturulduğunda atanacak
        name: "Owner",
        description: "Project owner with full control",
        permissions: ["manage_project", "manage_members", "manage_tasks"],
        createdAt: now,
        updatedAt: now
      };
      
      // Varsayılan rolü oluştur (hiçbir izne sahip değil)
      const defaultRole = {
        id: crypto.randomUUID(),
        projectId: "", // Bu değer döküman oluşturulduğunda atanacak
        name: "Default",
        description: "Default role with no permissions",
        permissions: [],
        createdAt: now,
        updatedAt: now
      };
      
      // Kullanıcıyı takım üyesi olarak ekle
      const ownerMember = {
        id: userId,
        name: userName,
        email: userEmail,
        roleId: ownerRole.id,
        systemRoleIds: [],
        joinedAt: now
      };
      
      const docRef = await addDoc(userProjectsRef, {
        ...project,
        createdBy: userId,
        teamMembers: [ownerMember],
        tasks: [],
        roles: [ownerRole, defaultRole],
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        startDate: project.startDate ? Timestamp.fromDate(project.startDate) : null,
        dueDate: project.dueDate ? Timestamp.fromDate(project.dueDate) : null,
      });
      
      // Projenin ID'sini role atayalım
      const completeOwnerRole = {...ownerRole, projectId: docRef.id};
      const completeDefaultRole = {...defaultRole, projectId: docRef.id};
      
      // Rol güncelleme (projectId eklemek için)
      await updateDoc(docRef, {
        roles: [completeOwnerRole, completeDefaultRole]
      });

      return {
        id: docRef.id,
        ...project,
        createdBy: userId,
        teamMembers: [ownerMember],
        tasks: [],
        roles: [completeOwnerRole, completeDefaultRole],
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  },

  // Update a project
  async updateProject(userId: string, projectId: string, project: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'teamMembers' | 'tasks' | 'roles'>>): Promise<void> {
    try {
      const projectRef = doc(db, `users/${userId}/projects`, projectId);
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
  async deleteProject(userId: string, projectId: string): Promise<void> {
    try {
      const projectRef = doc(db, `users/${userId}/projects`, projectId);
      await deleteDoc(projectRef);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  // Add a task to a project
  async addTask(userId: string, projectId: string, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const projectRef = doc(db, `users/${userId}/projects`, projectId);
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
  async updateTask(userId: string, projectId: string, taskId: string, taskUpdates: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const projectRef = doc(db, `users/${userId}/projects`, projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }
      
      const projectData = projectDoc.data();
      const tasks = projectData.tasks || [];
      
      // Find the task to update
      const taskIndex = tasks.findIndex((t: Task) => t.id === taskId);
      
      if (taskIndex === -1) {
        throw new Error('Task not found');
      }
      
      // Create updated task with current timestamp
      const now = new Date();
      const updatedTask = {
        ...tasks[taskIndex],
        ...taskUpdates,
        updatedAt: Timestamp.fromDate(now)
      };
      
      // Replace the task in the array
      tasks[taskIndex] = updatedTask;
      
      // Update the document with the modified tasks array
      await updateDoc(projectRef, { tasks });
      
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },
  
  // Delete a task from a project
  async deleteTask(userId: string, projectId: string, taskId: string): Promise<void> {
    try {
      const projectRef = doc(db, `users/${userId}/projects`, projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }
      
      const projectData = projectDoc.data();
      const tasks = projectData.tasks || [];
      
      // Filter out the task to delete
      const updatedTasks = tasks.filter((t: Task) => t.id !== taskId);
      
      // Update the document with the filtered tasks array
      await updateDoc(projectRef, { tasks: updatedTasks });
      
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  // Check if project code exists
  async checkProjectCodeExists(userId: string, code: string): Promise<boolean> {
    try {
      const projectsRef = collection(db, `users/${userId}/projects`);
      const q = query(projectsRef, where('code', '==', code));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking project code:', error);
      throw error;
    }
  },

  // Check if project name exists
  async checkProjectNameExists(userId: string, name: string): Promise<boolean> {
    try {
      const projectsRef = collection(db, `users/${userId}/projects`);
      const q = query(projectsRef, where('name', '==', name));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking project name:', error);
      throw error;
    }
  },

  // Add a team member to a project
  async addTeamMember(userId: string, projectId: string, member: Omit<TeamMember, 'id' | 'joinedAt'>): Promise<void> {
    try {
      const projectRef = doc(db, `users/${userId}/projects`, projectId);
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
  async removeTeamMember(userId: string, projectId: string, memberId: string): Promise<void> {
    try {
      const projectRef = doc(db, `users/${userId}/projects`, projectId);
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