import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";

export interface User {
  id: string;
  name: string;
  email: string;
  userCode: string;
  systemRoleIds: string[];
  projects?: Array<{
    id: string;
    role: {
      id: string;
      name: string;
      permissions: string[];
    };
  }>;
  createdAt: Date;
  updatedAt: Date;
}

class UserService {
  private collection = collection(db, "users");

  async getUser(id: string): Promise<User> {
    const docRef = doc(this.collection, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("User not found");
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      email: data.email,
      userCode: data.userCode || "",
      systemRoleIds: data.systemRoleIds || [],
      projects: data.projects || [],
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    };
  }

  async getUsers(): Promise<User[]> {
    const querySnapshot = await getDocs(this.collection);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        email: data.email,
        userCode: data.userCode || "",
        systemRoleIds: data.systemRoleIds || [],
        projects: data.projects || [],
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };
    });
  }

  async createUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const docRef = await addDoc(this.collection, {
      ...userData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return this.getUser(docRef.id);
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const docRef = doc(this.collection, id);
    await updateDoc(docRef, {
      ...userData,
      updatedAt: Timestamp.now(),
    });

    return this.getUser(id);
  }

  async deleteUser(id: string): Promise<void> {
    const docRef = doc(this.collection, id);
    await deleteDoc(docRef);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const q = query(this.collection, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      email: data.email,
      userCode: data.userCode || "",
      systemRoleIds: data.systemRoleIds || [],
      projects: data.projects || [],
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    };
  }

  async getUserByCode(userCode: string): Promise<User | null> {
    const q = query(this.collection, where("userCode", "==", userCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      email: data.email,
      userCode: data.userCode,
      systemRoleIds: data.systemRoleIds || [],
      projects: data.projects || [],
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    };
  }

  async addProjectToUser(userId: string, projectId: string, roleId: string): Promise<void> {
    const user = await this.getUser(userId);
    const project = {
      id: projectId,
      role: {
        id: roleId,
        name: "Project Role", // This should be fetched from roles service
        permissions: [], // This should be fetched from roles service
      },
    };

    const projects = [...(user.projects || []), project];
    await this.updateUser(userId, { projects });
  }

  async removeProjectFromUser(userId: string, projectId: string): Promise<void> {
    const user = await this.getUser(userId);
    const projects = (user.projects || []).filter((p) => p.id !== projectId);
    await this.updateUser(userId, { projects });
  }

  async updateUserSystemRoles(userId: string, systemRoleIds: string[]): Promise<void> {
    await this.updateUser(userId, { systemRoleIds });
  }
}

export const userService = new UserService(); 