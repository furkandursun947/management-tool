"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import {
  BarChart,
  Calendar,
  CheckSquare,
  LayoutDashboard,
  ListTodo,
  Settings,
  Users,
} from "lucide-react";

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  onClose: () => void;
}

function MobileSidebarItem({ href, icon, title, onClose }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
      )}
    >
      {icon}
      <span>{title}</span>
    </Link>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>
      
      {/* Overlay */}
      {open && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r bg-sidebar p-6 shadow-lg transition-transform duration-300 md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg" onClick={() => setOpen(false)}>
            Life Manager
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="space-y-1">
            <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
              Workspace
            </h2>
            <div className="space-y-1">
              <MobileSidebarItem
                href="/"
                icon={<LayoutDashboard className="h-4 w-4" />}
                title="Dashboard"
                onClose={() => setOpen(false)}
              />
              <MobileSidebarItem
                href="/projects"
                icon={<ListTodo className="h-4 w-4" />}
                title="Projects"
                onClose={() => setOpen(false)}
              />
              <MobileSidebarItem
                href="/tasks"
                icon={<CheckSquare className="h-4 w-4" />}
                title="Tasks"
                onClose={() => setOpen(false)}
              />
              <MobileSidebarItem
                href="/calendar"
                icon={<Calendar className="h-4 w-4" />}
                title="Calendar"
                onClose={() => setOpen(false)}
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
              Reports
            </h2>
            <div className="space-y-1">
              <MobileSidebarItem
                href="/analytics"
                icon={<BarChart className="h-4 w-4" />}
                title="Analytics"
                onClose={() => setOpen(false)}
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
              Management
            </h2>
            <div className="space-y-1">
              <MobileSidebarItem
                href="/team"
                icon={<Users className="h-4 w-4" />}
                title="Team"
                onClose={() => setOpen(false)}
              />
              <MobileSidebarItem
                href="/settings"
                icon={<Settings className="h-4 w-4" />}
                title="Settings"
                onClose={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 