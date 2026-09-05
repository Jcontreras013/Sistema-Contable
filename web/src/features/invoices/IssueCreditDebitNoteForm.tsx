import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountsApi } from "@/api/accounts";
import { creditDebitNotesApi } from "@/api/creditDebitNotes";
import { ApiRequestError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { todayIso } from "@/lib/format";
import type { NoteType } from "@/types/domain";

interface Props {
  invoiceId: string;
  invalidateKey: unknown[];
  onIssued: () => void;
}

export function IssueCreditDebitNoteForm({ invoiceId, invalidateKey, onIssued }: Props) {
  const queryClient = useQueryClient();
  const { data: accounts } = useQuery({ queryKey: ["accounts"], queryFn: accountsApi.list });
  const incomeAccounts = useMemo(
    () => (accounts ?? []).filter((a) => a.type === "INCOME" && a.allowsPosting && a.isActive),
    [accounts],
  );

  const [type, setType] = useState<NoteType>("CREDIT");
  const [issueDate, setIssueDate] = useState(todayIso());
  const [accountId, setAccountId] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      creditDebitNotesApi.create({
        invoiceId,
        type,
        issueDate,
        reason,
        accountId,
        subtotal,
        taxAmount: taxAmount || "0",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateKey });
      queryClient.invalidateQueries({ queryKey: ["credit-debit-notes", invoiceId] });
      setError(null);
      onIssued();
    },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : "No se pudo emitir la nota"),
  });

  return (
    <form
      className="grid grid-cols-1 gap-3 rounded-md border border-border p-4 sm:grid-cols-2"
      onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="note-type">Tipo</Label>
        <Select id="note-type" value={type} onChange={(e) => setType(e.target.value as NoteType)}>
          <option value="CREDIT">Nota de crédito (reduce el saldo)</option>
          <option value="DEBIT">Nota de débito (aumenta el saldo)</option>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="note-date">Fecha</Label>
        <Input id="note-date" type="date" required value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="note-account">Cuenta de ingreso a ajustar</Label>
        <Select id="note-account" required value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          <option value="">Selecciona</option>
          {incomeAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="note-subtotal">Subtotal</Label>
        <Input id="note-subtotal" type="number" step="0.01" min="0.01" required value={subtotal} onChange={(e) => setSubtotal(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="note-tax">ISV</Label>
        <Input id="note-tax" type="number" step="0.01" min="0" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="note-reason">Motivo</Label>
        <Input id="note-reason" required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Devolución de mercadería, descuento, corrección..." />
      </div>

      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Emitiendo..." : "Emitir nota"}
        </Button>
      </div>
    </form>
  );
}
