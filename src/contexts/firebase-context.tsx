"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { collection, doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { rolesService } from '@/services/roles-service';
import { userService } from '@/services/user-service';

// Kullanıcı için benzersiz bir kod oluşturur
const generateUserCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      // Set or remove auth cookie based on user state
      if (user) {
        Cookies.set('auth', 'true', { expires: 7 }); // Cookie expires in 7 days
      } else {
        Cookies.remove('auth');
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Firebase Authentication ile giriş yap
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      try {
        // Kullanıcı verisini kontrol et
        await userService.getUser(firebaseUser.uid);
      } catch (error) {
        // Eğer kullanıcı Firestore'da bulunamazsa, yeni kullanıcı dokümanı oluştur
        if (error instanceof Error && error.message === "User not found") {
          console.log("Creating new user document after signin for:", firebaseUser.uid);
          const userCode = generateUserCode();
          
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            name: firebaseUser.displayName || "Unknown User",
            email: firebaseUser.email || "",
            userCode,
            systemRoleIds: [],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
          
          // Kullanıcıya varsayılan rol ata
          const defaultRoleId = await rolesService.createDefaultSystemRole(firebaseUser.uid);
          
          // Kullanıcı dokümanını güncelle
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            systemRoleIds: [defaultRoleId],
            updatedAt: Timestamp.now(),
          }, { merge: true });
        } else {
          console.error('Error checking user during signin:', error);
        }
      }
      
      router.push('/');
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update the user profile with the display name
      await updateProfile(user, { displayName: name });
      
      // Generate a unique user code
      const userCode = generateUserCode();
      
      // Önce kullanıcı dokümanını oluşturalım
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        userCode,
        systemRoleIds: [], // Başlangıçta boş bir dizi
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      // Şimdi kullanıcı oluşturulduğuna göre, kullanıcıya özel alt koleksiyonlarda varsayılan rolü oluştur
      const defaultRoleId = await rolesService.createDefaultSystemRole(user.uid);
      
      // Kullanıcı dokümanını güncelleyerek varsayılan rolü ekleyelim
      await setDoc(doc(db, 'users', user.uid), {
        systemRoleIds: [defaultRoleId], // Varsayılan rol atama
        updatedAt: Timestamp.now(),
      }, { merge: true }); // Mevcut dokümanı korumak için merge:true kullanıyoruz
      
      router.push('/');
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <FirebaseContext.Provider value={{ user, loading, signIn, signUp, logout }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export function useAuth() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context;
} 