import { getSession } from "@/features/auth/utils/session";
import { Sidebar } from "@/features/core/components/sidebar";

export const dynamic = "force-dynamic";

export default async function ToolsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <div className="flex h-screen">
      <Sidebar
        isAuthenticated={!!session}
        isAdmin={session?.user?.role === "ADMIN"}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
