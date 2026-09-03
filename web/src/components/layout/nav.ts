import type { Role } from "@/types/domain";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ScrollText,
  FileText,
  Receipt,
  TrendingUp,
  ShieldCheck,
  UserCog,
  Coins,
  Stamp,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[];
}

export const navItems: NavItem[] = [
  { to: "/", label: "Panel principal", icon: LayoutDashboard },
  { to: "/accounts", label: "Plan de cuentas", icon: BookOpen },
  { to: "/parties", label: "Terceros", icon: Users },
  { to: "/journal-entries", label: "Asientos contables", icon: ScrollText },
  { to: "/invoices", label: "Facturas", icon: FileText },
  { to: "/expenses", label: "Gastos", icon: Receipt },
  { to: "/exchange-rates", label: "Tasas de cambio", icon: Coins, roles: ["ADMIN", "ACCOUNTANT"] },
  { to: "/reports", label: "Reportes", icon: TrendingUp },
  { to: "/users", label: "Usuarios", icon: UserCog, roles: ["ADMIN"] },
  { to: "/fiscal-settings", label: "Configuración fiscal", icon: Stamp, roles: ["ADMIN"] },
  { to: "/audit-log", label: "Bitácora de auditoría", icon: ShieldCheck, roles: ["ADMIN", "AUDITOR"] },
];
