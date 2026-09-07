import type { Role } from "@/types/domain";
import {
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
  Package,
  ClipboardCheck,
  KeyRound,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[];
}

export const navItems: NavItem[] = [
  { to: "/accounts", label: "Libro mayor", icon: BookOpen },
  { to: "/parties", label: "Proveedores", icon: Users },
  { to: "/products", label: "Productos", icon: Package },
  { to: "/journal-entries", label: "Asientos contables", icon: ScrollText },
  { to: "/invoices", label: "Facturas", icon: FileText },
  { to: "/expenses", label: "Gastos", icon: Receipt },
  { to: "/exchange-rates", label: "Tasas de cambio", icon: Coins, roles: ["ADMIN", "ACCOUNTANT"] },
  { to: "/bank-reconciliation", label: "Conciliación bancaria", icon: ClipboardCheck, roles: ["ADMIN", "ACCOUNTANT"] },
  { to: "/reports", label: "Reportes", icon: TrendingUp },
  { to: "/security", label: "Seguridad", icon: KeyRound },
  { to: "/users", label: "Usuarios", icon: UserCog, roles: ["ADMIN"] },
  { to: "/fiscal-settings", label: "Configuración fiscal", icon: Stamp, roles: ["ADMIN"] },
  { to: "/audit-log", label: "Bitácora de auditoría", icon: ShieldCheck, roles: ["ADMIN", "AUDITOR"] },
];
