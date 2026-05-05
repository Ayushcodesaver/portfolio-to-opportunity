import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageLoader } from "@/components/common/PageHeader";
import { format } from "date-fns";

export default function UserManagement() {
  const { data, isLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*, user_roles(role)").order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });

  if (isLoading) return <PageLoader />;
  return (
    <div className="container max-w-6xl py-8">
      <PageHeader title="User Management" description={`${data?.length ?? 0} users.`} />
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">User</th><th className="p-3">Username</th><th className="p-3">Roles</th>
              <th className="p-3">Status</th><th className="p-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((u: any) => (
              <tr key={u.id} className="border-t border-border/50">
                <td className="p-3 font-medium">{u.full_name}</td>
                <td className="p-3 text-muted-foreground">@{u.username}</td>
                <td className="p-3">
                  {(u.user_roles ?? []).map((r: any) => (
                    <span key={r.role} className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary-glow mr-1">{r.role}</span>
                  ))}
                </td>
                <td className="p-3">
                  {u.is_banned ? <span className="text-destructive">Banned</span> : <span className="text-success">Active</span>}
                </td>
                <td className="p-3 text-muted-foreground">{format(new Date(u.created_at), "MMM d, yyyy")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
