"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
}

function SidebarItem({ href, icon, title }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
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

export default function Sidebar() {
  return (
    <div className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r bg-sidebar pb-10 pt-14 md:flex">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Workspace
        </h2>
        <div className="space-y-1">
          <SidebarItem
            href="/"
            icon={<LayoutDashboard className="h-4 w-4" />}
            title="Dashboard"
          />
          <SidebarItem
            href="/projects"
            icon={<ListTodo className="h-4 w-4" />}
            title="Projects"
          />
          <SidebarItem
            href="/tasks"
            icon={<CheckSquare className="h-4 w-4" />}
            title="Tasks"
          />
          <SidebarItem
            href="/calendar"
            icon={<Calendar className="h-4 w-4" />}
            title="Calendar"
          />
        </div>
        <h2 className="mt-6 mb-2 px-4 text-lg font-semibold tracking-tight">
          Reports
        </h2>
        <div className="space-y-1">
          <SidebarItem
            href="/analytics"
            icon={<BarChart className="h-4 w-4" />}
            title="Analytics"
          />
        </div>
        <h2 className="mt-6 mb-2 px-4 text-lg font-semibold tracking-tight">
          Management
        </h2>
        <div className="space-y-1">
          <SidebarItem
            href="/team"
            icon={<Users className="h-4 w-4" />}
            title="Team"
          />
          <SidebarItem
            href="/settings"
            icon={<Settings className="h-4 w-4" />}
            title="Settings"
          />
        </div>
      </div>
    </div>
  );
} 