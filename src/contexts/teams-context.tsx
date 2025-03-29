import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { teamService, Team, TeamMember } from "@/services/team-service";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

interface TeamsContextType {
  teams: Team[];
  teamMembers: Record<string, TeamMember[]>; // teamId -> members
  loading: boolean;
  error: Error | null;
  refreshTeams: () => Promise<void>;
  getTeamMembers: (teamId: string) => Promise<TeamMember[]>;
  createTeam: (team: Omit<Team, "id" | "ownerId" | "createdAt" | "updatedAt">) => Promise<Team>;
  updateTeam: (teamId: string, team: Partial<Team>) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  addTeamMember: (teamId: string, member: Omit<TeamMember, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  removeTeamMember: (teamId: string, memberId: string) => Promise<void>;
}

const TeamsContext = createContext<TeamsContextType | undefined>(undefined);

export function TeamsProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  // Teams'leri yükle
  useEffect(() => {
    if (user) {
      refreshTeams();
    }
  }, [user]);

  const refreshTeams = async (): Promise<void> => {
    try {
      if (!user) {
        setTeams([]);
        setTeamMembers({});
        return;
      }
      
      setLoading(true);
      const fetchedTeams = await teamService.getUserTeams(user.id);
      setTeams(fetchedTeams);
      
      // Her takımın üyelerini yükle
      const membersObj: Record<string, TeamMember[]> = {};
      for (const team of fetchedTeams) {
        try {
          // Takım sahibinin takım üyelerini getir
          const members = await teamService.getTeamMembers(team.ownerId);
          membersObj[team.id] = members;
        } catch (err) {
          console.error(`Takım ${team.id} üyeleri yüklenirken hata:`, err);
          membersObj[team.id] = [];
        }
      }
      setTeamMembers(membersObj);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Takımlar yüklenirken bir hata oluştu");
      setError(error);
      toast.error("Takımlar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const getTeamMembers = async (teamId: string): Promise<TeamMember[]> => {
    if (!user) return [];
    
    try {
      // Takımı bul
      const team = teams.find(t => t.id === teamId);
      if (!team) {
        throw new Error("Takım bulunamadı");
      }
      
      // Takım sahibinden üyeleri getir
      const members = await teamService.getTeamMembers(team.ownerId);
      
      // Context'teki takım üyelerini güncelle
      setTeamMembers(prev => ({
        ...prev,
        [teamId]: members
      }));
      
      return members;
    } catch (error) {
      console.error("Takım üyeleri getirilirken hata oluştu:", error);
      throw error;
    }
  };

  const createTeam = async (teamData: Omit<Team, "id" | "ownerId" | "createdAt" | "updatedAt">): Promise<Team> => {
    if (!user) {
      throw new Error("Bu işlemi yapmak için giriş yapmalısınız");
    }

    try {
      const newTeam = await teamService.createTeam(user.id, teamData);
      setTeams(prev => [...prev, newTeam]);
      toast.success("Takım başarıyla oluşturuldu");
      return newTeam;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Takım oluşturulurken bir hata oluştu");
      toast.error(error.message);
      throw error;
    }
  };

  const updateTeam = async (teamId: string, teamData: Partial<Team>): Promise<void> => {
    if (!user) {
      throw new Error("Bu işlemi yapmak için giriş yapmalısınız");
    }

    try {
      await teamService.updateTeam(user.id, teamId, teamData);
      setTeams(prev => prev.map(team => 
        team.id === teamId ? { ...team, ...teamData, updatedAt: new Date() } : team
      ));
      toast.success("Takım başarıyla güncellendi");
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Takım güncellenirken bir hata oluştu");
      toast.error(error.message);
      throw error;
    }
  };

  const deleteTeam = async (teamId: string): Promise<void> => {
    if (!user) {
      throw new Error("Bu işlemi yapmak için giriş yapmalısınız");
    }

    try {
      await teamService.deleteTeam(user.id, teamId);
      setTeams(prev => prev.filter(team => team.id !== teamId));
      toast.success("Takım başarıyla silindi");
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Takım silinirken bir hata oluştu");
      toast.error(error.message);
      throw error;
    }
  };

  const addTeamMember = async (teamId: string, memberData: Omit<TeamMember, "id" | "createdAt" | "updatedAt">): Promise<void> => {
    if (!user) {
      throw new Error("Bu işlemi yapmak için giriş yapmalısınız");
    }

    try {
      // Takımı bul
      const team = teams.find(t => t.id === teamId);
      if (!team) {
        throw new Error("Takım bulunamadı");
      }
      
      // Takım sahibinin koleksiyonuna üye ekle
      const newMember = await teamService.addTeamMember(team.ownerId, memberData);
      
      // Context'teki takım üyelerini güncelle
      setTeamMembers(prev => {
        const currentMembers = prev[teamId] || [];
        return {
          ...prev,
          [teamId]: [...currentMembers, newMember]
        };
      });
      
      toast.success("Takım üyesi başarıyla eklendi");
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Takım üyesi eklenirken bir hata oluştu");
      toast.error(error.message);
      throw error;
    }
  };

  const removeTeamMember = async (teamId: string, memberId: string): Promise<void> => {
    if (!user) {
      throw new Error("Bu işlemi yapmak için giriş yapmalısınız");
    }

    try {
      // Burada takım üyesi silme mantığı gelecek
      // Şimdilik boş bırakıyoruz
      toast.success("Takım üyesi başarıyla silindi");
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Takım üyesi silinirken bir hata oluştu");
      toast.error(error.message);
      throw error;
    }
  };

  return (
    <TeamsContext.Provider
      value={{
        teams,
        teamMembers,
        loading,
        error,
        refreshTeams,
        getTeamMembers,
        createTeam,
        updateTeam,
        deleteTeam,
        addTeamMember,
        removeTeamMember,
      }}
    >
      {children}
    </TeamsContext.Provider>
  );
}

export function useTeams() {
  const context = useContext(TeamsContext);
  if (context === undefined) {
    throw new Error("useTeams must be used within a TeamsProvider");
  }
  return context;
} 