"use client";

import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamInvitations } from "@/components/dashboard/team-invitations";
import { TeamsGrid } from "@/components/dashboard/teams-grid";
import { UserTeams } from "@/components/dashboard/user-teams";

export default function TeamPage() {
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
            <p className="text-muted-foreground">
              Manage your teams and invite team members.
            </p>
          </div>

          {/* Teams Grid Component */}
          <TeamsGrid />

          {/* Team invitations component */}
          <div className="pt-6">
            <TeamInvitations />
          </div>

          {/* Teams user is a member of component */}
          <div className="pt-2">
            <UserTeams />
          </div>
        </div>
      </div>
    </Layout>
  );
} 