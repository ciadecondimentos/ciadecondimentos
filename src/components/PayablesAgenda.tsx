import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarClock, Plus, Trash2, Pencil, Check, X, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getPayables,
  createPayable,
  updatePayable,
  deletePayable,
  payPayable,
  processDuePayables,
  type Payable,
} from "@/lib/payables.functions";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

const emptyForm = {
  description: "",
  category: "Despesas",
  value: "",
  dueDate: new Date().toISOString().slice(0, 10),
  notes: "",
};

export function PayablesAgenda({ onPosted }: { onPosted?: () => void }) {
  const queryClient = useQueryClient();
  const fetchPayables = useServerFn(getPayables);
  const createFn = useServerFn(createPayable);
  const updateFn = useServerFn(updatePayable);
  const deleteFn = useServerFn(deletePayable);
  const payFn = useServerFn(payPayable);
  const processFn = useServerFn(processDuePayables);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const processedRef = useRef(false);

  const { data: payables, isFetching } = useQuery({
    queryKey: ["payables"],
    queryFn: () => fetchPayables(),
    staleTime: 1000 * 60,
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["payables"] });
    queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
    queryClient.invalidateQueries({ queryKey: ["finance-chart"] });
    onPosted?.();
  };

  // Ao abrir a página, lança automaticamente as contas vencidas/do dia
  // como saída na data correta e avisa no toast.
  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    processFn()
      .then((res: { posted: Array<{ description: string; value: number; dueDate: string }> }) => {
        if (!res?.posted?.length) return;
        res.posted.forEach((p) => {
          const [y, m, d] = p.dueDate.split("-");
          toast.warning(`Conta a pagar vencida: ${p.description}`, {
            description: `${formatCurrency(p.value)} lançado como saída em ${d}/${m}/${y}.`,
            duration: 8000,
          });
        });
        refreshAll();
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createMutation = useMutation({
    mutationFn: (data: any) => createFn({ data }),
    onSuccess: () => {
      toast.success("Conta agendada com sucesso!");
      setIsModalOpen(false);
      refreshAll();
    },
    onError: () => toast.error("Erro ao agendar conta."),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateFn({ data }),
    onSuccess: () => {
      toast.success("Conta atualizada!");
      setIsModalOpen(false);
      refreshAll();
    },
    onError: () => toast.error("Erro ao atualizar conta."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Conta removida.");
      refreshAll();
    },
    onError: () => toast.error("Erro ao remover conta."),
  });

  const payMutation = useMutation({
    mutationFn: (id: number) => payFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Pagamento registrado como saída no fluxo de caixa!");
      refreshAll();
    },
    onError: () => toast.error("Erro ao registrar pagamento."),
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (p: Payable) => {
    setEditingId(p.id);
    setForm({
      description: p.description,
      category: p.category,
      value: String(p.value),
      dueDate: p.dueDate,
      notes: p.notes ?? "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(String(form.value).replace(",", "."));
    if (!form.description.trim() || !Number.isFinite(value) || value <= 0) {
      toast.error("Informe descrição e valor válidos.");
      return;
    }
    const payload = {
      description: form.description.trim(),
      category: form.category,
      value,
      dueDate: form.dueDate,
      notes: form.notes,
    };
    if (editingId) updateMutation.mutate({ ...payload, id: editingId });
    else createMutation.mutate(payload);
  };

  const pending = (payables ?? []).filter((p) => p.status === "pendente");
  const paid = (payables ?? []).filter((p) => p.status === "pago").slice(0, 5);

  const statusOf = (p: Payable) => {
    if (p.daysUntilDue < 0) return { label: "Vencida", cls: "bg-primary/10 text-primary" };
    if (p.daysUntilDue === 0) return { label: "Vence hoje", cls: "bg-secondary/20 text-secondary-foreground" };
    if (p.daysUntilDue <= 3)
      return { label: `Em ${p.daysUntilDue} dia(s)`, cls: "bg-warning/10 text-warning" };
    return { label: `Em ${p.daysUntilDue} dias`, cls: "bg-muted text-muted-foreground" };
  };

  return (
    <div className="bg-card border border-border rounded-[24px] p-6 md:p-8 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#4d3227]/10 rounded-lg">
            <CalendarClock className="w-6 h-6 text-[#4d3227]" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif italic text-[#4d3227]">Contas a Pagar</h2>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
              Agenda de vencimentos • lançamento automático no dia
            </p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition-all text-[10px] font-black uppercase tracking-widest shadow-md shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Conta</span>
        </button>
      </div>

      {isFetching && !payables ? (
        <div className="h-32 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : pending.length === 0 ? (
        <div className="py-10 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Nenhuma conta agendada
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((p) => {
            const st = statusOf(p);
            return (
              <div
                key={p.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-background"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-muted shrink-0">
                    <span className="text-lg font-bold leading-none">{p.dueDateLabel.slice(0, 2)}</span>
                    <span className="text-[9px] font-black uppercase text-muted-foreground">
                      {p.dueDateLabel.slice(3, 5)}/{p.dueDateLabel.slice(8)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold truncate">{p.description}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.category} • vence em {p.dueDateLabel}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", st.cls)}>
                    {st.label}
                  </span>
                  <span className="font-bold text-primary">{formatCurrency(p.value)}</span>
                  <button
                    title="Pagar agora"
                    onClick={() => payMutation.mutate(p.id)}
                    className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-all"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    title="Editar"
                    onClick={() => openEdit(p)}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    title="Excluir"
                    onClick={() => deleteMutation.mutate(p.id)}
                    className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {paid.length > 0 && (
        <div className="pt-4 border-t border-border space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Pagas recentemente
          </p>
          {paid.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="truncate">
                {p.dueDateLabel} • {p.description}
              </span>
              <span className="font-bold">{formatCurrency(p.value)}</span>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-card w-full max-w-lg rounded-[24px] border border-border shadow-xl p-6 space-y-4 max-h-[90dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-serif italic text-[#4d3227]">
                {editingId ? "Editar Conta" : "Nova Conta a Pagar"}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              placeholder="Descrição (ex.: Aluguel, Energia)"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-primary text-sm font-bold"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-primary text-sm font-bold"
              />
              <input
                placeholder="Valor (R$)"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-primary text-sm font-bold"
              />
            </div>

            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-primary text-sm font-bold appearance-none"
            >
              <option>Despesas</option>
              <option>Fornecedores</option>
              <option>Impostos</option>
              <option>Outros</option>
            </select>

            <textarea
              placeholder="Observações (opcional)"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-primary text-sm min-h-[80px]"
            />

            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {editingId ? "Salvar Alterações" : "Agendar Conta"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
