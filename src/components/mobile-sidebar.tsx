"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronRight, FolderOpen, Plus } from "lucide-react";
import {
  BarChart,
  Calendar,
  CheckSquare,
  LayoutDashboard,
  ListTodo,
  Settings,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProjects } from "@/contexts/projects-context";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  const pathname = usePathname();
  const { projects, loading } = useProjects();
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);

  // Auto-expand the projects dropdown if the current route is a project route
  useEffect(() => {
    if (pathname?.includes('/projects/')) {
      setIsProjectsOpen(true);
    }
  }, [pathname]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-sidebar md:hidden"
            >
              <div className="flex h-14 items-center border-b px-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-2"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close sidebar</span>
                </Button>
                <span className="text-lg font-semibold">Menu</span>
              </div>

              <motion.div 
                className="mt-8 space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: open ? 1 : 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
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
                                  {loading ? (
                                    // Loading skeleton for projects
                                    Array.from({ length: 3 }).map((_, i) => (
                                      <div key={i} className="flex items-center gap-2 px-3 py-2">
                                        <Skeleton className="h-4 w-4" />
                                        <Skeleton className="h-4 w-24" />
                                      </div>
                                    ))
                                  ) : (
                                    <>
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
                                            onClick={() => setOpen(false)}
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
                                            onClick={() => setOpen(false)}
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
                                    </>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Collapsible>
                    ) : (
                      <MobileSidebarItem
                        href="/projects"
                        icon={<ListTodo className="h-4 w-4" />}
                        title="Projects"
                        onClose={() => setOpen(false)}
                      />
                    )}
                    
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
                      href="/roles"
                      icon={<Shield className="h-4 w-4" />}
                      title="Roles"
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
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
} 