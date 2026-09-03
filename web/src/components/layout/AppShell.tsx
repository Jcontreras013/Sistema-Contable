import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LogOut, Landmark, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { navItems } from "@/components/layout/nav";
import { cn } from "@/lib/utils";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

export function AppShell() {
  const { user, hasRole, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const visibleItems = navItems.filter((item) => !item.roles || hasRole(...item.roles));

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <aside
        className={cn(
          "flex shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-4">
          <Landmark className="h-6 w-6 shrink-0 text-primary" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">Sistema Contable</p>
              <p className="truncate text-xs text-muted-foreground">Honduras · HNL / USD</p>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/80 hover:bg-accent hover:text-accent-foreground",
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          {!collapsed && (
            <div className="mb-2 px-1">
              <p className="truncate text-sm font-medium">{user?.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email} · {roleLabel(user?.role)}</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? "Mostrar barra lateral" : "Ocultar barra lateral"}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4 shrink-0" /> : <PanelLeftClose className="h-4 w-4 shrink-0" />}
            {!collapsed && "Ocultar barra"}
          </button>
          <button
            onClick={logout}
            title={collapsed ? "Cerrar sesión" : undefined}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && "Cerrar sesión"}
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function roleLabel(role?: string) {
  switch (role) {
    case "ADMIN":
      return "Administrador";
    case "ACCOUNTANT":
      return "Contador";
    case "AUDITOR":
      return "Auditor";
    default:
      return "";
  }
}
