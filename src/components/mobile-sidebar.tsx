"use client";

import { useState, useEffect } from "react";
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
import { motion, AnimatePresence } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
    >
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
    </motion.div>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Debug logging
  useEffect(() => {
    console.log("Mobile sidebar open state:", open);
  }, [open]);

  const handleToggle = () => {
    console.log("Toggle button clicked, current state:", open);
    setOpen(!open);
  };

  // For debugging purposes, uncomment to force sidebar open
  // useEffect(() => {
  //   setOpen(true);
  // }, []);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={handleToggle}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu {open ? 'on' : 'off'}</span>
      </Button>
      
      {/* Overlay - only shown when sidebar is open */}
      {open && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[49] bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      
      {/* Sidebar - always rendered but positioned off-screen when closed */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: open ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        style={{ pointerEvents: open ? 'auto' : 'none' }} 
        className="fixed inset-y-0 left-0 z-[50] w-72 border-r bg-sidebar p-6 shadow-lg md:hidden"
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
        </motion.div>
      </motion.div>
    </>
  );
} 