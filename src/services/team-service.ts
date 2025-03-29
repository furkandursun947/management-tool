import { 
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp
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

class TeamService {
  private readonly usersCollection = "users";
  private readonly teamSubcollection = "team";

  // Kullanıcıya özgü team koleksiyonuna referans oluşturur
  private getUserTeamRef(userId: string) {
    return collection(db, this.usersCollection, userId, this.teamSubcollection);
  }

  // Get all team members
  async getTeamMembers(userId: string): Promise<TeamMember[]> {
    try {
      const teamRef = this.getUserTeamRef(userId);
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
  }

  // Get a team member by ID
  async getTeamMember(userId: string, memberId: string): Promise<TeamMember | null> {
    try {
      const memberRef = doc(this.getUserTeamRef(userId), memberId);
      const memberSnap = await getDoc(memberRef);
      
      if (!memberSnap.exists()) {
        return null;
      }
      
      const data = memberSnap.data();
      return {
        id: memberSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as TeamMember;
    } catch (error) {
      console.error('Error getting team member:', error);
      throw error;
    }
  }

  // Add a new team member
  async addTeamMember(userId: string, member: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<TeamMember> {
    try {
      const teamRef = this.getUserTeamRef(userId);
      const now = new Date();
      
      const docRef = await addDoc(teamRef, {
        ...member,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
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
  }

  // Update a team member
  async updateTeamMember(userId: string, id: string, member: Partial<TeamMember>): Promise<void> {
    try {
      const memberRef = doc(this.getUserTeamRef(userId), id);
      
      await updateDoc(memberRef, {
        ...member,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating team member:', error);
      throw error;
    }
  }

  // Delete a team member
  async deleteTeamMember(userId: string, id: string): Promise<void> {
    try {
      const memberRef = doc(this.getUserTeamRef(userId), id);
      
      await deleteDoc(memberRef);
    } catch (error) {
      console.error('Error deleting team member:', error);
      throw error;
    }
  }

  // Get unique roles
  async getUniqueRoles(userId: string): Promise<string[]> {
    try {
      const teamRef = this.getUserTeamRef(userId);
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
}

export const teamService = new TeamService(); 