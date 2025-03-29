import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { User as FirebaseUser } from "firebase/auth";
import { userService } from "@/services/user-service";
import { rolesService } from "@/services/roles-service";

interface Project {
  id: string;
  role: {
    id: string;
    name: string;
    permissions: string[];
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  userCode?: string;
  systemRoleIds: string[];
  projects?: Project[];
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  error: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        setFirebaseUser(firebaseUser);
        if (firebaseUser) {
          try {
            // Kullanıcı verilerini getir
            const userData = await userService.getUser(firebaseUser.uid);
            setUser(userData);

            // Kullanıcı verilerini aldıktan sonra, sistemde varsayılan rol var mı kontrol et
            // Eğer kullanıcının hiç rolü yoksa, varsayılan rolü oluştur ve ata
            if (!userData.systemRoleIds || userData.systemRoleIds.length === 0) {
              console.log("User has no roles, creating default role...");
              const defaultRoleId = await rolesService.createDefaultSystemRole(firebaseUser.uid);
              
              // Kullanıcıya varsayılan rolü ata
              await userService.updateUserSystemRoles(firebaseUser.uid, [defaultRoleId]);
              
              // Güncellenmiş kullanıcı verilerini tekrar al
              const updatedUserData = await userService.getUser(firebaseUser.uid);
              setUser(updatedUserData);
            } else {
              // Rollerin kullanıcıya özgü koleksiyonlarda olup olmadığını kontrol et
              try {
                const roles = await rolesService.getSystemRoles(firebaseUser.uid);
                if (roles.length === 0) {
                  // Kullanıcının systemRoleIds'si var ama alt koleksiyonda rol yok
                  // Bu durumda varsayılan rolü yeniden oluştur
                  console.log("User has systemRoleIds but no roles in subcollection, recreating...");
                  const defaultRoleId = await rolesService.createDefaultSystemRole(firebaseUser.uid);
                  
                  // Kullanıcının rol ID'lerini güncelle
                  await userService.updateUserSystemRoles(firebaseUser.uid, [defaultRoleId]);
                  
                  // Güncellenmiş kullanıcı verilerini tekrar al
                  const updatedUserData = await userService.getUser(firebaseUser.uid);
                  setUser(updatedUserData);
                }
              } catch (error) {
                console.error("Error checking user roles:", error);
              }
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            // Kullanıcı verisi bulunamazsa, yeni kullanıcı dokümanı oluştur
            if (error instanceof Error && error.message === "User not found") {
              console.log("Creating new user document for:", firebaseUser.uid);
              const newUser = {
                name: firebaseUser.displayName || "Unknown User",
                email: firebaseUser.email || "",
                userCode: generateUserCode(),
                systemRoleIds: [],
              };
              
              await userService.createUser(newUser);
              
              // Yeni kullanıcı için varsayılan rol oluştur
              const defaultRoleId = await rolesService.createDefaultSystemRole(firebaseUser.uid);
              
              // Kullanıcıya varsayılan rolü ata
              await userService.updateUserSystemRoles(firebaseUser.uid, [defaultRoleId]);
              
              // Oluşturulan kullanıcı verilerini al
              const createdUserData = await userService.getUser(firebaseUser.uid);
              setUser(createdUserData);
            } else {
              setError(error as Error);
            }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Random kullanıcı kodu oluşturma fonksiyonu
  function generateUserCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 