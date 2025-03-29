import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, UserCheck, HelpCircle } from "lucide-react";
import { invitationService, TeamInvitation } from "@/services/invitation-service";
import { teamService } from "@/services/team-service";
import { useFirebase } from "@/contexts/firebase-context";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function TeamInvitations() {
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useFirebase(); // Sadece Firebase Auth user'ını kullan

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
      
      // Get the updated invitation to extract role information
      const invitation = await invitationService.getInvitation(inviterId, invitationId);
      
      // Add user to team with the role from invitation
      await teamService.addTeamMember(inviterId, {
        name: user.displayName || "Unknown User",
        email: user.email || "",
        role: invitation.role,
      });
      
      setInvitations(invitations.filter(inv => inv.id !== invitationId));
      toast.success("Team invitation accepted");
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error("Failed to accept invitation");
    }
  }

  async function handleRejectInvitation(invitationId: string, inviterId: string) {
    try {
      // Daveti gönderen kullanıcının ID'sini kullanıyoruz
      await invitationService.updateInvitationStatus(inviterId, invitationId, "rejected");
      setInvitations(invitations.filter(inv => inv.id !== invitationId));
      toast.success("Team invitation rejected");
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      toast.error("Failed to reject invitation");
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
              <p>These are invitations from other users to join their team.</p>
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
                  <p className="text-sm text-muted-foreground">
                    Role: {invitation.role}
                  </p>
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
                  Decline
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