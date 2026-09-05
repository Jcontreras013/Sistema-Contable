import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Download, Mail } from "lucide-react";
import { invoicesApi } from "@/api/invoices";
import { ApiRequestError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaymentHistory } from "@/features/payments/PaymentHistory";
import { RegisterPaymentForm } from "@/features/payments/RegisterPaymentForm";
import { CreditDebitNoteHistory } from "@/features/invoices/CreditDebitNoteHistory";
import { IssueCreditDebitNoteForm } from "@/features/invoices/IssueCreditDebitNoteForm";
import { formatDate, formatMoney } from "@/lib/format";

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoices", id],
    queryFn: () => invoicesApi.get(id!),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => invoicesApi.cancel(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : "No se pudo cancelar la factura"),
  });

  const downloadPdfMutation = useMutation({
    mutationFn: () => invoicesApi.downloadPdf(id!),
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : "No se pudo descargar el PDF"),
  });

  const sendEmailMutation = useMutation({
    mutationFn: () => invoicesApi.sendEmail(id!),
    onSuccess: () => {
      setError(null);
      setEmailSent(true);
    },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : "No se pudo enviar el correo"),
  });

  if (isLoading || !invoice) return <p className="text-sm text-muted-foreground">Cargando...</p>;

  const canManage = hasRole("ADMIN", "ACCOUNTANT");
  const canPay = canManage && invoice.status !== "CANCELLED" && invoice.status !== "PAID";
  const canCancel =
    canManage &&
    invoice.status !== "CANCELLED" &&
    Number(invoice.paidInBase) === 0 &&
    Number(invoice.creditedInBase) === 0 &&
    Number(invoice.debitedInBase) === 0;
  const canIssueNote = canManage && invoice.status !== "CANCELLED";

  return (
    <div>
      <PageHeader
        title={`Factura #${invoice.invoiceNumber}`}
        description={
          invoice.correlativo
            ? `${invoice.partyName} · No. ${invoice.correlativo} · Emitida ${formatDate(invoice.issueDate)} · Vence ${formatDate(invoice.dueDate)}`
            : `${invoice.partyName} · Emitida ${formatDate(invoice.issueDate)} · Vence ${formatDate(invoice.dueDate)}`
        }
        actions={
          <div className="flex gap-2">
            {invoice.journalEntryId && (
              <Link to={`/journal-entries/${invoice.journalEntryId}`} className="text-sm text-primary underline self-center">
                Ver asiento contable
              </Link>
            )}
            <Button variant="outline" onClick={() => downloadPdfMutation.mutate()} disabled={downloadPdfMutation.isPending}>
              <Download className="h-4 w-4" /> PDF
            </Button>
            <Button variant="outline" onClick={() => sendEmailMutation.mutate()} disabled={sendEmailMutation.isPending}>
              <Mail className="h-4 w-4" /> {sendEmailMutation.isPending ? "Enviando..." : "Enviar por correo"}
            </Button>
            {canCancel && (
              <Button variant="destructive" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
                Cancelar factura
              </Button>
            )}
          </div>
        }
      />

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      {emailSent && <p className="mb-4 text-sm text-success">Factura enviada por correo.</p>}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryStat label="Estado" value={<StatusBadge status={invoice.status} />} />
        <SummaryStat label="Total" value={formatMoney(invoice.total, invoice.currency)} />
        <SummaryStat label="Pagado" value={formatMoney(invoice.paidInBase)} />
        <SummaryStat label="Saldo" value={formatMoney(invoice.balanceInBase)} />
        {Number(invoice.creditedInBase) > 0 && (
          <SummaryStat label="Acreditado (notas)" value={formatMoney(invoice.creditedInBase)} />
        )}
        {Number(invoice.debitedInBase) > 0 && (
          <SummaryStat label="Debitado (notas)" value={formatMoney(invoice.debitedInBase)} />
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead className="text-right">ISV %</TableHead>
            <TableHead className="text-right">Total línea</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoice.lines.map((line) => (
            <TableRow key={line.id}>
              <TableCell>{line.description}</TableCell>
              <TableCell className="text-right">{line.quantity}</TableCell>
              <TableCell className="text-right font-mono">{formatMoney(line.unitPrice, invoice.currency)}</TableCell>
              <TableCell className="text-right">{line.taxRate}%</TableCell>
              <TableCell className="text-right font-mono">{formatMoney(line.lineTotal, invoice.currency)}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={4} className="text-right text-muted-foreground">Subtotal</TableCell>
            <TableCell className="text-right font-mono">{formatMoney(invoice.subtotal, invoice.currency)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={4} className="text-right text-muted-foreground">ISV</TableCell>
            <TableCell className="text-right font-mono">{formatMoney(invoice.taxAmount, invoice.currency)}</TableCell>
          </TableRow>
          <TableRow className="font-semibold">
            <TableCell colSpan={4} className="text-right">Total</TableCell>
            <TableCell className="text-right font-mono">{formatMoney(invoice.total, invoice.currency)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {invoice.notes && <p className="mt-4 text-sm text-muted-foreground">Notas: {invoice.notes}</p>}

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cobros</h2>
          {canPay && (
            <Button variant="outline" size="sm" onClick={() => setShowPaymentForm((v) => !v)}>
              Registrar cobro
            </Button>
          )}
        </div>
        {showPaymentForm && (
          <div className="mb-4">
            <RegisterPaymentForm
              invoiceId={invoice.id}
              currency={invoice.currency}
              maxAmount={Number(invoice.balanceInBase)}
              invalidateKey={["invoices", id]}
              onRegistered={() => setShowPaymentForm(false)}
            />
          </div>
        )}
        <PaymentHistory invoiceId={invoice.id} />
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Notas de crédito/débito</h2>
          {canIssueNote && (
            <Button variant="outline" size="sm" onClick={() => setShowNoteForm((v) => !v)}>
              Emitir nota
            </Button>
          )}
        </div>
        {showNoteForm && (
          <div className="mb-4">
            <IssueCreditDebitNoteForm
              invoiceId={invoice.id}
              invalidateKey={["invoices", id]}
              onIssued={() => setShowNoteForm(false)}
            />
          </div>
        )}
        <CreditDebitNoteHistory invoiceId={invoice.id} />
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
