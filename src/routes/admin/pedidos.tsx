import { createFileRoute } from "@tanstack/react-router";
import { useHydrated } from "@/hooks/use-hydrated";
import { useServerFn } from "@tanstack/react-start";
import { 
  Search, 
  RotateCw, 
  Download, 
  Trash2, 
  Filter, 
  Eye, 
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { exportToCsv, exportToPdf, formatBRL, type ExportColumn } from "@/lib/export-utils";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { getOrders, setOrderPaymentStatus, deleteOrder, type Order } from "@/lib/orders.functions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/admin/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos - Cia. Condimentos e Especiarias" },
      { name: "description", content: "Gerenciamento de pedidos da Cia. Condimentos e Especiarias." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: async ({ context: { queryClient } }) => {
    return queryClient.ensureQueryData({
      queryKey: ["orders"],
      queryFn: () => getOrders(),
    });
  },
  component: PedidosPage,
});


function PedidosPage() {
  const isHydrated = useHydrated();
  const loaderData = Route.useLoaderData();
  const queryClient = useQueryClient();
  const fetchOrders = useServerFn(getOrders);
  const updateStatusFn = useServerFn(setOrderPaymentStatus);
  const deleteOrderFn = useServerFn(deleteOrder);
  const { data: orders = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["orders"],
    queryFn: () => fetchOrders(),
    initialData: loaderData,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesTerm =
        !term ||
        String(order.id).includes(term) ||
        (order.client || "").toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === "todos" ||
        (order.payment_status || "").toLowerCase() === statusFilter;
      return matchesTerm && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const orderColumns: ExportColumn<Order>[] = [
    { header: "Pedido", value: (o) => `#${o.id}` },
    { header: "Cliente", value: (o) => o.client },
    { header: "Data", value: (o) => o.date },
    { header: "Total", value: (o) => formatBRL(Number(o.total) || 0) },
    { header: "Pagamento", value: (o) => o.payment },
    { header: "Status Pagamento", value: (o) => o.payment_status },
    { header: "Status Pedido", value: (o) => o.order_status },
    { header: "Itens", value: (o) => (Array.isArray(o.items) ? o.items.map((i: any) => `${i.quantity}x ${i.name}`).join(" | ") : String(o.items ?? "")) },
    { header: "Entrega", value: (o) => o.address || "" },
  ];

  const handleExportCsv = () => {
    if (filteredOrders.length === 0) {
      toast.error("Nenhum pedido para exportar.");
      return;
    }
    exportToCsv("pedidos", orderColumns, filteredOrders);
    toast.success("CSV exportado com sucesso!");
  };

  const handleExportPdf = () => {
    if (filteredOrders.length === 0) {
      toast.error("Nenhum pedido para exportar.");
      return;
    }
    const ok = exportToPdf("Pedidos", orderColumns, filteredOrders);
    if (!ok) toast.error("Permita pop-ups para gerar o PDF.");
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const handleMarkPaid = async (order: Order) => {
    try {
      await updateStatusFn({ data: { id: order.id, status: "pago" } });
      toast.success(`Pedido #${order.id} marcado como pago.`);
      setSelectedOrder(null);
      invalidate();
    } catch {
      toast.error("Não foi possível dar baixa no pedido.");
    }
  };

  const handleDelete = async (order: Order) => {
    try {
      await deleteOrderFn({ data: { id: order.id } });
      toast.success(`Pedido #${order.id} excluído.`);
      setSelectedOrder(null);
      invalidate();
    } catch {
      toast.error("Não foi possível excluir o pedido.");
    }
  };


  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar currentPath="/admin/pedidos" />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Pedidos" />

        <main className="max-w-[1400px] w-full mx-auto p-3 sm:p-6 md:p-10 space-y-6 md:space-y-8">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold text-foreground tracking-tight font-serif italic">Pedidos</h1>
            <div className="flex items-center gap-2 bg-success/10 px-3 py-1.5 rounded-full">
               <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
               <span className="text-success text-xs font-bold uppercase tracking-widest">Sistema Online</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground hover:brightness-110 transition-all text-xs font-bold uppercase tracking-widest shadow-md shadow-secondary/10"
            >
              <RotateCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
              <span>Atualizar</span>
            </button>
            <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-primary/20 cursor-pointer">
              A
            </div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col xl:flex-row gap-4 items-center">
          <div className="flex flex-col md:flex-row gap-4 flex-1 w-full">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar pedido por cliente ou ID..." 
                className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm shadow-sm"
              />
            </div>
            
            <div className="relative w-full md:w-56">
               <select
                 value={statusFilter}
                 onChange={(e) => setStatusFilter(e.target.value)}
                 className="w-full pl-4 pr-10 py-3 bg-card border border-border rounded-xl outline-none focus:border-primary appearance-none text-sm font-bold text-foreground shadow-sm"
               >
                  <option value="todos">Todos os Status</option>
                  <option value="aprovado">Pago</option>
                  <option value="pendente">Pendente</option>
                  <option value="cancelado">Cancelado</option>
               </select>
               <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-3 w-full xl:w-auto">
            <button onClick={handleExportCsv} className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground hover:brightness-110 transition-all text-xs font-bold uppercase tracking-widest shadow-sm">
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
            <button onClick={handleExportPdf} className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition-all text-xs font-bold uppercase tracking-widest shadow-sm">
              <Download className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-card border border-border rounded-[24px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#4d3227] text-[#e8b57d]">
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Pedido</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Cliente</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Data</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Total</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Pagamento</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Status Pgto</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Status Pedido</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Entrega</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredOrders.length === 0 && !isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-10 text-center text-muted-foreground font-bold">
                      Nenhum pedido encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-5">
                        <span className="font-bold text-primary">#{order.id}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-bold text-foreground">{order.client}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span suppressHydrationWarning className="text-sm text-muted-foreground font-medium">
                          {isHydrated ? new Date(order.date).toLocaleDateString('pt-BR') : ''}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-bold text-foreground">R$ {order.total.toFixed(2).replace('.', ',')}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-muted-foreground">{order.payment}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          order.payment_status === 'Aprovado' ? "bg-success/10 text-success" : 
                          order.payment_status === 'Pendente' ? "bg-secondary/20 text-secondary-foreground" :
                          "bg-primary/10 text-primary"
                        )}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          order.order_status === 'Pago' || order.order_status === 'Entregue' ? "bg-success/10 text-success" : 
                          order.order_status === 'Pendente' || order.order_status === 'Em Preparação' ? "bg-secondary/20 text-secondary-foreground" :
                          "bg-primary/10 text-primary"
                        )}>
                          {order.order_status}
                        </span>
                      </td>
                      <td className="px-6 py-5 max-w-[240px]">
                        {order.address ? (
                          <span className="block text-xs font-medium text-foreground/80 truncate" title={order.address}>
                            {order.address}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                        {order.location && (
                          <a
                            href={order.location}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                          >
                            <MapPin className="w-3 h-3" /> Ver localização
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            title="Visualizar pedido"
                            onClick={() => setSelectedOrder(order)}
                            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {order.payment_status !== 'Aprovado' && (
                            <button
                              title="Dar baixa (marcar como pago)"
                              onClick={() => handleMarkPaid(order)}
                              className="p-2 rounded-lg hover:bg-success/10 hover:text-success text-muted-foreground transition-all"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            title="Excluir pedido"
                            onClick={() => handleDelete(order)}
                            className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-5 bg-muted/10 border-t border-border flex items-center justify-between">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Exibindo {filteredOrders.length} pedidos</span>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-50 text-muted-foreground shadow-sm" disabled>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-black shadow-sm shadow-primary/20">1</button>
              <button className="w-8 h-8 rounded-lg hover:bg-muted text-xs font-black transition-colors">2</button>
              <button className="w-8 h-8 rounded-lg hover:bg-muted text-xs font-black transition-colors">3</button>
              <button className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground shadow-sm">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
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

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif italic text-2xl">
              Pedido #{selectedOrder?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cliente</p>
                  <p className="font-bold">{selectedOrder.client}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data</p>
                  <p suppressHydrationWarning className="font-bold">
                    {isHydrated ? new Date(selectedOrder.date).toLocaleDateString('pt-BR') : ''}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pagamento</p>
                  <p className="font-bold uppercase">{selectedOrder.payment}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</p>
                  <p className="font-bold">{selectedOrder.payment_status}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Itens</p>
                <p className="font-medium leading-relaxed">{selectedOrder.items || '—'}</p>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entrega</p>
                <p className="font-medium">{selectedOrder.address || '—'}</p>
                {selectedOrder.location && (
                  <a
                    href={selectedOrder.location}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                  >
                    <MapPin className="w-3 h-3" /> Ver localização
                  </a>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total</span>
                <span className="text-xl font-bold">R$ {selectedOrder.total.toFixed(2).replace('.', ',')}</span>
              </div>

              {selectedOrder.payment_status !== 'Aprovado' && (
                <button
                  onClick={() => handleMarkPaid(selectedOrder)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-success text-white hover:brightness-110 transition-all text-xs font-bold uppercase tracking-widest"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Dar baixa (marcar como pago)
                </button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
