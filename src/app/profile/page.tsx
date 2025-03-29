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
  
  // Profil bilgilerini yükle
  useEffect(() => {
    if (user) {
      setDisplayName(user.name || "");
    }
  }, [user]);
  
  // Kullanıcı verilerini güncelle
  const handleUpdateProfile = async () => {
    if (!user || !displayName.trim()) return;
    
    try {
      setIsUpdating(true);
      await userService.updateUser(user.id, { name: displayName });
      toast.success("Profil güncellendi");
    } catch (error) {
      console.error("Profil güncellenirken hata:", error);
      toast.error("Profil güncellenemedi");
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Kullanıcı kodunu panoya kopyala
  const copyUserCode = () => {
    if (user && 'userCode' in user && typeof user.userCode === 'string') {
      navigator.clipboard.writeText(user.userCode);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
      toast.success("Kullanıcı kodu panoya kopyalandı");
    } else {
      toast.error("Kullanıcı kodu bulunamadı");
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Çıkış yapıldı");
      router.push("/login");
    } catch (error) {
      console.error("Çıkış yapılırken hata:", error);
      toast.error("Çıkış yapılamadı");
    }
  };
  
  // Kullanıcı yoksa veya oturum açmamışsa
  if (!user || !firebaseUser) {
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <Card>
            <CardHeader>
              <CardTitle>Profil sayfası</CardTitle>
              <CardDescription>Profil bilgilerinizi görüntülemek için giriş yapın</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => router.push("/login")}>Giriş Yap</Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }
  
  // Kullanıcının sahip olduğu takımları hesapla
  const ownedTeams = teams.filter(team => team.ownerId === user.id);
  
  return (
    <Layout>
      <div className="container mx-auto py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Sol Profil Özeti Bölümü */}
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
                    <span className="text-sm font-medium">Kullanıcı Kodu</span>
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
                    <span className="text-sm font-medium block mb-2">Takım İstatistikleri</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col items-center rounded-lg border p-2">
                        <span className="text-2xl font-bold">{teams.length}</span>
                        <span className="text-xs text-muted-foreground">Toplam Takım</span>
                      </div>
                      <div className="flex flex-col items-center rounded-lg border p-2">
                        <span className="text-2xl font-bold">{ownedTeams.length}</span>
                        <span className="text-xs text-muted-foreground">Sahip Olduğunuz</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="pt-2 flex justify-center">
                    <Button variant="outline" className="w-full" onClick={handleLogout}>
                      Çıkış Yap
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Sağ Taraftaki İçerik Alanı - Artık direkt Profil Bilgileri */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Profil Bilgileri</CardTitle>
                <CardDescription>
                  Kişisel bilgilerinizi burada düzenleyebilirsiniz
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">İsim</Label>
                  <Input 
                    id="name" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input 
                    id="email" 
                    value={user.email}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    E-posta adresi değiştirilemez
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userCode">Kullanıcı Kodu</Label>
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
                    Bu kodu takım üyelerine vererek sizi davet etmelerini sağlayabilirsiniz
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleUpdateProfile} 
                  disabled={isUpdating || !displayName.trim()}
                  className="ml-auto"
                >
                  {isUpdating ? "Güncelleniyor..." : "Değişiklikleri Kaydet"}
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