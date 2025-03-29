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
  Timestamp,
  setDoc
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

export interface Team {
  id: string;
  name: string;
  description: string;
  ownerId: string; // Takımı oluşturan kullanıcı ID'si
  createdAt: Date;
  updatedAt: Date;
}

class TeamService {
  private readonly usersCollection = "users";
  private readonly teamSubcollection = "team";
  private readonly teamsSubcollection = "teams";

  // Kullanıcıya özgü team koleksiyonuna referans oluşturur
  private getUserTeamRef(userId: string) {
    return collection(db, this.usersCollection, userId, this.teamSubcollection);
  }
  
  // Kullanıcıya özgü teams koleksiyonuna referans oluşturur
  private getUserTeamsRef(userId: string) {
    return collection(db, this.usersCollection, userId, this.teamsSubcollection);
  }

  // Teams Collection - Yeni Fonksiyonlar
  
  // Get all teams for a user
  async getUserTeams(userId: string): Promise<Team[]> {
    try {
      const teamsRef = this.getUserTeamsRef(userId);
      const q = query(teamsRef, orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Team[];
    } catch (error) {
      console.error('Error getting teams:', error);
      throw error;
    }
  }
  
  // Create a new team
  async createTeam(userId: string, team: Omit<Team, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>): Promise<Team> {
    try {
      const teamsRef = this.getUserTeamsRef(userId);
      const now = new Date();
      
      const docRef = await addDoc(teamsRef, {
        ...team,
        ownerId: userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      const createdTeam = {
        id: docRef.id,
        ...team,
        ownerId: userId,
        createdAt: now,
        updatedAt: now,
      };

      // Takım sahibini takım üyesi olarak ekle
      try {
        // Kullanıcı bilgilerini al 
        const userDoc = await getDoc(doc(db, this.usersCollection, userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          await this.addTeamMember(userId, {
            name: userData.name || "Unknown User",
            email: userData.email || "",
            role: "Takım Sahibi", // Takım sahibi rolü
          });
          console.log("Takım sahibi, takım üyesi olarak eklendi:", userId);
        }
      } catch (memberError) {
        console.error("Takım sahibi, takım üyesi olarak eklenirken hata:", memberError);
      }

      return createdTeam;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }
  
  // Get a team by ID
  async getTeam(userId: string, teamId: string): Promise<Team | null> {
    try {
      const teamRef = doc(this.getUserTeamsRef(userId), teamId);
      const teamSnap = await getDoc(teamRef);
      
      if (!teamSnap.exists()) {
        return null;
      }
      
      const data = teamSnap.data();
      return {
        id: teamSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Team;
    } catch (error) {
      console.error('Error getting team:', error);
      throw error;
    }
  }
  
  // Update a team
  async updateTeam(userId: string, teamId: string, team: Partial<Team>): Promise<void> {
    try {
      const teamRef = doc(this.getUserTeamsRef(userId), teamId);
      
      await updateDoc(teamRef, {
        ...team,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  }
  
  // Delete a team
  async deleteTeam(userId: string, teamId: string): Promise<void> {
    try {
      const teamRef = doc(this.getUserTeamsRef(userId), teamId);
      
      await deleteDoc(teamRef);
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  }

  // Existing Team Members Functions

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

  // Add a team to a user's teams collection (for when a user is invited to a team)
  async addTeamToUserTeams(userId: string, team: Team): Promise<Team> {
    try {
      const teamsRef = this.getUserTeamsRef(userId);
      
      // Önce bu takımın kullanıcının koleksiyonunda zaten var olup olmadığını kontrol et
      const q = query(teamsRef, where("id", "==", team.id));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        console.log("Bu takım zaten kullanıcının koleksiyonunda var:", team.id);
        return querySnapshot.docs[0].data() as Team;
      }
      
      // Takımı kullanıcının teams koleksiyonuna ekle
      await setDoc(doc(teamsRef, team.id), {
        ...team,
        updatedAt: Timestamp.now(),
      });
      
      return team;
    } catch (error) {
      console.error('Error adding team to user teams:', error);
      throw error;
    }
  }
}

export const teamService = new TeamService(); 