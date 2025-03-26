"use client";
import Link from "next/link";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function RolesPage() {
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
              <p className="text-muted-foreground">
                Manage team roles and permissions
              </p>
            </div>
            <Button asChild>
              <Link href="/roles/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Role
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Team Roles</CardTitle>
              <CardDescription>
                Define and manage roles for your team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Role list will go here */}
                <p className="text-muted-foreground">No roles defined yet.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
} 