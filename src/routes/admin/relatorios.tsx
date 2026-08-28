import { createFileRoute } from "@tanstack/react-router";
import { 
  RotateCw, 
  Download, 
  BarChart3, 
  ShoppingCart,
  DollarSign,
  Users,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getReportsSummary, getOrdersSummaryTable } from "@/lib/reports.functions";


export const Route = createFileRoute("/admin/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios & Análises - Cia. Condimentos e Especiarias" },
      { name: "description", content: "Painel de relatórios e análises da Cia. Condimentos e Especiarias." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData({
        queryKey: ['reports-summary'],
        queryFn: () => getReportsSummary(),
      }),
      queryClient.ensureQueryData({
        queryKey: ['reports-orders'],
        queryFn: () => getOrdersSummaryTable(),
      }),
    ]);
  },
  component: RelatoriosPage,
});




function StatCard({ icon: Icon, value, label, color, borderColor }: { icon: any, value: string, label: string, color: string, borderColor: string }) {
  return (
    <div className={cn("bg-card p-8 rounded-[24px] border border-border shadow-sm flex flex-col items-center text-center space-y-4 transition-all hover:shadow-md")}>
      <div className={cn("p-4 rounded-2xl", color)}>
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-3xl font-bold font-serif italic text-foreground tracking-tight">{value}</h3>
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{label}</p>
    </div>
  );
}

function RelatoriosPage() {
  const fetchSummary = useServerFn(getReportsSummary);
  const fetchOrders = useServerFn(getOrdersSummaryTable);

  const { data: summary, isFetching: isFetchingSummary } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: () => fetchSummary(),
  });

  const { data: orders, isFetching: isFetchingOrders } = useQuery({
    queryKey: ['reports-orders'],
    queryFn: () => fetchOrders(),
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar currentPath="/admin/relatorios" />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Relatórios" />

        <main className="max-w-[1400px] w-full mx-auto p-3 sm:p-6 md:p-10 space-y-6 md:space-y-8 transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-[#4d3227]/10 rounded-lg">
                <BarChart3 className="w-6 h-6 text-[#4d3227]" />
             </div>
             <h1 className="text-2xl font-bold font-serif italic text-[#4d3227]">Relatórios & Análises</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground hover:brightness-110 transition-all text-[10px] font-black uppercase tracking-widest shadow-md shadow-secondary/10">
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition-all text-[10px] font-black uppercase tracking-widest shadow-md shadow-primary/20">
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card hover:bg-muted transition-all text-[10px] font-black uppercase tracking-widest shadow-sm">
              <RotateCw className="w-4 h-4" />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <StatCard icon={ShoppingCart} value={summary?.totalOrders.toString() || "0"} label="Total de Pedidos" color="bg-blue-500/10 text-blue-500" borderColor="border-blue-500" />
          <StatCard icon={DollarSign} value={formatCurrency(summary?.totalRevenue || 0)} label="Faturamento" color="bg-success/10 text-success" borderColor="border-success" />
          <StatCard icon={Users} value={summary?.totalCustomers.toString() || "0"} label="Clientes CRM" color="bg-secondary/10 text-secondary" borderColor="border-secondary" />
          <StatCard icon={Package} value={summary?.totalProducts.toString() || "0"} label="Total Produtos" color="bg-primary/10 text-primary" borderColor="border-primary" />
        </div>
        
        <div className="bg-card border border-border rounded-[24px] overflow-hidden shadow-sm">
             <div className="px-8 py-6 border-b border-border flex items-center gap-3">
                 <ShoppingCart className="w-5 h-5 text-[#4d3227]" />
                 <h2 className="text-sm font-black uppercase tracking-widest text-[#4d3227]">Resumo de Pedidos Recentes</h2>
             </div>
             <div className="w-full overflow-x-auto">
                 <table className="w-full border-collapse">
                     <thead>
                         <tr className="bg-[#4d3227] text-[#e8b57d] text-[10px] font-black uppercase tracking-[0.2em] text-left">
                            <th className="px-8 py-4">Data</th>
                            <th className="px-8 py-4">Cliente</th>
                            <th className="px-8 py-4">Itens</th>
                            <th className="px-8 py-4">Valor Total</th>
                            <th className="px-8 py-4">Status</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-border/50">
                        {orders?.map((o: any) => (
                          <tr key={o.date + o.customer} className="hover:bg-muted/30">
                            <td className="px-8 py-4 text-sm font-bold text-muted-foreground">{o.date}</td>
                            <td className="px-8 py-4 text-sm font-bold text-foreground">{o.customer}</td>
                            <td className="px-8 py-4 text-sm font-bold text-muted-foreground">{o.items}</td>
                            <td className="px-8 py-4 text-sm font-bold text-foreground">{formatCurrency(o.total)}</td>
                            <td className="px-8 py-4 text-sm font-bold">
                                <span className={cn(
                                    "px-2 py-1 rounded-lg text-[10px] uppercase",
                                    o.status === 'pago' ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                                )}>{o.status}</span>
                            </td>
                          </tr>
                        ))}
                     </tbody>
                 </table>
             </div>
        </div>
      </main>
      </div>
    </div>
  );
}