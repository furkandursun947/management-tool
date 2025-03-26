import { 
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const teamService = {
  // Get all team members
  async getTeamMembers(): Promise<TeamMember[]> {
    try {
      const teamRef = collection(db, 'team');
      const q = query(teamRef, orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as TeamMember[];
    } catch (error) {
      console.error('Error getting team members:', error);
      throw error;
    }
  },

  // Add a new team member
  async addTeamMember(member: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<TeamMember> {
    try {
      const teamRef = collection(db, 'team');
      const now = new Date();
      
      const docRef = await addDoc(teamRef, {
        ...member,
        createdAt: now,
        updatedAt: now,
      });

      return {
        id: docRef.id,
        ...member,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error('Error adding team member:', error);
      throw error;
    }
  },

  // Update a team member
  async updateTeamMember(id: string, member: Partial<TeamMember>): Promise<void> {
    try {
      const teamRef = collection(db, 'team');
      const memberRef = doc(teamRef, id);
      
      await updateDoc(memberRef, {
        ...member,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating team member:', error);
      throw error;
    }
  },

  // Delete a team member
  async deleteTeamMember(id: string): Promise<void> {
    try {
      const teamRef = collection(db, 'team');
      const memberRef = doc(teamRef, id);
      
      await deleteDoc(memberRef);
    } catch (error) {
      console.error('Error deleting team member:', error);
      throw error;
    }
  },

  // Get unique roles
  async getUniqueRoles(): Promise<string[]> {
    try {
      const teamRef = collection(db, 'team');
      const querySnapshot = await getDocs(teamRef);
      
      const roles = new Set<string>();
      querySnapshot.docs.forEach(doc => {
        roles.add(doc.data().role);
      });
      
      return Array.from(roles).sort();
    } catch (error) {
      console.error('Error getting unique roles:', error);
      throw error;
    }
  }
}; 