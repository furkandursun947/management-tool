"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { useFirebase } from "@/contexts/firebase-context";
import { userService } from "@/services/user-service";
import { toast } from "sonner";
import { Check, Copy, Save } from "lucide-react";
import { useTeams } from "@/contexts/teams-context";

export default function ProfilePage() {
  const { user, firebaseUser } = useAuth();
  const { logout } = useFirebase();
  const { teams } = useTeams();
  const router = useRouter();
  
  const [displayName, setDisplayName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  
  // Load profile information
  useEffect(() => {
    if (user) {
      setDisplayName(user.name || "");
    }
  }, [user]);
  
  // Update user data
  const handleUpdateProfile = async () => {
    if (!user || !displayName.trim()) return;
    
    try {
      setIsUpdating(true);
      await userService.updateUser(user.id, { name: displayName });
      toast.success("Profile updated");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Copy user code to clipboard
  const copyUserCode = () => {
    if (user && 'userCode' in user && typeof user.userCode === 'string') {
      navigator.clipboard.writeText(user.userCode);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
      toast.success("User code copied to clipboard");
    } else {
      toast.error("User code not found");
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Failed to log out");
    }
  };
  
  // If user is not logged in
  if (!user || !firebaseUser) {
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <Card>
            <CardHeader>
              <CardTitle>Profile page</CardTitle>
              <CardDescription>Please log in to view your profile information</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => router.push("/login")}>Log In</Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }
  
  // Calculate user's owned teams
  const ownedTeams = teams.filter(team => team.ownerId === user.id);
  
  return (
    <Layout>
      <div className="container mx-auto py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Left Profile Summary Section */}
          <div>
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={firebaseUser?.photoURL || undefined} alt={user.name} />
                    <AvatarFallback className="text-2xl">
                      {user.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle>{user.name}</CardTitle>
                <CardDescription className="text-center">{user.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">User Code</span>
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                        {user.userCode || "N/A"}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={copyUserCode}
                        className="h-7 w-7"
                      >
                        {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <span className="text-sm font-medium block mb-2">Team Statistics</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col items-center rounded-lg border p-2">
                        <span className="text-2xl font-bold">{teams.length}</span>
                        <span className="text-xs text-muted-foreground">Total Teams</span>
                      </div>
                      <div className="flex flex-col items-center rounded-lg border p-2">
                        <span className="text-2xl font-bold">{ownedTeams.length}</span>
                        <span className="text-xs text-muted-foreground">Owned Teams</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="pt-2 flex justify-center">
                    <Button variant="outline" className="w-full" onClick={handleLogout}>
                      Log Out
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Content Area - Profile Information */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Edit your personal information here
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    value={user.email}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Email address cannot be changed
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userCode">User Code</Label>
                  <div className="flex">
                    <Input 
                      id="userCode" 
                      value={user.userCode || ""}
                      readOnly
                      className="font-mono"
                    />
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={copyUserCode}
                      className="ml-2"
                    >
                      {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this code with team owners to be invited to their teams
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleUpdateProfile} 
                  disabled={isUpdating || !displayName.trim()}
                  className="ml-auto"
                >
                  {isUpdating ? "Updating..." : "Save Changes"}
                  {!isUpdating && <Save className="ml-2 h-4 w-4" />}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
} 