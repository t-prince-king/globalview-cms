import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  profiles: {
    display_name: string | null;
  };
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserRole[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    display_name: "",
    role: "editor",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select(`
        id,
        user_id,
        role,
        profiles!user_roles_user_id_fkey (display_name)
      `)
      .order("role");

    if (data) {
      setUsers(data as any);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.display_name,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Add role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert([{
            user_id: authData.user.id,
            role: formData.role as "admin" | "editor" | "viewer",
          }]);

        if (roleError) throw roleError;

        toast.success("User created successfully!");
        setShowForm(false);
        setFormData({ email: "", password: "", display_name: "", role: "editor" });
        fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
    }
  };

  const handleDeleteUser = async (userId: string, roleId: string) => {
    if (!confirm("Are you sure you want to remove this user's role?")) return;

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      toast.success("User role removed");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove user role");
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-100">User Management</CardTitle>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            {showForm ? "Cancel" : "Add User"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleCreateUser} className="space-y-4 mb-6 p-4 bg-slate-800 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-slate-700 border-slate-600 text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                className="bg-slate-700 border-slate-600 text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_name" className="text-slate-300">Display Name</Label>
              <Input
                id="display_name"
                placeholder="John Doe"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                required
                className="bg-slate-700 border-slate-600 text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-slate-300">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full">Create User</Button>
          </form>
        )}

        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
            >
              <div>
                <p className="font-medium text-slate-100">
                  {user.profiles.display_name || "Unknown User"}
                </p>
                <p className="text-sm text-slate-400 capitalize">{user.role}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteUser(user.user_id, user.id)}
              >
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};