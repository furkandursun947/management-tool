"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Mail, MoreVertical, Edit, Trash2, UserCheck, UserX, CheckCircle, XCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";
import { teamService, TeamMember } from "@/services/team-service";
import { userService } from "@/services/user-service";
import { invitationService, TeamInvitation } from "@/services/invitation-service";
import { rolesService, SystemRole } from "@/services/roles-service";
import { useAuth } from "@/contexts/firebase-context";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

// Form schema for inviting a new member
const inviteMemberFormSchema = z.object({
  userCode: z.string().min(1, "User code is required"),
  role: z.string().min(1, "Role is required"),
});

type InviteMemberFormValues = z.infer<typeof inviteMemberFormSchema>;

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [foundUser, setFoundUser] = useState<any | null>(null);
  const [searchingUser, setSearchingUser] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
  const [previousInvitations, setPreviousInvitations] = useState<TeamInvitation[]>([]);
  const [systemRoles, setSystemRoles] = useState<SystemRole[]>([]);
  const { user } = useAuth();

  // Fetch team members, roles, and invitations
  useEffect(() => {
    async function fetchData() {
      try {
        if (!user) {
          setMembers([]);
          setRoles([]);
          setPendingInvitations([]);
          setPreviousInvitations([]);
          setLoading(false);
          return;
        }

        // Önce sistem rollerini al
        const systemRoles = await rolesService.getSystemRoles(user.uid);
        
        // Kullanıcının rollerini kontrol et
        let roleNames: string[] = [];
        
        // Kullanıcı bilgilerini al
        const userData = await userService.getUser(user.uid);
        const userRoleIds = userData.systemRoleIds || [];
        
        // Kullanıcının Admin rolü var mı kontrol et
        const hasAdminRole = userRoleIds.some(roleId => {
          const role = systemRoles.find(r => r.id === roleId);
          return role && role.name === 'Admin';
        });
        
        if (hasAdminRole) {
          // Admin kullanıcıları tüm rolleri görebilir
          roleNames = systemRoles.map(role => role.name);
        } else {
          // Admin olmayan kullanıcılar sadece kendi rollerini ve Default rolünü görebilir
          const userRoles = systemRoles.filter(role => 
            userRoleIds.includes(role.id) || role.name === 'Default'
          );
          roleNames = userRoles.map(role => role.name);
        }
        
        console.log("User-specific roles:", roleNames);

        // Takım üyelerini ve davetleri al
        const membersData = await teamService.getTeamMembers(user.uid);
        const allInvitationsData = await invitationService.getInvitationsSentByUser(user.uid);
        
        // Davetleri, bekleyen ve tamamlanmış olarak ayır
        const pendingInvs = allInvitationsData.filter(inv => inv.status === 'pending');
        const completedInvs = allInvitationsData.filter(inv => inv.status === 'accepted' || inv.status === 'rejected');
        
        // Davetleri tarihe göre sırala (en yeniden en eskiye)
        const sortedPendingInvs = pendingInvs.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        const sortedCompletedInvs = completedInvs.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        
        console.log("Pending invitations:", sortedPendingInvs);
        console.log("Previous invitations:", sortedCompletedInvs);
        
        setMembers(membersData || []);
        setRoles(roleNames || []); // Sistem rollerinin isimlerini kullan
        setSystemRoles(systemRoles); // Tüm sistem rollerini sakla
        setPendingInvitations(sortedPendingInvs);
        setPreviousInvitations(sortedCompletedInvs);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error("Failed to load team members");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  // Filter members based on search query
  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Initialize form
  const form = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberFormSchema),
    defaultValues: {
      userCode: "",
      role: "",
    },
  });

  // Look up user by code
  async function handleUserCodeSearch(userCode: string) {
    if (!userCode || !user) return;
    
    setSearchingUser(true);
    try {
      const foundUserData = await userService.getUserByCode(userCode);
      console.log("Found user data:", foundUserData); // Bulunan kullanıcı hakkında detaylı bilgi
      setFoundUser(foundUserData);
      if (!foundUserData) {
        toast.error("User not found with that code");
      }
    } catch (error) {
      console.error('Error searching for user:', error);
      toast.error("Failed to search for user");
      setFoundUser(null);
    } finally {
      setSearchingUser(false);
    }
  }

  // Handle form submission
  async function onSubmit(values: InviteMemberFormValues) {
    try {
      if (!foundUser) {
        toast.error("Please find a valid user first");
        return;
      }

      if (!user) {
        toast.error("You must be logged in to invite members");
        return;
      }

      // Seçilen rolü bul
      const selectedRoleObj = systemRoles.find((role: SystemRole) => role.name === values.role);
      if (!selectedRoleObj) {
        toast.error(`Role "${values.role}" not found`);
        return;
      }

      console.log("Creating invitation with selected role:", {
        role: values.role,
        roleId: selectedRoleObj.id,
        permissions: selectedRoleObj.permissions,
        description: selectedRoleObj.description
      });

      console.log("Creating invitation with:", {
        inviterId: user.uid,
        inviterName: user.displayName || "Unknown User",
        inviteeId: foundUser.id, // Firestore ID'sini kullanıyoruz
        inviteeName: foundUser.name,
        role: values.role
      });

      // Create invitation
      const invitation = await invitationService.createInvitation(user.uid, {
        inviterId: user.uid,
        inviterName: user.displayName || "Unknown User",
        inviteeId: foundUser.id, // Firestore ID'sini kullanıyoruz
        inviteeName: foundUser.name,
        role: values.role,
      });

      console.log("Created invitation:", invitation);
      
      // Daveti doğrudan ekle, her iki ID'yi de kullan (Firestore ID ve Firebase UID)
      if (foundUser.uid) {
        console.log("User also has a Firebase UID:", foundUser.uid);
        try {
          // Eğer kullanıcının bir Firebase UID'si varsa, aynı daveti bu UID ile de oluştur
          // Bu sadece bir workaround, normalde ID eşleştirme daha tutarlı olmalı
          await invitationService.createInvitation(user.uid, {
            inviterId: user.uid,
            inviterName: user.displayName || "Unknown User", 
            inviteeId: foundUser.uid, // Firebase UID kullan
            inviteeName: foundUser.name,
            role: values.role,
          });
          console.log("Created additional invitation with Firebase UID");
        } catch (err) {
          console.error("Error creating additional invitation:", err);
        }
      }

      // Yeni daveti listeye ekle, en yeni davetler önce gösterilecek şekilde
      setPendingInvitations(prev => [invitation, ...prev]);
      
      toast.success(`Invitation sent to ${foundUser.name}`);
      
      setIsAddMemberOpen(false);
      form.reset();
      setFoundUser(null);
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error("Failed to send invitation");
    }
  }

  // Handle member deletion
  async function handleDeleteMember(id: string) {
    try {
      if (!user) {
        toast.error("You must be logged in to perform this action");
        return;
      }
      
      await teamService.deleteTeamMember(user.uid, id);
      setMembers(prev => prev.filter(member => member.id !== id));
      toast.success("Team member removed successfully");
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast.error("Failed to remove team member");
    }
  }

  // Handle invitation cancellation
  async function handleCancelInvitation(id: string) {
    try {
      if (!user) {
        toast.error("You must be logged in to perform this action");
        return;
      }
      
      await invitationService.deleteInvitation(user.uid, id);
      setPendingInvitations(prev => prev.filter(invitation => invitation.id !== id));
      toast.success("Invitation cancelled");
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error("Failed to cancel invitation");
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading team members...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Team</h1>
              <div className="flex flex-col space-y-1">
                <p className="text-muted-foreground">
                  Manage your team members and their roles
                </p>
                {roles.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Available Roles:</span> You can assign {roles.length} role(s): {roles.join(', ')}
                  </p>
                )}
              </div>
            </div>
            <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Invite a new member to your team using their user code.
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
                                <p>User codes can be found in the profile settings of each user. Ask the user to share their unique code with you to invite them.</p>
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
                    {foundUser && (
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {roles.map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {role}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="mt-2 text-xs text-muted-foreground">
                              {roles.length === 0 ? (
                                <p>You don't have any roles to assign.</p>
                              ) : roles.length === 1 ? (
                                <p>You can assign the Default role.</p>
                              ) : (
                                <p>You can assign {roles.length} roles based on your permissions.</p>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={!foundUser || searchingUser || !form.watch("role")}
                        onClick={() => {
                          // Debug için log yazdır
                          console.log("Form values:", form.getValues());
                          console.log("Found user:", foundUser);
                          console.log("Role selected:", form.watch("role"));
                        }}
                      >
                        Send Invitation
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Team Members</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredMembers.length > 0 ? (
                <div className="space-y-4">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={member.avatarUrl} />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                          {member.role}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteMember(member.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">No team members found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Invitations Section */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingInvitations.length > 0 ? (
                <div className="space-y-4">
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 rounded-md border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>{invitation.inviteeName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{invitation.inviteeName}</p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Mail className="mr-1 h-3 w-3" />
                            <span>Invitation sent</span>
                          </div>
                          {invitation.createdAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(invitation.createdAt).toLocaleDateString()} at {new Date(invitation.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                          {invitation.role} (Pending)
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleCancelInvitation(invitation.id)}
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No pending invitations</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Previous Invitations Section */}
          <Card>
            <CardHeader>
              <CardTitle>Previous Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              {previousInvitations.length > 0 ? (
                <div className="space-y-4">
                  {previousInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className={`flex items-center justify-between p-3 rounded-md border ${
                        invitation.status === 'accepted' 
                          ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900' 
                          : 'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>{invitation.inviteeName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{invitation.inviteeName}</p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            {invitation.status === 'accepted' ? (
                              <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                            ) : (
                              <XCircle className="mr-1 h-3 w-3 text-red-500" />
                            )}
                            <span>
                              {invitation.status === 'accepted' 
                                ? 'Invitation accepted' 
                                : 'Invitation rejected'
                              }
                            </span>
                          </div>
                          {invitation.updatedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(invitation.updatedAt).toLocaleDateString()} at {new Date(invitation.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          invitation.status === 'accepted'
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}>
                          {invitation.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No previous invitations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
} 