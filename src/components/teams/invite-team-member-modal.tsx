import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { UserPlus, HelpCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTeams } from "@/contexts/teams-context";
import { userService } from "@/services/user-service";
import { invitationService } from "@/services/invitation-service";
import { useAuth } from "@/contexts/firebase-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const inviteMemberFormSchema = z.object({
  userCode: z.string().min(1, "User code is required"),
  role: z.string().min(1, "Role is required"),
});

type FormValues = z.infer<typeof inviteMemberFormSchema>;

interface InviteTeamMemberModalProps {
  teamId: string;
  teamName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteTeamMemberModal({ teamId, teamName, open, onOpenChange }: InviteTeamMemberModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchingUser, setSearchingUser] = useState(false);
  const [foundUser, setFoundUser] = useState<any | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(inviteMemberFormSchema),
    defaultValues: {
      userCode: "",
      role: "Member", // Default role
    },
  });

  // Search user by code
  async function handleUserCodeSearch(userCode: string) {
    if (!userCode || !user) return;
    
    setSearchingUser(true);
    try {
      const foundUserData = await userService.getUserByCode(userCode);
      console.log("Found user:", foundUserData);
      setFoundUser(foundUserData);
      if (!foundUserData) {
        toast.error("No user found with this code");
      }
    } catch (error) {
      console.error('Error searching for user:', error);
      toast.error("User search failed");
      setFoundUser(null);
    } finally {
      setSearchingUser(false);
    }
  }

  async function onSubmit(values: FormValues) {
    try {
      if (!foundUser) {
        toast.error("Please find a valid user first");
        return;
      }

      if (!user) {
        toast.error("You must be logged in to invite members");
        return;
      }

      setLoading(true);

      console.log("Creating team invitation:", {
        inviterId: user.uid,
        inviterName: user.displayName || "Unknown User",
        inviteeId: foundUser.id,
        inviteeName: foundUser.name,
        teamId,
        teamName,
        role: values.role
      });

      // Create invitation
      await invitationService.createInvitation(user.uid, {
        inviterId: user.uid,
        inviterName: user.displayName || "Unknown User",
        inviterEmail: user.email || "",
        inviteeId: foundUser.id,
        inviteeName: foundUser.name,
        role: values.role,
        teamId,
        teamName,
      });

      // If the user has a Firebase UID, create an additional invitation
      if (foundUser.uid && foundUser.uid !== foundUser.id) {
        console.log("User has Firebase UID:", foundUser.uid);
        try {
          await invitationService.createInvitation(user.uid, {
            inviterId: user.uid,
            inviterName: user.displayName || "Unknown User",
            inviterEmail: user.email || "",
            inviteeId: foundUser.uid,
            inviteeName: foundUser.name,
            role: values.role,
            teamId,
            teamName,
          });
          console.log("Additional invitation created with Firebase UID");
        } catch (err) {
          console.error("Error creating additional invitation:", err);
        }
      }

      toast.success(`${foundUser.name} has been invited to "${teamName}" team`);
      
      form.reset();
      setFoundUser(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error("Could not send invitation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Enter a user code to invite a new member to "{teamName}" team.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    User Code
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-80">
                        <p>User codes can be found in each user's profile settings. Ask the person you want to invite to provide you with their unique code.</p>
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <div className="flex space-x-2">
                    <FormControl>
                      <Input 
                        placeholder="Enter user code" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          setFoundUser(null);
                        }}
                      />
                    </FormControl>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => handleUserCodeSearch(field.value)}
                      disabled={searchingUser || !field.value}
                    >
                      {searchingUser ? "Searching..." : "Search"}
                    </Button>
                  </div>
                  <FormMessage />
                  {foundUser && (
                    <div className="mt-2 p-2 border rounded-md">
                      <div className="flex items-center space-x-2">
                        <Avatar>
                          <AvatarImage src={foundUser.avatarUrl} />
                          <AvatarFallback>{foundUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{foundUser.name}</p>
                          <p className="text-sm text-muted-foreground">{foundUser.email}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Member">Member</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Observer">Observer</SelectItem>
                        <SelectItem value="Developer">Developer</SelectItem>
                        <SelectItem value="Designer">Designer</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={loading || !foundUser}>
                {loading ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"></span>
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 