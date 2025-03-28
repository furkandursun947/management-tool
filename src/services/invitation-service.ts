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

export interface TeamInvitation {
  id: string;
  inviterId: string;
  inviterName: string;
  inviteeId: string;
  inviteeName: string;
  role: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

class InvitationService {
  private collection = collection(db, "teamInvitations");

  async getInvitation(id: string): Promise<TeamInvitation> {
    const docRef = doc(this.collection, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("Invitation not found");
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      inviterId: data.inviterId,
      inviterName: data.inviterName,
      inviteeId: data.inviteeId,
      inviteeName: data.inviteeName,
      role: data.role,
      status: data.status,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    };
  }

  async createInvitation(invitationData: Omit<TeamInvitation, "id" | "createdAt" | "updatedAt" | "status">): Promise<TeamInvitation> {
    const docRef = await addDoc(this.collection, {
      ...invitationData,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return this.getInvitation(docRef.id);
  }

  async updateInvitationStatus(id: string, status: 'accepted' | 'rejected'): Promise<TeamInvitation> {
    const docRef = doc(this.collection, id);
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now(),
    });

    return this.getInvitation(id);
  }

  async deleteInvitation(id: string): Promise<void> {
    const docRef = doc(this.collection, id);
    await deleteDoc(docRef);
  }

  async getPendingInvitationsForUser(userId: string): Promise<TeamInvitation[]> {
    const q = query(
      this.collection, 
      where("inviteeId", "==", userId),
      where("status", "==", "pending")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        inviterId: data.inviterId,
        inviterName: data.inviterName,
        inviteeId: data.inviteeId,
        inviteeName: data.inviteeName,
        role: data.role,
        status: data.status,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };
    });
  }

  async getInvitationsSentByUser(userId: string): Promise<TeamInvitation[]> {
    const q = query(this.collection, where("inviterId", "==", userId));
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        inviterId: data.inviterId,
        inviterName: data.inviterName,
        inviteeId: data.inviteeId,
        inviteeName: data.inviteeName,
        role: data.role,
        status: data.status,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };
    });
  }
}

export const invitationService = new InvitationService(); 