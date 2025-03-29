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
  userCode: z.string().min(1, "Kullanıcı kodu zorunludur"),
  role: z.string().min(1, "Rol zorunludur"),
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
      role: "Üye", // Varsayılan rol
    },
  });

  // Kullanıcı koduna göre arama
  async function handleUserCodeSearch(userCode: string) {
    if (!userCode || !user) return;
    
    setSearchingUser(true);
    try {
      const foundUserData = await userService.getUserByCode(userCode);
      console.log("Bulunan kullanıcı:", foundUserData);
      setFoundUser(foundUserData);
      if (!foundUserData) {
        toast.error("Bu koda sahip bir kullanıcı bulunamadı");
      }
    } catch (error) {
      console.error('Kullanıcı aranırken hata oluştu:', error);
      toast.error("Kullanıcı arama işlemi başarısız oldu");
      setFoundUser(null);
    } finally {
      setSearchingUser(false);
    }
  }

  async function onSubmit(values: FormValues) {
    try {
      if (!foundUser) {
        toast.error("Lütfen önce geçerli bir kullanıcı bulun");
        return;
      }

      if (!user) {
        toast.error("Üye davet etmek için giriş yapmalısınız");
        return;
      }

      setLoading(true);

      console.log("Takım daveti oluşturuluyor:", {
        inviterId: user.uid,
        inviterName: user.displayName || "Bilinmeyen Kullanıcı",
        inviteeId: foundUser.id,
        inviteeName: foundUser.name,
        teamId,
        teamName,
        role: values.role
      });

      // Davet oluştur
      await invitationService.createInvitation(user.uid, {
        inviterId: user.uid,
        inviterName: user.displayName || "Bilinmeyen Kullanıcı",
        inviterEmail: user.email || "",
        inviteeId: foundUser.id,
        inviteeName: foundUser.name,
        role: values.role,
        teamId,
        teamName,
      });

      // Eğer kullanıcının bir Firebase UID'si varsa, ek bir davet oluştur
      if (foundUser.uid && foundUser.uid !== foundUser.id) {
        console.log("Kullanıcının Firebase UID'si var:", foundUser.uid);
        try {
          await invitationService.createInvitation(user.uid, {
            inviterId: user.uid,
            inviterName: user.displayName || "Bilinmeyen Kullanıcı",
            inviterEmail: user.email || "",
            inviteeId: foundUser.uid,
            inviteeName: foundUser.name,
            role: values.role,
            teamId,
            teamName,
          });
          console.log("Firebase UID ile ek davet oluşturuldu");
        } catch (err) {
          console.error("Ek davet oluşturulurken hata:", err);
        }
      }

      toast.success(`${foundUser.name} kullanıcısı "${teamName}" takımına davet edildi`);
      
      form.reset();
      setFoundUser(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Davet gönderilirken hata oluştu:', error);
      toast.error("Davet gönderilemedi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Takıma Üye Davet Et</DialogTitle>
          <DialogDescription>
            Kullanıcı kodunu girerek "{teamName}" takımınıza yeni bir üye davet edin.
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
                    Kullanıcı Kodu
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-80">
                        <p>Kullanıcı kodları, her kullanıcının profil ayarlarında bulunur. Davet etmek istediğiniz kişiden benzersiz kodunu size vermesini isteyin.</p>
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <div className="flex space-x-2">
                    <FormControl>
                      <Input 
                        placeholder="Kullanıcı kodu girin" 
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
                      {searchingUser ? "Aranıyor..." : "Ara"}
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
                  <FormLabel>Rol</FormLabel>
                  <FormControl>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Rol seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Üye">Üye</SelectItem>
                        <SelectItem value="Yönetici">Yönetici</SelectItem>
                        <SelectItem value="Gözlemci">Gözlemci</SelectItem>
                        <SelectItem value="Geliştirici">Geliştirici</SelectItem>
                        <SelectItem value="Tasarımcı">Tasarımcı</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="submit" 
                disabled={loading || !foundUser}
              >
                {loading ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"></span>
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Davet Gönder
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