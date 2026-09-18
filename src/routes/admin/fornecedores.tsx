import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { exportToCsv, exportToPdf, formatBRL, type ExportColumn } from "@/lib/export-utils";
import {
  Factory,
  ShoppingCart,
  HeartCrack,
  AlertTriangle,
  Download,
  Plus,
  RotateCw,
  Search,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import {
  getSuppliers,
  getSupplierStats,
  getSupplierPurchases,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  createSupplierPurchase,
  setSupplierPurchasePaid,
  deleteSupplierPurchase,
  type Supplier,
} from "@/lib/suppliers.functions";

export const Route = createFileRoute("/admin/fornecedores")({
  head: () => ({
    meta: [
      { title: "Central de Fornecedores - Cia. Condimentos e Especiarias" },
      { name: "description", content: "Gerencie fornecedores, compras e valores em aberto da Cia. Condimentos e Especiarias." },
      { property: "og:title", content: "Central de Fornecedores - Cia. Condimentos e Especiarias" },
      { property: "og:description", content: "Gerencie fornecedores, compras e valores em aberto da Cia. Condimentos e Especiarias." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: FornecedoresPage,
});

function StatCard({ icon: Icon, value, label, iconClass, borderClass }: { icon: any; value: string; label: string; iconClass: string; borderClass: string }) {
  return (
    <div className={cn("bg-card p-8 rounded-[24px] border border-border border-t-4 shadow-sm flex flex-col items-center text-center gap-4", borderClass)}>
      <div className={cn("p-4 rounded-2xl", iconClass)}>
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-3xl font-bold font-serif italic text-foreground tracking-tight">{value}</h3>
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{label}</p>
    </div>
  );
}

const emptyForm = {
  id: 0,
  company_name: "",
  contact_name: "",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  neighborhood: "",
  city: "",
  cnpj: "",
  observations: "",
  is_active: true,
};

const inputCls =
  "w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-primary transition-all text-sm font-medium";
const labelCls = "text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block";

function FornecedoresPage() {
  const qc = useQueryClient();
  const fetchSuppliers = useServerFn(getSuppliers);
  const fetchStats = useServerFn(getSupplierStats);
  const fetchPurchases = useServerFn(getSupplierPurchases);
  const createFn = useServerFn(createSupplier);
  const updateFn = useServerFn(updateSupplier);
  const deleteFn = useServerFn(deleteSupplier);
  const createPurchaseFn = useServerFn(createSupplierPurchase);
  const payPurchaseFn = useServerFn(setSupplierPurchasePaid);
  const deletePurchaseFn = useServerFn(deleteSupplierPurchase);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ok" | "debt">("all");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [detail, setDetail] = useState<Supplier | null>(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    product_name: "",
    quantity: "1",
    unit_price: "",
    total_price: "",
    purchase_date: new Date().toISOString().slice(0, 10),
    payment_method: "Dinheiro",
    payment_status: "pendente",
    notes: "",
  });

  const suppliersQuery = useQuery({
    queryKey: ["suppliers", from, to],
    queryFn: () => fetchSuppliers({ data: { from: from || null, to: to || null } }),
  });
  const statsQuery = useQuery({ queryKey: ["supplier-stats"], queryFn: () => fetchStats({}) });
  const purchasesQuery = useQuery({
    queryKey: ["supplier-purchases", detail?.id],
    queryFn: () => fetchPurchases({ data: detail!.id }),
    enabled: !!detail,
  });

  const suppliers = suppliersQuery.data ?? [];
  const stats = statsQuery.data;

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ["suppliers"] });
    qc.invalidateQueries({ queryKey: ["supplier-stats"] });
    qc.invalidateQueries({ queryKey: ["supplier-purchases"] });
  };

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) =>
      data.id ? updateFn({ data }) : createFn({ data }),
    onSuccess: () => {
      toast.success(form.id ? "Fornecedor atualizado!" : "Fornecedor cadastrado!");
      setFormOpen(false);
      setForm({ ...emptyForm });
      refreshAll();
    },
    onError: () => toast.error("Não foi possível salvar o fornecedor."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteFn({ data: id }),
    onSuccess: () => {
      toast.success("Fornecedor excluído.");
      setDetail(null);
      refreshAll();
    },
    onError: () => toast.error("Não foi possível excluir o fornecedor."),
  });

  const purchaseMutation = useMutation({
    mutationFn: (data: any) => createPurchaseFn({ data }),
    onSuccess: () => {
      toast.success("Compra registrada!");
      setPurchaseOpen(false);
      setPurchaseForm({
        product_name: "",
        quantity: "1",
        unit_price: "",
        total_price: "",
        purchase_date: new Date().toISOString().slice(0, 10),
        payment_method: "Dinheiro",
        payment_status: "pendente",
        notes: "",
      });
      refreshAll();
    },
    onError: () => toast.error("Não foi possível registrar a compra."),
  });

  const payMutation = useMutation({
    mutationFn: (id: number) => payPurchaseFn({ data: id }),
    onSuccess: () => {
      toast.success("Compra marcada como paga.");
      refreshAll();
    },
    onError: () => toast.error("Não foi possível dar baixa."),
  });

  const deletePurchaseMutation = useMutation({
    mutationFn: (id: number) => deletePurchaseFn({ data: id }),
    onSuccess: () => {
      toast.success("Compra removida.");
      refreshAll();
    },
    onError: () => toast.error("Não foi possível remover a compra."),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return suppliers.filter((s) => {
      const matchTerm =
        !term ||
        [s.company_name, s.contact_name, s.city, s.neighborhood, s.phone, s.whatsapp, s.email]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term));
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "debt" ? s.open_balance > 0 : s.open_balance <= 0);
      return matchTerm && matchStatus;
    });
  }, [suppliers, search, statusFilter]);

  const supplierColumns: ExportColumn<Supplier>[] = [
    { header: "Fornecedor", value: (s) => s.company_name },
    { header: "Cidade", value: (s) => s.city ?? "" },
    { header: "Contato", value: (s) => s.contact_name ?? "" },
    { header: "Telefone", value: (s) => s.phone ?? s.whatsapp ?? "" },
    { header: "Situação", value: (s) => (s.open_balance > 0 ? "Em débito" : "Em dia") },
    { header: "Compras", value: (s) => s.purchase_count },
    { header: "Total Comprado", value: (s) => formatBRL(s.total_purchased) },
    { header: "Em Aberto", value: (s) => formatBRL(s.open_balance) },
  ];

  const handleExportCsv = () => {
    if (filtered.length === 0) { toast.error("Nenhum fornecedor para exportar."); return; }
    exportToCsv("fornecedores", supplierColumns, filtered);
    toast.success("CSV exportado com sucesso!");
  };

  const handleExportPdf = () => {
    if (filtered.length === 0) { toast.error("Nenhum fornecedor para exportar."); return; }
    const ok = exportToPdf("Fornecedores", supplierColumns, filtered);
    if (!ok) toast.error("Permita pop-ups para gerar o PDF.");
  };

  const openNew = () => {
    setForm({ ...emptyForm });
    setFormOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setForm({
      id: s.id,
      company_name: s.company_name ?? "",
      contact_name: s.contact_name ?? "",
      phone: s.phone ?? "",
      whatsapp: s.whatsapp ?? "",
      email: s.email ?? "",
      address: s.address ?? "",
      neighborhood: s.neighborhood ?? "",
      city: s.city ?? "",
      cnpj: s.cnpj ?? "",
      observations: s.observations ?? "",
      is_active: s.is_active ?? true,
    });
    setFormOpen(true);
  };

  const submitForm = () => {
    if (!form.company_name.trim()) { toast.error("Informe o nome da empresa."); return; }
    saveMutation.mutate(form);
  };

  const submitPurchase = () => {
    if (!detail) return;
    if (!purchaseForm.product_name.trim()) { toast.error("Informe o produto."); return; }
    const qty = Number(purchaseForm.quantity) || 1;
    const unit = Number(purchaseForm.unit_price.replace(",", ".")) || 0;
    const total = purchaseForm.total_price
      ? Number(purchaseForm.total_price.replace(",", ".")) || qty * unit
      : qty * unit;
    if (total <= 0) { toast.error("Informe um valor válido."); return; }
    purchaseMutation.mutate({
      supplier_id: detail.id,
      product_name: purchaseForm.product_name,
      quantity: qty,
      unit_price: unit || total / qty,
      total_price: total,
      purchase_date: purchaseForm.purchase_date,
      payment_method: purchaseForm.payment_method,
      payment_status: purchaseForm.payment_status,
      notes: purchaseForm.notes || null,
    });
  };

  const purchases = purchasesQuery.data ?? [];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar currentPath="/admin/fornecedores" />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Fornecedores" />

        <main className="max-w-[1400px] w-full mx-auto p-3 sm:p-6 md:p-10 space-y-6 md:space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#4d3227]/10 rounded-lg">
                <Factory className="w-6 h-6 text-[#4d3227]" />
              </div>
              <h1 className="text-2xl font-bold font-serif italic text-[#4d3227]">Central de Fornecedores</h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button onClick={handleExportCsv} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground hover:brightness-110 transition-all text-[10px] font-black uppercase tracking-widest shadow-md shadow-secondary/10">
                <Download className="w-4 h-4" />
                <span>Exportar CSV</span>
              </button>
              <button onClick={handleExportPdf} className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card hover:bg-muted transition-all text-[10px] font-black uppercase tracking-widest shadow-sm">
                <Download className="w-4 h-4" />
                <span>Exportar PDF</span>
              </button>
              <button onClick={() => { refreshAll(); toast.success("Dados atualizados!"); }} className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card hover:bg-muted transition-all text-[10px] font-black uppercase tracking-widest shadow-sm">
                <RotateCw className={cn("w-4 h-4", suppliersQuery.isFetching && "animate-spin")} />
                <span>Atualizar</span>
              </button>
              <button onClick={openNew} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition-all text-[10px] font-black uppercase tracking-widest shadow-md shadow-primary/20">
                <Plus className="w-4 h-4" />
                <span>Novo Fornecedor</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard icon={Factory} value={String(stats?.total ?? 0)} label="Total de Fornecedores" iconClass="bg-secondary/20 text-secondary" borderClass="border-t-secondary" />
            <StatCard icon={ShoppingCart} value={formatBRL(stats?.total_purchased ?? 0)} label="Total Comprado" iconClass="bg-success/10 text-success" borderClass="border-t-success" />
            <StatCard icon={HeartCrack} value={formatBRL(stats?.open_balance ?? 0)} label="Em Aberto" iconClass="bg-primary/10 text-primary" borderClass="border-t-primary" />
            <StatCard icon={AlertTriangle} value={String(stats?.in_debt ?? 0)} label="Fornecedores em Débito" iconClass="bg-secondary/20 text-secondary" borderClass="border-t-primary" />
          </div>

          <div className="bg-card border border-border rounded-[24px] p-4 flex flex-col xl:flex-row gap-4 items-center shadow-sm">
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <span className="w-full sm:w-auto text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Filtrar por período</span>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="flex-1 min-w-0 px-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-primary transition-all text-sm font-bold" />
              <span className="text-xs font-bold text-muted-foreground">até</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="flex-1 min-w-0 px-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-primary transition-all text-sm font-bold" />
            </div>

            <div className="flex flex-col md:flex-row gap-4 flex-1 w-full min-w-0">
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-primary absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar empresa, contato, cidade..."
                  className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-primary transition-all text-sm font-medium"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-primary text-sm font-bold appearance-none"
              >
                <option value="all">Todos Fornecedores</option>
                <option value="ok">Em dia</option>
                <option value="debt">Em débito</option>
              </select>
            </div>
          </div>

          <div className="bg-card border border-border rounded-[24px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#4d3227] text-[#e8b57d]">
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Empresa</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Contato</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Telefone</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Situação</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em]">Total Comprado</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em]">Em Aberto</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {suppliersQuery.isLoading && (
                    <tr><td colSpan={7} className="px-8 py-12 text-center text-sm text-muted-foreground">Carregando fornecedores...</td></tr>
                  )}
                  {!suppliersQuery.isLoading && filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-8 py-12 text-center text-sm text-muted-foreground">Nenhum fornecedor encontrado.</td></tr>
                  )}
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground">{s.company_name}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.city || "—"}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm font-medium text-muted-foreground">{s.contact_name || "N/A"}</td>
                      <td className="px-8 py-5 text-sm font-medium text-muted-foreground">{s.phone || s.whatsapp || "N/A"}</td>
                      <td className="px-8 py-5">
                        {s.open_balance > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Em débito
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-success">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Em dia
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-right text-sm font-bold text-foreground">{formatBRL(s.total_purchased)}</td>
                      <td className="px-8 py-5 text-right text-sm font-bold text-primary">{formatBRL(s.open_balance)}</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setDetail(s)} aria-label="Visualizar" className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground transition-all">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEdit(s)} aria-label="Editar" className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground transition-all">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Excluir o fornecedor "${s.company_name}" e suas compras?`)) deleteMutation.mutate(s.id);
                            }}
                            aria-label="Excluir"
                            className="p-2 rounded-lg bg-primary text-primary-foreground hover:brightness-110 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        <footer className="max-w-[1400px] mx-auto p-10 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-10">
          <div className="flex items-center gap-8">
            <a href="#" className="hover:text-primary transition-colors">Suporte Técnico</a>
            <a href="#" className="hover:text-primary transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-primary transition-colors">Políticas</a>
          </div>
          <div className="text-center md:text-right">
            © 2026 Cia. de Condimentos e Especiarias • Plataforma de Gestão E-commerce
          </div>
        </footer>
      </div>

      {/* Modal cadastro/edição */}
      {formOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setFormOpen(false)}>
          <div className="bg-card border border-border rounded-[24px] w-full max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 sm:p-8 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-serif italic text-[#4d3227]">
                {form.id ? "Editar Fornecedor" : "Novo Fornecedor"}
              </h2>
              <button onClick={() => setFormOpen(false)} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Empresa *</label>
                <input className={inputCls} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Contato</label>
                <input className={inputCls} value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Telefone</label>
                <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>WhatsApp</label>
                <input className={inputCls} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>E-mail</label>
                <input className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Endereço</label>
                <input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Bairro</label>
                <input className={inputCls} value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Cidade</label>
                <input className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>CNPJ</label>
                <input className={inputCls} value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Observações</label>
                <textarea rows={3} className={inputCls} value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setFormOpen(false)} className="px-6 py-3 rounded-xl border border-border text-[10px] font-black uppercase tracking-widest hover:bg-muted">Cancelar</button>
              <button onClick={submitForm} disabled={saveMutation.isPending} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-60">
                {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {form.id ? "Salvar Alterações" : "Cadastrar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalhes + compras */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-card border border-border rounded-[24px] w-full max-w-3xl max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 sm:p-8 space-y-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold font-serif italic text-[#4d3227]">{detail.company_name}</h2>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">
                  {[detail.contact_name, detail.city].filter(Boolean).join(" • ") || "Sem contato cadastrado"}
                </p>
              </div>
              <button onClick={() => setDetail(null)} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="bg-muted/40 rounded-xl p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Telefone</p>
                <p className="font-bold">{detail.phone || detail.whatsapp || "—"}</p>
              </div>
              <div className="bg-muted/40 rounded-xl p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Compras</p>
                <p className="font-bold">{detail.purchase_count}</p>
              </div>
              <div className="bg-muted/40 rounded-xl p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total</p>
                <p className="font-bold">{formatBRL(detail.total_purchased)}</p>
              </div>
              <div className="bg-muted/40 rounded-xl p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Em aberto</p>
                <p className="font-bold text-primary">{formatBRL(detail.open_balance)}</p>
              </div>
            </div>

            {detail.observations && (
              <div className="bg-muted/30 rounded-xl p-4 text-sm whitespace-pre-line">{detail.observations}</div>
            )}

            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Compras registradas</h3>
              <button onClick={() => setPurchaseOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest hover:brightness-110">
                <Plus className="w-3.5 h-3.5" /> Nova Compra
              </button>
            </div>

            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest">Data</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest">Produto</th>
                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest">Qtd</th>
                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest">Total</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest">Status</th>
                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {purchasesQuery.isLoading && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Carregando...</td></tr>
                  )}
                  {!purchasesQuery.isLoading && purchases.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhuma compra registrada.</td></tr>
                  )}
                  {purchases.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3">{new Date(p.purchase_date + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-3 font-medium">{p.product_name}</td>
                      <td className="px-4 py-3 text-right">{p.quantity}</td>
                      <td className="px-4 py-3 text-right font-bold">{formatBRL(p.total_price)}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-bold", p.payment_status === "pago" ? "text-success" : "text-primary")}>
                          {p.payment_status === "pago" ? "Pago" : "Pendente"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => payMutation.mutate(p.id)}
                            disabled={p.payment_status === "pago"}
                            aria-label="Dar baixa"
                            className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { if (confirm("Remover esta compra?")) deletePurchaseMutation.mutate(p.id); }}
                            aria-label="Excluir compra"
                            className="p-2 rounded-lg bg-primary text-primary-foreground hover:brightness-110"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal nova compra */}
      {purchaseOpen && detail && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={() => setPurchaseOpen(false)}>
          <div className="bg-card border border-border rounded-[24px] w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 sm:p-8 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-serif italic text-[#4d3227]">Nova Compra</h2>
              <button onClick={() => setPurchaseOpen(false)} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Produto / Descrição *</label>
                <input className={inputCls} value={purchaseForm.product_name} onChange={(e) => setPurchaseForm({ ...purchaseForm, product_name: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Quantidade</label>
                <input type="number" min="1" className={inputCls} value={purchaseForm.quantity} onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Valor Unitário</label>
                <input className={inputCls} placeholder="0,00" value={purchaseForm.unit_price} onChange={(e) => setPurchaseForm({ ...purchaseForm, unit_price: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Valor Total</label>
                <input className={inputCls} placeholder="calculado automaticamente" value={purchaseForm.total_price} onChange={(e) => setPurchaseForm({ ...purchaseForm, total_price: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Data</label>
                <input type="date" className={inputCls} value={purchaseForm.purchase_date} onChange={(e) => setPurchaseForm({ ...purchaseForm, purchase_date: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Pagamento</label>
                <select className={inputCls} value={purchaseForm.payment_method} onChange={(e) => setPurchaseForm({ ...purchaseForm, payment_method: e.target.value })}>
                  <option>Dinheiro</option>
                  <option>PIX</option>
                  <option>Cartão</option>
                  <option>Boleto</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select className={inputCls} value={purchaseForm.payment_status} onChange={(e) => setPurchaseForm({ ...purchaseForm, payment_status: e.target.value })}>
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Observações</label>
                <textarea rows={2} className={inputCls} value={purchaseForm.notes} onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })} />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setPurchaseOpen(false)} className="px-6 py-3 rounded-xl border border-border text-[10px] font-black uppercase tracking-widest hover:bg-muted">Cancelar</button>
              <button onClick={submitPurchase} disabled={purchaseMutation.isPending} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-60">
                {purchaseMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
