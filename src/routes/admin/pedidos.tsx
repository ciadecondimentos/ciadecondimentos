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
  Edit,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getOrders } from "@/lib/orders.functions";
import { useQuery } from "@tanstack/react-query";
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
  const fetchOrders = useServerFn(getOrders);
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => fetchOrders(),
    initialData: () => Route.useLoaderData(),
  });

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
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground hover:brightness-110 transition-all text-xs font-bold uppercase tracking-widest shadow-md shadow-secondary/10">
              <RotateCw className="w-4 h-4" />
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
                placeholder="Buscar pedido por cliente ou ID..." 
                className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm shadow-sm"
              />
            </div>
            
            <div className="relative w-full md:w-56">
               <select className="w-full pl-4 pr-10 py-3 bg-card border border-border rounded-xl outline-none focus:border-primary appearance-none text-sm font-bold text-foreground shadow-sm">
                  <option>Todos os Status</option>
                  <option>Pago</option>
                  <option>Pendente</option>
                  <option>Cancelado</option>
                  <option>Entregue</option>
               </select>
               <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>

            <div className="relative w-full md:w-64">
               <select className="w-full pl-4 pr-10 py-3 bg-card border border-border rounded-xl outline-none focus:border-primary appearance-none text-sm font-bold text-foreground shadow-sm">
                  <option>Período: Todos os Pedidos</option>
                  <option>Últimas 24 horas</option>
                  <option>Últimos 7 dias</option>
                  <option>Este mês</option>
               </select>
               <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-3 w-full xl:w-auto">
            <button className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground hover:brightness-110 transition-all text-xs font-bold uppercase tracking-widest shadow-sm">
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
            <button className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition-all text-xs font-bold uppercase tracking-widest shadow-sm">
              <Trash2 className="w-4 h-4" />
              <span>Limpar Todos</span>
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
                  <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {orders.length === 0 && !isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-muted-foreground font-bold">
                      Nenhum pedido encontrado.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
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
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-all">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-all">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all">
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
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Exibindo {orders.length} pedidos</span>
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
    </div>
  );
}
