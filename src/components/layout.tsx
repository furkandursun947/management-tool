"use client";

import { ReactNode } from "react";
import Sidebar from "./sidebar";
import Header from "./header";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex min-h-screen flex-col">
        <Sidebar />
        <div className="flex flex-1 flex-col md:pl-64">
          <main className="flex-1 p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 