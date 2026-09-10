import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "primary" }> = {
  ISSUED: { label: "Emitida", variant: "primary" },
  POSTED: { label: "Contabilizado", variant: "primary" },
  PARTIALLY_PAID: { label: "Parcialmente pagado", variant: "warning" },
  PAID: { label: "Pagado", variant: "success" },
  CANCELLED: { label: "Cancelado", variant: "destructive" },
  OPEN: { label: "Abierta", variant: "warning" },
  COMPLETED: { label: "Completada", variant: "success" },
  ACTIVE: { label: "Activo", variant: "success" },
  FULLY_DEPRECIATED: { label: "Totalmente depreciado", variant: "warning" },
  DISPOSED: { label: "Dado de baja", variant: "destructive" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
