"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./theme/theme-toggle";
import { Bell, Search, User, Menu } from "lucide-react";
import { Button } from "./ui/button";

export default function Header() {
  return (
    <header className="sticky  top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full flex h-14 items-center px-6">
        <div className="md:hidden mr-2">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-lg">Life Manager</span>
          </Link>
        </div>
        
        
        {/* Search */}
        <div className="flex-1 flex items-center justify-center px-2">
          <div className="w-full max-w-md lg:max-w-sm relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search..." 
              className="w-full bg-background pl-8 md:w-[300px] lg:w-[400px]" 
            />
          </div>
        </div>
        
        {/* Right side icons */}
        <div className="flex items-center space-x-1">
          <Button className="cursor-pointer" variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          <Button className="cursor-pointer" variant="ghost" size="icon">
            <User className="h-5 w-5" />
            <span className="sr-only">User</span>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}