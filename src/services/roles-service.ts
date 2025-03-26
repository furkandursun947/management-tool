import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, deleteDoc } from "firebase/firestore";

export interface SystemRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectRole {
  id: string;
  projectId: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

class RolesService {
  private readonly systemRolesCollection = "system_roles";
  private readonly projectRolesCollection = "project_roles";

  // System Roles
  async getSystemRoles(): Promise<SystemRole[]> {
    const rolesRef = collection(db, this.systemRolesCollection);
    const rolesSnapshot = await getDocs(rolesRef);
    return rolesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as SystemRole[];
  }

  async getSystemRole(id: string): Promise<SystemRole | null> {
    const roleRef = doc(db, this.systemRolesCollection, id);
    const roleDoc = await getDoc(roleRef);
    if (!roleDoc.exists()) return null;
    
    return {
      id: roleDoc.id,
      ...roleDoc.data(),
      createdAt: roleDoc.data().createdAt?.toDate(),
      updatedAt: roleDoc.data().updatedAt?.toDate()
    } as SystemRole;
  }

  async createSystemRole(role: Omit<SystemRole, "id" | "createdAt" | "updatedAt">): Promise<SystemRole> {
    const rolesRef = collection(db, this.systemRolesCollection);
    const now = new Date();
    const newRole = {
      ...role,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await addDoc(rolesRef, newRole);
    return {
      id: docRef.id,
      ...newRole
    };
  }

  async updateSystemRole(id: string, role: Partial<Omit<SystemRole, "id" | "createdAt" | "updatedAt">>): Promise<void> {
    const roleRef = doc(db, this.systemRolesCollection, id);
    await updateDoc(roleRef, {
      ...role,
      updatedAt: new Date()
    });
  }

  async deleteSystemRole(id: string): Promise<void> {
    const roleRef = doc(db, this.systemRolesCollection, id);
    await deleteDoc(roleRef);
  }

  // Project Roles
  async getProjectRoles(projectId: string): Promise<ProjectRole[]> {
    const rolesRef = collection(db, this.projectRolesCollection);
    const q = query(rolesRef, where("projectId", "==", projectId));
    const rolesSnapshot = await getDocs(q);
    return rolesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as ProjectRole[];
  }

  async getProjectRole(projectId: string, roleId: string): Promise<ProjectRole | null> {
    const roleRef = doc(db, this.projectRolesCollection, roleId);
    const roleDoc = await getDoc(roleRef);
    if (!roleDoc.exists() || roleDoc.data().projectId !== projectId) return null;
    
    return {
      id: roleDoc.id,
      ...roleDoc.data(),
      createdAt: roleDoc.data().createdAt?.toDate(),
      updatedAt: roleDoc.data().updatedAt?.toDate()
    } as ProjectRole;
  }

  async createProjectRole(projectId: string, role: Omit<ProjectRole, "id" | "projectId" | "createdAt" | "updatedAt">): Promise<ProjectRole> {
    const rolesRef = collection(db, this.projectRolesCollection);
    const now = new Date();
    const newRole = {
      ...role,
      projectId,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await addDoc(rolesRef, newRole);
    return {
      id: docRef.id,
      projectId,
      ...newRole
    };
  }

  async updateProjectRole(projectId: string, roleId: string, role: Partial<Omit<ProjectRole, "id" | "projectId" | "createdAt" | "updatedAt">>): Promise<void> {
    const roleRef = doc(db, this.projectRolesCollection, roleId);
    const roleDoc = await getDoc(roleRef);
    if (!roleDoc.exists() || roleDoc.data().projectId !== projectId) {
      throw new Error("Project role not found");
    }

    await updateDoc(roleRef, {
      ...role,
      updatedAt: new Date()
    });
  }

  async deleteProjectRole(projectId: string, roleId: string): Promise<void> {
    const roleRef = doc(db, this.projectRolesCollection, roleId);
    const roleDoc = await getDoc(roleRef);
    if (!roleDoc.exists() || roleDoc.data().projectId !== projectId) {
      throw new Error("Project role not found");
    }

    await deleteDoc(roleRef);
  }
}

export const rolesService = new RolesService(); 