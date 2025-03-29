import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { useFirebase } from "@/contexts/firebase-context";
import { LogOut, User as UserIcon, Settings, Copy } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// Update the User interface to include userCode property
declare module "@/contexts/auth-context" {
    interface User {
        userCode?: string;
    }
}

export function UserNav() {
    const { user, firebaseUser } = useAuth();
    const { logout } = useFirebase();
    const [showCode, setShowCode] = useState(false);

    const copyUserCode = () => {
        if (user && 'userCode' in user && typeof user.userCode === 'string') {
            navigator.clipboard.writeText(user.userCode);
            toast.success("User code copied to clipboard");
        } else {
            toast.error("User code not available");
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            toast.success("Logged out successfully");
        } catch (error) {
            console.error("Logout error:", error);
            toast.error("Failed to log out");
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={firebaseUser?.photoURL || undefined} alt={user?.name || "User"} />
                        <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem>
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowCode(!showCode)}>
                        {showCode ? (
                            <div className="flex items-center w-full">
                                <span className="ml-6 flex-1 text-sm font-mono">
                                    {user && 'userCode' in user && typeof user.userCode === 'string'
                                        ? user.userCode
                                        : "No code"}
                                </span>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                copyUserCode();
                                            }}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Copy user code</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        ) : (
                            <>
                                <span className="mr-2">👤</span>
                                <span>Show User Code</span>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="ml-2">
                                            <span className="relative flex h-4 w-4 cursor-help">
                                                <span className="h-4 w-4 text-muted-foreground">ℹ️</span>
                                            </span>
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Share your user code with others so they can invite you to their team</p>
                                    </TooltipContent>
                                </Tooltip>
                            </>
                        )}
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
} 