import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";

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
  private readonly usersCollection = "users";
  private readonly systemRolesSubcollection = "system_roles";
  private readonly projectRolesSubcollection = "project_roles";

  // Kullanıcıya özgü system_roles koleksiyonuna referans oluşturur
  private getUserSystemRolesRef(userId: string) {
    return collection(db, this.usersCollection, userId, this.systemRolesSubcollection);
  }

  // Kullanıcıya özgü project_roles koleksiyonuna referans oluşturur
  private getUserProjectRolesRef(userId: string) {
    return collection(db, this.usersCollection, userId, this.projectRolesSubcollection);
  }

  // Create default system role if it doesn't exist
  async createDefaultSystemRole(userId: string): Promise<string> {
    try {
      // Check if default role already exists for this user
      const rolesRef = this.getUserSystemRolesRef(userId);
      const q = query(rolesRef, where("name", "==", "Default"));
      const querySnapshot = await getDocs(q);
      
      // If default role exists, return its ID
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
      }
      
      // Create the default role with no permissions
      const defaultRole = {
        name: "Default",
        description: "Default role with no permissions",
        permissions: [],
      };
      
      const role = await this.createSystemRole(userId, defaultRole);
      return role.id;
    } catch (error) {
      console.error("Error creating default role:", error);
      throw error;
    }
  }

  // System Roles
  async getSystemRoles(userId: string): Promise<SystemRole[]> {
    const rolesRef = this.getUserSystemRolesRef(userId);
    const rolesSnapshot = await getDocs(rolesRef);
    return rolesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as SystemRole[];
  }

  async getSystemRole(userId: string, id: string): Promise<SystemRole | null> {
    const roleRef = doc(this.getUserSystemRolesRef(userId), id);
    const roleDoc = await getDoc(roleRef);
    if (!roleDoc.exists()) return null;
    
    return {
      id: roleDoc.id,
      ...roleDoc.data(),
      createdAt: roleDoc.data().createdAt?.toDate(),
      updatedAt: roleDoc.data().updatedAt?.toDate()
    } as SystemRole;
  }

  async createSystemRole(userId: string, role: Omit<SystemRole, "id" | "createdAt" | "updatedAt">): Promise<SystemRole> {
    const rolesRef = this.getUserSystemRolesRef(userId);
    const now = new Date();
    const newRole = {
      ...role,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(rolesRef, newRole);
    return {
      id: docRef.id,
      ...role,
      createdAt: now,
      updatedAt: now
    };
  }

  async updateSystemRole(userId: string, id: string, role: Partial<Omit<SystemRole, "id" | "createdAt" | "updatedAt">>): Promise<void> {
    const roleRef = doc(this.getUserSystemRolesRef(userId), id);
    await updateDoc(roleRef, {
      ...role,
      updatedAt: Timestamp.now()
    });
  }

  async deleteSystemRole(userId: string, id: string): Promise<void> {
    const roleRef = doc(this.getUserSystemRolesRef(userId), id);
    await deleteDoc(roleRef);
  }

  // Project Roles
  async getProjectRoles(userId: string, projectId: string): Promise<ProjectRole[]> {
    const rolesRef = this.getUserProjectRolesRef(userId);
    const q = query(rolesRef, where("projectId", "==", projectId));
    const rolesSnapshot = await getDocs(q);
    return rolesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as ProjectRole[];
  }

  async getProjectRole(userId: string, projectId: string, roleId: string): Promise<ProjectRole | null> {
    const roleRef = doc(this.getUserProjectRolesRef(userId), roleId);
    const roleDoc = await getDoc(roleRef);
    if (!roleDoc.exists() || roleDoc.data().projectId !== projectId) return null;
    
    return {
      id: roleDoc.id,
      ...roleDoc.data(),
      createdAt: roleDoc.data().createdAt?.toDate(),
      updatedAt: roleDoc.data().updatedAt?.toDate()
    } as ProjectRole;
  }

  async createProjectRole(userId: string, projectId: string, role: Omit<ProjectRole, "id" | "projectId" | "createdAt" | "updatedAt">): Promise<ProjectRole> {
    const rolesRef = this.getUserProjectRolesRef(userId);
    const now = new Date();
    const newRole = {
      ...role,
      projectId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(rolesRef, newRole);
    return {
      id: docRef.id,
      projectId,
      ...role,
      createdAt: now,
      updatedAt: now
    };
  }

  async updateProjectRole(userId: string, projectId: string, roleId: string, role: Partial<Omit<ProjectRole, "id" | "projectId" | "createdAt" | "updatedAt">>): Promise<void> {
    const roleRef = doc(this.getUserProjectRolesRef(userId), roleId);
    const roleDoc = await getDoc(roleRef);
    if (!roleDoc.exists() || roleDoc.data().projectId !== projectId) {
      throw new Error("Project role not found");
    }

    await updateDoc(roleRef, {
      ...role,
      updatedAt: Timestamp.now()
    });
  }

  async deleteProjectRole(userId: string, projectId: string, roleId: string): Promise<void> {
    const roleRef = doc(this.getUserProjectRolesRef(userId), roleId);
    const roleDoc = await getDoc(roleRef);
    if (!roleDoc.exists() || roleDoc.data().projectId !== projectId) {
      throw new Error("Project role not found");
    }

    await deleteDoc(roleRef);
  }
}

export const rolesService = new RolesService(); 