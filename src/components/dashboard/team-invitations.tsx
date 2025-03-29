import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, UserCheck, HelpCircle } from "lucide-react";
import { invitationService, TeamInvitation } from "@/services/invitation-service";
import { teamService } from "@/services/team-service";
import { useFirebase } from "@/contexts/firebase-context";
import { useTeams } from "@/contexts/teams-context";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { userService } from "@/services/user-service";
import { useRouter } from "next/navigation";

export function TeamInvitations() {
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useFirebase(); // Sadece Firebase Auth user'ını kullan
  const { refreshTeams } = useTeams(); // Takım listesini yenilemek için
  const router = useRouter(); // Router ekle

  useEffect(() => {
    async function fetchInvitations() {
      if (!user) {
        console.log("User not authenticated");
        setLoading(false);
        return;
      }
      
      console.log("Fetching invitations for user:", user.uid);
      
      try {
        // Şimdi kullanıcının kendisine gönderilen davetleri almak için yeni bir metod kullanıyoruz
        const pendingInvitations = await invitationService.getInvitationsForInvitee(user.uid);
        console.log("Pending invitations:", pendingInvitations);
        
        // Sadece bekleyen davetleri göster
        const filteredInvitations = pendingInvitations.filter(inv => inv.status === 'pending');
        setInvitations(filteredInvitations);
      } catch (error) {
        console.error("Error fetching team invitations:", error);
        toast.error("Failed to load team invitations");
      } finally {
        setLoading(false);
      }
    }

    fetchInvitations();
  }, [user]);

  async function handleAcceptInvitation(invitationId: string, inviterId: string) {
    try {
      if (!user) return;
      
      // Daveti gönderen kullanıcının ID'sini kullanıyoruz
      await invitationService.updateInvitationStatus(inviterId, invitationId, "accepted");
      
      // Güncellenmiş daveti al
      const invitation = await invitationService.getInvitation(inviterId, invitationId);
      
      try {
        // Davet edenin kullanıcı bilgilerini al
        const inviterUser = await userService.getUser(inviterId);
        
        // Eğer bu bir takım daveti ise (teamId ve teamName var ise)
        if (invitation.teamId && invitation.teamName) {
          console.log(`Takım daveti kabul edildi: ${invitation.teamName} (${invitation.teamId})`);
          
          // Davet edileni davet edenin takımına ekle
          await teamService.addTeamMember(inviterId, {
            name: user.displayName || "Unknown User",
            email: user.email || "",
            role: invitation.role,
          });
          
          // ÖNEMLİ: Takımı kullanıcının kendi teams koleksiyonuna ekle
          // Bu işlem, kullanıcının "Takımlarım" listesinde bu takımı görmesini sağlar
          try {
            // Takımın ayrıntılarını alalım
            const team = await teamService.getTeam(inviterId, invitation.teamId);
            if (team) {
              // Kabul eden kullanıcının teams koleksiyonuna takımı ekle
              await teamService.addTeamToUserTeams(user.uid, {
                id: team.id,
                name: team.name,
                description: team.description,
                ownerId: team.ownerId,
                createdAt: team.createdAt,
                updatedAt: new Date()
              });
              console.log("Takım kullanıcının teams koleksiyonuna eklendi:", team.id);
            }
          } catch (teamError) {
            console.error("Takım kullanıcının koleksiyonuna eklenirken hata:", teamError);
          }
          
          toast.success(`${invitation.teamName} takımına katıldınız`);
          
          // Takım listesini yenile (tamamlanmasını bekle)
          await refreshTeams();
          
          // Takım sayfasına yönlendir (isteğe bağlı)
          // router.push(`/team/${invitation.teamId}`);
          
          setInvitations(invitations.filter(inv => inv.id !== invitationId));
        } else {
          // Normal davet işlemleri (geriye dönük uyumluluk için)
          
          // 1. Davet edeni kendi takımına ekle (karşılıklı ilişki)
          await teamService.addTeamMember(user.uid, {
            name: invitation.inviterName,
            email: inviterUser.email || "",  // Kullanıcı verisinden email al
            role: invitation.role,
          });
          
          // 2. Davet edileni davet edenin takımına ekle
          await teamService.addTeamMember(inviterId, {
            name: user.displayName || "Unknown User",
            email: user.email || "",
            role: invitation.role,
          });
          
          toast.success("Takım daveti kabul edildi");
          
          // Takım listesini yenile (tamamlanmasını bekle)
          await refreshTeams();
          
          setInvitations(invitations.filter(inv => inv.id !== invitationId));
        }
        
        console.log("Davet kabul edildi ve her iki kullanıcının takımına da eklendi");
      } catch (userError) {
        console.error("Kullanıcı bilgileri alınamadı:", userError);
        toast.error("Kullanıcı bilgileri alınamadı");
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error("Daveti kabul ederken bir hata oluştu");
    }
  }

  async function handleRejectInvitation(invitationId: string, inviterId: string) {
    try {
      if (!user) return;
      
      // Daveti gönderen kullanıcının ID'sini kullanıyoruz
      await invitationService.updateInvitationStatus(inviterId, invitationId, "rejected");
      
      setInvitations(invitations.filter(inv => inv.id !== invitationId));
      toast.success("Takım daveti reddedildi");
      console.log("Davet reddedildi, ID:", invitationId, "Gönderen:", inviterId);
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      toast.error("Daveti reddetme sırasında bir hata oluştu");
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Takım Davetleri
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Diğer kullanıcılardan gelen takım davetleri burada listelenir.</p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div 
              key={invitation.id} 
              className="flex items-center justify-between p-3 rounded-md border"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{invitation.inviterName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{invitation.inviterName} tarafından davet</p>
                  {invitation.teamId && invitation.teamName && (
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Takım: {invitation.teamName}
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row sm:gap-2 text-sm text-muted-foreground">
                    <p>Rol: {invitation.role}</p>
                    <p className="hidden sm:inline">•</p>
                    <p>Gönderen: {invitation.inviterEmail || "N/A"}</p>
                    <p className="hidden sm:inline">•</p>
                    <p>Alıcı: {user?.email || "N/A"}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-destructive border-destructive hover:bg-destructive/10"
                  onClick={() => handleRejectInvitation(invitation.id, invitation.inviterId)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reddet
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleAcceptInvitation(invitation.id, invitation.inviterId)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Kabul Et
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 