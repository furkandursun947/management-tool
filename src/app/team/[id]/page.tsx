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
        // Find the team
        const teamId = Array.isArray(params.id) ? params.id[0] : params.id;
        const foundTeam = teams.find(t => t.id === teamId);
        
        if (!foundTeam) {
          toast.error("Team not found");
          router.push("/team");
          return;
        }
        
        setTeam(foundTeam);
        
        // Get team members
        const members = await getTeamMembers(teamId);
        setTeamMembers(members);
        
        // Get invitations
        if (user.uid === foundTeam.ownerId) {
          // Only team owner can see invitations
          const sentInvitations = await invitationService.getInvitationsSentByUser(user.uid);
          const teamInvitations = sentInvitations.filter(inv => inv.teamId === teamId);
          
          // Separate active and previous invitations
          setActiveInvitations(teamInvitations.filter(inv => inv.status === 'pending'));
          setPreviousInvitations(teamInvitations.filter(inv => inv.status !== 'pending'));
        }
      } catch (error) {
        console.error("Error fetching team data:", error);
        toast.error("An error occurred while loading team information");
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
            <h2 className="text-2xl font-bold mb-2">Team Not Found</h2>
            <p className="text-muted-foreground mb-6">This team was not found or you don't have access to it.</p>
            <Button onClick={() => router.push("/team")}>Return to Teams Page</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleOpenInviteModal = () => {
    if (team && user?.uid === team.ownerId) {
      setInviteModalOpen(true);
    } else {
      toast.error("Only the team owner can invite members");
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
                {team.description || "No team description available"}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mb-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Created {formatDistanceToNow(team.createdAt, { addSuffix: true })}</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{teamMembers.length} Members</span>
            </Badge>
          </div>
        </div>
        
        <Tabs defaultValue="members">
          <TabsList className="mb-4">
            <TabsTrigger value="members">
              <Users className="h-4 w-4 mr-2" />
              Team Members
            </TabsTrigger>
            <TabsTrigger value="invitations">
              <Clock className="h-4 w-4 mr-2" />
              Invitations
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Team Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="members">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Team Members</CardTitle>
                <Button size="sm" onClick={handleOpenInviteModal}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </CardHeader>
              <CardContent>
                {teamMembers.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No team members yet.
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
                            <Badge variant="default">Team Owner</Badge>
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
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>
                  Pending invitations sent for users to join your team
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user?.uid !== team.ownerId ? (
                  <div className="text-center py-6 text-muted-foreground">
                    Only the team owner can view invitations.
                  </div>
                ) : activeInvitations.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No pending invitations.
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
                              Role: {invitation.role}
                            </p>
                            <div className="flex items-center mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>Sent {formatDistanceToNow(invitation.createdAt, { addSuffix: true })}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">Pending</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Previous Invitations</CardTitle>
                <CardDescription>
                  History of accepted and rejected invitations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user?.uid !== team.ownerId ? (
                  <div className="text-center py-6 text-muted-foreground">
                    Only the team owner can view invitation history.
                  </div>
                ) : previousInvitations.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No previous invitations.
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
                              Role: {invitation.role}
                            </p>
                            <div className="flex items-center mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>Responded {formatDistanceToNow(invitation.updatedAt, { addSuffix: true })}</span>
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant={invitation.status === 'accepted' ? 'default' : 'destructive'}
                        >
                          {invitation.status === 'accepted' ? 'Accepted' : 'Rejected'}
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
                <CardTitle>Team Settings</CardTitle>
                <CardDescription>
                  Manage team details and configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user?.uid !== team.ownerId ? (
                  <div className="text-center py-6 text-muted-foreground">
                    Only the team owner can access team settings.
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-muted-foreground">
                      Team settings will be available soon.
                    </p>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Danger Zone</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        These actions are destructive and cannot be reversed.
                      </p>
                      <Button variant="destructive">
                        Delete Team
                      </Button>
                    </div>
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