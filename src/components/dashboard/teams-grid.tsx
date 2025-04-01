import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, User2, Settings, UserPlus, Trash2, ExternalLink } from "lucide-react";
import { useTeams } from "@/contexts/teams-context";
import { Team } from "@/services/team-service";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { CreateTeamModal } from "@/components/teams/create-team-modal";
import { InviteTeamMemberModal } from "@/components/teams/invite-team-member-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function TeamsGrid() {
  const { teams, loading, deleteTeam, teamMembers } = useTeams();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const router = useRouter();

  const handleDeleteTeam = async (teamId: string) => {
    try {
      setDeletingTeamId(teamId);
      await deleteTeam(teamId);
    } catch (error) {
      console.error("Error deleting team:", error);
    } finally {
      setDeletingTeamId(null);
    }
  };

  const handleInviteMember = (team: Team) => {
    setSelectedTeam(team);
    setInviteModalOpen(true);
  };

  const handleViewTeamDetails = (teamId: string) => {
    router.push(`/team/${teamId}`);
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">My Teams</h2>
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-7 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2 mb-4" />
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-between">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-9 w-9 rounded-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight">My Teams</h2>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Team
        </Button>
      </div>

      {teams.length === 0 ? (
        <Card className="text-center p-6">
          <div className="flex flex-col items-center gap-2 py-6">
            <User2 className="h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-medium">You don't have any teams yet</h3>
            <p className="text-sm text-muted-foreground pb-4">
              Create a team and invite members to manage your projects.
            </p>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle 
                    className="text-lg cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleViewTeamDetails(team.id)}
                  >
                    {team.name}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleViewTeamDetails(team.id)}
                        className="cursor-pointer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Team Details
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleInviteMember(team)}
                        className="cursor-pointer"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Invite Member
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteTeam(team.id)}
                        className="text-destructive cursor-pointer"
                        disabled={deletingTeamId === team.id}
                      >
                        {deletingTeamId === team.id ? (
                          <>
                            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-background"></span>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Team
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {team.description && (
                  <CardDescription>{team.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <User2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {teamMembers && teamMembers[team.id] ? teamMembers[team.id].length : 0} Members
                  </span>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 text-xs text-muted-foreground">
                Created {formatDistanceToNow(team.createdAt, { addSuffix: true })}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <CreateTeamModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
      {selectedTeam && (
        <InviteTeamMemberModal 
          teamId={selectedTeam.id}
          teamName={selectedTeam.name}
          open={inviteModalOpen}
          onOpenChange={setInviteModalOpen}
        />
      )}
    </div>
  );
} 