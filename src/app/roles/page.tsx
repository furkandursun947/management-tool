"use client";
import Link from "next/link";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useRoles } from "@/contexts/roles-context";
import { Badge } from "@/components/ui/badge";

export default function RolesPage() {
  const { systemRoles, loading, error } = useRoles();

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
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="text-destructive">
                  Error loading roles: {error.message}
                </div>
              ) : systemRoles.length === 0 ? (
                <p className="text-muted-foreground">No roles defined yet.</p>
              ) : (
                <div className="space-y-4">
                  {systemRoles.map((role) => (
                    <div
                      key={role.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <h3 className="font-medium">{role.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {role.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {role.permissions.map((permission) => (
                            <Badge key={permission} variant="secondary">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/roles/${role.id}`}>Edit</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
} 