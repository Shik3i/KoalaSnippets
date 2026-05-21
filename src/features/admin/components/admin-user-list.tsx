"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Shield } from "lucide-react";

interface AdminUser {
  id: string;
  username: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  snippetCount: number;
}

export function AdminUserList() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (userId: string, username: string) => {
    if (!confirm(`Delete user "${username}" and all their snippets?`)) return;

    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (res.ok) {
      fetchUsers();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-10 bg-muted/30 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">User Management ({users.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2 px-3 font-medium">Username</th>
                <th className="text-left py-2 px-3 font-medium">Role</th>
                <th className="text-left py-2 px-3 font-medium">Snippets</th>
                <th className="text-left py-2 px-3 font-medium">Joined</th>
                <th className="text-right py-2 px-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border/50">
                  <td className="py-2.5 px-3 font-medium">{user.username}</td>
                  <td className="py-2.5 px-3">
                    {user.role === "ADMIN" ? (
                      <Badge variant="default" className="gap-1 text-xs">
                        <Shield size={10} suppressHydrationWarning />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">User</Badge>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">{user.snippetCount}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    {mounted ? new Date(user.createdAt).toLocaleDateString() : ""}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {user.role !== "ADMIN" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(user.id, user.username)}
                        aria-label={`Delete user ${user.username}`}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 size={14} suppressHydrationWarning />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
