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
  const { user } = useFirebase(); // Only use Firebase Auth user
  const { refreshTeams } = useTeams(); // To refresh the team list
  const router = useRouter(); // Add router

  useEffect(() => {
    async function fetchInvitations() {
      if (!user) {
        console.log("User not authenticated");
        setLoading(false);
        return;
      }
      
      console.log("Fetching invitations for user:", user.uid);
      
      try {
        // Now using a new method to get invitations sent to the user
        const pendingInvitations = await invitationService.getInvitationsForInvitee(user.uid);
        console.log("Pending invitations:", pendingInvitations);
        
        // Only show pending invitations
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
      
      // Using the inviter's ID
      await invitationService.updateInvitationStatus(inviterId, invitationId, "accepted");
      
      // Get the updated invitation
      const invitation = await invitationService.getInvitation(inviterId, invitationId);
      
      try {
        // Get the inviter's user information
        const inviterUser = await userService.getUser(inviterId);
        
        // If this is a team invitation (if teamId and teamName exist)
        if (invitation.teamId && invitation.teamName) {
          console.log(`Team invitation accepted: ${invitation.teamName} (${invitation.teamId})`);
          
          // Add the invitee to the inviter's team
          await teamService.addTeamMember(inviterId, {
            name: user.displayName || "Unknown User",
            email: user.email || "",
            role: invitation.role,
          });
          
          // IMPORTANT: Add the team to the user's own teams collection
          // This allows the user to see this team in their "My Teams" list
          try {
            // Get the team details
            const team = await teamService.getTeam(inviterId, invitation.teamId);
            if (team) {
              // Add the team to the accepting user's teams collection
              await teamService.addTeamToUserTeams(user.uid, {
                id: team.id,
                name: team.name,
                description: team.description,
                ownerId: team.ownerId,
                createdAt: team.createdAt,
                updatedAt: new Date()
              });
              console.log("Team added to user's teams collection:", team.id);
            }
          } catch (teamError) {
            console.error("Error adding team to user's collection:", teamError);
          }
          
          toast.success(`You've joined the ${invitation.teamName} team`);
          
          // Refresh team list (wait for completion)
          await refreshTeams();
          
          // Redirect to team page (optional)
          // router.push(`/team/${invitation.teamId}`);
          
          setInvitations(invitations.filter(inv => inv.id !== invitationId));
        } else {
          // Normal invitation process (for backward compatibility)
          
          // 1. Add the inviter to your team (mutual relationship)
          await teamService.addTeamMember(user.uid, {
            name: invitation.inviterName,
            email: inviterUser.email || "",  // Get email from user data
            role: invitation.role,
          });
          
          // 2. Add the invitee to the inviter's team
          await teamService.addTeamMember(inviterId, {
            name: user.displayName || "Unknown User",
            email: user.email || "",
            role: invitation.role,
          });
          
          toast.success("Team invitation accepted");
          
          // Refresh team list (wait for completion)
          await refreshTeams();
          
          setInvitations(invitations.filter(inv => inv.id !== invitationId));
        }
        
        console.log("Invitation accepted and added to both users' teams");
      } catch (userError) {
        console.error("Failed to get user information:", userError);
        toast.error("Failed to get user information");
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error("An error occurred while accepting the invitation");
    }
  }

  async function handleRejectInvitation(invitationId: string, inviterId: string) {
    try {
      if (!user) return;
      
      // Using the inviter's ID
      await invitationService.updateInvitationStatus(inviterId, invitationId, "rejected");
      
      setInvitations(invitations.filter(inv => inv.id !== invitationId));
      toast.success("Team invitation rejected");
      console.log("Invitation rejected, ID:", invitationId, "Sender:", inviterId);
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      toast.error("An error occurred while rejecting the invitation");
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
          Team Invitations
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Team invitations from other users are listed here.</p>
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
                  <p className="font-medium">Invitation from {invitation.inviterName}</p>
                  {invitation.teamId && invitation.teamName && (
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Team: {invitation.teamName}
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row sm:gap-2 text-sm text-muted-foreground">
                    <p>Role: {invitation.role}</p>
                    <p className="hidden sm:inline">•</p>
                    <p>From: {invitation.inviterEmail || "N/A"}</p>
                    <p className="hidden sm:inline">•</p>
                    <p>To: {user?.email || "N/A"}</p>
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
                  Reject
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleAcceptInvitation(invitation.id, invitation.inviterId)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accept
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 