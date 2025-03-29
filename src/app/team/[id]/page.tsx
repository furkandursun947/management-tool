"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useTeams } from "@/contexts/teams-context";
import { useFirebase } from "@/contexts/firebase-context";
import { Team, TeamMember } from "@/services/team-service";
import { invitationService, TeamInvitation } from "@/services/invitation-service";
import { ArrowLeft, Users, Clock, UserPlus, Calendar, Building2, Settings } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { InviteTeamMemberModal } from "@/components/teams/invite-team-member-modal";

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useFirebase();
  const { teams, loading, getTeamMembers } = useTeams();
  
  const [team, setTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeInvitations, setActiveInvitations] = useState<TeamInvitation[]>([]);
  const [previousInvitations, setPreviousInvitations] = useState<TeamInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  useEffect(() => {
    async function fetchTeamData() {
      if (!user || !params.id) return;
      
      try {
        // Takımı bul
        const teamId = Array.isArray(params.id) ? params.id[0] : params.id;
        const foundTeam = teams.find(t => t.id === teamId);
        
        if (!foundTeam) {
          toast.error("Takım bulunamadı");
          router.push("/team");
          return;
        }
        
        setTeam(foundTeam);
        
        // Takım üyelerini getir
        const members = await getTeamMembers(teamId);
        setTeamMembers(members);
        
        // Davetleri getir
        if (user.uid === foundTeam.ownerId) {
          // Sadece takım sahibi davetleri görebilir
          const sentInvitations = await invitationService.getInvitationsSentByUser(user.uid);
          const teamInvitations = sentInvitations.filter(inv => inv.teamId === teamId);
          
          // Aktif ve geçmiş davetleri ayır
          setActiveInvitations(teamInvitations.filter(inv => inv.status === 'pending'));
          setPreviousInvitations(teamInvitations.filter(inv => inv.status !== 'pending'));
        }
      } catch (error) {
        console.error("Error fetching team data:", error);
        toast.error("Takım bilgileri yüklenirken bir hata oluştu");
      } finally {
        setIsLoading(false);
      }
    }
    
    if (!loading) {
      fetchTeamData();
    }
  }, [params.id, user, teams, loading, getTeamMembers, router]);

  if (isLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-48" />
          </div>
          
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
      </Layout>
    );
  }
  
  if (!team) {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold mb-2">Takım Bulunamadı</h2>
            <p className="text-muted-foreground mb-6">Bu takım bulunamadı veya erişim izniniz yok.</p>
            <Button onClick={() => router.push("/team")}>Takımlar Sayfasına Dön</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleOpenInviteModal = () => {
    if (team && user?.uid === team.ownerId) {
      setInviteModalOpen(true);
    } else {
      toast.error("Sadece takım sahibi üye davet edebilir");
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="icon" onClick={() => router.push("/team")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
              <p className="text-muted-foreground">
                {team.description || "Takım açıklaması bulunmuyor"}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mb-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDistanceToNow(team.createdAt, { addSuffix: true, locale: tr })} oluşturuldu</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{teamMembers.length} Üye</span>
            </Badge>
          </div>
        </div>
        
        <Tabs defaultValue="members">
          <TabsList className="mb-4">
            <TabsTrigger value="members">
              <Users className="h-4 w-4 mr-2" />
              Takım Üyeleri
            </TabsTrigger>
            <TabsTrigger value="invitations">
              <Clock className="h-4 w-4 mr-2" />
              Davetler
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Takım Ayarları
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="members">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Takım Üyeleri</CardTitle>
                <Button size="sm" onClick={handleOpenInviteModal}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Üye Davet Et
                </Button>
              </CardHeader>
              <CardContent>
                {teamMembers.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    Henüz takım üyesi bulunmuyor.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teamMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-3 rounded-md border">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <p>{member.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{member.role}</Badge>
                          {member.id === team.ownerId && (
                            <Badge variant="default">Takım Sahibi</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="invitations">
            <Card>
              <CardHeader>
                <CardTitle>Bekleyen Davetler</CardTitle>
                <CardDescription>
                  Takımınıza katılmaları için gönderdiğiniz bekleyen davetler
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user?.uid !== team.ownerId ? (
                  <div className="text-center py-6 text-muted-foreground">
                    Davetleri sadece takım sahibi görüntüleyebilir.
                  </div>
                ) : activeInvitations.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    Bekleyen davet bulunmuyor.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeInvitations.map(invitation => (
                      <div key={invitation.id} className="flex items-center justify-between p-3 rounded-md border">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{invitation.inviteeName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{invitation.inviteeName}</p>
                            <p className="text-sm text-muted-foreground">
                              Rol: {invitation.role}
                            </p>
                            <div className="flex items-center mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{formatDistanceToNow(invitation.createdAt, { addSuffix: true, locale: tr })} gönderildi</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">Bekliyor</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Önceki Davetler</CardTitle>
                <CardDescription>
                  Kabul edilen veya reddedilen davetler
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user?.uid !== team.ownerId ? (
                  <div className="text-center py-6 text-muted-foreground">
                    Davetleri sadece takım sahibi görüntüleyebilir.
                  </div>
                ) : previousInvitations.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    Önceki davet bulunmuyor.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {previousInvitations.map(invitation => (
                      <div key={invitation.id} className="flex items-center justify-between p-3 rounded-md border">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{invitation.inviteeName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{invitation.inviteeName}</p>
                            <p className="text-sm text-muted-foreground">
                              Rol: {invitation.role}
                            </p>
                            <div className="flex items-center mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{formatDistanceToNow(invitation.updatedAt, { addSuffix: true, locale: tr })} güncellendi</span>
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant={invitation.status === 'accepted' ? 'default' : 'destructive'}
                        >
                          {invitation.status === 'accepted' ? 'Kabul Edildi' : 'Reddedildi'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Takım Ayarları</CardTitle>
                <CardDescription>
                  Takım bilgilerini düzenleyin
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user?.uid !== team.ownerId ? (
                  <div className="text-center py-6 text-muted-foreground">
                    Takım ayarlarını sadece takım sahibi değiştirebilir.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Takım ayarları yakında eklenecektir.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Davet Modalı */}
        {team && (
          <InviteTeamMemberModal
            teamId={team.id}
            teamName={team.name}
            open={inviteModalOpen}
            onOpenChange={setInviteModalOpen}
          />
        )}
      </div>
    </Layout>
  );
} 