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
  inviterEmail?: string; // Davet eden kullanıcının e-posta adresi
  inviteeId: string;
  inviteeName: string;
  role: string;
  teamId?: string; // Takım ID'si (opsiyonel, geriye dönük uyumluluk için)
  teamName?: string; // Takım adı (opsiyonel, geriye dönük uyumluluk için)
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

class InvitationService {
  private readonly usersCollection = "users";
  private readonly invitationsSubcollection = "teamInvitations";

  // Kullanıcıya özgü teamInvitations koleksiyonuna referans oluşturur
  private getUserInvitationsRef(userId: string) {
    return collection(db, this.usersCollection, userId, this.invitationsSubcollection);
  }

  async getInvitation(userId: string, id: string): Promise<TeamInvitation> {
    const docRef = doc(this.getUserInvitationsRef(userId), id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("Invitation not found");
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      inviterId: data.inviterId,
      inviterName: data.inviterName,
      inviterEmail: data.inviterEmail,
      inviteeId: data.inviteeId,
      inviteeName: data.inviteeName,
      role: data.role,
      teamId: data.teamId,
      teamName: data.teamName,
      status: data.status,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    };
  }

  async createInvitation(userId: string, invitationData: Omit<TeamInvitation, "id" | "createdAt" | "updatedAt" | "status">): Promise<TeamInvitation> {
    const invitationsRef = this.getUserInvitationsRef(userId);
    const docRef = await addDoc(invitationsRef, {
      ...invitationData,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return this.getInvitation(userId, docRef.id);
  }

  async updateInvitationStatus(userId: string, id: string, status: 'accepted' | 'rejected'): Promise<TeamInvitation> {
    const docRef = doc(this.getUserInvitationsRef(userId), id);
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now(),
    });

    return this.getInvitation(userId, id);
  }

  async deleteInvitation(userId: string, id: string): Promise<void> {
    const docRef = doc(this.getUserInvitationsRef(userId), id);
    await deleteDoc(docRef);
  }

  async getPendingInvitationsForUser(userId: string, inviteeId: string): Promise<TeamInvitation[]> {
    const invitationsRef = this.getUserInvitationsRef(userId);
    const q = query(
      invitationsRef, 
      where("inviteeId", "==", inviteeId),
      where("status", "==", "pending")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        inviterId: data.inviterId,
        inviterName: data.inviterName,
        inviterEmail: data.inviterEmail,
        inviteeId: data.inviteeId,
        inviteeName: data.inviteeName,
        role: data.role,
        teamId: data.teamId,
        teamName: data.teamName,
        status: data.status,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };
    });
  }

  async getInvitationsSentByUser(userId: string): Promise<TeamInvitation[]> {
    const invitationsRef = this.getUserInvitationsRef(userId);
    const querySnapshot = await getDocs(invitationsRef);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        inviterId: data.inviterId,
        inviterName: data.inviterName,
        inviterEmail: data.inviterEmail,
        inviteeId: data.inviteeId,
        inviteeName: data.inviteeName,
        role: data.role,
        teamId: data.teamId,
        teamName: data.teamName,
        status: data.status,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };
    });
  }

  // Davetleri karşılayan kullanıcıların davetlerini almak için
  // Bu, bir kullanıcının kendisine gönderilen davetleri görmesi için kullanılır
  async getInvitationsForInvitee(userId: string): Promise<TeamInvitation[]> {
    // Bu işlev, diğer kullanıcıların koleksiyonlarına erişmek gerektiğinden karmaşıktır
    // Şu anda, inviteeId değeri userId olan tüm kullanıcıların koleksiyonlarını taramalıyız
    // Ancak bu verimli değildir - bu sorunu çözmek için özel bir koleksiyon veya farklı bir yapı gerekebilir
    
    // Şimdilik basitleştirilmiş bir yaklaşım kullanıyoruz - gerçek uygulamada
    // tüm kullanıcıları elde etmek ve her birinin davet koleksiyonunu kontrol etmek gerekecektir
    const usersRef = collection(db, this.usersCollection);
    const userSnapshots = await getDocs(usersRef);
    
    let allInvitations: TeamInvitation[] = [];
    
    // Her kullanıcının davet koleksiyonunu kontrol et
    for (const userDoc of userSnapshots.docs) {
      const invitationsRef = collection(userDoc.ref, this.invitationsSubcollection);
      const q = query(invitationsRef, where("inviteeId", "==", userId));
      const invitationSnapshots = await getDocs(q);
      
      const userInvitations = invitationSnapshots.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          inviterId: data.inviterId,
          inviterName: data.inviterName,
          inviterEmail: data.inviterEmail,
          inviteeId: data.inviteeId,
          inviteeName: data.inviteeName,
          role: data.role,
          teamId: data.teamId,
          teamName: data.teamName,
          status: data.status,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      });
      
      allInvitations = [...allInvitations, ...userInvitations];
    }
    
    return allInvitations;
  }
}

export const invitationService = new InvitationService(); 