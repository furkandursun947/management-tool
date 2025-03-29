import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Trash2, HelpCircle } from "lucide-react";
import { teamService, TeamMember } from "@/services/team-service";
import { useFirebase } from "@/contexts/firebase-context";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function TeamList() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useFirebase();

  useEffect(() => {
    async function fetchTeamMembers() {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        console.log("Takım üyeleri getiriliyor:", user.uid);
        const members = await teamService.getTeamMembers(user.uid);
        console.log("Takım üyeleri:", members);
        setTeamMembers(members);
      } catch (error) {
        console.error("Takım üyeleri getirilirken hata oluştu:", error);
        toast.error("Takım üyeleri yüklenemedi");
      } finally {
        setLoading(false);
      }
    }

    fetchTeamMembers();
  }, [user]);

  async function handleRemoveMember(id: string) {
    if (!user) return;

    try {
      await teamService.deleteTeamMember(user.uid, id);
      setTeamMembers(members => members.filter(member => member.id !== id));
      toast.success("Takım üyesi kaldırıldı");
    } catch (error) {
      console.error("Takım üyesi kaldırılırken hata oluştu:", error);
      toast.error("Takım üyesi kaldırılamadı");
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Takım Üyeleri</CardTitle>
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
                <Skeleton className="h-9 w-9" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (teamMembers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Takım Üyeleri
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Takımınızdaki üyeler.</p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teamMembers.map((member) => (
            <div 
              key={member.id} 
              className="flex items-center justify-between p-3 rounded-md border"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Rol: {member.role}
                  </p>
                </div>
              </div>
              <Button 
                size="icon" 
                variant="ghost"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => handleRemoveMember(member.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 