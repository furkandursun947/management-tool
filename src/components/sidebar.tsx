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
  ChevronRight,
  FolderOpen,
  Plus,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState, useEffect } from "react";
import { projects } from "@/data/projects";
import { motion, AnimatePresence } from "framer-motion";

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
  const pathname = usePathname();
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  
  // Auto-expand the projects dropdown if the current route is a project route
  useEffect(() => {
    if (pathname?.includes('/projects/')) {
      setIsProjectsOpen(true);
    }
  }, [pathname]);

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
          
          {/* Projects dropdown */}
          {projects.length > 0 ? (
            <Collapsible
              open={isProjectsOpen}
              onOpenChange={setIsProjectsOpen}
              className="w-full"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors duration-200 cursor-pointer">
                <div className="flex items-center gap-3">
                  <ListTodo className="h-4 w-4" />
                  <span>Projects</span>
                </div>
                <motion.div
                  animate={{ rotate: isProjectsOpen ? 90 : 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <ChevronRight className="h-4 w-4" />
                </motion.div>
              </CollapsibleTrigger>
              <AnimatePresence>
                {isProjectsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ 
                      height: "auto", 
                      opacity: 1 
                    }}
                    exit={{ 
                      height: 0, 
                      opacity: 0,
                      transition: {
                        height: { duration: 0.3 },
                        opacity: { duration: 0.2 }
                      }
                    }}
                    transition={{ 
                      height: { duration: 0.3, ease: [0.33, 1, 0.68, 1] },
                      opacity: { duration: 0.2, ease: "easeInOut" }
                    }}
                    className="overflow-hidden"
                  >
                    <CollapsibleContent className="pl-6 pt-1">
                      <div className="space-y-1">
                        {/* Show up to 3 most recent projects */}
                        {projects.slice(0, 3).map((project, index) => (
                          <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ 
                              delay: index * 0.05,
                              duration: 0.2
                            }}
                          >
                            <Link
                              href={`/projects/${project.id}`}
                              className={cn(
                                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors duration-200",
                                pathname === `/projects/${project.id}`
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                              )}
                            >
                              <FolderOpen className="h-4 w-4" />
                              <span className="truncate">{project.name}</span>
                            </Link>
                          </motion.div>
                        ))}
                        {/* Show More option if more than 3 projects */}
                        {projects.length > 3 && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ 
                              delay: 0.15,
                              duration: 0.2
                            }}
                          >
                            <Link
                              href="/projects"
                              className={cn(
                                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors duration-200",
                                pathname === "/projects"
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                              )}
                            >
                              <Plus className="h-4 w-4" />
                              <span>More</span>
                            </Link>
                          </motion.div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Collapsible>
          ) : (
            <SidebarItem
              href="/projects"
              icon={<ListTodo className="h-4 w-4" />}
              title="Projects"
            />
          )}
          
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