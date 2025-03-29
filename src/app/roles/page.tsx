"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, RefreshCw } from "lucide-react";
import { useRoles } from "@/contexts/roles-context";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SystemRole } from "@/services/roles-service";

export default function RolesPage() {
  // Başlangıç loading durumu true, ilk yükleme için
  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState<Error | null>(null);
  const [localRoles, setLocalRoles] = useState<SystemRole[]>([]);
  
  // Contextden sadece refreshSystemRoles fonksiyonunu alıyoruz
  const { refreshSystemRoles } = useRoles();
  const dataFetchedRef = useRef(false);

  // Sadece bir kez çalışacak useEffect
  useEffect(() => {
    const fetchRoles = async () => {
      if (dataFetchedRef.current) return;

      setLocalLoading(true);
      try {
        // Rolleri getir
        const roles = await refreshSystemRoles();
        setLocalRoles(roles || []);
        dataFetchedRef.current = true;
      } catch (error) {
        console.error('Error fetching roles:', error);
        setLocalError(error instanceof Error ? error : new Error('Failed to fetch roles'));
        toast.error('Failed to load roles');
      } finally {
        setLocalLoading(false);
      }
    };

    fetchRoles();

    // Cleanup
    return () => {
      dataFetchedRef.current = false;
    };
  }, []); // Boş bağımlılık dizisi, sadece bir kez çalışması için

  // Manuel yenileme fonksiyonu
  const handleRefresh = async () => {
    setLocalLoading(true);
    try {
      const roles = await refreshSystemRoles();
      setLocalRoles(roles || []);
      toast.success('Roles refreshed successfully');
    } catch (error) {
      console.error('Error refreshing roles:', error);
      setLocalError(error instanceof Error ? error : new Error('Failed to refresh roles'));
      toast.error('Failed to refresh roles');
    } finally {
      setLocalLoading(false);
    }
  };

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
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefresh} disabled={localLoading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button asChild>
                <Link href="/roles/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Role
                </Link>
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Team Roles</CardTitle>
              <CardDescription>
                Define and manage roles for your team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {localLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : localError ? (
                <div className="text-destructive">
                  Error loading roles: {localError.message}
                </div>
              ) : localRoles.length === 0 ? (
                <p className="text-muted-foreground">No roles defined yet.</p>
              ) : (
                <div className="space-y-4">
                  {localRoles.map((role) => (
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
                          {role.permissions && role.permissions.length > 0 ? role.permissions.map((permission) => (
                            <Badge key={permission} variant="secondary">
                              {permission}
                            </Badge>
                          )) : (
                            <span className="text-xs text-muted-foreground">No permissions</span>
                          )}
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